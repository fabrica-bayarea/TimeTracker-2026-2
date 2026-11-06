from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .. import schemas, crud, models, security
from ..database import get_db
from ..rate_limit import association_limiter

router = APIRouter(prefix="/users", tags=["Usuários"])
collaborators_router = APIRouter(
    prefix="/collaborators", tags=["Associação do colaborador"]
)


@router.get(
        "/",
        response_model=List[schemas.UserOut],
        summary="Lista os colaboradores da equipe do gestor",
        description=(
            "Exige token de gestor e retorna somente os colaboradores "
            "associados a ele."
        ),
        responses={
            status.HTTP_401_UNAUTHORIZED: {
                "description": "Token ausente, inválido ou expirado."
            }
        },
)
def list_users(
    manager: models.Manager = Depends(security.get_current_manager),
    db: Session = Depends(get_db),
):
    return crud.list_users(db, manager.id)


@collaborators_router.post(
    "/associate",
    response_model=schemas.AssociationOut,
    summary="Associa o colaborador ao gestor pelo código de 6 dígitos",
    description=(
        "Chamada pelo Agente Desktop no primeiro acesso. Se o código "
        "pertence a um gestor, registra (ou atualiza) o colaborador "
        "identificado por `username`, vincula-o ao gestor e devolve o token "
        "do Agente. É idempotente: repetir a chamada com o mesmo gestor "
        "apenas revalida o acesso e emite um novo token. Código inválido "
        "não persiste vínculo nem emite token."
    ),
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Código de associação inválido."
        },
        status.HTTP_409_CONFLICT: {
            "description": "Colaborador já associado a outro gestor."
        },
        status.HTTP_429_TOO_MANY_REQUESTS: {
            "description": "Tentativas inválidas demais; aguarde (Retry-After)."
        },
    },
)
def associate_collaborator(
    payload: schemas.AssociationRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    origin = request.client.host if request.client else "desconhecido"
    retry_after = association_limiter.retry_after(origin)

    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas com código inválido. "
                   "Aguarde e tente novamente.",
            headers={"Retry-After": str(retry_after)},
        )

    try:
        user, already = crud.associate_collaborator(
            db,
            payload.association_code,
            payload.username,
            payload.machine_name,
        )
    except crud.InvalidAssociationCodeError:
        association_limiter.register_failure(origin)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código de associação inválido.",
        ) from None
    except crud.AlreadyAssociatedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este colaborador já está associado a outro gestor.",
        ) from None

    return schemas.AssociationOut(
        access_token=security.create_agent_token(user.id),
        expires_in=security.AGENT_TOKEN_EXPIRE_MINUTES * 60,
        collaborator_id=user.id,
        username=user.username,
        machine_name=user.machine_name,
        manager_id=user.manager_id,
        already_associated=already,
    )
