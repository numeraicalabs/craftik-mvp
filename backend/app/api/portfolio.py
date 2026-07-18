"""Portfolio endpoints: workers document past works; linked companies confirm them."""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_company, require_worker
from app.db.session import get_db
from app.models.company import Company
from app.models.portfolio import PortfolioItem
from app.models.user import User
from app.models.worker import WorkerProfile
from app.schemas.extras import PortfolioItemCreate, PortfolioItemPublic
from app.services.scoring import recompute_and_persist

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/workers/{worker_id}", response_model=list[PortfolioItemPublic])
def list_for_worker(
    worker_id: int,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return (
        db.query(PortfolioItem)
        .filter(PortfolioItem.worker_id == worker_id)
        .order_by(PortfolioItem.year.desc().nullslast(), PortfolioItem.id.desc())
        .all()
    )


@router.post("/me", response_model=PortfolioItemPublic, status_code=201)
def add_mine(
    payload: PortfolioItemCreate,
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    if payload.company_id is not None and db.get(Company, payload.company_id) is None:
        raise HTTPException(status_code=404, detail="Linked company not found")

    item = PortfolioItem(worker_id=worker.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/me/{item_id}", status_code=204)
def delete_mine(
    item_id: int,
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current.id).first()
    item = db.get(PortfolioItem, item_id)
    if not worker or not item or item.worker_id != worker.id:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    db.delete(item)
    db.commit()
    recompute_and_persist(db, worker)


@router.get("/pending-confirmations", response_model=list[PortfolioItemPublic])
def pending_confirmations(
    current: Annotated[User, Depends(require_company)],
    db: Annotated[Session, Depends(get_db)],
):
    """Items that reference the current company and still await confirmation."""
    company = db.query(Company).filter(Company.user_id == current.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return (
        db.query(PortfolioItem)
        .filter(PortfolioItem.company_id == company.id, PortfolioItem.confirmed.is_(False))
        .order_by(PortfolioItem.created_at.desc())
        .all()
    )


@router.post("/{item_id}/confirm", response_model=PortfolioItemPublic)
def confirm(
    item_id: int,
    current: Annotated[User, Depends(require_company)],
    db: Annotated[Session, Depends(get_db)],
):
    company = db.query(Company).filter(Company.user_id == current.id).first()
    item = db.get(PortfolioItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    if not company or item.company_id != company.id:
        raise HTTPException(status_code=403, detail="This work is not linked to your company")
    if item.confirmed:
        return item

    item.confirmed = True
    item.confirmed_at = datetime.now(timezone.utc)
    db.add(item)
    db.commit()
    db.refresh(item)

    worker = db.get(WorkerProfile, item.worker_id)
    if worker:
        recompute_and_persist(db, worker)
    return item
