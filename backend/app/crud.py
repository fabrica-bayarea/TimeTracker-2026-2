import uuid
from datetime import datetime, date, timedelta, timezone

from sqlalchemy import func, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

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


def list_users(db: Session) -> list[models.User]:
    return (
        db.query(models.User)
          .order_by(models.User.username)
          .all()
    )


# Managers (autenticação do gestor)
class EmailAlreadyRegisteredError(Exception):
    """Já existe um gestor com este e-mail"""


def get_manager_by_email(db: Session, email: str) -> models.Manager | None:
    return (
        db.query(models.Manager)
          .filter(models.Manager.email == email.strip().lower())
          .first()
    )


def create_manager(
        db: Session,
        manager: schemas.ManagerCreate
) -> models.Manager:
    if get_manager_by_email(db, manager.email):
        raise EmailAlreadyRegisteredError(manager.email)

    db_manager = models.Manager(
        email=manager.email,
        password_hash=security.hash_password(manager.password),
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


def authenticate_manager(
        db: Session,
        email: str,
        password: str
) -> models.Manager | None:
    """
    Retorna o gestor se e-mail e senha conferem, senão None. Não diferencia
    "e-mail inexistente" de "senha incorreta" (nem no tempo de resposta)
    """
    manager = get_manager_by_email(db, email)

    if manager is None:
        security.verify_password(password, security.DUMMY_PASSWORD_HASH)
        return None

    if not security.verify_password(password, manager.password_hash):
        return None

    return manager


# Tasks
class InvalidCollaboratorsError(Exception):
    """
    Algum colaborador não existe ou não pertence à equipe do gestor
    """

    def __init__(self, invalid_ids: list[uuid.UUID]):
        super().__init__(invalid_ids)

        self.invalid_ids = invalid_ids


def _get_team_collaborators(
        db: Session,
        manager_id: uuid.UUID,
        collaborator_ids: list[uuid.UUID]
) -> list[models.User]:
    """
    Resolve os ids em colaboradores da equipe do gestor
    (`user.manager_id == manager_id`)

    Ids repetidos são ignorados
    """
    ids = tuple(dict.fromkeys(collaborator_ids))

    if not ids:
        return []

    users = (
        db.query(models.User)
          .filter(
              models.User.id.in_(ids),
              models.User.manager_id == manager_id,
          )
          .all()
    )

    found = {user.id for user in users}
    invalid = [user_id for user_id in ids if user_id not in found]

    if invalid:
        raise InvalidCollaboratorsError(invalid)

    return users


def list_tasks(db: Session, manager_id: uuid.UUID) -> list[models.Task]:
    return (
        db.query(models.Task)
          .options(selectinload(models.Task.collaborators))
          .filter(models.Task.manager_id == manager_id)
          .order_by(models.Task.created_at.desc(), models.Task.id.desc())
          .all()
    )


def get_task(
        db: Session,
        manager_id: uuid.UUID,
        task_id: uuid.UUID
) -> models.Task | None:
    """
    Só devolve a task se ela pertencer ao gestor; task de outro gestor
    é tratada como inexistente
    """
    return (
        db.query(models.Task)
          .options(selectinload(models.Task.collaborators))
          .filter(
              models.Task.id == task_id,
              models.Task.manager_id == manager_id,
          )
          .first()
    )


def create_task(
        db: Session,
        manager_id: uuid.UUID,
        task: schemas.TaskCreate
) -> models.Task:
    collaborators = _get_team_collaborators(
        db, manager_id, task.collaborator_ids
    )

    db_task = models.Task(
        manager_id=manager_id,
        title=task.title,
        description=task.description,
        collaborators=collaborators,
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return db_task


def update_task(
        db: Session,
        db_task: models.Task,
        task_update: schemas.TaskUpdate
) -> models.Task:
    changes = task_update.model_dump(exclude_unset=True)

    # Valida a equipe antes de alterar qualquer campo
    if "collaborator_ids" in changes:
        db_task.collaborators = _get_team_collaborators(
            db, db_task.manager_id, changes.pop("collaborator_ids")
        )

    for field, value in changes.items():
        setattr(db_task, field, value)

    if task_update.model_fields_set:
        # Trocar só os colaboradores não altera a linha da task
        db_task.updated_at = func.now()

    db.commit()
    db.refresh(db_task)

    return db_task


def delete_task(db: Session, db_task: models.Task) -> None:
    db.delete(db_task)
    db.commit()


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


# Activity Logs
def create_activity_log(
        db: Session,
        log: schemas.ActivityLogCreate
) -> models.ActivityLog:
    user = get_or_create_user(db, log.username)
    category_id = categorize(db, log.process_name, log.window_title)

    db_log = models.ActivityLog(
        user_id=user.id,
        hostname=log.hostname,
        process_name=log.process_name,
        window_title=log.window_title,
        duration_seconds=log.duration_seconds,
        category_id=category_id,
        is_idle=log.is_idle,
        captured_at=log.captured_at or datetime.now(timezone.utc),
    )

    db.add(db_log)
    db.commit()
    db.refresh(db_log)

    return db_log


# Realtime View
def get_realtime_view(db: Session) -> list[schemas.RealtimeEntry]:
    display_cutoff = (
        datetime.now(timezone.utc)
        - timedelta(hours=REALTIME_DISPLAY_WINDOW_HOURS)
    )
    
    # Última atividade de cada usuário (subquery pelo maior captured_at)
    latest_ids = (
        db.query(
            models.ActivityLog.user_id,
            func.max(models.ActivityLog.captured_at).label("last_captured_at"),
        )
        .filter(models.ActivityLog.captured_at >= display_cutoff)
        .group_by(models.ActivityLog.user_id)
        .subquery()
    )

    rows = (
        db.query(models.ActivityLog, models.User, models.Category)
        .join(latest_ids, and_(
            models.ActivityLog.user_id == latest_ids.c.user_id,
            models.ActivityLog.captured_at == latest_ids.c.last_captured_at,
        ))
        .join(models.User, models.User.id == models.ActivityLog.user_id)
        .outerjoin(models.Category, 
                   models.Category.id == models.ActivityLog.category_id)
        .all()
    )

    now = datetime.now(timezone.utc)

    result = []

    for log, user, category in rows:
        seconds_since = int((now - log.captured_at).total_seconds())

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
                is_idle=log.is_idle,
                seconds_since_last_activity=seconds_since,
                status=status,
            )
        )

    return result


def get_daily_summary(
        db: Session,
        target_date: date,
        username: str | None = None
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
            {"total_seconds": 0, "by_category": []}
        )
        entry["total_seconds"] += row.total_seconds
        entry["by_category"].append(
            schemas.CategorySummary(
                category=row.category_name or "Outros",
                color=row.category_color or "#6B7280",
                total_seconds=row.total_seconds,
            )
        )

    users_summary = [
        schemas.UserDailySummary(
            username=uname,
            total_seconds=data["total_seconds"],
            by_category=data["by_category"]
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
