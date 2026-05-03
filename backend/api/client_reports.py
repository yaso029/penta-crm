"""
Client Reports — all authenticated agents can view intake sessions,
curate property links, and generate branded PDF reports.
"""
import json
import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from backend.database.db import get_db
from backend.database.models import ClientIntake, AgentPropertyPick
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/api/client-reports", tags=["client-reports"])


# ─── Sessions list ────────────────────────────────────────────────────────────

@router.get("/sessions")
def list_sessions(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(ClientIntake).order_by(ClientIntake.created_at.desc()).all()
    result = []
    for s in sessions:
        picks_count = db.query(AgentPropertyPick).filter(
            AgentPropertyPick.session_id == s.session_id
        ).count()
        result.append({
            "id": s.id,
            "session_id": s.session_id,
            "completed": s.completed,
            "client_name": s.client_name,
            "client_phone": s.client_phone,
            "client_email": s.client_email,
            "budget_aed": s.budget_aed,
            "property_type": s.property_type,
            "bedrooms": s.bedrooms,
            "preferred_areas": s.preferred_areas,
            "market_preference": s.market_preference,
            "purchase_purpose": s.purchase_purpose,
            "picks_count": picks_count,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return result


# ─── Fetch link metadata ──────────────────────────────────────────────────────

class FetchLinkRequest(BaseModel):
    url: str


def _scrape_og(url: str) -> dict:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        from curl_cffi import requests as cffi_req
        resp = cffi_req.get(url, headers=headers, timeout=12, impersonate="chrome124")
        html = resp.text
    except Exception:
        try:
            import httpx
            resp = httpx.get(url, headers=headers, timeout=12, follow_redirects=True)
            html = resp.text
        except Exception:
            return {}

    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "lxml")

    def og(prop):
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        return tag["content"].strip() if tag and tag.get("content") else None

    title = og("og:title") or og("twitter:title") or (soup.title.string.strip() if soup.title else None) or ""
    image = og("og:image") or og("twitter:image") or ""
    description = og("og:description") or og("twitter:description") or ""

    # Parse price from title/description
    price = None
    price_match = re.search(r"AED\s*([\d,]+)", f"{title} {description}", re.IGNORECASE)
    if price_match:
        try:
            price = float(price_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Parse bedrooms
    bedrooms = None
    bed_match = re.search(r"(\d+)\s*(?:BR|Bed|Bedroom)", f"{title} {description}", re.IGNORECASE)
    if bed_match:
        bedrooms = bed_match.group(1)
    elif re.search(r"\bstudio\b", f"{title} {description}", re.IGNORECASE):
        bedrooms = "Studio"

    # Parse sqft
    sqft = None
    sqft_match = re.search(r"([\d,]+)\s*(?:sq\.?\s*ft|sqft)", f"{title} {description}", re.IGNORECASE)
    if sqft_match:
        try:
            sqft = float(sqft_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Clean title — remove trailing site name like " | Bayut"
    clean_title = re.sub(r"\s*[|\-–]\s*(?:Bayut|Property Finder|PropertyFinder|Reelly).*$", "", title, flags=re.IGNORECASE).strip()

    return {
        "title": clean_title or title,
        "image_url": image,
        "price_aed": price,
        "bedrooms": bedrooms,
        "size_sqft": sqft,
        "description": description[:300] if description else "",
    }


@router.post("/fetch-link")
def fetch_link(body: FetchLinkRequest, current_user=Depends(get_current_user)):
    data = _scrape_og(body.url)
    return data


# ─── Property picks ───────────────────────────────────────────────────────────

class PickIn(BaseModel):
    listing_url: str
    title: Optional[str] = None
    price_aed: Optional[float] = None
    bedrooms: Optional[str] = None
    bathrooms: Optional[str] = None
    area: Optional[str] = None
    size_sqft: Optional[float] = None
    property_type: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


@router.get("/sessions/{session_id}/picks")
def list_picks(session_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    picks = db.query(AgentPropertyPick).filter(
        AgentPropertyPick.session_id == session_id
    ).order_by(AgentPropertyPick.sort_order, AgentPropertyPick.created_at).all()
    return [
        {
            "id": p.id, "listing_url": p.listing_url, "title": p.title,
            "price_aed": p.price_aed, "bedrooms": p.bedrooms, "bathrooms": p.bathrooms,
            "area": p.area, "size_sqft": p.size_sqft, "property_type": p.property_type,
            "image_url": p.image_url, "notes": p.notes, "sort_order": p.sort_order,
            "added_by_name": p.agent.full_name if p.agent else None,
        }
        for p in picks
    ]


@router.post("/sessions/{session_id}/picks")
def add_pick(session_id: str, body: PickIn, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ClientIntake).filter(ClientIntake.session_id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    max_order = db.query(AgentPropertyPick).filter(
        AgentPropertyPick.session_id == session_id
    ).count()
    pick = AgentPropertyPick(
        session_id=session_id,
        added_by=current_user.id,
        listing_url=body.listing_url,
        title=body.title,
        price_aed=body.price_aed,
        bedrooms=body.bedrooms,
        bathrooms=body.bathrooms,
        area=body.area,
        size_sqft=body.size_sqft,
        property_type=body.property_type,
        image_url=body.image_url,
        notes=body.notes,
        sort_order=max_order,
    )
    db.add(pick)
    db.commit()
    db.refresh(pick)
    return {"id": pick.id, "message": "Pick added"}


@router.put("/sessions/{session_id}/picks/{pick_id}")
def update_pick(session_id: str, pick_id: int, body: PickIn, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    pick = db.query(AgentPropertyPick).filter(
        AgentPropertyPick.id == pick_id,
        AgentPropertyPick.session_id == session_id,
    ).first()
    if not pick:
        raise HTTPException(404, "Pick not found")
    for field in ("listing_url", "title", "price_aed", "bedrooms", "bathrooms", "area", "size_sqft", "property_type", "image_url", "notes"):
        val = getattr(body, field)
        if val is not None:
            setattr(pick, field, val)
    db.commit()
    return {"message": "Updated"}


@router.delete("/sessions/{session_id}/picks/{pick_id}")
def delete_pick(session_id: str, pick_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    pick = db.query(AgentPropertyPick).filter(
        AgentPropertyPick.id == pick_id,
        AgentPropertyPick.session_id == session_id,
    ).first()
    if not pick:
        raise HTTPException(404, "Pick not found")
    db.delete(pick)
    db.commit()
    return {"message": "Deleted"}


# ─── PDF Report ───────────────────────────────────────────────────────────────

@router.post("/sessions/{session_id}/report")
def generate_report(session_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    from backend.services.picks_report import generate_picks_pdf
    session = db.query(ClientIntake).filter(ClientIntake.session_id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    picks = db.query(AgentPropertyPick).filter(
        AgentPropertyPick.session_id == session_id
    ).order_by(AgentPropertyPick.sort_order, AgentPropertyPick.created_at).all()
    if not picks:
        raise HTTPException(400, "No properties added yet — add at least one before generating a report")

    pdf_bytes = generate_picks_pdf(session, picks)
    client_slug = (session.client_name or "client").replace(" ", "_")
    filename = f"penta_report_{client_slug}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
