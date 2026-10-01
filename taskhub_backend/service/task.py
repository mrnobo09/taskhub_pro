import base64
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from models.Task import Task
from models.User import User, UserRole
from schema.task import TaskCreate, TaskUpdate, TaskBulkUpdate

def encode_cursor(updated_at: datetime, task_id: int) -> str:
    cursor_str = f"{updated_at.isoformat()}|{task_id}"
    return base64.b64encode(cursor_str.encode()).decode()

def decode_cursor(cursor: str):
    decoded = base64.b64decode(cursor).decode()
    time_str, id_str = decoded.split("|")
    return datetime.fromisoformat(time_str), int(id_str)

def apply_rbac_scope(query, user: User, scope: Optional[str] = None):
    if user.role == UserRole.ADMIN:
        if scope == "org" and user.org_id is not None:
            return query.filter(Task.org_id == user.org_id)
        return query

    if user.role == UserRole.MANAGER:
        if user.org_id is None:
            return query.filter(False)
        return query.filter(Task.org_id == user.org_id)

    return query.filter(Task.created_by_id == user._id)

def get_tasks(
    db: Session,
    user: User,
    scope: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[str] = None,
    q: Optional[str] = None,
    cursor: Optional[str] = None,
    limit: int = 20,
):
    query = db.query(Task)

    # 1. RBAC Enforcement
    query = apply_rbac_scope(query, user, scope)

    # 2. Field Filters & Search
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if q:
        query = query.filter(Task.title.ilike(f"%{q}%"))
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        query = query.filter(Task.tags.contains(tag_list))

    if cursor:
        cursor_time, cursor_id = decode_cursor(cursor)
        query = query.filter(
            or_(
                Task.updated_at < cursor_time,
                and_(Task.updated_at == cursor_time, Task._id < cursor_id),
            )
        )

    tasks = query.order_by(Task.updated_at.desc(), Task._id.desc()).limit(limit).all()

    next_cursor = None
    if len(tasks) == limit:
        next_cursor = encode_cursor(tasks[-1].updated_at, tasks[-1]._id)

    return tasks, next_cursor

def create_task(db: Session, task_in: TaskCreate, user: User):
    new_task = Task(
        **task_in.model_dump(),
        org_id=user.org_id,
        created_by_id=user._id,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

def get_task_by_id_for_user(db: Session, task_id: int, user: User) -> Optional[Task]:
    query = db.query(Task).filter(Task._id == task_id)
    query = apply_rbac_scope(query, user)
    return query.first()

def update_task(db: Session, task_id: int, task_in: TaskUpdate, user: User):
    task = get_task_by_id_for_user(db, task_id, user)
    if not task:
        return None

    for key, value in task_in.model_dump(exclude_unset=True).items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task

def delete_task(db: Session, task_id: int, user: User):
    task = get_task_by_id_for_user(db, task_id, user)
    if not task:
        return None

    db.delete(task)
    db.commit()
    return task

def bulk_update_tasks(db: Session, bulk_in: TaskBulkUpdate, user: User) -> int:
    update_data = bulk_in.set.model_dump(exclude_unset=True)
    if not update_data or not bulk_in.ids:
        return 0

    query = db.query(Task).filter(Task._id.in_(bulk_in.ids))
    query = apply_rbac_scope(query, user)

    count = query.update(update_data, synchronize_session=False)
    db.commit()
    return count