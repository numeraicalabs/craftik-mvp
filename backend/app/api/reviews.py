"""Certified reviews — only for completed engagements."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.application import Application, ApplicationStatus, Review
from app.models.company import Company
from app.models.job import JobPost
from app.models.user import User, UserRole
from app.models.worker import WorkerProfile
from app.schemas.application import ReviewCreate, ReviewPublic
from app.services.scoring import recompute_and_persist

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/applications/{application_id}", response_model=ReviewPublic, status_code=201)
def create_review(
    application_id: int,
    payload: ReviewCreate,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    app = (
        db.query(Application)
        .options(joinedload(Application.job).joinedload(JobPost.company), joinedload(Application.worker))
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != ApplicationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Reviews are only allowed after completed engagements")

    # Determine author role and target user
    if current.role == UserRole.COMPANY:
        company = db.query(Company).filter(Company.user_id == current.id).first()
        if not company or app.job.company_id != company.id:
            raise HTTPException(status_code=403, detail="Not your engagement")
        author_role = "company"
        target = db.query(WorkerProfile).filter(WorkerProfile.id == app.worker_id).first()
        target_user_id = target.user_id if target else None
    elif current.role == UserRole.WORKER:
        worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current.id).first()
        if not worker or app.worker_id != worker.id:
            raise HTTPException(status_code=403, detail="Not your engagement")
        author_role = "worker"
        target_user_id = app.job.company.user_id
    else:
        raise HTTPException(status_code=403, detail="Role not permitted")

    if target_user_id is None:
        raise HTTPException(status_code=500, detail="Review target not found")

    existing = (
        db.query(Review)
        .filter(Review.application_id == application_id, Review.author_role == author_role)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already reviewed this engagement")

    review = Review(
        application_id=application_id,
        author_role=author_role,
        author_user_id=current.id,
        target_user_id=target_user_id,
        **payload.model_dump(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # If company reviewed worker, recompute worker score.
    if author_role == "company":
        worker = db.query(WorkerProfile).filter(WorkerProfile.id == app.worker_id).first()
        if worker:
            recompute_and_persist(db, worker)

    return review


@router.get("/workers/{worker_id}", response_model=list)
def list_reviews_for_worker(
    worker_id: int,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    worker = db.get(WorkerProfile, worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    reviews = (
        db.query(Review)
        .filter(Review.target_user_id == worker.user_id, Review.author_role == "company")
        .order_by(Review.created_at.desc())
        .all()
    )
    out = []
    for r in reviews:
        author_company = db.query(Company).filter(Company.user_id == r.author_user_id).first()
        out.append({
            "id": r.id,
            "author_role": r.author_role,
            "author_name": author_company.legal_name if author_company else "Azienda",
            "rating": r.rating,
            "punctuality": r.punctuality,
            "quality": r.quality,
            "communication": r.communication,
            "comment": r.comment,
            "created_at": r.created_at,
        })
    return out
