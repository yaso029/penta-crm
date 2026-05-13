import io
import csv
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.database.models import InstagramLead, Lead, User
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/api/instagram", tags=["instagram"])

SCRAPER_KEY = os.environ.get("SCRAPER_API_KEY", "")


ALLOWED_EMAIL = "yaso@pentacrm.com"

def _require_admin(current_user: User = Depends(get_current_user)):
    if current_user.email != ALLOWED_EMAIL:
        raise HTTPException(403, "Access restricted")
    return current_user


def _lead_dict(l: InstagramLead) -> dict:
    return {
        "id": l.id,
        "username": l.username,
        "display_name": l.display_name,
        "bio": l.bio,
        "email": l.email,
        "phone": l.phone,
        "whatsapp": l.whatsapp,
        "website": l.website,
        "follower_count": l.follower_count,
        "following_count": l.following_count,
        "post_count": l.post_count,
        "is_verified": l.is_verified,
        "is_business_account": l.is_business_account,
        "profile_picture_url": l.profile_picture_url,
        "search_keyword": l.search_keyword,
        "lead_score": l.lead_score,
        "contacted_status": l.contacted_status,
        "notes": l.notes,
        "crm_lead_id": l.crm_lead_id,
        "scraped_at": l.scraped_at.isoformat() if l.scraped_at else None,
        "last_modified": l.last_modified.isoformat() if l.last_modified else None,
    }


# ── Stats ──────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    total = db.query(InstagramLead).count()
    with_email = db.query(InstagramLead).filter(
        InstagramLead.email.isnot(None), InstagramLead.email != ""
    ).count()
    with_phone = db.query(InstagramLead).filter(
        InstagramLead.phone.isnot(None), InstagramLead.phone != ""
    ).count()
    contacted = db.query(InstagramLead).filter(
        InstagramLead.contacted_status != "not_contacted"
    ).count()
    converted = db.query(InstagramLead).filter(
        InstagramLead.contacted_status == "converted"
    ).count()

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = db.query(InstagramLead).filter(
        InstagramLead.scraped_at >= today_start
    ).count()

    top_keywords = (
        db.query(InstagramLead.search_keyword, func.count(InstagramLead.id))
        .group_by(InstagramLead.search_keyword)
        .order_by(func.count(InstagramLead.id).desc())
        .limit(10)
        .all()
    )

    recent = (
        db.query(InstagramLead)
        .order_by(InstagramLead.scraped_at.desc())
        .limit(8)
        .all()
    )

    return {
        "total": total,
        "today": today_count,
        "with_email": with_email,
        "with_phone": with_phone,
        "contacted": contacted,
        "converted": converted,
        "top_keywords": [{"keyword": k or "—", "count": c} for k, c in top_keywords],
        "recent": [_lead_dict(l) for l in recent],
    }


# ── List / search ──────────────────────────────────────────────────────────────

@router.get("/leads")
def list_leads(
    search: str = Query(""),
    has_email: bool = Query(False),
    has_phone: bool = Query(False),
    has_whatsapp: bool = Query(False),
    status: str = Query(""),
    keyword: str = Query(""),
    min_score: int = Query(0),
    limit: int = Query(100),
    offset: int = Query(0),
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(InstagramLead)
    if search:
        like = f"%{search}%"
        q = q.filter(
            InstagramLead.username.ilike(like)
            | InstagramLead.display_name.ilike(like)
            | InstagramLead.bio.ilike(like)
        )
    if has_email:
        q = q.filter(InstagramLead.email.isnot(None), InstagramLead.email != "")
    if has_phone:
        q = q.filter(InstagramLead.phone.isnot(None), InstagramLead.phone != "")
    if has_whatsapp:
        q = q.filter(InstagramLead.whatsapp.isnot(None), InstagramLead.whatsapp != "")
    if status:
        q = q.filter(InstagramLead.contacted_status == status)
    if keyword:
        q = q.filter(InstagramLead.search_keyword.ilike(f"%{keyword}%"))
    if min_score > 0:
        q = q.filter(InstagramLead.lead_score >= min_score)

    total = q.count()
    leads = (
        q.order_by(InstagramLead.lead_score.desc(), InstagramLead.scraped_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {"total": total, "leads": [_lead_dict(l) for l in leads]}


# ── Update status / notes ──────────────────────────────────────────────────────

class UpdateBody(BaseModel):
    contacted_status: Optional[str] = None
    notes: Optional[str] = None


@router.patch("/leads/{lead_id}")
def update_lead(
    lead_id: int,
    body: UpdateBody,
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    lead = db.query(InstagramLead).filter(InstagramLead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Not found")
    if body.contacted_status is not None:
        lead.contacted_status = body.contacted_status
    if body.notes is not None:
        lead.notes = body.notes
    lead.last_modified = datetime.utcnow()
    db.commit()
    return _lead_dict(lead)


# ── Delete ─────────────────────────────────────────────────────────────────────

@router.delete("/leads/{lead_id}")
def delete_lead(
    lead_id: int,
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    lead = db.query(InstagramLead).filter(InstagramLead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Not found")
    db.delete(lead)
    db.commit()
    return {"ok": True}


# ── Send to CRM ────────────────────────────────────────────────────────────────

@router.post("/leads/{lead_id}/send-to-crm")
def send_to_crm(
    lead_id: int,
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    ig = db.query(InstagramLead).filter(InstagramLead.id == lead_id).first()
    if not ig:
        raise HTTPException(404, "Not found")

    if ig.crm_lead_id:
        return {"ok": True, "lead_id": ig.crm_lead_id, "already_exists": True}

    crm = Lead(
        full_name=ig.display_name or ig.username,
        phone=ig.phone or "",
        email=ig.email or "",
        source="instagram",
        notes=(
            f"Instagram: @{ig.username}\n"
            f"Followers: {ig.follower_count or 0}\n"
            f"Bio: {ig.bio or ''}\n"
            f"{ig.notes or ''}"
        ).strip(),
        stage="new",
        created_by=current_user.id,
    )
    db.add(crm)
    db.flush()
    ig.crm_lead_id = crm.id
    ig.last_modified = datetime.utcnow()
    db.commit()
    return {"ok": True, "lead_id": crm.id, "already_exists": False}


# ── Export CSV ─────────────────────────────────────────────────────────────────

@router.get("/leads/export")
def export_csv(
    search: str = Query(""),
    has_email: bool = Query(False),
    has_phone: bool = Query(False),
    status: str = Query(""),
    keyword: str = Query(""),
    current_user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(InstagramLead)
    if search:
        like = f"%{search}%"
        q = q.filter(
            InstagramLead.username.ilike(like) | InstagramLead.display_name.ilike(like)
        )
    if has_email:
        q = q.filter(InstagramLead.email.isnot(None), InstagramLead.email != "")
    if has_phone:
        q = q.filter(InstagramLead.phone.isnot(None), InstagramLead.phone != "")
    if status:
        q = q.filter(InstagramLead.contacted_status == status)
    if keyword:
        q = q.filter(InstagramLead.search_keyword.ilike(f"%{keyword}%"))

    leads = q.order_by(InstagramLead.scraped_at.desc()).all()

    output = io.StringIO()
    fields = [
        "username", "display_name", "email", "phone", "whatsapp",
        "website", "bio", "follower_count", "following_count",
        "lead_score", "contacted_status", "search_keyword", "scraped_at",
    ]
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    for l in leads:
        writer.writerow({
            "username": f"@{l.username}",
            "display_name": l.display_name or "",
            "email": l.email or "",
            "phone": l.phone or "",
            "whatsapp": l.whatsapp or "",
            "website": l.website or "",
            "bio": (l.bio or "").replace("\n", " "),
            "follower_count": l.follower_count or 0,
            "following_count": l.following_count or 0,
            "lead_score": l.lead_score or 0,
            "contacted_status": l.contacted_status or "",
            "search_keyword": l.search_keyword or "",
            "scraped_at": l.scraped_at.strftime("%Y-%m-%d %H:%M") if l.scraped_at else "",
        })
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=instagram_leads.csv"},
    )


# ── Upsert (called by local scraper) ──────────────────────────────────────────

class UpsertBody(BaseModel):
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    website: Optional[str] = None
    follower_count: Optional[int] = None
    following_count: Optional[int] = None
    post_count: Optional[int] = None
    is_verified: bool = False
    is_business_account: bool = False
    profile_picture_url: Optional[str] = None
    search_keyword: Optional[str] = None
    lead_score: int = 0


@router.post("/leads/upsert")
def upsert_lead(
    body: UpsertBody,
    db: Session = Depends(get_db),
    x_scraper_key: Optional[str] = Header(None),
):
    if not SCRAPER_KEY or x_scraper_key != SCRAPER_KEY:
        raise HTTPException(403, "Invalid scraper key")

    existing = db.query(InstagramLead).filter(
        InstagramLead.username == body.username
    ).first()

    if existing:
        for field in body.model_fields:
            val = getattr(body, field)
            if val is not None:
                setattr(existing, field, val)
        existing.last_modified = datetime.utcnow()
        db.commit()
        return {"saved": True, "action": "updated", "id": existing.id}

    new_lead = InstagramLead(**body.model_dump())
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return {"saved": True, "action": "created", "id": new_lead.id}
