"""JobPost: an opportunity published by a company."""
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.worker import Profession


class JobType(str, Enum):
    PERMANENT = "permanent"
    TEMPORARY = "temporary"
    FREELANCE = "freelance"
    SUBCONTRACT = "subcontract"


class JobStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    FILLED = "filled"


class JobPost(Base):
    __tablename__ = "job_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    profession: Mapped[Profession] = mapped_column(SQLEnum(Profession, name="profession"), nullable=False)
    job_type: Mapped[JobType] = mapped_column(SQLEnum(JobType, name="job_type"), nullable=False)

    # Location
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    # Compensation (EUR/h for freelance/temp, EUR/month for permanent)
    salary_min: Mapped[int] = mapped_column(Integer, nullable=False)
    salary_max: Mapped[int] = mapped_column(Integer, nullable=False)

    # Flags
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    min_years_experience: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Status
    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus, name="job_status"), default=JobStatus.OPEN, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="job_posts")  # noqa: F821
    applications: Mapped[list["Application"]] = relationship(  # noqa: F821
        "Application", back_populates="job", cascade="all, delete-orphan"
    )
