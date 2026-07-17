"""Application and review schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus
from app.schemas.job import JobPostPublic
from app.schemas.worker import WorkerProfilePublic


class ApplicationCreate(BaseModel):
    cover_message: str | None = Field(default=None, max_length=2000)


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: ApplicationStatus
    cover_message: str | None
    match_score: int
    applied_at: datetime
    job: JobPostPublic
    worker: WorkerProfilePublic


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    punctuality: int | None = Field(default=None, ge=1, le=5)
    quality: int | None = Field(default=None, ge=1, le=5)
    communication: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class ReviewPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    application_id: int
    author_role: str
    rating: int
    punctuality: int | None
    quality: int | None
    communication: int | None
    comment: str | None
    created_at: datetime
