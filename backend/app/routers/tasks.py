import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .. import crud, models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/tasks", tags=["Tarefas (Tasks)"])


def get_current_or_default_manager(
    credentials: HTTPAuthorizationCredentials | None = Depends(security.bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Manager:
    if credentials:
        try:
            manager_id = security.decode_access_token(credentials.credentials)
            manager = db.query(models.Manager).filter(models.Manager.id == manager_id).first()
            if manager:
                return manager
        except security.InvalidTokenError:
            pass

    # Modo sem login (MVP aberto): usa o primeiro gestor ou cria um padrão
    manager = db.query(models.Manager).first()
    if not manager:
        manager = crud.create_manager(
            db, schemas.ManagerCreate(email="admin@timetracker.com", password="adminpassword123")
        )
    return manager


@router.post(
    "/",
    response_model=schemas.TaskOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma nova tarefa e atribui colaboradores",
)
def create_task(
    payload: schemas.TaskCreate,
    manager: models.Manager = Depends(get_current_or_default_manager),
    db: Session = Depends(get_db),
):
    return crud.create_task(db, manager.id, payload)


@router.get(
    "/",
    response_model=list[schemas.TaskOut],
    summary="Lista as tarefas criadas pelo gestor autenticado ou padrão",
)
def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    manager: models.Manager = Depends(get_current_or_default_manager),
    db: Session = Depends(get_db),
):
    return crud.list_tasks(db, manager.id, status=status_filter)


@router.get(
    "/my",
    response_model=list[schemas.TaskOut],
    summary="Lista as tarefas ativas atribuídas ao colaborador (Agente Desktop)",
)
@router.get(
    "/my-tasks",
    response_model=list[schemas.TaskOut],
    summary="Lista as tarefas ativas atribuídas ao colaborador (Agente Desktop)",
)
def list_my_tasks(
    user: models.User = Depends(security.get_current_agent),
    db: Session = Depends(get_db),
):
    return crud.list_collaborator_tasks(db, user)


@router.get(
    "/{task_id}",
    response_model=schemas.TaskOut,
    summary="Obtém detalhes de uma tarefa",
)
def get_task(
    task_id: uuid.UUID,
    manager: models.Manager = Depends(get_current_or_default_manager),
    db: Session = Depends(get_db),
):
    task = crud.get_task(db, task_id, manager_id=manager.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada.",
        )
    return task


@router.patch(
    "/{task_id}",
    response_model=schemas.TaskOut,
    summary="Atualiza dados ou status de uma tarefa",
)
def update_task(
    task_id: uuid.UUID,
    payload: schemas.TaskUpdate,
    manager: models.Manager = Depends(get_current_or_default_manager),
    db: Session = Depends(get_db),
):
    task = crud.update_task(db, task_id, manager.id, payload)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada.",
        )
    return task


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Exclui uma tarefa",
)
def delete_task(
    task_id: uuid.UUID,
    manager: models.Manager = Depends(get_current_or_default_manager),
    db: Session = Depends(get_db),
):
    success = crud.delete_task(db, task_id, manager.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada.",
        )
