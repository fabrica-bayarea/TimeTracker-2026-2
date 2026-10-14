from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post(
    "/register",
    response_model=schemas.ManagerOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cria a conta de um gestor",
    description=(
        "Cadastra um gestor com e-mail e senha (mínimo de 8 caracteres). "
        "O e-mail é único (sem diferenciar maiúsculas/minúsculas) e a senha "
        "é armazenada somente como hash bcrypt."
    ),
    responses={
        status.HTTP_409_CONFLICT: {"description": "E-mail já cadastrado."}
    },
)
def register(
    payload: schemas.ManagerCreate,
    db: Session = Depends(get_db)
):
    try:
        return crud.create_manager(db, payload)
    except crud.EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado.",
        ) from None


@router.post(
    "/login",
    response_model=schemas.Token,
    summary="Autentica o gestor e retorna um token JWT",
    description=(
        "Valida e-mail e senha e retorna um token JWT de acesso. Envie-o nas "
        "rotas protegidas no cabeçalho `Authorization: Bearer <token>`."
    ),
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "description": "E-mail ou senha inválidos."
        }
    },
)
def login(
    payload: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    manager = crud.authenticate_manager(db, payload.email, payload.password)

    if manager is None:
        # Mensagem genérica: não revela se o e-mail existe.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return schemas.Token(
        access_token=security.create_access_token(manager.id),
        expires_in=security.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get(
    "/me",
    response_model=schemas.ManagerOut,
    summary="Retorna o gestor autenticado",
    description="Rota protegida: exige token JWT válido.",
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "description": "Token ausente, inválido ou expirado."
        }
    },
)
def read_current_manager(
    manager: models.Manager = Depends(security.get_current_manager),
    db: Session = Depends(get_db),
):
    crud.get_or_create_manager_association_code(db, manager)
    return manager
