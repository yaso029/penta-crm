from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.db import get_db
from backend.database.models import User, Lead, Activity
from backend.services.auth_service import get_current_user, require_admin

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    base = db.query(Lead)
    if current_user.role == "broker":
        base = base.filter(Lead.assigned_to == current_user.id)
    elif current_user.role == "team_leader":
        broker_ids = [u.id for u in db.query(User).filter(User.team_leader_id == current_user.id).all()]
        visible = broker_ids + [current_user.id]
        base = base.filter((Lead.assigned_to.in_(visible)) | (Lead.created_by == current_user.id))

    total = base.count()
    new_leads = base.filter(Lead.stage == "new_lead").count()
    active = base.filter(Lead.stage.in_(["follow_up", "pre_meeting", "meeting_done"])).count()
    closed_won = base.filter(Lead.stage == "deal_closed").count()
    closed_lost = base.filter(Lead.stage.in_(["junk", "wrong_number", "no_answer"])).count()

    stage_counts = (
        db.query(Lead.stage, func.count(Lead.id))
        .group_by(Lead.stage)
        .all()
    )
    if current_user.role == "broker":
        stage_counts = (
            db.query(Lead.stage, func.count(Lead.id))
            .filter(Lead.assigned_to == current_user.id)
            .group_by(Lead.stage)
            .all()
        )

    return {
        "total_leads": total,
        "new_leads": new_leads,
        "active_leads": active,
        "closed_won": closed_won,
        "closed_lost": closed_lost,
        "stage_breakdown": [{"stage": s, "count": c} for s, c in stage_counts],
    }


@router.get("/admin")
def admin_dashboard(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).filter(User.is_active == True).count()
    brokers = db.query(User).filter(User.role == "broker", User.is_active == True).count()
    team_leaders = db.query(User).filter(User.role == "team_leader", User.is_active == True).count()
    total_leads = db.query(Lead).count()
    closed_won = db.query(Lead).filter(Lead.stage == "closed_won").count()

    broker_performance = (
        db.query(User.id, User.full_name, func.count(Lead.id).label("lead_count"))
        .outerjoin(Lead, Lead.assigned_to == User.id)
        .filter(User.role == "broker", User.is_active == True)
        .group_by(User.id, User.full_name)
        .all()
    )

    source_breakdown = (
        db.query(Lead.source, func.count(Lead.id))
        .group_by(Lead.source)
        .all()
    )

    return {
        "total_users": total_users,
        "brokers": brokers,
        "team_leaders": team_leaders,
        "total_leads": total_leads,
        "closed_won": closed_won,
        "broker_performance": [
            {"id": b.id, "name": b.full_name, "lead_count": b.lead_count}
            for b in broker_performance
        ],
        "source_breakdown": [{"source": s or "unknown", "count": c} for s, c in source_breakdown],
    }
