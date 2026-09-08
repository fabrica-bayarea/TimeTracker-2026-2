import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas, crud
from ..database import get_db

router = APIRouter(prefix="/categories", tags=["Categorias"])


@router.get(
    "/",
    response_model=list[schemas.CategoryOut],
    summary="Lista as categorias"
)
def list_categories(db: Session = Depends(get_db)):
    return crud.list_categories(db)


@router.post(
    "/",
    response_model=schemas.CategoryOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma nova categoria",
)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db)
):
    return crud.create_category(db, category)


@router.get(
    "/rules",
    response_model=list[schemas.CategorizationRuleOut],
    summary="Lista as regras de categorização (palavras-chave)",
    # description="",
)
def list_rules(db: Session = Depends(get_db)):
    return crud.list_rules(db)


@router.post(
    "/rules",
    response_model=schemas.CategorizationRuleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma nova regra de categorização",
    # description="",
)
def create_rule(
    rule: schemas.CategorizationRuleCreate,
    db: Session = Depends(get_db)
):
    return crud.create_rule(db, rule)


@router.put(
    "/rules/{rule_id}",
    response_model=schemas.CategorizationRuleOut,
    summary="Edita uma regra de categorização existente",
    # description="",
)
def update_rule(
    rule_id: uuid.UUID,
    rule: schemas.CategorizationRuleUpdate,
    db: Session = Depends(get_db)
):
    updated = crud.update_rule(db, rule_id, rule)

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Regra não encontrada"
        )

    return updated


@router.delete(
    "/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove uma regra de categorização",
)
def delete_rule(rule_id: uuid.UUID, db: Session = Depends(get_db)):
    deleted = crud.delete_rule(db, rule_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regra não encontrada"
        )
