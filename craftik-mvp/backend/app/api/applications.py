"""Application endpoints: worker applies, company reviews applications."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_company, require_worker
from app.db.session import get_db
from app.models.application import Application, ApplicationStatus
from app.models.company import Company
from app.models.job import JobPost, JobStatus
from app.models.user import User
from app.models.worker import WorkerProfile
from app.schemas.application import ApplicationCreate, ApplicationPublic, ApplicationStatusUpdate
from app.services.matching import match_score

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("/jobs/{job_id}", response_model=ApplicationPublic, status_code=201)
def apply_to_job(
    job_id: int,
    payload: ApplicationCreate,
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    job = db.get(JobPost, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.OPEN:
        raise HTTPException(status_code=400, detail="Job is not open")

    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    existing = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.worker_id == worker.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already applied to this job")

    application = Application(
        job_id=job_id,
        worker_id=worker.id,
        cover_message=payload.cover_message,
        match_score=match_score(worker, job),
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    # Trigger relationship loads for response
    _ = application.job.company
    _ = application.worker
    return application


@router.get("/mine", response_model=list[ApplicationPublic])
def list_my_applications(
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == current.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return (
        db.query(Application)
        .options(
            joinedload(Application.job).joinedload(JobPost.company),
            joinedload(Application.worker),
        )
        .filter(Application.worker_id == worker.id)
        .order_by(desc(Application.applied_at))
        .all()
    )


@router.get("/jobs/{job_id}", response_model=list[ApplicationPublic])
def list_applications_for_job(
    job_id: int,
    current: Annotated[User, Depends(require_company)],
    db: Annotated[Session, Depends(get_db)],
):
    company = db.query(Company).filter(Company.user_id == current.id).first()
    job = db.get(JobPost, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not company or job.company_id != company.id:
        raise HTTPException(status_code=403, detail="Not your job post")

    return (
        db.query(Application)
        .options(
            joinedload(Application.job).joinedload(JobPost.company),
            joinedload(Application.worker),
        )
        .filter(Application.job_id == job_id)
        .order_by(desc(Application.match_score))
        .all()
    )


@router.patch("/{application_id}", response_model=ApplicationPublic)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    current: Annotated[User, Depends(require_company)],
    db: Annotated[Session, Depends(get_db)],
):
    """Company updates an application's status through the pipeline."""
    company = db.query(Company).filter(Company.user_id == current.id).first()
    app = db.query(Application).options(joinedload(Application.job)).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if not company or app.job.company_id != company.id:
        raise HTTPException(status_code=403, detail="Not your application")

    app.status = payload.status
    # When hired, mark the job as filled (simple MVP rule; enterprises may keep multi-hire jobs).
    if payload.status == ApplicationStatus.HIRED:
        app.job.status = JobStatus.FILLED
        db.add(app.job)
    db.add(app)
    db.commit()
    db.refresh(app)
    _ = app.worker
    _ = app.job.company
    return app
