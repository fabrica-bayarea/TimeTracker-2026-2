import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/tasks", tags=["Tasks"])

UNAUTHORIZED_RESPONSE = {
    status.HTTP_401_UNAUTHORIZED: {
        "description": "Token ausente, inválido ou expirado."
    }
}
NOT_FOUND_RESPONSE = {
    status.HTTP_404_NOT_FOUND: {
        "description": "Task inexistente ou pertencente a outro gestor."
    }
}
INVALID_COLLABORATORS_RESPONSE = {
    status.HTTP_422_UNPROCESSABLE_CONTENT: {
        "description": "Dados inválidos ou colaboradores fora da equipe."
    }
}


def _task_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Task não encontrada.",
    )


def _invalid_collaborators(
    exc: crud.InvalidCollaboratorsError
) -> HTTPException:
    ids = ", ".join(str(user_id) for user_id in exc.invalid_ids)

    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=f"Colaboradores inexistentes ou fora da sua equipe: {ids}.",
    )


@router.post(
    "/",
    response_model=schemas.TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma task e atribui colaboradores",
    description=(
        "Cria uma task do gestor autenticado. Os `collaborator_ids` devem ser "
        "colaboradores da equipe do gestor; ids inexistentes ou de outra "
        "equipe recusam a criação inteira."
    ),
    responses={**UNAUTHORIZED_RESPONSE, **INVALID_COLLABORATORS_RESPONSE},
)
def create_task(
    task: schemas.TaskCreate,
    manager: models.Manager = Depends(security.get_current_manager),
    db: Session = Depends(get_db),
):
    try:
        return crud.create_task(db, manager.id, task)
    except crud.InvalidCollaboratorsError as exc:
        raise _invalid_collaborators(exc) from None


@router.get(
    "/",
    response_model=list[schemas.TaskResponse],
    summary="Lista as tasks do gestor autenticado",
    description=(
        "Retorna somente as tasks do gestor, da mais nova à mais antiga."
    ),
    responses=UNAUTHORIZED_RESPONSE,
)
def list_tasks(
    manager: models.Manager = Depends(security.get_current_manager),
    db: Session = Depends(get_db),
):
    return crud.list_tasks(db, manager.id)


@router.get(
    "/{task_id}",
    response_model=schemas.TaskResponse,
    summary="Detalha uma task com seus colaboradores",
    responses={**UNAUTHORIZED_RESPONSE, **NOT_FOUND_RESPONSE},
)
def read_task(
    task_id: uuid.UUID,
    manager: models.Manager = Depends(security.get_current_manager),
    db: Session = Depends(get_db),
):
    task = crud.get_task(db, manager.id, task_id)

    if task is None:
        raise _task_not_found()

    return task


@router.put(
    "/{task_id}",
    response_model=schemas.TaskResponse,
    summary="Atualiza título, descrição e colaboradores da task",
    description=(
        "Atualização parcial: só os campos enviados mudam. "
        "`collaborator_ids` substitui a lista inteira (`[]` remove todos). "
        "Se algum colaborador for inválido, nada é alterado."
    ),
    responses={
        **UNAUTHORIZED_RESPONSE,
        **NOT_FOUND_RESPONSE,
        **INVALID_COLLABORATORS_RESPONSE,
    },
)
def update_task(
    task_id: uuid.UUID,
    task_update: schemas.TaskUpdate,
    manager: models.Manager = Depends(security.get_current_manager),
    db: Session = Depends(get_db),
):
    task = crud.get_task(db, manager.id, task_id)

    if task is None:
        raise _task_not_found()

    try:
        return crud.update_task(db, task, task_update)
    except crud.InvalidCollaboratorsError as exc:
        raise _invalid_collaborators(exc) from None


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Exclui uma task",
    description=(
        "Remove a task e os vínculos com os colaboradores. "
        "Os colaboradores em si não são afetados."
    ),
    responses={**UNAUTHORIZED_RESPONSE, **NOT_FOUND_RESPONSE},
)
def delete_task(
    task_id: uuid.UUID,
    manager: models.Manager = Depends(security.get_current_manager),
    db: Session = Depends(get_db),
):
    task = crud.get_task(db, manager.id, task_id)

    if task is None:
        raise _task_not_found()

    crud.delete_task(db, task)
