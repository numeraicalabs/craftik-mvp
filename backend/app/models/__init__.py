"""Re-export all models so metadata is complete for Alembic autogenerate."""
from app.models.user import User, UserRole
from app.models.worker import WorkerProfile, Profession, AvailabilityStatus
from app.models.company import Company
from app.models.job import JobPost, JobType, JobStatus
from app.models.application import Application, ApplicationStatus, Review
from app.models.certification import Certification, CertificationKind, VerificationStatus
from app.models.portfolio import PortfolioItem
from app.models.message import Conversation, Message

__all__ = [
    "User", "UserRole",
    "WorkerProfile", "Profession", "AvailabilityStatus",
    "Company",
    "JobPost", "JobType", "JobStatus",
    "Application", "ApplicationStatus", "Review",
    "Certification", "CertificationKind", "VerificationStatus",
    "PortfolioItem",
    "Conversation", "Message",
]
