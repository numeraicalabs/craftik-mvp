"""Application: a worker applies to a job. Review: after completed engagement."""
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    HIRED = "hired"
    REJECTED = "rejected"
    COMPLETED = "completed"  # engagement finished, reviews can be posted


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_id", "worker_id", name="uq_application_job_worker"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job_posts.id", ondelete="CASCADE"), nullable=False)
    worker_id: Mapped[int] = mapped_column(ForeignKey("worker_profiles.id", ondelete="CASCADE"), nullable=False)

    status: Mapped[ApplicationStatus] = mapped_column(
        SQLEnum(ApplicationStatus, name="application_status"),
        default=ApplicationStatus.APPLIED,
        nullable=False,
    )
    cover_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    match_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0-100
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job: Mapped["JobPost"] = relationship("JobPost", back_populates="applications")  # noqa: F821
    worker: Mapped["WorkerProfile"] = relationship("WorkerProfile", back_populates="applications")  # noqa: F821


class Review(Base):
    """Certified review: only after a completed engagement.

    Enforced at service-level: a review can only be created when the underlying
    Application is in COMPLETED status.
    """
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("application_id", "author_role", name="uq_review_app_author"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    author_role: Mapped[str] = mapped_column(String(16), nullable=False)  # 'worker' or 'company'
    author_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Overall rating 1-5
    rating: Mapped[int] = mapped_column(Integer, nullable=False)

    # Dimensions 1-5 (nullable to allow gradual rollout)
    punctuality: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quality: Mapped[int | None] = mapped_column(Integer, nullable=True)
    communication: Mapped[int | None] = mapped_column(Integer, nullable=True)

    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
