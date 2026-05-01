from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.database.db import get_db
from backend.database.models import Property, AgentEvent, AgentVideo, AgentPromotion
from backend.services.auth_service import get_current_user, require_admin
from backend.services.cloudinary_service import upload_image, delete_image

router = APIRouter(prefix="/api/agents", tags=["agents"])


# ─── Image Upload ─────────────────────────────────────────────────────────────

@router.post("/upload-image")
async def upload_property_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    contents = await file.read()
    result = upload_image(contents)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


# ─── Properties ───────────────────────────────────────────────────────────────

class PropertyIn(BaseModel):
    title: str
    description: Optional[str] = None
    property_type: str
    transaction_type: str
    location: str
    price: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = None
    floor: Optional[int] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    status: Optional[str] = "available"
    developer: Optional[str] = None
    project_name: Optional[str] = None
    handover_date: Optional[str] = None
    payment_plan: Optional[str] = None


def prop_to_dict(p: Property) -> dict:
    return {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "property_type": p.property_type,
        "transaction_type": p.transaction_type,
        "location": p.location,
        "price": p.price,
        "bedrooms": p.bedrooms,
        "bathrooms": p.bathrooms,
        "area_sqft": p.area_sqft,
        "floor": p.floor,
        "amenities": p.amenities or [],
        "images": p.images or [],
        "status": p.status,
        "developer": p.developer,
        "project_name": p.project_name,
        "handover_date": p.handover_date,
        "payment_plan": p.payment_plan,
        "uploaded_by": p.uploaded_by,
        "uploader_name": p.uploader.full_name if p.uploader else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


@router.get("/properties")
def list_properties(
    property_type: Optional[str] = None,
    transaction_type: Optional[str] = None,
    location: Optional[str] = None,
    status: Optional[str] = None,
    bedrooms: Optional[int] = None,
    search: Optional[str] = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Property)
    if property_type:
        q = q.filter(Property.property_type == property_type)
    if transaction_type:
        q = q.filter(Property.transaction_type == transaction_type)
    if location:
        q = q.filter(Property.location.ilike(f"%{location}%"))
    if status:
        q = q.filter(Property.status == status)
    if bedrooms is not None:
        q = q.filter(Property.bedrooms == bedrooms)
    if search:
        q = q.filter(
            Property.title.ilike(f"%{search}%") |
            Property.location.ilike(f"%{search}%") |
            Property.developer.ilike(f"%{search}%") |
            Property.project_name.ilike(f"%{search}%")
        )
    props = q.order_by(Property.created_at.desc()).all()
    return [prop_to_dict(p) for p in props]


@router.post("/properties")
def create_property(
    data: PropertyIn,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = Property(**data.model_dump(), uploaded_by=current_user.id)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop_to_dict(prop)


@router.get("/properties/{prop_id}")
def get_property(
    prop_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == prop_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop_to_dict(prop)


@router.put("/properties/{prop_id}")
def update_property(
    prop_id: int,
    data: PropertyIn,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == prop_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if current_user.role != "admin" and prop.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    for k, v in data.model_dump().items():
        setattr(prop, k, v)
    prop.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(prop)
    return prop_to_dict(prop)


@router.delete("/properties/{prop_id}")
def delete_property(
    prop_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == prop_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return {"ok": True}


# ─── Events ───────────────────────────────────────────────────────────────────

class EventIn(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: Optional[str] = "other"
    event_date: Optional[datetime] = None
    location: Optional[str] = None
    image_url: Optional[str] = None


def event_to_dict(e: AgentEvent) -> dict:
    return {
        "id": e.id,
        "title": e.title,
        "description": e.description,
        "event_type": e.event_type,
        "event_date": e.event_date.isoformat() if e.event_date else None,
        "location": e.location,
        "image_url": e.image_url,
        "created_by": e.created_by,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


@router.get("/events")
def list_events(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    events = db.query(AgentEvent).order_by(AgentEvent.event_date.desc()).all()
    return [event_to_dict(e) for e in events]


@router.post("/events")
def create_event(
    data: EventIn,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    ev = AgentEvent(**data.model_dump(), created_by=current_user.id)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return event_to_dict(ev)


@router.put("/events/{ev_id}")
def update_event(
    ev_id: int,
    data: EventIn,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    ev = db.query(AgentEvent).filter(AgentEvent.id == ev_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    for k, v in data.model_dump().items():
        setattr(ev, k, v)
    db.commit()
    db.refresh(ev)
    return event_to_dict(ev)


@router.delete("/events/{ev_id}")
def delete_event(
    ev_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    ev = db.query(AgentEvent).filter(AgentEvent.id == ev_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(ev)
    db.commit()
    return {"ok": True}


# ─── Videos ───────────────────────────────────────────────────────────────────

class VideoIn(BaseModel):
    title: str
    description: Optional[str] = None
    youtube_url: str
    category: Optional[str] = "other"


def video_to_dict(v: AgentVideo) -> dict:
    return {
        "id": v.id,
        "title": v.title,
        "description": v.description,
        "youtube_url": v.youtube_url,
        "category": v.category,
        "created_by": v.created_by,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }


@router.get("/videos")
def list_videos(
    category: Optional[str] = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(AgentVideo)
    if category:
        q = q.filter(AgentVideo.category == category)
    videos = q.order_by(AgentVideo.created_at.desc()).all()
    return [video_to_dict(v) for v in videos]


@router.post("/videos")
def create_video(
    data: VideoIn,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    vid = AgentVideo(**data.model_dump(), created_by=current_user.id)
    db.add(vid)
    db.commit()
    db.refresh(vid)
    return video_to_dict(vid)


@router.put("/videos/{vid_id}")
def update_video(
    vid_id: int,
    data: VideoIn,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    vid = db.query(AgentVideo).filter(AgentVideo.id == vid_id).first()
    if not vid:
        raise HTTPException(status_code=404, detail="Video not found")
    for k, v in data.model_dump().items():
        setattr(vid, k, v)
    db.commit()
    db.refresh(vid)
    return video_to_dict(vid)


@router.delete("/videos/{vid_id}")
def delete_video(
    vid_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    vid = db.query(AgentVideo).filter(AgentVideo.id == vid_id).first()
    if not vid:
        raise HTTPException(status_code=404, detail="Video not found")
    db.delete(vid)
    db.commit()
    return {"ok": True}


# ─── Promotions ───────────────────────────────────────────────────────────────

class PromotionIn(BaseModel):
    title: str
    description: Optional[str] = None
    developer: Optional[str] = None
    discount_percent: Optional[float] = None
    promo_details: Optional[str] = None
    expires_at: Optional[datetime] = None
    image_url: Optional[str] = None


def promo_to_dict(p: AgentPromotion) -> dict:
    return {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "developer": p.developer,
        "discount_percent": p.discount_percent,
        "promo_details": p.promo_details,
        "expires_at": p.expires_at.isoformat() if p.expires_at else None,
        "image_url": p.image_url,
        "created_by": p.created_by,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("/promotions")
def list_promotions(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    promos = db.query(AgentPromotion).order_by(AgentPromotion.created_at.desc()).all()
    return [promo_to_dict(p) for p in promos]


@router.post("/promotions")
def create_promotion(
    data: PromotionIn,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    promo = AgentPromotion(**data.model_dump(), created_by=current_user.id)
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo_to_dict(promo)


@router.put("/promotions/{promo_id}")
def update_promotion(
    promo_id: int,
    data: PromotionIn,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    promo = db.query(AgentPromotion).filter(AgentPromotion.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    for k, v in data.model_dump().items():
        setattr(promo, k, v)
    db.commit()
    db.refresh(promo)
    return promo_to_dict(promo)


@router.delete("/promotions/{promo_id}")
def delete_promotion(
    promo_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    promo = db.query(AgentPromotion).filter(AgentPromotion.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    db.delete(promo)
    db.commit()
    return {"ok": True}


# ─── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "properties": db.query(Property).count(),
        "available": db.query(Property).filter(Property.status == "available").count(),
        "for_sale": db.query(Property).filter(Property.transaction_type == "For Sale").count(),
        "for_rent": db.query(Property).filter(Property.transaction_type == "For Rent").count(),
        "events": db.query(AgentEvent).count(),
        "videos": db.query(AgentVideo).count(),
        "promotions": db.query(AgentPromotion).count(),
    }
