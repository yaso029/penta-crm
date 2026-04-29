from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta, timezone
from backend.database.db import get_db
from backend.database.models import Partner, WhatsAppTemplate, OutreachMessage, IncomingReply
from backend.services.auth_service import require_admin
from backend.services import whatsapp_service, ai_reply_service
import os

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

UAE_TZ = timezone(timedelta(hours=4))
DAILY_LIMIT = 50
COOLDOWN_DAYS = 5
BLOCKED_STATUSES = ["Not Interested", "Inactive"]


class SendRequest(BaseModel):
    partner_ids: List[int]
    template_id: Optional[int] = None
    custom_message: Optional[str] = None


class TemplateRequest(BaseModel):
    name: str
    category: Optional[str] = "MARKETING"
    body: str
    buttons: Optional[list] = None


def msg_to_dict(m: OutreachMessage) -> dict:
    return {
        "id": m.id,
        "partner_id": m.partner_id,
        "partner_name": m.partner.full_name if m.partner else None,
        "channel": m.channel,
        "message_body": m.message_body,
        "sent_at": m.sent_at.isoformat() if m.sent_at else None,
        "status": m.status,
        "message_id": m.message_id,
    }


def tmpl_to_dict(t: WhatsAppTemplate) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "category": t.category,
        "body": t.body,
        "buttons": t.buttons,
        "meta_status": t.meta_status,
        "meta_template_id": t.meta_template_id,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


@router.get("/daily-count")
def daily_count(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    today = datetime.now(UAE_TZ).date()
    count = db.query(OutreachMessage).filter(
        OutreachMessage.channel == "whatsapp",
        OutreachMessage.sent_at >= datetime.combine(today, datetime.min.time())
    ).count()
    return {"count": count, "limit": DAILY_LIMIT}


@router.post("/send")
async def send_whatsapp(req: SendRequest, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    if not whatsapp_service.is_within_sending_hours():
        raise HTTPException(status_code=400, detail="Outside sending hours (9 AM – 6 PM UAE time)")

    today = datetime.now(UAE_TZ).date()
    sent_today = db.query(OutreachMessage).filter(
        OutreachMessage.channel == "whatsapp",
        OutreachMessage.sent_at >= datetime.combine(today, datetime.min.time())
    ).count()

    if sent_today >= DAILY_LIMIT:
        raise HTTPException(status_code=400, detail=f"Daily limit of {DAILY_LIMIT} messages reached")

    template = None
    if req.template_id:
        template = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == req.template_id).first()

    results = []
    remaining = DAILY_LIMIT - sent_today

    for pid in req.partner_ids[:remaining]:
        partner = db.query(Partner).filter(Partner.id == pid).first()
        if not partner:
            continue
        if partner.status in BLOCKED_STATUSES:
            results.append({"partner_id": pid, "error": "Blocked status"})
            continue

        # Check 5-day cooldown
        cooldown_cutoff = datetime.utcnow() - timedelta(days=COOLDOWN_DAYS)
        recent = db.query(OutreachMessage).filter(
            OutreachMessage.partner_id == pid,
            OutreachMessage.channel == "whatsapp",
            OutreachMessage.sent_at >= cooldown_cutoff
        ).first()
        if recent:
            results.append({"partner_id": pid, "error": f"Contacted within last {COOLDOWN_DAYS} days"})
            continue

        body = req.custom_message or (template.body if template else "")
        body = whatsapp_service.personalize(body, {
            "full_name": partner.full_name, "company": partner.company,
            "partner_type": partner.partner_type, "commission_rate": partner.commission_rate
        })

        to_number = (partner.whatsapp_number or "").replace(" ", "").replace("+", "").replace("-", "")
        if not to_number:
            results.append({"partner_id": pid, "error": "No WhatsApp number"})
            continue

        if template and template.meta_status == "approved":
            template_name = template.name.lower().replace(" ", "_")
            result = await whatsapp_service.send_whatsapp_template(to_number, template_name)
        else:
            result = await whatsapp_service.send_whatsapp_text(to_number, body)

        if "error" in result and not result.get("simulated"):
            results.append({"partner_id": pid, "error": result["error"]})
            continue

        msg = OutreachMessage(
            partner_id=partner.id,
            channel="whatsapp",
            template_id=req.template_id,
            message_body=body,
            status="sent",
            message_id=result.get("message_id"),
        )
        db.add(msg)
        partner.last_contacted_at = datetime.utcnow()
        results.append({"partner_id": pid, "ok": True})

    db.commit()
    errors = [r for r in results if r.get("error")]
    sent_count = len([r for r in results if r.get("ok")])
    if sent_count == 0 and errors:
        raise HTTPException(status_code=400, detail=errors[0]["error"])
    return {"results": results, "sent": sent_count}


@router.get("/templates")
def list_templates(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    return [tmpl_to_dict(t) for t in db.query(WhatsAppTemplate).order_by(WhatsAppTemplate.created_at.desc()).all()]


@router.post("/templates")
def create_template(req: TemplateRequest, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    t = WhatsAppTemplate(name=req.name, category=req.category, body=req.body, buttons=req.buttons)
    db.add(t)
    db.commit()
    db.refresh(t)
    return tmpl_to_dict(t)


@router.put("/templates/{template_id}")
def update_template(template_id: int, req: TemplateRequest, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    t = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    t.name = req.name
    t.category = req.category
    t.body = req.body
    t.buttons = req.buttons
    t.meta_status = "pending"
    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return tmpl_to_dict(t)


@router.delete("/templates/{template_id}")
def delete_template(template_id: int, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    t = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(t)
    db.commit()
    return {"ok": True}


@router.post("/templates/{template_id}/submit")
async def submit_template(template_id: int, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    t = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    result = await whatsapp_service.submit_template_to_meta(t.name, t.category, t.body, t.buttons or [])
    if result.get("ok"):
        t.meta_status = "submitted"
        t.meta_template_id = result.get("template_id")
        db.commit()
    return result


@router.post("/templates/{template_id}/check-status")
async def check_template_status(template_id: int, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    t = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    result = await whatsapp_service.check_template_status(t.name)
    if result.get("status"):
        t.meta_status = result["status"].lower()
        db.commit()
    return {"meta_status": t.meta_status, **result}


@router.patch("/templates/{template_id}/status")
def set_template_status(template_id: int, status: str, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    t = db.query(WhatsAppTemplate).filter(WhatsAppTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    t.meta_status = status
    db.commit()
    return tmpl_to_dict(t)


@router.get("/sent")
def sent_history(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    msgs = db.query(OutreachMessage).filter(OutreachMessage.channel == "whatsapp") \
        .order_by(OutreachMessage.sent_at.desc()).limit(200).all()
    return [msg_to_dict(m) for m in msgs]


@router.get("/replies")
def get_replies(current_user=Depends(require_admin), db: Session = Depends(get_db)):
    replies = db.query(IncomingReply).filter(IncomingReply.channel == "whatsapp") \
        .order_by(IncomingReply.received_at.desc()).all()
    return [{
        "id": r.id,
        "partner_id": r.partner_id,
        "partner_name": r.partner.full_name if r.partner else "Unknown",
        "from_number": r.from_number,
        "message_body": r.message_body,
        "received_at": r.received_at.isoformat() if r.received_at else None,
        "ai_suggestion": r.ai_suggestion,
        "action_taken": r.action_taken,
    } for r in replies]


@router.patch("/replies/{reply_id}/action")
def take_action(reply_id: int, action: str, current_user=Depends(require_admin), db: Session = Depends(get_db)):
    r = db.query(IncomingReply).filter(IncomingReply.id == reply_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reply not found")
    r.action_taken = action
    if r.partner and action == "not_interested":
        partner = db.query(Partner).filter(Partner.id == r.partner_id).first()
        if partner:
            partner.status = "Not Interested"
    db.commit()
    return {"ok": True}


VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "pentacrm_verify_2024")

@router.get("/webhook")
async def verify_webhook(request: Request):
    params = dict(request.query_params)
    if params.get("hub.verify_token") == VERIFY_TOKEN and params.get("hub.challenge"):
        return int(params["hub.challenge"])
    raise HTTPException(status_code=403, detail="Invalid token")


@router.post("/webhook")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for msg in value.get("messages", []):
                    from_number = msg.get("from", "")
                    body = msg.get("text", {}).get("body", "")
                    if not body:
                        continue
                    suggestion = ai_reply_service.analyze_reply(body)
                    partner = db.query(Partner).filter(
                        Partner.whatsapp_number.ilike(f"%{from_number[-9:]}")
                    ).first()
                    reply = IncomingReply(
                        partner_id=partner.id if partner else None,
                        channel="whatsapp",
                        message_body=body,
                        from_number=from_number,
                        ai_suggestion=suggestion,
                    )
                    db.add(reply)
        db.commit()
    except Exception:
        pass
    return {"status": "ok"}
