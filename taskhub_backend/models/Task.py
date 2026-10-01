import enum
from datetime import datetime
from db.db import Base
from sqlalchemy import Column, DateTime, Enum, Integer, JSON, String


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Task(Base):
    __tablename__ = "tasks"

    _id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(
        Enum(TaskStatus, name="task_status_enum", native_enum=True),
        default=TaskStatus.TODO,
        nullable=False,
        index=True,
    )

    priority = Column(
        Enum(TaskPriority, name="task_priority_enum", native_enum=True),
        default=TaskPriority.MEDIUM,
        nullable=False,
        index=True,
    )

    org_id = Column(Integer, nullable=True)
    tags = Column(JSON, default=list, nullable=False)

    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
