from fastapi import APIRouter, Depends, HTTPException, status
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


@router.post(
    "/sync",
    response_model=schemas.ActivitySyncResponse,
    summary="Sincroniza um lote de atividades do Agente (idempotente)",
    description=(
        "Exige o token do Agente (`POST /collaborators/associate`). Os "
        "registros são gravados no colaborador dono do token. Reenviar o "
        "mesmo lote (ex.: após queda de rede) não duplica linhas: um "
        "registro com o mesmo usuário, máquina, processo e `started_at` é "
        "ignorado, mas continua listado em `confirmed_ids`. O Agente só "
        "deve marcar como sincronizados os registros presentes em "
        "`confirmed_ids`. Registros com `task_id` inexistente ou de outro "
        "gestor voltam em `rejected` e não são gravados; os demais do lote "
        "são processados normalmente."
    ),
    responses={
        **UNAUTHORIZED_RESPONSE,
        status.HTTP_409_CONFLICT: {
            "description": "Lotes simultâneos disputaram os mesmos "
                           "registros; reenvie o lote."
        },
    },
)
def sync_activities(
    payload: schemas.ActivitySyncRequest,
    user: models.User = Depends(security.get_current_agent),
    db: Session = Depends(get_db),
):
    try:
        return crud.sync_activity_logs(db, payload.activities, user)
    except crud.ActivitySyncConflictError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflito ao gravar o lote. Reenvie-o.",
        ) from None


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
