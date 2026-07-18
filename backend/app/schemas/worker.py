"""Worker profile schemas."""
from pydantic import BaseModel, ConfigDict, Field

from app.models.worker import AvailabilityStatus, Profession


class WorkerProfileUpdate(BaseModel):
    first_name: str | None = Field(default=None, max_length=80)
    last_name: str | None = Field(default=None, max_length=80)
    bio: str | None = Field(default=None, max_length=2000)
    profession: Profession | None = None
    years_experience: int | None = Field(default=None, ge=0, le=70)
    city: str | None = Field(default=None, max_length=120)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    travel_radius_km: int | None = Field(default=None, ge=1, le=500)
    willing_to_relocate: bool | None = None
    hourly_rate_min: int | None = Field(default=None, ge=5, le=500)
    hourly_rate_max: int | None = Field(default=None, ge=5, le=500)
    availability: AvailabilityStatus | None = None


class WorkerProfilePublic(BaseModel):
    """Public view of a worker profile — surfaced in search results and job matching."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    first_name: str
    last_name: str
    bio: str | None
    profession: Profession
    years_experience: int
    city: str
    latitude: float
    longitude: float
    travel_radius_km: int
    willing_to_relocate: bool
    hourly_rate_min: int
    hourly_rate_max: int
    availability: AvailabilityStatus
    ai_score: int


class WorkerSearchResult(WorkerProfilePublic):
    """Search result adds a computed distance and match score."""
    distance_km: float
    match_score: int
