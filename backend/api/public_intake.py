"""
Public (no-auth) intake endpoints for the client-facing intake form.
POST /intake/form/save          — save form data, returns session_id
POST /intake/form/generate-report — generate PDF, return as download
"""
import json
import uuid
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.database.models import ClientIntake

router = APIRouter(tags=["public-intake"])


class SaveBody(BaseModel):
    form_data: dict


class ReportBody(BaseModel):
    session_id: str


def _extract(form: dict):
    """Pull the relevant fields out of the frontend form_data dict."""
    budget_min = form.get("budgetMin", 0)
    budget_max = form.get("budgetMax", 0)
    budget_str = f"AED {budget_min:,.0f} – {budget_max:,.0f}"

    areas = form.get("areas", [])
    areas_str = ", ".join(areas) if isinstance(areas, list) else str(areas or "")

    prop_types = form.get("propertyTypes", [])
    prop_str = ", ".join(prop_types) if isinstance(prop_types, list) else str(prop_types or "")

    features = form.get("features", [])
    feat_str = ", ".join(features) if isinstance(features, list) else str(features or "")

    return {
        "client_name":        form.get("fullName", ""),
        "client_phone":       form.get("whatsapp", ""),
        "client_email":       form.get("email", ""),
        "purchase_purpose":   form.get("purpose", ""),
        "property_type":      prop_str,
        "bedrooms":           str(form.get("bedrooms", "")),
        "preferred_areas":    areas_str,
        "market_preference":  form.get("marketPreference", ""),
        "budget_aed":         budget_str,
        "features":           feat_str,
        "payment_method":     form.get("paymentMethod", ""),
        "timeline":           form.get("timeline", ""),
        "additional_notes":   form.get("additionalNotes", ""),
        "nationality":        form.get("nationality", ""),
    }


@router.post("/intake/form/save")
def intake_form_save(body: SaveBody, db: Session = Depends(get_db)):
    fields = _extract(body.form_data)
    session_id = str(uuid.uuid4())

    # store extra fields in messages_json as structured metadata
    meta = {
        "features":        fields["features"],
        "payment_method":  fields["payment_method"],
        "timeline":        fields["timeline"],
        "additional_notes": fields["additional_notes"],
        "nationality":     fields["nationality"],
        "raw_form":        body.form_data,
    }

    record = ClientIntake(
        session_id=session_id,
        completed=True,
        client_name=fields["client_name"],
        client_phone=fields["client_phone"],
        client_email=fields["client_email"],
        purchase_purpose=fields["purchase_purpose"],
        property_type=fields["property_type"],
        bedrooms=fields["bedrooms"],
        preferred_areas=fields["preferred_areas"],
        market_preference=fields["market_preference"],
        budget_aed=fields["budget_aed"],
        messages_json=json.dumps([{"role": "meta", "content": meta}]),
    )
    db.add(record)
    db.commit()
    return {"session_id": session_id}


@router.post("/intake/form/generate-report")
def intake_form_generate_report(body: ReportBody, db: Session = Depends(get_db)):
    from backend.services.intake_report import generate_pdf

    record = db.query(ClientIntake).filter(
        ClientIntake.session_id == body.session_id
    ).first()
    if not record:
        raise HTTPException(404, "Session not found")

    messages = json.loads(record.messages_json or "[]")
    # build client_data dict for the PDF generator
    meta_msg = next((m for m in messages if m.get("role") == "meta"), None)
    raw = meta_msg["content"].get("raw_form", {}) if meta_msg else {}

    areas = record.preferred_areas or ""
    client_data = {
        "fullName":        record.client_name or "",
        "whatsapp":        record.client_phone or "",
        "email":           record.client_email or "",
        "nationality":     raw.get("nationality", ""),
        "purpose":         record.purchase_purpose or "",
        "propertyTypes":   [t.strip() for t in (record.property_type or "").split(",") if t.strip()],
        "bedrooms":        record.bedrooms or "",
        "areas":           [a.strip() for a in areas.split(",") if a.strip()],
        "marketPreference": record.market_preference or "",
        "budgetMin":       raw.get("budgetMin", 0),
        "budgetMax":       raw.get("budgetMax", 0),
        "paymentMethod":   raw.get("paymentMethod", ""),
        "features":        raw.get("features", []),
        "timeline":        raw.get("timeline", ""),
        "additionalNotes": raw.get("additionalNotes", ""),
    }

    pdf_bytes = generate_pdf(client_data, messages, body.session_id)

    name = (record.client_name or "Client").replace(" ", "_")
    filename = f"PROPIQ_Intake_{name}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
