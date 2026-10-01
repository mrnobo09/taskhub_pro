from fastapi import Depends, HTTPException, status, APIRouter, Query
from sqlalchemy.orm import Session
from models.User import User, UserRole
from routes.auth import current_user
from typing import Optional

from db.db import get_db
from models.User import User, UserRole
from routes.auth import current_user
from schema import task as schemas
from service import task as task_service

def require_roles(*allowed_roles: UserRole):
    def role_checker(user: User = Depends(current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for your role"
            )
        return user
    return role_checker


router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=schemas.PaginatedTasksOut)
def list_tasks(
    scope: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[str] = None,
    q: Optional[str] = None,
    cursor: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    tasks, next_cursor = task_service.get_tasks(
        db=db,
        user=user,
        scope=scope,
        status=status,
        priority=priority,
        tags=tags,
        q=q,
        cursor=cursor,
        limit=limit,
    )
    return {"data": tasks, "next_cursor": next_cursor}

@router.post("", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: schemas.TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    return task_service.create_task(db, task_in, user)

@router.patch("/bulk")
def bulk_update_tasks(
    bulk_in: schemas.TaskBulkUpdate,
    db: Session = Depends(get_db),
    # Only Managers and Admins can perform bulk modifications
    user: User = Depends(require_roles(UserRole.MANAGER, UserRole.ADMIN)),
):
    updated_count = task_service.bulk_update_tasks(db, bulk_in, user)
    return {"message": "Bulk update successful", "updated_count": updated_count}

@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    task_in: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    task = task_service.update_task(db, task_id, task_in, user)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or access denied")
    return task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    # Only Managers and Admins can delete tasks
    user: User = Depends(require_roles(UserRole.MANAGER, UserRole.ADMIN)),
):
    task = task_service.delete_task(db, task_id, user)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or access denied")
    return {"message": "Task deleted successfully"}