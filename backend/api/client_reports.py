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


def _parse_price(text: str):
    m = re.search(r"AED\s*([\d,]+)", text, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1).replace(",", ""))
        except ValueError:
            pass
    return None

def _parse_beds(text: str):
    m = re.search(r"(\d+)\s*(?:BR|Bed|Bedroom)", text, re.IGNORECASE)
    if m:
        return m.group(1)
    if re.search(r"\bstudio\b", text, re.IGNORECASE):
        return "Studio"
    return None

def _parse_sqft(text: str):
    m = re.search(r"([\d,]+)\s*(?:sq\.?\s*ft|sqft)", text, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1).replace(",", ""))
        except ValueError:
            pass
    return None

def _fetch_html(url: str) -> str | None:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    try:
        from curl_cffi import requests as cffi_req
        resp = cffi_req.get(url, headers=headers, timeout=14, impersonate="chrome124")
        return resp.text
    except Exception:
        pass
    try:
        import httpx
        resp = httpx.get(url, headers=headers, timeout=14, follow_redirects=True)
        return resp.text
    except Exception:
        return None

def _reelly_login() -> str | None:
    """Login to Reelly API using env vars, return authToken or None."""
    import os, httpx
    email    = os.environ.get("REELLY_EMAIL", "agentyassinammary@gmail.com")
    password = os.environ.get("REELLY_PASSWORD", "Penta@2024$$")
    try:
        r = httpx.post(
            "https://api.reelly.io/api:sk5LT7jx/auth/login0",
            json={"email": email, "password": password},
            timeout=15,
        )
        if r.status_code != 200:
            return None
        return r.json().get("authToken")
    except Exception:
        return None


def _scrape_reelly(url: str) -> dict:
    """
    Scrape a find.reelly.io project page.
    The Reelly API has no single-project GET endpoint — project data is
    embedded as __NEXT_DATA__ JSON in the HTML page. We fetch the page
    with an auth cookie so the server includes full project data.
    """
    import logging, httpx
    from bs4 import BeautifulSoup
    log = logging.getLogger(__name__)

    m = re.search(r"/projects/(\d+)", url)
    if not m:
        return {}
    project_id = m.group(1)

    try:
        token = _reelly_login()
        if not token:
            log.error("Reelly login failed — check REELLY_EMAIL / REELLY_PASSWORD on Railway")
            return {}

        # Fetch the project's HTML page with auth token as a header/cookie
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "authToken": token,
            "Cookie": f"authToken={token}",
        }
        project_url = f"https://find.reelly.io/projects/{project_id}"
        resp = httpx.get(project_url, headers=headers, timeout=20, follow_redirects=True)
        if resp.status_code != 200:
            log.error("Reelly HTML page returned %s for %s", resp.status_code, project_url)
            return {}

        html = resp.text
        soup = BeautifulSoup(html, "html.parser")

        # Try __NEXT_DATA__ first (Next.js embedded JSON with full project data)
        next_data_tag = soup.find("script", id="__NEXT_DATA__")
        if next_data_tag and next_data_tag.string:
            try:
                nd = json.loads(next_data_tag.string)
                # Walk the props tree to find project data
                props = nd.get("props", {}).get("pageProps", {})
                # Try common keys
                d = (props.get("project") or props.get("data") or
                     props.get("projectData") or props.get("initialData") or {})
                if not d and props:
                    # Take the first dict value that looks like project data
                    for v in props.values():
                        if isinstance(v, dict) and (v.get("Project_name") or v.get("name") or v.get("title")):
                            d = v
                            break

                if d:
                    title = (d.get("Project_name") or d.get("project_name") or
                             d.get("name") or d.get("title") or "")
                    img = (d.get("cover_image") or d.get("cover") or
                           (d.get("images") or [{}])[0].get("url") if d.get("images") else None)
                    if isinstance(img, dict):
                        img = img.get("url") or img.get("src")
                    price = None
                    if d.get("min_price") and float(d["min_price"]) > 0:
                        price = float(d["min_price"])
                    elif d.get("Starting_price"):
                        sp = d["Starting_price"]
                        if isinstance(sp, list):
                            for item in sp:
                                p = item.get("Price_from_AED") or item.get("price")
                                if p and float(p) > 0:
                                    price = float(p)
                                    break
                    area = d.get("Area_name") or d.get("area") or d.get("community") or ""
                    unit_types = d.get("unit_types_available") or d.get("Unit_types") or ""
                    if title:
                        log.info("Reelly __NEXT_DATA__ — title=%r price=%s img=%r", title, price, img)
                        return {
                            "title": title,
                            "image_url": img or "",
                            "price_aed": price,
                            "area": area,
                            "bedrooms": unit_types[:60] if unit_types else None,
                        }
            except Exception as e:
                log.warning("Reelly __NEXT_DATA__ parse failed: %s", e)

        # Fallback: OG tags from the page
        def og(prop):
            tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
            return tag["content"].strip() if tag and tag.get("content") else None

        title = og("og:title") or og("twitter:title") or ""
        image = og("og:image") or og("twitter:image") or ""
        # Strip generic Reelly page titles
        if title.lower().strip() in ("offers for you", "reelly", "find.reelly.io", ""):
            title = ""
        price_text = og("og:description") or ""
        price = _parse_price(price_text)

        log.info("Reelly OG fallback — title=%r price=%s img=%r", title, price, image)
        return {
            "title": title,
            "image_url": image,
            "price_aed": price,
            "area": "",
            "bedrooms": None,
        }

    except Exception as e:
        log.error("Reelly scrape exception: %s", e)
        return {}

def _scrape_html_source(url: str) -> dict:
    """Parse OG tags + JSON-LD from HTML for Bayut, PropertyFinder, etc."""
    try:
        html = _fetch_html(url)
        if not html:
            return {}

        from bs4 import BeautifulSoup
        try:
            soup = BeautifulSoup(html, "lxml")
        except Exception:
            soup = BeautifulSoup(html, "html.parser")

        def og(prop):
            tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
            return tag["content"].strip() if tag and tag.get("content") else None

        title_tag_text = ""
        if soup.title:
            title_tag_text = soup.title.get_text(strip=True)

        title = og("og:title") or og("twitter:title") or title_tag_text or ""
        image = og("og:image") or og("twitter:image") or ""
        description = og("og:description") or og("twitter:description") or ""

        # Try JSON-LD for richer structured data (Bayut/PropertyFinder use this)
        price = None
        area = None
        sqft = None
        bedrooms = None
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                ld = json.loads(script.string or "{}")
                if isinstance(ld, list):
                    ld = ld[0]
                price = price or (float(str(ld.get("price", "")).replace(",", "")) if ld.get("price") else None)
                if ld.get("address"):
                    area = area or ld["address"].get("addressLocality") or ld["address"].get("addressRegion")
                if ld.get("floorSize"):
                    try:
                        sqft = sqft or float(str(ld["floorSize"].get("value", "")).replace(",", ""))
                    except Exception:
                        pass
                if ld.get("numberOfRooms"):
                    bedrooms = bedrooms or str(ld["numberOfRooms"])
                if not image and ld.get("image"):
                    img_val = ld["image"]
                    image = img_val[0] if isinstance(img_val, list) else img_val
            except Exception:
                pass

        combined = f"{title} {description}"
        price = price or _parse_price(combined)
        bedrooms = bedrooms or _parse_beds(combined)
        sqft = sqft or _parse_sqft(combined)

        clean_title = re.sub(
            r"\s*[|\-–]\s*(?:Bayut|Property Finder|PropertyFinder|Reelly|dubizzle).*$",
            "", title, flags=re.IGNORECASE
        ).strip()

        return {
            "title": clean_title or title,
            "image_url": image,
            "price_aed": price,
            "bedrooms": bedrooms,
            "area": area or "",
            "size_sqft": sqft,
            "description": description[:300] if description else "",
        }
    except Exception:
        return {}

def _scrape_og(url: str) -> dict:
    """Route to best scraper based on URL domain."""
    if "reelly.io" in url:
        # Only use Reelly API — never fall back to HTML (HTML just returns generic "Offers for you")
        return _scrape_reelly(url)
    return _scrape_html_source(url)


@router.get("/debug/reelly/{project_id}")
def debug_reelly(project_id: str):
    """Debug: fetch Reelly project HTML and show what data is embedded."""
    import httpx
    from bs4 import BeautifulSoup
    token = _reelly_login()
    if not token:
        return {"step": "login_failed"}
    headers = {
        "User-Agent": "Mozilla/5.0",
        "authToken": token,
        "Cookie": f"authToken={token}",
    }
    try:
        resp = httpx.get(f"https://find.reelly.io/projects/{project_id}", headers=headers, timeout=20, follow_redirects=True)
        soup = BeautifulSoup(resp.text, "html.parser")
        tag = soup.find("script", id="__NEXT_DATA__")
        nd = json.loads(tag.string) if tag and tag.string else {}
        props = nd.get("props", {}).get("pageProps", {})
        return {"status": resp.status_code, "next_data_keys": list(props.keys()), "props_preview": str(props)[:2000]}
    except Exception as e:
        return {"step": "exception", "error": str(e)}


@router.post("/fetch-link")
def fetch_link(body: FetchLinkRequest, current_user=Depends(get_current_user)):
    try:
        data = _scrape_og(body.url)
        return data
    except Exception:
        return {}


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
