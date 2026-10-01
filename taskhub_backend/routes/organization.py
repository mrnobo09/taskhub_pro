from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.db import get_db
from models.Organization import Organization
from models.User import User, UserRole
from routes.auth import current_user
from schema.auth import UserOut
from schema.organization import (
    OrganizationCreate,
    OrganizationMemberUpdate,
    OrganizationOut,
)

router = APIRouter(prefix="/organizations", tags=["Organizations"])


def require_admin(user: User = Depends(current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for your role",
        )
    return user


@router.get("", response_model=list[OrganizationOut])
def list_organizations(
    db: Session = Depends(get_db),
    _user: User = Depends(current_user),
):
    return db.query(Organization).order_by(Organization.name).all()


@router.post(
    "",
    response_model=OrganizationOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_organization(body: OrganizationCreate, db: Session = Depends(get_db)):
    name = body.name.strip()
    if db.query(Organization).filter(Organization.name == name).first():
        raise HTTPException(status_code=400, detail="Organization already exists")

    organization = Organization(name=name)
    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization


@router.put(
    "/{org_id}/members/{user_id}",
    response_model=UserOut,
    dependencies=[Depends(require_admin)],
)
def assign_member(
    org_id: int,
    user_id: int,
    body: OrganizationMemberUpdate,
    db: Session = Depends(get_db),
):
    if body.role not in {UserRole.USER, UserRole.MANAGER}:
        raise HTTPException(status_code=400, detail="Members can only be users or managers")

    organization = db.query(Organization).filter(Organization.id == org_id).first()
    member = db.query(User).filter(User._id == user_id).first()
    if not organization or not member:
        raise HTTPException(status_code=404, detail="Organization or user not found")

    member.org_id = organization.id
    member.role = body.role
    db.commit()
    db.refresh(member)
    return member