import uuid
from datetime import datetime, timezone
from enum import Enum

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

from .security import MAX_PASSWORD_BYTES

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


# Associação do colaborador (Agente Desktop)
ASSOCIATION_FIELD_MAX = 150


def _clean_identifier(value: str) -> str:
    cleaned = value.strip()

    if not cleaned:
        raise ValueError("Não pode ser vazio.")

    if any(ord(char) < 32 or ord(char) == 127 for char in cleaned):
        raise ValueError("Não pode conter caracteres de controle.")

    return cleaned


class AssociationRequest(BaseModel):
    association_code: str = Field(
        pattern=r"^\d{6}$",
        description="Código de 6 dígitos exibido no Dashboard do gestor.",
    )
    username: str = Field(
        min_length=1,
        max_length=ASSOCIATION_FIELD_MAX,
        description="Usuário Windows do colaborador.",
    )
    machine_name: str = Field(
        min_length=1,
        max_length=ASSOCIATION_FIELD_MAX,
        description="Nome da máquina do colaborador.",
    )

    @field_validator("username", "machine_name")
    @classmethod
    def clean(cls, value: str) -> str:
        return _clean_identifier(value)


class AssociationOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Validade do token, em segundos.")
    collaborator_id: uuid.UUID
    username: str
    machine_name: str
    manager_id: uuid.UUID
    already_associated: bool = Field(
        description="True quando o colaborador já pertencia a este gestor "
                    "(apenas revalidação)."
    )


# Auth (gestor)
def _normalize_email(value: str) -> str:
    return value.strip().lower()


class ManagerCreate(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=MAX_PASSWORD_BYTES,
        description=f"Mínimo de 8 caracteres e máximo de {MAX_PASSWORD_BYTES} "
                    "bytes (UTF-8).",
    )

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return _normalize_email(value)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
            raise ValueError(
                f"A senha deve ter no máximo {MAX_PASSWORD_BYTES} bytes."
            )
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return _normalize_email(value)


class ManagerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    created_at: datetime


class ManagerProfileOut(ManagerOut):
    """Gestor autenticado, incluindo o código de associação da equipe"""

    association_code: str = Field(
        pattern=r"^\d{6}$",
        description="Código de 6 dígitos para o colaborador se associar.",
    )


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Validade do token, em segundos.")


# Tasks
TASK_TITLE_MAX = 200
TASK_DESCRIPTION_MAX = 5000
TASK_COLLABORATORS_MAX = 500


def _clean_title(value: str) -> str:
    title = value.strip()

    if not title:
        raise ValueError("O título não pode ser vazio.")

    return title


def _clean_description(value: str | None) -> str | None:
    if value is None:
        return None

    return value.strip() or None


class TaskCreate(BaseModel):
    title: str = Field(max_length=TASK_TITLE_MAX)
    description: str | None = Field(default=None,
                                    max_length=TASK_DESCRIPTION_MAX)
    collaborator_ids: list[uuid.UUID] = Field(
        default_factory=list,
        max_length=TASK_COLLABORATORS_MAX,
        description="Colaboradores da equipe do gestor atribuídos à task.",
    )

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value: str) -> str:
        return _clean_title(value)

    @field_validator("description")
    @classmethod
    def description_blank_is_none(cls, value: str | None) -> str | None:
        return _clean_description(value)


class TaskUpdate(BaseModel):
    """
    Atualização parcial: só os campos enviados são alterados

    `collaborator_ids` substitui a lista inteira (`[]` remove todos)
    """

    title: str | None = Field(default=None, max_length=TASK_TITLE_MAX)
    description: str | None = Field(default=None,
                                    max_length=TASK_DESCRIPTION_MAX)
    collaborator_ids: list[uuid.UUID] | None = Field(
        default=None,
        max_length=TASK_COLLABORATORS_MAX,
    )

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value: str | None) -> str:
        if value is None:
            raise ValueError("O título não pode ser nulo.")

        return _clean_title(value)

    @field_validator("description")
    @classmethod
    def description_blank_is_none(cls, value: str | None) -> str | None:
        return _clean_description(value)

    @field_validator("collaborator_ids")
    @classmethod
    def collaborators_not_null(
        cls,
        value: list[uuid.UUID] | None
    ) -> list[uuid.UUID]:
        if value is None:
            raise ValueError(
                "A lista de colaboradores não pode ser nula; "
                "use [] para remover todos."
            )

        return value


class TaskCollaboratorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    username: str
    full_name: str | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: str | None
    collaborators: list[TaskCollaboratorOut]
    created_at: datetime
    updated_at: datetime


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
    """
    Payload enviado pelo agente desktop a cada leitura da janela ativa
    """

    username: str | None = Field(
        None,
        deprecated=True,
        description=(
            "Ignorado: o colaborador é identificado pelo token do Agente "
            "(emitido em `POST /collaborators/associate`), nunca por um "
            "nome informado no corpo."
        ),
    )
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


# Sincronização de atividades (Agente Desktop)
ACTIVITY_SYNC_MAX_ITEMS = 500


class ActivityScopeEnum(str, Enum):
    in_scope = "in_scope"
    out_of_scope = "out_of_scope"


class ActivitySyncItem(BaseModel):
    """
    Um período de utilização de uma aplicação, como guardado no JSON local
    do Agente. O colaborador não vem no corpo: é o dono do token
    """

    client_id: uuid.UUID = Field(
        description=(
            "Identificador do registro no JSON local do Agente. É devolvido "
            "em `confirmed_ids` para o Agente saber quais registros já pode "
            "marcar como sincronizados."
        ),
    )
    hostname: str = Field(
        min_length=1,
        max_length=ASSOCIATION_FIELD_MAX,
        description="Nome da máquina que gerou o registro.",
    )
    process_name: str = Field(
        min_length=1,
        max_length=255,
        description="Aplicação (processo) utilizada.",
    )
    window_title: str | None = Field(default=None, max_length=500)
    task_id: uuid.UUID | None = Field(
        default=None,
        description=(
            "Task ativa durante o período. Precisa pertencer ao gestor do "
            "colaborador; caso contrário o registro é rejeitado."
        ),
    )
    scope: ActivityScopeEnum = Field(
        description="Classificação: dentro (`in_scope`) ou fora "
                    "(`out_of_scope`) do escopo da task.",
    )
    started_at: AwareDatetime = Field(
        description="Início do período, com fuso horário.",
    )
    ended_at: AwareDatetime = Field(
        description="Término do período, com fuso horário.",
    )

    @field_validator("hostname", "process_name")
    @classmethod
    def clean(cls, value: str) -> str:
        return _clean_identifier(value)

    @field_validator("window_title")
    @classmethod
    def window_title_blank_is_none(cls, value: str | None) -> str | None:
        if value is None:
            return None

        return value.strip() or None

    @field_validator("started_at", "ended_at")
    @classmethod
    def to_utc(cls, value: datetime) -> datetime:
        # Normaliza: o mesmo instante em fusos diferentes gera a mesma chave
        # de deduplicação
        return value.astimezone(timezone.utc)

    @model_validator(mode="after")
    def window_is_ordered(self) -> "ActivitySyncItem":
        if self.ended_at < self.started_at:
            raise ValueError("`ended_at` não pode ser anterior a `started_at`.")

        return self


class ActivitySyncRequest(BaseModel):
    activities: list[ActivitySyncItem] = Field(
        min_length=1,
        max_length=ACTIVITY_SYNC_MAX_ITEMS,
        description=f"Lote de 1 a {ACTIVITY_SYNC_MAX_ITEMS} registros.",
    )

    @field_validator("activities")
    @classmethod
    def client_ids_are_unique(
        cls,
        value: list[ActivitySyncItem]
    ) -> list[ActivitySyncItem]:
        ids = [item.client_id for item in value]

        if len(ids) != len(set(ids)):
            raise ValueError("`client_id` repetido no mesmo lote.")

        return value


class ActivitySyncRejected(BaseModel):
    client_id: uuid.UUID
    reason: str = Field(
        description="`task_not_found`: a task não existe ou não pertence ao "
                    "gestor do colaborador."
    )


class ActivitySyncResponse(BaseModel):
    confirmed_ids: list[uuid.UUID] = Field(
        description=(
            "`client_id` dos registros persistidos, inclusive os que já "
            "estavam gravados (reenvio). O Agente só deve marcar como "
            "sincronizado o que estiver aqui."
        ),
    )
    created: int = Field(description="Registros novos gravados nesta chamada.")
    duplicates: int = Field(
        description="Registros confirmados que já existiam e foram ignorados."
    )
    rejected: list[ActivitySyncRejected] = Field(
        default_factory=list,
        description="Registros não gravados e não confirmados.",
    )


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
