from typing import List

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .. import schemas, crud, security
from ..database import get_db

router = APIRouter(prefix="/users", tags=["Usuários"])


@router.get(
        "/",
        response_model=List[schemas.UserOut],
        summary="Lista os colaboradores cadastrados",
)
def list_users(
    credentials: HTTPAuthorizationCredentials | None = Depends(security.bearer_scheme),
    db: Session = Depends(get_db)
):
    manager_id = None
    if credentials:
        try:
            manager_id = security.decode_access_token(credentials.credentials)
        except security.InvalidTokenError:
            pass
    return crud.list_users(db, manager_id=manager_id)
