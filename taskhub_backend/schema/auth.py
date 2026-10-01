from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr
from models.User import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.USER
    org_id: int | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    org_id: int | None
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)