import uuid
from datetime import datetime, date, timedelta, timezone

from sqlalchemy import func, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from . import models, schemas, security
from .utils import MAX_IDLE_SECONDS

REALTIME_DISPLAY_WINDOW_HOURS = 24  # até quando um colaborador some da lista por falta de dados
IDLE_AFTER_SECONDS = 300     # >5min sem novo evento -> "ausente"
OFFLINE_AFTER_SECONDS = 900  # >15min sem novo evento -> "offline" (mas ainda aparece na lista)

# Users
def get_or_create_user(db: Session, username: str) -> models.User:
    user = (
        db.query(models.User)
          .filter(models.User.username == username)
          .first()
    )

    if user: return user

    user = models.User(username=username)

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def list_users(db: Session, manager_id: uuid.UUID | None = None) -> list[models.User]:
    query = db.query(models.User)
    if manager_id:
        query = query.filter(models.User.manager_id == manager_id)
    return query.order_by(models.User.username).all()


# Managers (autenticação do gestor)
class EmailAlreadyRegisteredError(Exception):
    """Já existe um gestor com este e-mail."""


def get_manager_by_email(db: Session, email: str) -> models.Manager | None:
    return (
        db.query(models.Manager)
          .filter(models.Manager.email == email.strip().lower())
          .first()
    )


def get_manager_by_association_code(db: Session, code: str) -> models.Manager | None:
    return (
        db.query(models.Manager)
          .filter(models.Manager.association_code == code.strip())
          .first()
    )


def get_or_create_manager_association_code(db: Session, manager: models.Manager) -> str:
    if not manager.association_code:
        manager.association_code = security.generate_association_code(db)
        db.commit()
        db.refresh(manager)
    return manager.association_code


def create_manager(
        db: Session,
        manager: schemas.ManagerCreate
) -> models.Manager:
    if get_manager_by_email(db, manager.email):
        raise EmailAlreadyRegisteredError(manager.email)

    code = security.generate_association_code(db)
    db_manager = models.Manager(
        email=manager.email,
        password_hash=security.hash_password(manager.password),
        association_code=code,
    )

    db.add(db_manager)

    try:
        db.commit()
    except IntegrityError:
        # Cadastro simultâneo do mesmo e-mail (índice único do banco).
        db.rollback()
        raise EmailAlreadyRegisteredError(manager.email) from None

    db.refresh(db_manager)

    return db_manager


def associate_agent(
    db: Session,
    code: str,
    username: str,
    hostname: str
) -> tuple[models.User, str]:
    manager = get_manager_by_association_code(db, code)
    if not manager:
        raise ValueError("Código inválido ou expirado.")

    user = get_or_create_user(db, username)
    user.manager_id = manager.id
    db.commit()
    db.refresh(user)

    token = security.create_agent_token(user.id)
    return user, token


def authenticate_manager(
        db: Session,
        email: str,
        password: str
) -> models.Manager | None:
    """
    Retorna o gestor se e-mail e senha conferem, senão None. Não diferencia
    "e-mail inexistente" de "senha incorreta" (nem no tempo de resposta).
    """
    manager = get_manager_by_email(db, email)

    if manager is None:
        security.verify_password(password, security.DUMMY_PASSWORD_HASH)
        return None

    if not security.verify_password(password, manager.password_hash):
        return None

    return manager


# Categories
def list_categories(db: Session) -> list[models.Category]:
    return (
        db.query(models.Category)
          .order_by(models.Category.name)
          .all()
    )


def create_category(
        db: Session,
        category: schemas.CategoryCreate
) -> models.Category:
    db_category = models.Category(**category.model_dump())

    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    return db_category


# Categorization Rules
def list_rules(db: Session) -> list[models.CategorizationRule]:
    return (
        db.query(models.CategorizationRule)
          .all()
    )


def create_rule(
        db: Session,
        rule: schemas.CategorizationRuleCreate
) -> models.CategorizationRule:
    db_rule = models.CategorizationRule(**rule.model_dump())

    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)

    return db_rule


def update_rule(
    db: Session,
    rule_id: uuid.UUID,
    rule_update: schemas.CategorizationRuleUpdate
) -> models.CategorizationRule | None:
    db_rule = (
        db.query(models.CategorizationRule)
          .filter(models.CategorizationRule.id == rule_id)
          .first()
    )

    if not db_rule: return None

    for field, value in rule_update.model_dump(exclude_unset=True).items():
        setattr(db_rule, field, value)

    db.commit()
    db.refresh(db_rule)

    return db_rule


def delete_rule(db: Session, rule_id: uuid.UUID) -> bool:
    db_rule = (
        db.query(models.CategorizationRule)
          .filter(models.CategorizationRule.id == rule_id)
          .first()
    )

    if not db_rule: return False

    db.delete(db_rule)
    db.commit()

    return True


def categorize(
        db: Session,
        process_name: str | None,
        window_title: str | None
) -> uuid.UUID | None:
    """
    Retorna o category_id da primeira regra que casar,
    ou None ("Outros"/sem categoria).
    """
    tgt = {
        "process": (process_name or "").lower(),
        "title": (window_title or "").lower(),
    }

    rules = list_rules(db)

    for rule in rules:
        keyword = rule.keyword.lower()
        field = (
            rule.match_field.value if hasattr(rule.match_field, "value")
            else rule.match_field
        )
        target = tgt.get(field, f"{process_name} {window_title}")

        if keyword in target: return rule.category_id

    return None


# Tasks
def create_task(
    db: Session, manager_id: uuid.UUID, task_in: schemas.TaskCreate
) -> models.Task:
    task = models.Task(
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        manager_id=manager_id,
    )
    if task_in.assigned_user_ids:
        users = (
            db.query(models.User)
            .filter(
                models.User.id.in_(task_in.assigned_user_ids),
                models.User.manager_id == manager_id,
            )
            .all()
        )
        task.assigned_users = users

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def list_tasks(
    db: Session,
    manager_id: uuid.UUID,
    status: str | None = None
) -> list[models.Task]:
    query = db.query(models.Task).filter(models.Task.manager_id == manager_id)
    if status:
        query = query.filter(models.Task.status == status)
    return query.order_by(models.Task.created_at.desc()).all()


def get_task(
    db: Session,
    task_id: uuid.UUID,
    manager_id: uuid.UUID | None = None
) -> models.Task | None:
    query = db.query(models.Task).filter(models.Task.id == task_id)
    if manager_id:
        query = query.filter(models.Task.manager_id == manager_id)
    return query.first()


def update_task(
    db: Session,
    task_id: uuid.UUID,
    manager_id: uuid.UUID,
    update: schemas.TaskUpdate
) -> models.Task | None:
    task = get_task(db, task_id, manager_id)
    if not task:
        return None

    if update.title is not None:
        task.title = update.title
    if update.description is not None:
        task.description = update.description
    if update.status is not None:
        task.status = update.status
    if update.assigned_user_ids is not None:
        users = (
            db.query(models.User)
            .filter(
                models.User.id.in_(update.assigned_user_ids),
                models.User.manager_id == manager_id,
            )
            .all()
        )
        task.assigned_users = users

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: uuid.UUID, manager_id: uuid.UUID) -> bool:
    task = get_task(db, task_id, manager_id)
    if not task:
        return False
    db.delete(task)
    db.commit()
    return True


def list_collaborator_tasks(db: Session, user: models.User) -> list[models.Task]:
    # Retorna tarefas atribuídas diretamente ao colaborador OU tarefas do mesmo gestor sem atribuição específica
    return (
        db.query(models.Task)
        .outerjoin(models.Task.assigned_users)
        .filter(
            (models.User.id == user.id) |
            (
                (models.Task.manager_id == user.manager_id) &
                ~models.Task.assigned_users.any()
            )
        )
        .filter(models.Task.status != "completed")
        .order_by(models.Task.created_at.desc())
        .distinct()
        .all()
    )


# Activity Logs
def create_activity_log(
        db: Session,
        log: schemas.ActivityLogCreate,
        current_user: models.User | None = None,
) -> models.ActivityLog:
    user = current_user or get_or_create_user(db, log.username)
    category_id = categorize(db, log.process_name, log.window_title)

    db_log = models.ActivityLog(
        user_id=user.id,
        hostname=log.hostname,
        process_name=log.process_name,
        window_title=log.window_title,
        duration_seconds=log.duration_seconds,
        category_id=category_id,
        task_id=log.task_id,
        is_idle=log.is_idle,
        captured_at=log.captured_at or datetime.now(timezone.utc),
    )

    db.add(db_log)
    db.commit()
    db.refresh(db_log)

    return db_log


# Realtime View
def get_realtime_view(
    db: Session, manager_id: uuid.UUID | None = None
) -> list[schemas.RealtimeEntry]:
    display_cutoff = (
        datetime.now(timezone.utc)
        - timedelta(hours=REALTIME_DISPLAY_WINDOW_HOURS)
    )

    # Última atividade de cada usuário (subquery pelo maior captured_at)
    latest_ids_query = (
        db.query(
            models.ActivityLog.user_id,
            func.max(models.ActivityLog.captured_at).label("last_captured_at"),
        )
        .filter(models.ActivityLog.captured_at >= display_cutoff)
    )

    if manager_id:
        latest_ids_query = latest_ids_query.join(
            models.User, models.User.id == models.ActivityLog.user_id
        ).filter(models.User.manager_id == manager_id)

    latest_ids = latest_ids_query.group_by(models.ActivityLog.user_id).subquery()

    rows = (
        db.query(models.ActivityLog, models.User, models.Category, models.Task)
        .join(latest_ids, and_(
            models.ActivityLog.user_id == latest_ids.c.user_id,
            models.ActivityLog.captured_at == latest_ids.c.last_captured_at,
        ))
        .join(models.User, models.User.id == models.ActivityLog.user_id)
        .outerjoin(models.Category, 
                   models.Category.id == models.ActivityLog.category_id)
        .outerjoin(models.Task,
                   models.Task.id == models.ActivityLog.task_id)
        .all()
    )

    now = datetime.now(timezone.utc)

    result = []

    for log, user, category, task in rows:
        captured_at = log.captured_at.replace(tzinfo=timezone.utc) if log.captured_at.tzinfo is None else log.captured_at
        seconds_since = max(0, int((now - captured_at).total_seconds()))

        if log.is_idle or seconds_since > OFFLINE_AFTER_SECONDS:
            status = "offline"
        elif seconds_since > IDLE_AFTER_SECONDS:
            status = "ausente"
        else:
            status = "online"

        result.append(
            schemas.RealtimeEntry(
                username=user.username,
                hostname=log.hostname,
                process_name=log.process_name,
                window_title=log.window_title,
                category=category.name if category else None,
                task_id=log.task_id,
                task_title=task.title if task else None,
                is_idle=log.is_idle,
                seconds_since_last_activity=seconds_since,
                status=status,
            )
        )

    return result


def get_daily_summary(
        db: Session,
        target_date: date,
        username: str | None = None,
        manager_id: uuid.UUID | None = None,
) -> schemas.DailySummaryResponse:
    query = (
        db.query(
            models.User.username,
            models.Category.name.label("category_name"),
            models.Category.color.label("category_color"),
            func.coalesce(func.sum(models.ActivityLog.duration_seconds), 0)
                .label("total_seconds"),
          )
          .join(models.User, models.User.id == models.ActivityLog.user_id)
          .outerjoin(
              models.Category,
              models.Category.id == models.ActivityLog.category_id
          )
          .filter(func.date(models.ActivityLog.captured_at) == target_date)
    )

    if manager_id:
        query = query.filter(models.User.manager_id == manager_id)
    if username:
        query = query.filter(models.User.username == username)

    query = query.group_by(
        models.User.username,
        models.Category.name,
        models.Category.color
    )
    rows = query.all()

    users_map = {}

    for row in rows:
        entry = users_map.setdefault(
            row.username, 
            {"total_seconds": 0, "by_category": [], "by_task": []}
        )
        entry["total_seconds"] += row.total_seconds
        entry["by_category"].append(
            schemas.CategorySummary(
                category=row.category_name or "Outros",
                color=row.category_color or "#6B7280",
                total_seconds=row.total_seconds,
            )
        )

    # Subquery / agregação por task para a mesma data
    task_query = (
        db.query(
            models.User.username,
            models.Task.id.label("task_id"),
            models.Task.title.label("task_title"),
            func.coalesce(func.sum(models.ActivityLog.duration_seconds), 0).label("task_seconds"),
        )
        .join(models.User, models.User.id == models.ActivityLog.user_id)
        .join(models.Task, models.Task.id == models.ActivityLog.task_id)
        .filter(func.date(models.ActivityLog.captured_at) == target_date)
    )
    if manager_id:
        task_query = task_query.filter(models.User.manager_id == manager_id)
    if username:
        task_query = task_query.filter(models.User.username == username)
    task_query = task_query.group_by(
        models.User.username, models.Task.id, models.Task.title
    )

    for trow in task_query.all():
        if trow.username in users_map:
            users_map[trow.username]["by_task"].append(
                schemas.TaskDailySummary(
                    task_id=trow.task_id,
                    title=trow.task_title,
                    total_seconds=trow.task_seconds,
                )
            )

    users_summary = [
        schemas.UserDailySummary(
            username=uname,
            total_seconds=data["total_seconds"],
            by_category=data["by_category"],
            by_task=data.get("by_task", []),
        )
        for uname, data in users_map.items()
    ]

    return schemas.DailySummaryResponse(
        date=target_date.isoformat(),
        users=users_summary
    )


def get_settings(db: Session) -> models.SystemSettings:
    settings = db.query(models.SystemSettings).first()

    if not settings:
        settings = models.SystemSettings()

        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


def update_settings(
        db: Session,
        update: schemas.SystemSettingsUpdate
) -> models.SystemSettings:
    settings = get_settings(db)
    settings.capture_interval_seconds = update.capture_interval_seconds
    settings.idle_timeout_seconds = update.idle_timeout_seconds

    db.commit()
    db.refresh(settings)

    return settings
