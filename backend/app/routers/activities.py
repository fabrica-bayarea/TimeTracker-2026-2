from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import schemas, crud, models, security
from ..database import get_db

router = APIRouter(prefix="/activities", tags=["Atividades"])

UNAUTHORIZED_RESPONSE = {
    status.HTTP_401_UNAUTHORIZED: {
        "description": "Token ausente, inválido, expirado ou do tipo errado."
    }
}


@router.post(
    "/",
    response_model=schemas.ActivityLogOut,
    status_code=status.HTTP_201_CREATED,
    summary="Recebe uma leitura da janela ativa enviada pelo agente desktop",
    description=(
        "Exige o token do Agente (`POST /collaborators/associate`). O "
        "registro é gravado no colaborador dono do token; o `username` do "
        "corpo é ignorado. Token de gestor não é aceito."
    ),
    responses=UNAUTHORIZED_RESPONSE,
)
def receive_activity(
    log: schemas.ActivityLogCreate,
    user: models.User = Depends(security.get_current_agent),
    db: Session = Depends(get_db),
):
    return crud.create_activity_log(db, log, user)


@router.get(
    "/realtime",
    response_model=list[schemas.RealtimeEntry],
    summary="Visão em tempo real dos colaboradores",
    description=(
        "Retorna a última atividade de cada colaborador da equipe do gestor "
        "autenticado nas últimas horas. Exige token de gestor."
    ),
    responses=UNAUTHORIZED_RESPONSE,
)
def realtime_view(
    manager: models.Manager = Depends(security.get_current_manager),
    db: Session = Depends(get_db),
):
    return crud.get_realtime_view(db, manager.id)
