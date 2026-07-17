"""Job post schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.job import JobStatus, JobType
from app.models.worker import Profession


class JobPostCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    profession: Profession
    job_type: JobType
    city: str = Field(min_length=1, max_length=120)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    salary_min: int = Field(ge=1)
    salary_max: int = Field(ge=1)
    is_urgent: bool = False
    min_years_experience: int = Field(default=0, ge=0, le=60)


class JobPostUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    description: str | None = None
    salary_min: int | None = Field(default=None, ge=1)
    salary_max: int | None = Field(default=None, ge=1)
    is_urgent: bool | None = None
    status: JobStatus | None = None


class CompanyBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    legal_name: str
    city: str


class JobPostPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    profession: Profession
    job_type: JobType
    city: str
    latitude: float
    longitude: float
    salary_min: int
    salary_max: int
    is_urgent: bool
    min_years_experience: int
    status: JobStatus
    created_at: datetime
    company: CompanyBrief
