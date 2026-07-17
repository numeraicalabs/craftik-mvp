"""Company: the demand-side aggregate."""
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    legal_name: Mapped[str] = mapped_column(String(160), nullable=False)
    vat_number: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # HQ location
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    employee_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="company")  # noqa: F821
    job_posts: Mapped[list["JobPost"]] = relationship(  # noqa: F821
        "JobPost", back_populates="company", cascade="all, delete-orphan"
    )
