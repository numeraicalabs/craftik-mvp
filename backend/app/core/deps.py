"""FastAPI dependency injection helpers."""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        raise credentials_exception
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_worker(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != UserRole.WORKER:
        raise HTTPException(status_code=403, detail="Worker account required")
    return user


def require_company(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != UserRole.COMPANY:
        raise HTTPException(status_code=403, detail="Company account required")
    return user
