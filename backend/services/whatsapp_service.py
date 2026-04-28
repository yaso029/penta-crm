import os
import httpx
from datetime import datetime, timezone, timedelta

WHATSAPP_API_TOKEN = os.environ.get("WHATSAPP_API_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_BUSINESS_ACCOUNT_ID = os.environ.get("WHATSAPP_BUSINESS_ACCOUNT_ID", "")

UAE_TZ = timezone(timedelta(hours=4))
SEND_HOUR_START = 9
SEND_HOUR_END = 18


def is_within_sending_hours() -> bool:
    now_uae = datetime.now(UAE_TZ)
    return SEND_HOUR_START <= now_uae.hour < SEND_HOUR_END


def personalize(template_body: str, partner: dict) -> str:
    return (
        template_body
        .replace("{name}", partner.get("full_name", ""))
        .replace("{company}", partner.get("company", "") or "")
        .replace("{partner_type}", partner.get("partner_type", "") or "")
        .replace("{commission_rate}", str(partner.get("commission_rate", "0.5")) + "%")
    )


async def send_whatsapp_text(to_number: str, message: str) -> dict:
    if not WHATSAPP_API_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        return {"error": "WhatsApp not configured", "simulated": True, "message_id": f"sim_{to_number}"}

    url = f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_API_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": message},
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json=payload, headers=headers)
        data = resp.json()
        if resp.status_code == 200:
            msg_id = data.get("messages", [{}])[0].get("id", "")
            return {"ok": True, "message_id": msg_id}
        return {"error": data.get("error", {}).get("message", "Send failed")}


async def submit_template_to_meta(template_name: str, category: str, body: str, buttons: list) -> dict:
    if not WHATSAPP_API_TOKEN or not WHATSAPP_BUSINESS_ACCOUNT_ID:
        return {"error": "WhatsApp not configured"}

    url = f"https://graph.facebook.com/v18.0/{WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_API_TOKEN}",
        "Content-Type": "application/json",
    }
    components = [{"type": "BODY", "text": body}]
    if buttons:
        btn_component = {"type": "BUTTONS", "buttons": []}
        for b in buttons:
            if b.get("type") == "URL":
                btn_component["buttons"].append({"type": "URL", "text": b["text"], "url": b.get("url", "")})
            else:
                btn_component["buttons"].append({"type": "QUICK_REPLY", "text": b["text"]})
        components.append(btn_component)

    payload = {
        "name": template_name.lower().replace(" ", "_"),
        "category": category.upper(),
        "language": "en",
        "components": components,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json=payload, headers=headers)
        data = resp.json()
        if resp.status_code == 200:
            return {"ok": True, "template_id": data.get("id", "")}
        return {"error": data.get("error", {}).get("message", "Submission failed")}
