"""Authentication endpoints: register worker/company, login, current user."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.company import Company
from app.models.user import User, UserRole
from app.models.worker import WorkerProfile
from app.schemas.auth import (
    CurrentUser,
    LoginRequest,
    RegisterCompanyRequest,
    RegisterWorkerRequest,
    Token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_token(user: User) -> Token:
    return Token(
        access_token=create_access_token(user.id, extra={"role": user.role.value}),
        user_id=user.id,
        role=user.role,
    )


@router.post("/register/worker", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_worker(payload: RegisterWorkerRequest, db: Annotated[Session, Depends(get_db)]):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.WORKER,
        is_verified=False,
    )
    db.add(user)
    db.flush()  # get user.id

    profile = WorkerProfile(
        user_id=user.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        profession=payload.profession,
        years_experience=payload.years_experience,
        city=payload.city,
        latitude=payload.latitude,
        longitude=payload.longitude,
        travel_radius_km=payload.travel_radius_km,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return _issue_token(user)


@router.post("/register/company", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_company(payload: RegisterCompanyRequest, db: Annotated[Session, Depends(get_db)]):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(Company).filter(Company.vat_number == payload.vat_number).first():
        raise HTTPException(status_code=409, detail="VAT number already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.COMPANY,
        is_verified=False,
    )
    db.add(user)
    db.flush()

    company = Company(
        user_id=user.id,
        legal_name=payload.legal_name,
        vat_number=payload.vat_number,
        city=payload.city,
        employee_count=payload.employee_count,
    )
    db.add(company)
    db.commit()
    db.refresh(user)
    return _issue_token(user)


@router.post("/login", response_model=Token)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    """OAuth2-compatible login. Accepts `username` (=email) and `password` as form data."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    return _issue_token(user)


@router.post("/login/json", response_model=Token)
def login_json(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    """Alternative JSON login for the SPA — same result as /login."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    return _issue_token(user)


@router.get("/me", response_model=CurrentUser)
def me(current: Annotated[User, Depends(get_current_user)]):
    return CurrentUser(id=current.id, email=current.email, role=current.role, is_verified=current.is_verified)
