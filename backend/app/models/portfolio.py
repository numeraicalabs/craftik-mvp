"""PortfolioItem: a documented past work. The heart of Craftik's trust model.

A portfolio item can reference a Company on the platform; when that company
confirms it, the item becomes 'verified work' and weighs on the AI score.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    worker_id: Mapped[int] = mapped_column(
        ForeignKey("worker_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str | None] = mapped_column(String(120), nullable=True)
    client_name: Mapped[str | None] = mapped_column(String(160), nullable=True)

    # Location of the worksite
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Timing
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)

    materials: Mapped[str | None] = mapped_column(String(300), nullable=True)

    # Company confirmation (the "prova, non parole" mechanism)
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    worker: Mapped["WorkerProfile"] = relationship("WorkerProfile", backref="portfolio_items")  # noqa: F821
    company: Mapped["Company | None"] = relationship("Company")  # noqa: F821
