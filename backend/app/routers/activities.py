from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .. import schemas, crud, security, models
from ..database import get_db

router = APIRouter(prefix="/activities", tags=["Atividades"])


@router.post(
    "/",
    response_model=schemas.ActivityLogOut,
    status_code=status.HTTP_201_CREATED,
    summary="Recebe uma leitura da janela ativa enviada pelo agente desktop",
)
def receive_activity(
    log: schemas.ActivityLogCreate,
    credentials: HTTPAuthorizationCredentials | None = Depends(security.bearer_scheme),
    db: Session = Depends(get_db)
):
    current_user: models.User | None = None
    if credentials:
        try:
            user_id = security.decode_agent_token(credentials.credentials)
            current_user = db.get(models.User, user_id)
        except security.InvalidTokenError:
            pass

    return crud.create_activity_log(db, log, current_user=current_user)


@router.get(
    "/realtime",
    response_model=list[schemas.RealtimeEntry],
    summary="Visão em tempo real dos colaboradores",
    description=(
        "Retorna a última atividade de cada colaborador ativo "
        "nos últimos minutos."
    ),
)
def realtime_view(
    credentials: HTTPAuthorizationCredentials | None = Depends(security.bearer_scheme),
    db: Session = Depends(get_db)
):
    manager_id = None
    if credentials:
        try:
            manager_id = security.decode_access_token(credentials.credentials)
        except security.InvalidTokenError:
            pass

    return crud.get_realtime_view(db, manager_id=manager_id)

