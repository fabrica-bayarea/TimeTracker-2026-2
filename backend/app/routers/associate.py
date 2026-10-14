from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(prefix="/associate", tags=["Associação"])


@router.post(
    "/",
    response_model=schemas.AssociateResponse,
    status_code=status.HTTP_200_OK,
    summary="Associa o agente desktop ao gestor via código de 6 dígitos",
    description=(
        "Valida o código de associação fornecido pelo gestor, vincula "
        "o colaborador ao gestor e retorna o token de acesso de longa "
        "duração para o agente desktop."
    ),
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Código inválido ou expirado."
        }
    },
)
def associate_agent(
    payload: schemas.AssociateRequest,
    db: Session = Depends(get_db)
):
    try:
        user, token = crud.associate_agent(
            db, payload.code, payload.username, payload.hostname
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from None

    return schemas.AssociateResponse(
        token=token,
        access_token=token,
        user_id=user.id,
        username=user.username,
    )


@router.get(
    "/code",
    summary="Consulta o código de associação do gestor padrão (para uso no MVP)",
)
def get_current_association_code(db: Session = Depends(get_db)):
    manager = db.query(models.Manager).first()
    if not manager:
        manager = crud.create_manager(
            db, schemas.ManagerCreate(email="admin@timetracker.com", password="adminpassword123")
        )
    crud.get_or_create_manager_association_code(db, manager)
    return {
        "association_code": manager.association_code,
        "manager_email": manager.email,
    }
