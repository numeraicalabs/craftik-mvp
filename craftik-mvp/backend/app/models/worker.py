"""WorkerProfile: the professional identity — profession, geo, score."""
from enum import Enum

from sqlalchemy import Boolean, Enum as SQLEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Profession(str, Enum):
    """MVP profession catalog. In production this becomes a table with i18n."""
    ELETTRICISTA = "elettricista"
    IDRAULICO = "idraulico"
    MURATORE = "muratore"
    CARPENTIERE = "carpentiere"
    PIASTRELLISTA = "piastrellista"
    FALEGNAME = "falegname"
    IMBIANCHINO = "imbianchino"
    SALDATORE = "saldatore"
    GRUISTA = "gruista"
    TERMOIDRAULICO = "termoidraulico"
    CARTONGESSISTA = "cartongessista"
    OPERATORE_ESCAVATORE = "operatore_escavatore"


class AvailabilityStatus(str, Enum):
    IMMEDIATE = "immediate"
    WITHIN_WEEK = "within_week"
    WITHIN_MONTH = "within_month"
    NOT_LOOKING = "not_looking"


class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Identity
    first_name: Mapped[str] = mapped_column(String(80), nullable=False)
    last_name: Mapped[str] = mapped_column(String(80), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Profession
    profession: Mapped[Profession] = mapped_column(SQLEnum(Profession, name="profession"), nullable=False)
    years_experience: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Geo (MVP: simple lat/lng columns; Haversine in Python. PostGIS in v2.)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    travel_radius_km: Mapped[int] = mapped_column(Integer, default=25, nullable=False)
    willing_to_relocate: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Economics
    hourly_rate_min: Mapped[int] = mapped_column(Integer, default=25, nullable=False)  # EUR/h
    hourly_rate_max: Mapped[int] = mapped_column(Integer, default=40, nullable=False)

    # Status
    availability: Mapped[AvailabilityStatus] = mapped_column(
        SQLEnum(AvailabilityStatus, name="availability_status"),
        default=AvailabilityStatus.WITHIN_WEEK,
        nullable=False,
    )

    # Score (computed by scoring_service, cached here)
    ai_score: Mapped[int] = mapped_column(Integer, default=50, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="worker_profile")  # noqa: F821
    applications: Mapped[list["Application"]] = relationship(  # noqa: F821
        "Application", back_populates="worker", cascade="all, delete-orphan"
    )
