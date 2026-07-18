"""Company schemas."""
from pydantic import BaseModel, ConfigDict, Field


class CompanyUpdate(BaseModel):
    legal_name: str | None = Field(default=None, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    city: str | None = Field(default=None, max_length=120)
    employee_count: int | None = Field(default=None, ge=1)


class CompanyPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    legal_name: str
    vat_number: str
    description: str | None
    city: str
    employee_count: int
