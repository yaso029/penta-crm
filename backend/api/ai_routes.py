"""
AI Model API — admin-only routes for the Real Estate Intelligence system.
Covers: scraping (Reelly, Bayut), listing browse, client matching, intake AI, PDF reports.
"""
import asyncio
import json
import time
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from backend.database.db import get_db
from backend.database.models import (
    OffPlanListing, SecondaryListing, ClientIntake, AIScrapeLog
)
from backend.services.auth_service import require_admin
from backend.matching.engine import ClientRequirements, match_listings
from backend.reports.generator import generate_match_report
from backend.services.intake_ai import chat, extract_client_data, get_opening_message

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ─── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
def ai_stats(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    from sqlalchemy import func
    return {
        "offplan_total": db.query(func.count(OffPlanListing.id)).scalar() or 0,
        "secondary_total": db.query(func.count(SecondaryListing.id)).scalar() or 0,
        "intake_sessions": db.query(func.count(ClientIntake.id)).scalar() or 0,
        "last_scrape": db.query(AIScrapeLog).order_by(AIScrapeLog.started_at.desc()).first(),
    }


# ─── Scraping ────────────────────────────────────────────────────────────────

async def _run_scrape(source: str, log_id: int, db: Session, max_pages: int):
    log = db.query(AIScrapeLog).filter(AIScrapeLog.id == log_id).first()
    try:
        if source == "reelly":
            from backend.scrapers.reelly_scraper import run_reelly_scraper, upsert_offplan_listings
            listings = await asyncio.to_thread(run_reelly_scraper, max_pages)
            new_c, upd_c = upsert_offplan_listings(listings, db)
        elif source == "bayut":
            from backend.scrapers.bayut_scraper import run_bayut_scraper, upsert_listings
            listings = await asyncio.to_thread(run_bayut_scraper, max_pages=max_pages)
            new_c, upd_c = upsert_listings(listings, db)
        else:
            raise ValueError(f"Unknown source: {source}")

        log.finished_at = datetime.utcnow()
        log.listings_found = len(listings)
        log.listings_new = new_c
        log.listings_updated = upd_c
        log.status = "success"
        db.commit()
    except Exception as exc:
        log.finished_at = datetime.utcnow()
        log.status = "error"
        log.error_message = str(exc)[:500]
        db.commit()


@router.post("/scrape/{source}")
async def trigger_scrape(
    source: str,
    background_tasks: BackgroundTasks,
    max_pages: int = 999,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if source not in ("reelly", "bayut"):
        raise HTTPException(400, "source must be reelly or bayut")
    log = AIScrapeLog(source=source, status="running")
    db.add(log)
    db.commit()
    db.refresh(log)
    background_tasks.add_task(_run_scrape, source, log.id, db, max_pages)
    return {"message": f"{source} scrape started", "log_id": log.id}


@router.get("/scrape/logs")
def scrape_logs(
    limit: int = 30,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.query(AIScrapeLog).order_by(AIScrapeLog.started_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id, "source": l.source, "status": l.status,
            "started_at": l.started_at.isoformat() if l.started_at else None,
            "finished_at": l.finished_at.isoformat() if l.finished_at else None,
            "listings_found": l.listings_found, "listings_new": l.listings_new,
            "listings_updated": l.listings_updated, "error_message": l.error_message,
        }
        for l in logs
    ]


# ─── Off-plan listings ────────────────────────────────────────────────────────

@router.get("/listings/offplan")
def list_offplan(
    limit: int = 50,
    offset: int = 0,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    area: Optional[str] = None,
    developer: Optional[str] = None,
    sale_status: Optional[str] = None,
    handover: Optional[str] = None,
    search: Optional[str] = None,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(OffPlanListing).filter(OffPlanListing.is_active == True)
    if min_price: q = q.filter(OffPlanListing.starting_price_aed >= min_price)
    if max_price: q = q.filter(OffPlanListing.starting_price_aed <= max_price)
    if area: q = q.filter(OffPlanListing.area.ilike(f"%{area}%"))
    if developer: q = q.filter(OffPlanListing.developer_name.ilike(f"%{developer}%"))
    if sale_status: q = q.filter(OffPlanListing.sale_status.ilike(f"%{sale_status}%"))
    if handover: q = q.filter(OffPlanListing.completion_date_text == handover)
    if search:
        q = q.filter(
            OffPlanListing.project_name.ilike(f"%{search}%") |
            OffPlanListing.developer_name.ilike(f"%{search}%") |
            OffPlanListing.area.ilike(f"%{search}%")
        )
    total = q.count()
    rows = q.order_by(OffPlanListing.scrape_timestamp.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "results": [
            {
                "id": r.id, "project_name": r.project_name, "developer_name": r.developer_name,
                "area": r.area, "community": r.community,
                "starting_price_aed": r.starting_price_aed, "handover_year": r.handover_year,
                "completion_date_text": r.completion_date_text, "sale_status": r.sale_status,
                "cover_image_url": r.cover_image_url, "max_commission": r.max_commission,
                "payment_plan_details": r.payment_plan_details,
                "listing_url": r.listing_url,
                "scrape_timestamp": r.scrape_timestamp.isoformat() if r.scrape_timestamp else None,
            }
            for r in rows
        ],
    }


@router.get("/listings/offplan/options")
def offplan_options(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    from sqlalchemy import func
    devs = db.query(OffPlanListing.developer_name).filter(
        OffPlanListing.developer_name.isnot(None), OffPlanListing.developer_name != ""
    ).distinct().all()
    areas = db.query(OffPlanListing.area).filter(
        OffPlanListing.area.isnot(None), OffPlanListing.area != ""
    ).distinct().all()
    statuses = db.query(OffPlanListing.sale_status).filter(
        OffPlanListing.sale_status.isnot(None)
    ).distinct().all()

    def dedup(vals):
        seen = {}
        for (v,) in vals:
            if v:
                k = v.strip().lower()
                if k not in seen:
                    seen[k] = v.strip()
        return sorted(seen.values(), key=str.lower)

    return {
        "developers": dedup(devs),
        "areas": dedup(areas),
        "statuses": sorted({r[0].strip() for r in statuses if r[0]}),
    }


@router.get("/listings/offplan/{listing_id}/detail")
def offplan_detail(
    listing_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    import httpx
    _REELLY_API = "https://api.reelly.io/api:sk5LT7jx"
    _CACHE_TTL = 86400

    row = db.query(OffPlanListing).filter(OffPlanListing.id == listing_id).first()
    if not row:
        raise HTTPException(404, "Listing not found")

    # Cache hit
    if row.detail_json and row.detail_fetched_at:
        if time.time() - row.detail_fetched_at < _CACHE_TTL:
            return json.loads(row.detail_json)

    # Extract reelly_id from URL
    import re
    m = re.search(r"/projects/(\d+)", row.listing_url or "")
    if not m:
        raise HTTPException(422, "Cannot determine Reelly project ID")
    reelly_id = int(m.group(1))

    # Fetch from Reelly API
    try:
        from backend.scrapers.reelly_scraper import _login
        token = _login()
        resp = httpx.get(f"{_REELLY_API}/projects/{reelly_id}", headers={"authToken": token}, timeout=15)
        if resp.status_code != 200:
            raise HTTPException(resp.status_code, "Reelly API error")
        d = resp.json()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(502, str(exc))

    result = {"id": reelly_id, "project_name": d.get("Project_name"),
              "developer_name": d.get("Developers_name"), "area": d.get("Area_name"),
              "overview": d.get("Overview"), "sale_status": d.get("sale_status"),
              "completion_date": d.get("Completion_date"), "floors": d.get("Floors"),
              "max_commission": d.get("max_commission"), "reelly_url": row.listing_url}
    row.detail_json = json.dumps(result)
    row.detail_fetched_at = int(time.time())
    db.commit()
    return result


# ─── Secondary listings ───────────────────────────────────────────────────────

@router.get("/listings/secondary")
def list_secondary(
    limit: int = 50,
    offset: int = 0,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[str] = None,
    area: Optional[str] = None,
    property_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(SecondaryListing).filter(SecondaryListing.is_active == True)
    if min_price: q = q.filter(SecondaryListing.price_aed >= min_price)
    if max_price: q = q.filter(SecondaryListing.price_aed <= max_price)
    if bedrooms: q = q.filter(SecondaryListing.bedrooms == bedrooms)
    if area: q = q.filter(SecondaryListing.area.ilike(f"%{area}%"))
    if property_type: q = q.filter(SecondaryListing.property_type.ilike(f"%{property_type}%"))
    if search:
        q = q.filter(
            SecondaryListing.title.ilike(f"%{search}%") |
            SecondaryListing.area.ilike(f"%{search}%") |
            SecondaryListing.community.ilike(f"%{search}%")
        )
    total = q.count()
    rows = q.order_by(SecondaryListing.scrape_timestamp.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "results": [
            {
                "id": r.id, "listing_id": r.listing_id, "source": r.source,
                "title": r.title, "price_aed": r.price_aed, "size_sqft": r.size_sqft,
                "bedrooms": r.bedrooms, "bathrooms": r.bathrooms,
                "property_type": r.property_type, "furnishing_status": r.furnishing_status,
                "community": r.community, "area": r.area, "building_name": r.building_name,
                "agent_name": r.agent_name, "agency_name": r.agency_name,
                "days_on_market": r.days_on_market, "listing_url": r.listing_url,
                "scrape_timestamp": r.scrape_timestamp.isoformat() if r.scrape_timestamp else None,
            }
            for r in rows
        ],
    }


# ─── Client Matching ─────────────────────────────────────────────────────────

class MatchRequest(BaseModel):
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    bedrooms: Optional[str] = None
    size_min_sqft: Optional[float] = None
    size_max_sqft: Optional[float] = None
    property_type: Optional[str] = None
    preferred_areas: list[str] = []
    market_type: Optional[str] = None
    max_handover_year: Optional[int] = None
    furnishing: Optional[str] = None
    prefer_fresh: bool = False
    top_n: int = 15
    min_score_pct: float = 0.0
    client_name: str = ""


@router.post("/match")
def run_match(
    req: MatchRequest,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    client_req = ClientRequirements(
        budget_min=req.budget_min, budget_max=req.budget_max,
        bedrooms=req.bedrooms, size_min_sqft=req.size_min_sqft,
        size_max_sqft=req.size_max_sqft, property_type=req.property_type,
        preferred_areas=req.preferred_areas, market_type=req.market_type,
        max_handover_year=req.max_handover_year, furnishing=req.furnishing,
        prefer_fresh=req.prefer_fresh,
    )
    matches = match_listings(client_req, db, top_n=req.top_n, min_score_pct=req.min_score_pct)
    return {
        "count": len(matches),
        "results": [
            {
                "listing_id": m.listing_id, "listing_type": m.listing_type,
                "title": m.title, "price_aed": m.price_aed, "area": m.area,
                "community": m.community, "bedrooms": m.bedrooms,
                "size_sqft": m.size_sqft, "listing_url": m.listing_url,
                "score_pct": m.score_pct, "breakdown": m.breakdown, "raw": m.raw,
            }
            for m in matches
        ],
    }


@router.post("/match/report")
def match_report(
    req: MatchRequest,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    client_req = ClientRequirements(
        budget_min=req.budget_min, budget_max=req.budget_max,
        bedrooms=req.bedrooms, preferred_areas=req.preferred_areas,
        market_type=req.market_type, max_handover_year=req.max_handover_year,
    )
    matches = match_listings(client_req, db, top_n=req.top_n)
    match_dicts = [
        {"listing_id": m.listing_id, "listing_type": m.listing_type, "title": m.title,
         "price_aed": m.price_aed, "area": m.area, "community": m.community,
         "bedrooms": m.bedrooms, "size_sqft": m.size_sqft, "listing_url": m.listing_url,
         "score_pct": m.score_pct, "breakdown": m.breakdown}
        for m in matches
    ]
    pdf_bytes = generate_match_report(matches=match_dicts, req=req.model_dump(), client_name=req.client_name)
    filename = f"penta_match_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


# ─── Client Intake AI ────────────────────────────────────────────────────────

class MessageIn(BaseModel):
    session_id: str
    message: str


@router.post("/intake/start")
def intake_start(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    opening = get_opening_message()
    session = ClientIntake(
        session_id=session_id,
        messages_json=json.dumps([{"role": "assistant", "content": opening}]),
    )
    db.add(session)
    db.commit()
    return {"session_id": session_id, "message": opening}


@router.post("/intake/message")
def intake_message(body: MessageIn, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    session = db.query(ClientIntake).filter(ClientIntake.session_id == body.session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")

    messages = json.loads(session.messages_json or "[]")
    messages.append({"role": "user", "content": body.message})

    ai_reply = chat(messages)
    messages.append({"role": "assistant", "content": ai_reply})
    session.messages_json = json.dumps(messages)
    session.updated_at = datetime.utcnow()

    ready = "[READY_TO_GENERATE]" in ai_reply
    if ready:
        session.completed = True
        try:
            data = extract_client_data(messages)
            session.client_name = data.get("client_name")
            session.client_phone = data.get("client_phone")
            session.client_email = data.get("client_email")
            session.budget_aed = data.get("budget_aed")
            session.property_type = data.get("property_type")
            session.bedrooms = data.get("bedrooms")
            session.preferred_areas = data.get("preferred_areas")
            session.market_preference = data.get("market_preference")
            session.purchase_purpose = data.get("purchase_purpose")
        except Exception:
            pass

    db.commit()
    return {"message": ai_reply.replace("[READY_TO_GENERATE]", "").strip(), "completed": ready}


@router.get("/intake/sessions")
def intake_sessions(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    sessions = db.query(ClientIntake).order_by(ClientIntake.created_at.desc()).all()
    return [
        {
            "id": s.id, "session_id": s.session_id, "completed": s.completed,
            "client_name": s.client_name, "client_phone": s.client_phone,
            "client_email": s.client_email, "budget_aed": s.budget_aed,
            "property_type": s.property_type, "bedrooms": s.bedrooms,
            "preferred_areas": s.preferred_areas, "market_preference": s.market_preference,
            "purchase_purpose": s.purchase_purpose,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


@router.post("/intake/{session_id}/report")
def intake_report(session_id: str, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    from backend.services.intake_report import generate_pdf
    session = db.query(ClientIntake).filter(ClientIntake.session_id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    messages = json.loads(session.messages_json or "[]")
    pdf_bytes = generate_pdf(session, messages)
    filename = f"intake_{session.client_name or session_id[:8]}.pdf"
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})
