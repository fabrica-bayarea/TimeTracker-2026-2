import enum
import uuid

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Enum,
    Index,
    Uuid,
    Table,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base
from .utils import MAX_IDLE_SECONDS


class MatchField(str, enum.Enum):
    PROCESS = "process"
    TITLE = "title"
    BOTH = "both"


task_assignments = Table(
    "task_assignments",
    Base.metadata,
    Column(
        "task_id",
        Uuid(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "user_id",
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class User(Base):
    """
    Identificação automática do usuário/máquina.
    """

    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid7)
    username = Column(String(150), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    department = Column(String(150), nullable=True)
    manager_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("managers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    manager = relationship("Manager", back_populates="collaborators")
    activity_logs = relationship("ActivityLog", back_populates="user")
    tasks = relationship(
        "Task", secondary=task_assignments, back_populates="assigned_users"
    )


class Manager(Base):
    """
    Gestor com acesso ao Dashboard. Autentica por e-mail e senha;
    A senha é guardada apenas como hash bcrypt
    """

    __tablename__ = "managers"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid7)
    # Sempre salvo em minúsculas (normalizado no schema).
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    association_code = Column(
        String(6), unique=True, nullable=True, index=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(),
                        nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    collaborators = relationship("User", back_populates="manager")
    tasks = relationship("Task", back_populates="manager")


class Category(Base):
    """
    Categorias de atividade (Desenvolvimento, Design,
    Comunicação, Social, Outros).
    """

    __tablename__ = "categories"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid7)
    name = Column(String(100), unique=True, nullable=False)
    color = Column(String(20), nullable=False, default="#6B7280")

    rules = relationship("CategorizationRule", back_populates="category")
    activity_logs = relationship("ActivityLog", back_populates="category")


class CategorizationRule(Base):
    """
    Palavras-chave vinculadas a categorias.
    """

    __tablename__ = "categorization_rules"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid7)
    category_id = Column(Uuid(as_uuid=True), ForeignKey("categories.id"),
                         nullable=False)
    keyword = Column(String(200), nullable=False)
    match_field = Column(Enum(MatchField), nullable=False,
                         default=MatchField.BOTH)

    category = relationship("Category", back_populates="rules")


class Task(Base):
    """
    Tarefa criada pelo gestor e atribuída a colaboradores.
    """

    __tablename__ = "tasks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid7)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    status = Column(String(50), nullable=False, default="pending")
    manager_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("managers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    manager = relationship("Manager", back_populates="tasks")
    assigned_users = relationship(
        "User", secondary=task_assignments, back_populates="tasks"
    )
    activity_logs = relationship("ActivityLog", back_populates="task")


class ActivityLog(Base):
    """
    Registro de cada janela ativa capturada pelo agente.
    """

    __tablename__ = "activity_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid7)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"),
                     nullable=False)
    hostname = Column(String(150), nullable=False)
    process_name = Column(String(255), nullable=False)
    window_title = Column(String(500), nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    category_id = Column(Uuid(as_uuid=True), ForeignKey("categories.id"),
                         nullable=True)
    task_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_idle = Column(Boolean, default=False, nullable=False)
    captured_at = Column(DateTime(timezone=True), server_default=func.now(),
                         nullable=False)

    user = relationship("User", back_populates="activity_logs")
    category = relationship("Category", back_populates="activity_logs")
    task = relationship("Task", back_populates="activity_logs")

    __table_args__ = (
        # Otimiza consultas: usuário + data, e por categoria
        Index("ix_activity_user_captured_at", "user_id", "captured_at"),
        Index("ix_activity_category", "category_id"),
        Index("ix_activity_task", "task_id"),
    )


class SystemSettings(Base):
    """
    Configurações consultadas remotamente pelo agente (linha única).
    """

    __tablename__ = "system_settings"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid7)
    capture_interval_seconds = Column(Integer, nullable=False, default=10)
    idle_timeout_seconds = Column(Integer, nullable=False,
                                  default=MAX_IDLE_SECONDS)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(),
                        server_default=func.now())
