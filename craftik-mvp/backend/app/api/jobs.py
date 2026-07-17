"""Job post endpoints — create, list with geo search, get, update."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_company
from app.db.session import get_db
from app.models.company import Company
from app.models.job import JobPost, JobStatus
from app.models.user import User
from app.models.worker import Profession
from app.schemas.job import JobPostCreate, JobPostPublic, JobPostUpdate
from app.services.geo import haversine_km

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobPostPublic, status_code=201)
def create_job(
    payload: JobPostCreate,
    current: Annotated[User, Depends(require_company)],
    db: Annotated[Session, Depends(get_db)],
):
    if payload.salary_min > payload.salary_max:
        raise HTTPException(status_code=422, detail="salary_min cannot exceed salary_max")
    company = db.query(Company).filter(Company.user_id == current.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    job = JobPost(company_id=company.id, **payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    _ = job.company  # trigger relationship load for the response
    return job


@router.get("", response_model=list[JobPostPublic])
def list_jobs(
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    profession: Profession | None = Query(default=None),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
    radius_km: int | None = Query(default=None, ge=1, le=500),
    is_urgent: bool | None = Query(default=None),
    limit: int = Query(50, ge=1, le=200),
):
    """List open jobs with optional filters. Geo filter requires all three of lat/lng/radius."""
    q = db.query(JobPost).options(joinedload(JobPost.company)).filter(JobPost.status == JobStatus.OPEN)
    if profession:
        q = q.filter(JobPost.profession == profession)
    if is_urgent is not None:
        q = q.filter(JobPost.is_urgent == is_urgent)
    q = q.order_by(desc(JobPost.is_urgent), desc(JobPost.created_at))

    jobs = q.limit(500).all()

    if latitude is not None and longitude is not None and radius_km is not None:
        jobs = [j for j in jobs if haversine_km(latitude, longitude, j.latitude, j.longitude) <= radius_km]

    return jobs[:limit]


@router.get("/mine", response_model=list[JobPostPublic])
def list_my_jobs(
    current: Annotated[User, Depends(require_company)],
    db: Annotated[Session, Depends(get_db)],
):
    company = db.query(Company).filter(Company.user_id == current.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return (
        db.query(JobPost)
        .options(joinedload(JobPost.company))
        .filter(JobPost.company_id == company.id)
        .order_by(desc(JobPost.created_at))
        .all()
    )


@router.get("/{job_id}", response_model=JobPostPublic)
def get_job(
    job_id: int,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    job = db.query(JobPost).options(joinedload(JobPost.company)).filter(JobPost.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.patch("/{job_id}", response_model=JobPostPublic)
def update_job(
    job_id: int,
    payload: JobPostUpdate,
    current: Annotated[User, Depends(require_company)],
    db: Annotated[Session, Depends(get_db)],
):
    company = db.query(Company).filter(Company.user_id == current.id).first()
    job = db.query(JobPost).filter(JobPost.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not company or job.company_id != company.id:
        raise HTTPException(status_code=403, detail="Not your job post")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    db.add(job)
    db.commit()
    db.refresh(job)
    _ = job.company
    return job
