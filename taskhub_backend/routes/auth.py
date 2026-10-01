from db.db import get_db
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from models.User import User, UserRole
from schema.auth import RefreshRequest, TokenResponse, UserLogin, UserOut, UserRegister
from service import auth as auth_service
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")


def current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)) -> User:
    data = auth_service.decode_token(token)
    if not data or data.get("token_type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = (
        db.query(User).filter(User.email == data.get("sub")).first()
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already taken")

    user = User(
        email=body.email,
        hashed_password=auth_service.hash_password(body.password),
        role=UserRole.USER,
        org_id=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not auth_service.verify_password(
        body.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=401, detail="Invalid email or password"
        )

    return auth_service.create_token_pair(
        {"sub": user.email, "role": user.role.value, "org_id": user.org_id}
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    data = auth_service.decode_token(body.refresh_token)
    if not data or data.get("token_type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.email == data.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return auth_service.create_token_pair(
        {"sub": user.email, "role": user.role.value, "org_id": user.org_id}
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user