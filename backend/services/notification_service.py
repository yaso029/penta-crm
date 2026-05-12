from backend.database.models import Notification, User
from sqlalchemy.orm import Session


def _add(db: Session, user_id: int, message: str, lead_id: int = None):
    db.add(Notification(user_id=user_id, message=message, lead_id=lead_id))


def notify_admins(db: Session, message: str, lead_id: int = None, exclude_id: int = None):
    admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
    for a in admins:
        if exclude_id and a.id == exclude_id:
            continue
        _add(db, a.id, message, lead_id)


def notify_user(db: Session, user_id: int, message: str, lead_id: int = None, exclude_id: int = None):
    if user_id and user_id != exclude_id:
        _add(db, user_id, message, lead_id)
