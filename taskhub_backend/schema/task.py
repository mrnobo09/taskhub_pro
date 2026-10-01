from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from models.Task import TaskPriority, TaskStatus

class TaskBase(BaseModel):
    title: str
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    tags: List[str] = Field(default_factory=list)
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    tags: Optional[List[str]] = None
    due_date: Optional[datetime] = None

class BulkUpdateSet(BaseModel):
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None

class TaskBulkUpdate(BaseModel):
    ids: List[int]
    set: BulkUpdateSet

class TaskOut(TaskBase):
    id: int = Field(validation_alias="_id")
    org_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class PaginatedTasksOut(BaseModel):
    data: List[TaskOut]
    next_cursor: Optional[str] = None