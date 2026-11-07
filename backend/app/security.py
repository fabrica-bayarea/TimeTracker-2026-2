"""
Segurança do backend: hash de senhas (bcrypt), tokens JWT do gestor e do
Agente Desktop e as dependências `get_current_manager` e `get_current_agent`
usadas para proteger as rotas.
"""

import uuid
from datetime import datetime, timedelta, timezone
from os import getenv

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .utils import ROOT_DIR

load_dotenv(ROOT_DIR / ".env")

JWT_ALGORITHM = "HS256"
# Audiência do token: evita que outro tipo de token assinado com a mesma chave
# (ex.: futuro token do agente) seja aceito como sessão de gestor
JWT_AUDIENCE = "time-tracker:manager"
# Token do Agente Desktop: audiência própria, para que um token de agente
# nunca seja aceito como sessão de gestor (e vice-versa)
AGENT_JWT_AUDIENCE = "time-tracker:agent"

MIN_SECRET_KEY_LENGTH = 32
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 60
# O Agente não tem tela de login: o token dura bem mais que o do gestor
DEFAULT_AGENT_TOKEN_EXPIRE_MINUTES = 60 * 24 * 365

# bcrypt só considera os 72 primeiros bytes da senha
MAX_PASSWORD_BYTES = 72

# Hash válido de uma senha aleatória descartada. Usado no login quando o
# e-mail não existe, para que o tempo de resposta não revele quais e-mails
# estão cadastrados
DUMMY_PASSWORD_HASH = (
    "$2b$12$8hiys1htiV3e1Ew.a7.3zeSE1.dl0O32jFQGtbLrqYJ/CH3G0BEEC"
)


def _resolve_secret_key(raw: str | None) -> str:
    """
    Valida a chave de assinatura dos JWT.

    A chave é obrigatória e precisa ser a mesma entre reinicializações e
    entre workers: com uma chave aleatória por processo, os tokens dos
    gestores e, principalmente, os dos Agentes (que duram meses e não têm
    tela de login) deixariam de valer a cada reinício da API.
    """
    key = (raw or "").strip()

    if not key:
        raise RuntimeError(
            "JWT_SECRET_KEY é obrigatória. Defina no .env uma chave de pelo "
            f"menos {MIN_SECRET_KEY_LENGTH} caracteres. Gere com: "
            'python -c "import secrets; print(secrets.token_urlsafe(64))"'
        )

    if len(key) < MIN_SECRET_KEY_LENGTH:
        raise RuntimeError(
            f"JWT_SECRET_KEY deve ter ao menos {MIN_SECRET_KEY_LENGTH} "
            "caracteres."
        )

    return key


def _resolve_expire_minutes(
    raw: str | None,
    default: int = DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES,
    name: str = "ACCESS_TOKEN_EXPIRE_MINUTES",
) -> int:
    if raw is None or not raw.strip():
        return default

    try:
        minutes = int(raw)
    except ValueError:
        minutes = 0

    if minutes <= 0:
        raise RuntimeError(f"{name} deve ser um inteiro maior que zero.")

    return minutes


JWT_SECRET_KEY = _resolve_secret_key(getenv("JWT_SECRET_KEY"))
ACCESS_TOKEN_EXPIRE_MINUTES = _resolve_expire_minutes(
    getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
)
AGENT_TOKEN_EXPIRE_MINUTES = _resolve_expire_minutes(
    getenv("AGENT_TOKEN_EXPIRE_MINUTES"),
    default=DEFAULT_AGENT_TOKEN_EXPIRE_MINUTES,
    name="AGENT_TOKEN_EXPIRE_MINUTES",
)


# Senhas
def hash_password(password: str) -> str:
    """Gera o hash bcrypt (com salt aleatório) da senha."""
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    """Compara a senha com o hash. Entradas inválidas resultam em False."""
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), password_hash.encode("ascii")
        )
    except ValueError:
        # Hash malformado ou senha acima do limite de 72 bytes.
        return False


# Tokens JWT
class InvalidTokenError(Exception):
    """Token ausente de requisitos, adulterado, expirado ou inválido."""


def create_access_token(
    subject: uuid.UUID | str,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Emite um JWT de acesso para o gestor `subject` (id do gestor).

    Claims: sub (id), aud, iat e exp. A expiração padrão vem de
    ACCESS_TOKEN_EXPIRE_MINUTES.
    """
    now = datetime.now(timezone.utc)

    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(subject),
        "aud": JWT_AUDIENCE,
        "iat": now,
        "exp": now + expires_delta,
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> uuid.UUID:
    """
    Valida assinatura, expiração e claims obrigatórias do JWT e devolve o
    id do gestor. Levanta InvalidTokenError para qualquer token inválido.
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],  # fixo: impede troca de algoritmo
            audience=JWT_AUDIENCE,
            options={"require": ["exp", "iat", "sub", "aud"]},
        )
        return uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError) as exc:
        raise InvalidTokenError("Token inválido ou expirado.") from exc


def create_agent_token(
    subject: uuid.UUID | str,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Emite o JWT do Agente Desktop para o colaborador `subject` (id do
    `User`). Mesmas claims do token do gestor, mas com audiência própria e
    validade de AGENT_TOKEN_EXPIRE_MINUTES
    """
    now = datetime.now(timezone.utc)

    if expires_delta is None:
        expires_delta = timedelta(minutes=AGENT_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(subject),
        "aud": AGENT_JWT_AUDIENCE,
        "iat": now,
        "exp": now + expires_delta,
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_agent_token(token: str) -> uuid.UUID:
    """
    Valida o JWT do Agente e devolve o id do colaborador. Levanta
    InvalidTokenError para qualquer token inválido, expirado ou que não
    seja de agente.
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            audience=AGENT_JWT_AUDIENCE,
            options={"require": ["exp", "iat", "sub", "aud"]},
        )
        return uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError) as exc:
        raise InvalidTokenError("Token inválido ou expirado.") from exc


# Dependência de rotas protegidas
bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Token JWT obtido em `POST /auth/login`.",
)


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado: token ausente, inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_manager(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Manager:
    """
    Dependência do FastAPI: exige `Authorization: Bearer <jwt>` válido e
    devolve o gestor autenticado. Responde 401 para token ausente, inválido,
    expirado, de gestor inexistente ou que não seja token de gestor (o token
    do Agente não é aceito aqui)

    Uso: `manager: models.Manager = Depends(get_current_manager)` ou
    `APIRouter(dependencies=[Depends(get_current_manager)])`.
    """
    if credentials is None:
        raise _unauthorized()

    try:
        manager_id = decode_access_token(credentials.credentials)
    except InvalidTokenError:
        raise _unauthorized() from None

    manager = db.get(models.Manager, manager_id)

    if manager is None:
        raise _unauthorized()

    return manager


def get_current_agent(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """
    Dependência do FastAPI para as rotas do Agente Desktop: exige o token
    emitido em `POST /collaborators/associate` e devolve o colaborador
    autenticado. Responde 401 para token ausente, inválido, expirado, de
    colaborador inexistente ou sem gestor, ou que não seja token de Agente
    (o token do gestor não é aceito aqui)

    Como o vínculo é conferido a cada chamada, um colaborador removido (ou
    sem gestor) perde o acesso mesmo com o token ainda dentro da validade
    """
    if credentials is None:
        raise _unauthorized()

    try:
        user_id = decode_agent_token(credentials.credentials)
    except InvalidTokenError:
        raise _unauthorized() from None

    user = db.get(models.User, user_id)

    if user is None or user.manager_id is None:
        raise _unauthorized()

    return user
