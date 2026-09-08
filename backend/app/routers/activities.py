from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import schemas, crud
from ..database import get_db

router = APIRouter(prefix="/activities", tags=["Atividades"])


@router.post(
    "/",
    response_model=schemas.ActivityLogOut,
    status_code=status.HTTP_201_CREATED,
    summary="Recebe uma leitura da janela ativa enviada pelo agente desktop",
    # description="",
)
def receive_activity(
    log: schemas.ActivityLogCreate,
    db: Session = Depends(get_db)
):
    return crud.create_activity_log(db, log)


@router.get(
    "/realtime",
    response_model=list[schemas.RealtimeEntry],
    summary="Visão em tempo real dos colaboradores",
    description=(
        "Retorna a última atividade de cada colaborador ativo "
        "nos últimos minutos."
    ),
)
def realtime_view(db: Session = Depends(get_db)):
    return crud.get_realtime_view(db)
