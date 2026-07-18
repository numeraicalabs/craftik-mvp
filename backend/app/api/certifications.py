"""Certification endpoints. In MVP, adding a certification auto-verifies it
(simulating the OCR+registry check); production plugs a real verification queue.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_worker
from app.db.session import get_db
from app.models.certification import Certification, VerificationStatus
from app.models.user import User
from app.models.worker import WorkerProfile
from app.schemas.extras import CertificationCreate, CertificationPublic
from app.services.scoring import recompute_and_persist

router = APIRouter(prefix="/certifications", tags=["certifications"])


def _my_worker(db: Session, user: User) -> WorkerProfile:
    w = db.query(WorkerProfile).filter(WorkerProfile.user_id == user.id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return w


@router.get("/workers/{worker_id}", response_model=list[CertificationPublic])
def list_for_worker(
    worker_id: int,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return (
        db.query(Certification)
        .filter(Certification.worker_id == worker_id)
        .order_by(Certification.kind, Certification.name)
        .all()
    )


@router.post("/me", response_model=CertificationPublic, status_code=201)
def add_mine(
    payload: CertificationCreate,
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    worker = _my_worker(db, current)
    cert = Certification(
        worker_id=worker.id,
        verification_status=VerificationStatus.VERIFIED,  # MVP: instant verify
        **payload.model_dump(),
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    recompute_and_persist(db, worker)
    return cert


@router.delete("/me/{cert_id}", status_code=204)
def delete_mine(
    cert_id: int,
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    worker = _my_worker(db, current)
    cert = db.get(Certification, cert_id)
    if not cert or cert.worker_id != worker.id:
        raise HTTPException(status_code=404, detail="Certification not found")
    db.delete(cert)
    db.commit()
    recompute_and_persist(db, worker)
