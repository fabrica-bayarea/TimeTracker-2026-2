from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas, crud
from ..database import get_db

router = APIRouter(prefix="/users", tags=["Usuários"])


@router.get(
        "/",
        response_model=List[schemas.UserOut],
        summary="Lista os colaboradores cadastrados",
        # description=""
)
def list_users(db: Session = Depends(get_db)):
    return crud.list_users(db)
