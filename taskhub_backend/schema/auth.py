from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from models.User import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: int = Field(validation_alias="_id")
    email: EmailStr
    role: UserRole
    org_id: int | None
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)