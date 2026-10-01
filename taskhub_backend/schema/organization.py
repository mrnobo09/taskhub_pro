from datetime import datetime

from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from models.User import UserRole


class OrganizationCreate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]


class OrganizationOut(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationMemberUpdate(BaseModel):
    role: UserRole = UserRole.USER