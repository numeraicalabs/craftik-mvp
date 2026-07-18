"""Schemas for certifications, portfolio, messaging and badges."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.certification import CertificationKind, VerificationStatus


# ---- Certifications ----
class CertificationCreate(BaseModel):
    kind: CertificationKind
    name: str = Field(min_length=2, max_length=160)
    issuer: str | None = Field(default=None, max_length=160)
    issued_year: int | None = Field(default=None, ge=1960, le=2100)
    expires_year: int | None = Field(default=None, ge=1960, le=2120)


class CertificationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    kind: CertificationKind
    name: str
    issuer: str | None
    issued_year: int | None
    expires_year: int | None
    verification_status: VerificationStatus


# ---- Portfolio ----
class PortfolioItemCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=3000)
    role: str | None = Field(default=None, max_length=120)
    client_name: str | None = Field(default=None, max_length=160)
    city: str | None = Field(default=None, max_length=120)
    year: int | None = Field(default=None, ge=1980, le=2100)
    duration_weeks: int | None = Field(default=None, ge=1, le=520)
    materials: str | None = Field(default=None, max_length=300)
    company_id: int | None = None  # link to a platform company to request confirmation


class PortfolioItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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


# ---- Messaging ----
class ConversationCreate(BaseModel):
    other_user_id: int


class ConversationPublic(BaseModel):
    id: int
    other_user_id: int
    other_name: str
    other_role: str
    last_message_preview: str | None
    last_message_at: datetime | None


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class MessagePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    conversation_id: int
    sender_user_id: int
    body: str
    created_at: datetime


# ---- Badges ----
class BadgePublic(BaseModel):
    code: str
    label: str
    icon: str
    description: str


# ---- Review with author name (extends ReviewPublic shape) ----
class ReviewWithAuthor(BaseModel):
    id: int
    author_role: str
    author_name: str
    rating: int
    punctuality: int | None
    quality: int | None
    communication: int | None
    comment: str | None
    created_at: datetime
