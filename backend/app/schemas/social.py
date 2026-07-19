"""Schemas for the portfolio social layer."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ---- Photos ----
class PhotoCreate(BaseModel):
    # data URL: "data:image/jpeg;base64,...."; capped to ~300KB by validator
    data_url: str = Field(min_length=20, max_length=400_000)
    caption: str | None = Field(default=None, max_length=200)


class PhotoPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    data_url: str
    caption: str | None
    position: int


# ---- Comments ----
class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class CommentPublic(BaseModel):
    id: int
    user_id: int
    author_name: str
    author_role: str
    body: str
    created_at: datetime


# ---- Enriched portfolio item (photos + social counters) ----
class PortfolioItemFull(BaseModel):
    id: int
    worker_id: int
    title: str
    description: str | None
    role: str | None
    client_name: str | None
    city: str | None
    year: int | None
    duration_weeks: int | None
    materials: str | None
    company_id: int | None
    confirmed: bool
    confirmed_at: datetime | None
    photos: list[PhotoPublic]
    like_count: int
    liked_by_me: bool
    comment_count: int
