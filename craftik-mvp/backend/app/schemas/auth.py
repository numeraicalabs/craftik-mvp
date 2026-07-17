"""Request/response schemas for authentication."""
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole
from app.models.worker import Profession


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterWorkerRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    profession: Profession
    city: str = Field(min_length=1, max_length=120)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    years_experience: int = Field(default=0, ge=0, le=70)
    travel_radius_km: int = Field(default=25, ge=1, le=500)


class RegisterCompanyRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    legal_name: str = Field(min_length=1, max_length=160)
    vat_number: str = Field(min_length=8, max_length=32)
    city: str = Field(min_length=1, max_length=120)
    employee_count: int = Field(default=1, ge=1, le=100000)


class CurrentUser(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_verified: bool
