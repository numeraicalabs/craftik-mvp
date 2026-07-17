"""Company endpoints."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_company
from app.db.session import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyPublic, CompanyUpdate

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/me", response_model=CompanyPublic)
def get_my_company(
    current: Annotated[User, Depends(require_company)],
    db: Annotated[Session, Depends(get_db)],
):
    company = db.query(Company).filter(Company.user_id == current.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.patch("/me", response_model=CompanyPublic)
def update_my_company(
    payload: CompanyUpdate,
    current: Annotated[User, Depends(require_company)],
    db: Annotated[Session, Depends(get_db)],
):
    company = db.query(Company).filter(Company.user_id == current.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/{company_id}", response_model=CompanyPublic)
def get_company(
    company_id: int,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company
