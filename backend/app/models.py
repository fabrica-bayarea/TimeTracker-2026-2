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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    activity_logs = relationship("ActivityLog", back_populates="user")


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
