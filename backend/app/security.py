"""
Segurança do backend: hash de senhas (bcrypt), tokens JWT de acesso e a
dependência `get_current_manager` usada para proteger rotas do gestor.
"""

import logging
import secrets
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

logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"
# Audiência do token: evita que outro tipo de token assinado com a mesma chave
# (ex.: futuro token do agente) seja aceito como sessão de gestor.
JWT_AUDIENCE = "time-tracker:manager"

MIN_SECRET_KEY_LENGTH = 32
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 60

# bcrypt só considera os 72 primeiros bytes da senha.
MAX_PASSWORD_BYTES = 72

# Hash válido de uma senha aleatória descartada. Usado no login quando o
# e-mail não existe, para que o tempo de resposta não revele quais e-mails
# estão cadastrados.
DUMMY_PASSWORD_HASH = (
    "$2b$12$8hiys1htiV3e1Ew.a7.3zeSE1.dl0O32jFQGtbLrqYJ/CH3G0BEEC"
)


def _resolve_secret_key(raw: str | None) -> str:
    """
    Valida a chave de assinatura dos JWT.

    Sem JWT_SECRET_KEY, gera uma chave aleatória temporária: segura, mas as
    sessões deixam de valer a cada reinício (e entre múltiplos workers)
    (defina JWT_SECRET_KEY em prod)
    """
    key = (raw or "").strip()

    if not key:
        logger.warning(
            "JWT_SECRET_KEY não definida: usando chave temporária. Os tokens "
            "perdem a validade a cada reinício. Defina JWT_SECRET_KEY no .env."
        )
        return secrets.token_urlsafe(64)

    if len(key) < MIN_SECRET_KEY_LENGTH:
        raise RuntimeError(
            f"JWT_SECRET_KEY deve ter ao menos {MIN_SECRET_KEY_LENGTH} "
            "caracteres."
        )

    return key


def _resolve_expire_minutes(raw: str | None) -> int:
    if raw is None or not raw.strip():
        return DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES

    try:
        minutes = int(raw)
    except ValueError:
        minutes = 0

    if minutes <= 0:
        raise RuntimeError(
            "ACCESS_TOKEN_EXPIRE_MINUTES deve ser um inteiro maior que zero."
        )

    return minutes


JWT_SECRET_KEY = _resolve_secret_key(getenv("JWT_SECRET_KEY"))
ACCESS_TOKEN_EXPIRE_MINUTES = _resolve_expire_minutes(
    getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
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


# Dependência de rotas protegidas
bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Token JWT obtido em `POST /auth/login` ou `POST /associate/`.",
)


AGENT_JWT_AUDIENCE = "time-tracker:agent"
DEFAULT_AGENT_TOKEN_EXPIRE_DAYS = 365


def create_agent_token(
    user_id: uuid.UUID | str,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Emite um JWT de longa duração para o agente desktop vinculado ao usuário.
    """
    now = datetime.now(timezone.utc)

    if expires_delta is None:
        expires_delta = timedelta(days=DEFAULT_AGENT_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "aud": AGENT_JWT_AUDIENCE,
        "iat": now,
        "exp": now + expires_delta,
        "role": "agent",
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_agent_token(token: str) -> uuid.UUID:
    """
    Valida token emitido para o agente desktop e devolve o id do colaborador.
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
        raise InvalidTokenError("Token de agente inválido ou expirado.") from exc


def get_current_manager(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Manager:
    """
    Dependência do FastAPI: exige `Authorization: Bearer <jwt>` válido e
    devolve o gestor autenticado. Responde 401 para token ausente, inválido,
    expirado ou de gestor inexistente.

    Uso: `manager: models.Manager = Depends(get_current_manager)` ou
    `APIRouter(dependencies=[Depends(get_current_manager)])`.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado: token ausente, inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        manager_id = decode_access_token(credentials.credentials)
    except InvalidTokenError:
        raise unauthorized from None

    manager = db.get(models.Manager, manager_id)

    if manager is None:
        raise unauthorized

    return manager


def get_current_agent(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """
    Dependência do FastAPI: exige token de agente válido emitido em /associate/
    e devolve o colaborador (User) correspondente.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autorizado: token do agente ausente, inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        user_id = decode_agent_token(credentials.credentials)
    except InvalidTokenError:
        raise unauthorized from None

    user = db.get(models.User, user_id)
    if user is None:
        raise unauthorized

    return user


def get_current_actor(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Manager | models.User:
    """
    Permite acesso a rotas compartilhadas por gestor ou agente (ex: consulta de configs).
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado: token ausente, inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    token = credentials.credentials
    # Tenta gestor primeiro
    try:
        manager_id = decode_access_token(token)
        manager = db.get(models.Manager, manager_id)
        if manager is not None:
            return manager
    except InvalidTokenError:
        pass

    # Tenta agente
    try:
        user_id = decode_agent_token(token)
        user = db.get(models.User, user_id)
        if user is not None:
            return user
    except InvalidTokenError:
        pass

    raise unauthorized


def generate_association_code(db: Session) -> str:
    """
    Gera um código numérico único de 6 dígitos para o gestor.
    """
    for _ in range(100):
        code = f"{secrets.randbelow(1_000_000):06d}"
        exists = (
            db.query(models.Manager.id)
            .filter(models.Manager.association_code == code)
            .first()
        )
        if not exists:
            return code
    raise RuntimeError("Falha ao gerar código de associação único.")
