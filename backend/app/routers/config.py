from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas, crud
from ..database import get_db

router = APIRouter(prefix="/config", tags=["Configurações"])


@router.get(
    "/",
    response_model=schemas.SystemSettingsOut,
    summary="Consulta as configurações do sistema",
    description=(
        "O agente desktop consulta este endpoint periodicamente para saber o "
        "intervalo de captura e o tempo de inatividade configurados."
    ),
)
def read_settings(db: Session = Depends(get_db)):
    return crud.get_settings(db)


@router.put(
    "/",
    response_model=schemas.SystemSettingsOut,
    summary="Atualiza as configurações do sistema",
    description=(
        "O gestor altera o intervalo de captura e o tempo de inatividade "
        "via painel web."
    ),
)
def update_settings(
    update: schemas.SystemSettingsUpdate,
    db: Session = Depends(get_db)
):
    return crud.update_settings(db, update)
