"""Certification: patentini, certificazioni, licenses attached to a worker."""
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CertificationKind(str, Enum):
    CERTIFICAZIONE = "certificazione"
    PATENTINO = "patentino"
    PATENTE = "patente"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Certification(Base):
    __tablename__ = "certifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    worker_id: Mapped[int] = mapped_column(
        ForeignKey("worker_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    kind: Mapped[CertificationKind] = mapped_column(
        SQLEnum(CertificationKind, name="certification_kind"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    issuer: Mapped[str | None] = mapped_column(String(160), nullable=True)
    issued_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expires_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SQLEnum(VerificationStatus, name="verification_status"),
        default=VerificationStatus.PENDING,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    worker: Mapped["WorkerProfile"] = relationship("WorkerProfile", backref="certifications")  # noqa: F821
