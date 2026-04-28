from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database.db import get_db
from backend.database.models import User
from backend.services.auth_service import get_current_user, require_admin, hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


class CreateUserRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str
    team_leader_id: Optional[int] = None


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    team_leader_id: Optional[int] = None
    is_active: Optional[bool] = None


def user_to_dict(u: User):
    return {
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role,
        "team_leader_id": u.team_leader_id,
        "team_leader_name": u.team_leader.full_name if u.team_leader else None,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@router.get("")
def list_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [user_to_dict(u) for u in users]


@router.get("/team")
def get_my_team(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        # Admins can assign to brokers AND team leaders
        members = db.query(User).filter(
            User.role.in_(["broker", "team_leader"]), User.is_active == True
        ).order_by(User.role, User.full_name).all()
    elif current_user.role == "team_leader":
        # Team leader sees their own brokers + themselves
        members = db.query(User).filter(
            User.team_leader_id == current_user.id, User.is_active == True
        ).all()
        members = [current_user] + members
    else:
        members = []
    return [user_to_dict(b) for b in members]


@router.post("")
def create_user(req: CreateUserRequest, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    if req.role not in ("admin", "team_leader", "broker"):
        raise HTTPException(status_code=400, detail="Invalid role")
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    user = User(
        full_name=req.full_name,
        email=req.email,
        password_hash=hash_password(req.password),
        role=req.role,
        team_leader_id=req.team_leader_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_dict(user)


@router.put("/{user_id}")
def update_user(user_id: int, req: UpdateUserRequest, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if req.full_name is not None:
        user.full_name = req.full_name
    if req.email is not None:
        user.email = req.email
    if req.role is not None:
        user.role = req.role
    if req.team_leader_id is not None:
        user.team_leader_id = req.team_leader_id
    if req.is_active is not None:
        user.is_active = req.is_active
    db.commit()
    db.refresh(user)
    return user_to_dict(user)


@router.delete("/{user_id}")
def deactivate_user(user_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = False
    db.commit()
    return {"ok": True}
