from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database.db import get_db
from app.models.models import ROLE_ADMIN, ROLE_VIEWER, User
from app.schemas.schemas import LoginRequest, Token, UserCreate, UserOut
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # First user in the system becomes admin so there's always someone who
    # can manage roles; everyone after that starts as viewer.
    is_first_user = db.query(User).count() == 0
    user = User(
        name=user_in.name,
        email=user_in.email,
        password=hash_password(user_in.password),
        role=ROLE_ADMIN if is_first_user else ROLE_VIEWER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_action(db, user, "user_registered", f"role={user.role}")
    return user


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.email})
    log_action(db, user, "login")
    return Token(access_token=token)


@router.post("/logout")
def logout(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # JWTs are stateless so there's nothing server-side to invalidate here;
    # this endpoint exists so the frontend has something to call for the
    # audit trail. The frontend also clears its stored token immediately.
    log_action(db, current_user, "logout")
    return {"status": "logged out"}


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
