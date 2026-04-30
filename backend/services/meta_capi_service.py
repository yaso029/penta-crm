import os
import hashlib
import time
import httpx

META_PIXEL_ID = os.environ.get("META_PIXEL_ID", "")
META_CAPI_TOKEN = os.environ.get("META_CAPI_TOKEN", "")

STAGE_EVENTS = {
    "follow_up": "Lead",
    "pre_meeting": "Schedule",
    "meeting_done": "ViewContent",
    "deal_closed": "Purchase",
}


def _hash(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


def _clean_phone(phone: str) -> str:
    return "".join(c for c in phone if c.isdigit())


async def send_stage_event(lead) -> dict:
    stage = lead.stage
    event_name = STAGE_EVENTS.get(stage)
    if not event_name:
        return {"skipped": True, "reason": f"No event for stage '{stage}'"}

    if not META_PIXEL_ID or not META_CAPI_TOKEN:
        return {"skipped": True, "reason": "META_PIXEL_ID or META_CAPI_TOKEN not configured"}

    user_data = {}
    if lead.phone:
        cleaned = _clean_phone(lead.phone)
        if cleaned:
            user_data["ph"] = [_hash(cleaned)]
    if lead.email:
        user_data["em"] = [_hash(lead.email)]

    event = {
        "event_name": event_name,
        "event_time": int(time.time()),
        "action_source": "crm",
        "user_data": user_data,
        "custom_data": {},
    }

    if event_name == "Purchase" and lead.budget:
        try:
            event["custom_data"]["value"] = float(lead.budget)
            event["custom_data"]["currency"] = "AED"
        except (ValueError, TypeError):
            pass

    payload = {
        "data": [event],
        "test_event_code": os.environ.get("META_CAPI_TEST_CODE", ""),
    }
    if not payload["test_event_code"]:
        del payload["test_event_code"]

    url = f"https://graph.facebook.com/v18.0/{META_PIXEL_ID}/events"
    params = {"access_token": META_CAPI_TOKEN}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, json=payload, params=params)
        data = resp.json()
        if resp.status_code == 200:
            return {"ok": True, "event": event_name, "events_received": data.get("events_received")}
        return {"error": data.get("error", {}).get("message", "CAPI error"), "event": event_name}
