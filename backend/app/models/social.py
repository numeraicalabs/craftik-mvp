"""Social layer on portfolio items: photos (proof), likes, comments.

Photos are stored as data URLs in the DB for the MVP. This avoids needing
object storage (S3) on Render's free tier, where the filesystem is ephemeral.
Kept small (client resizes before upload); migrate to S3 + CDN in production.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PortfolioPhoto(Base):
    __tablename__ = "portfolio_photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    portfolio_item_id: Mapped[int] = mapped_column(
        ForeignKey("portfolio_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # data URL (image/jpeg;base64,...) — kept under ~200KB by client-side resize
    data_url: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[str | None] = mapped_column(String(200), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PortfolioLike(Base):
    __tablename__ = "portfolio_likes"
    __table_args__ = (
        UniqueConstraint("portfolio_item_id", "user_id", name="uq_like_item_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    portfolio_item_id: Mapped[int] = mapped_column(
        ForeignKey("portfolio_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PortfolioComment(Base):
    __tablename__ = "portfolio_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    portfolio_item_id: Mapped[int] = mapped_column(
        ForeignKey("portfolio_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
