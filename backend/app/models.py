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
    Table,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base
from .utils import MAX_IDLE_SECONDS


class MatchField(str, enum.Enum):
    PROCESS = "process"
    TITLE = "title"
    BOTH = "both"


class User(Base):
    """
    Identificação automática do usuário/máquina.
    """

    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid7)
    username = Column(String(150), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    department = Column(String(150), nullable=True)
    # Gestor responsável pelo colaborador (equipe). Nulo até a associação
    manager_id = Column(Uuid(as_uuid=True), ForeignKey("managers.id"),
                        nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    manager = relationship("Manager")
    activity_logs = relationship("ActivityLog", back_populates="user")
    tasks = relationship("Task", secondary="task_assignments",
                         back_populates="collaborators")


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
    created_at = Column(DateTime(timezone=True), server_default=func.now(),
                        nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(),
                        onupdate=func.now(), nullable=False)


class Task(Base):
    """
    Task criada por um gestor e atribuída a colaboradores da sua equipe
    """

    __tablename__ = "tasks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid7)
    manager_id = Column(Uuid(as_uuid=True), ForeignKey("managers.id"),
                        nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(),
                        nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    manager = relationship("Manager")
    collaborators = relationship("User", secondary="task_assignments",
                                 back_populates="tasks",
                                 order_by="User.username")


# Associação N:N entre tasks e colaboradores
# Apagar a task (ou o usuário) remove os vínculos, nunca o outro lado
task_assignments = Table(
    "task_assignments",
    Base.metadata,
    Column("task_id", Uuid(as_uuid=True),
           ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Uuid(as_uuid=True),
           ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Index("ix_task_assignments_user_id", "user_id"),
)


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
    is_idle = Column(Boolean, default=False, nullable=False)
    captured_at = Column(DateTime(timezone=True), server_default=func.now(),
                         nullable=False)

    user = relationship("User", back_populates="activity_logs")
    category = relationship("Category", back_populates="activity_logs")

    __table_args__ = (
        # Otimiza consultas: usuário + data, e por categoria
        Index("ix_activity_user_captured_at", "user_id", "captured_at"),
        Index("ix_activity_category", "category_id"),
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
