import enum
from datetime import datetime, timezone
from db.db import Base
from sqlalchemy import Column, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column


class UserRole(str, enum.Enum):
    USER = "user"
    MANAGER = "manager"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    _id = Column(Integer, primary_key=True, index=True)
    role = Column(
        Enum(UserRole, name="user_role_enum", native_enum=True),
        default=UserRole.USER,
        nullable=False,
        index=True,
    )
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    org_id = Column(Integer, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
