"""User: the core identity aggregate. Each user has one role: worker or company."""
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class UserRole(str, Enum):
    WORKER = "worker"
    COMPANY = "company"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole, name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Reverse relationships (uselist=False for 1:1)
    worker_profile: Mapped["WorkerProfile | None"] = relationship(  # noqa: F821
        "WorkerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    company: Mapped["Company | None"] = relationship(  # noqa: F821
        "Company", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
