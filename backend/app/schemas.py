import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict

# pass = alias

class MatchFieldEnum(str, Enum):
    process = "process"
    title = "title"
    both = "both"


# Users
class UserBase(BaseModel):
    username: str
    full_name: str | None = None
    department: str | None = None


class UserCreate(UserBase):
    pass


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime


# Categories
class CategoryBase(BaseModel):
    name: str
    color: str = "#6B7280"


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


# Categorization Rules
class CategorizationRuleBase(BaseModel):
    category_id: uuid.UUID
    keyword: str
    match_field: MatchFieldEnum = MatchFieldEnum.both


class CategorizationRuleCreate(CategorizationRuleBase):
    pass


class CategorizationRuleUpdate(BaseModel):
    keyword: str | None = None
    match_field: MatchFieldEnum | None = None
    category_id: uuid.UUID | None = None


class CategorizationRuleOut(CategorizationRuleBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


# Activity Logs
class ActivityLogCreate(BaseModel):
    """Payload enviado pelo agente desktop a cada leitura da janela ativa (RF01/RF02)."""

    username: str = Field(..., description="Usuário do Windows capturado automaticamente (RF05)")
    hostname: str = Field(..., description="Nome da máquina (RF05)")
    process_name: str
    window_title: str | None = None
    duration_seconds: int = Field(0, ge=0)
    is_idle: bool = False
    captured_at: datetime | None = None


class ActivityLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    hostname: str
    process_name: str
    window_title: str | None
    duration_seconds: int
    category_id: uuid.UUID | None
    is_idle: bool
    captured_at: datetime


# Dashboard / Real-Time
class RealtimeEntry(BaseModel):
    username: str
    hostname: str
    process_name: str
    window_title: str | None
    category: str | None
    is_idle: bool
    seconds_since_last_activity: int
    status: str  # "online" | "ausente"


class CategorySummary(BaseModel):
    category: str
    color: str
    total_seconds: int


class UserDailySummary(BaseModel):
    username: str
    total_seconds: int
    by_category: list[CategorySummary]


class DailySummaryResponse(BaseModel):
    date: str
    users: list[UserDailySummary]


# Settings
class SystemSettingsBase(BaseModel):
    capture_interval_seconds: int = Field(10, ge=1)
    idle_timeout_seconds: int = Field(300, ge=1)


class SystemSettingsUpdate(SystemSettingsBase):
    pass


class SystemSettingsOut(SystemSettingsBase):
    model_config = ConfigDict(from_attributes=True)
    updated_at: datetime | None = None
