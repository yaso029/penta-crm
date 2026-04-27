from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database.db import get_db
from backend.database.models import Lead, Activity, User
import os

router = APIRouter(prefix="/api/webhook", tags=["webhook"])

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "pentad-webhook-secret-change-me")


class ZapierLeadPayload(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    source: Optional[str] = "zapier"
    budget: Optional[str] = None
    property_type: Optional[str] = None
    preferred_area: Optional[str] = None
    notes: Optional[str] = None


@router.post("/zapier")
def zapier_inbound(
    payload: ZapierLeadPayload,
    x_webhook_secret: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if x_webhook_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    admin = db.query(User).filter(User.role == "admin", User.is_active == True).first()
    default_assignee = admin.id if admin else None

    lead = Lead(
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        source=payload.source or "zapier",
        budget=payload.budget,
        property_type=payload.property_type,
        preferred_area=payload.preferred_area,
        notes=payload.notes,
        stage="new_lead",
        assigned_to=default_assignee,
        created_by=default_assignee,
    )
    db.add(lead)
    db.flush()

    activity = Activity(
        lead_id=lead.id,
        user_id=default_assignee,
        type="note",
        content=f"Lead created via Zapier webhook from source: {payload.source or 'zapier'}",
    )
    db.add(activity)
    db.commit()
    db.refresh(lead)

    return {
        "ok": True,
        "lead_id": lead.id,
        "message": f"Lead '{lead.full_name}' created successfully",
    }
