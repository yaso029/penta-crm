"""
Claude-powered intake conversation for Penta System.
Collects property requirements only — contact details are captured via form at the end.
"""
import os
import json
import re
import anthropic

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


SYSTEM_PROMPT = """You are a warm and professional property advisor at Penta System, a premium Dubai real estate brokerage. Your job is to have a natural, friendly conversation to understand exactly what the client is looking for in a property.

## Your personality
- Warm, friendly, knowledgeable — like a trusted Dubai property advisor
- Professional but conversational, never robotic or list-like
- If the client writes in Arabic, respond entirely in Arabic
- Acknowledge each answer naturally before moving to the next topic
- Offer helpful Dubai market context when clients seem unsure (e.g. typical prices in an area, popular communities)

## Topics to cover (ask naturally, 1-2 topics at a time — never list all questions at once)

1. Purpose — investment or personal use? If investment: rental yield or capital appreciation? If personal: primary home or holiday?
2. Property type — apartment, villa, townhouse, penthouse?
3. Bedrooms — studio, 1BR, 2BR, 3BR, 4BR+?
4. Preferred areas or communities in Dubai
5. Market preference — off-plan (new development), ready/secondary, or open to both?
6. If off-plan — preferred handover timeline?
7. Must-have features — pool, gym, view, parking, garden, maid's room, etc.
8. Total budget in AED
9. Payment method — cash or mortgage? (if mortgage: pre-approved?)
10. Timeline — how soon looking to buy?

## When you have enough information
Once you have covered the main topics (at minimum: purpose, property type, bedrooms, area, budget), give a brief friendly summary of what the client is looking for, then end your message with exactly this token on its own line:
[READY_TO_GENERATE]

Do NOT ask the client to confirm or say "shall I generate". Just summarise and include the token — the system will handle the next step automatically.

## Rules
- Never ask for name, phone number, or email — those are collected separately
- Never fabricate details the client didn't provide
- Keep responses concise — 2-4 sentences per turn
- If a client is vague about budget, offer ranges to choose from (e.g. "Are you thinking under AED 1M, 1-2M, or above 2M?")"""


def chat(messages: list[dict]) -> str:
    cl = _get_client()
    response = cl.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text


def extract_client_data(messages: list[dict]) -> dict:
    cl = _get_client()
    conversation_text = "\n".join(
        f"{'Client' if m['role'] == 'user' else 'Advisor'}: {m['content']}"
        for m in messages
    )
    extraction_prompt = f"""Extract all property requirement information from this intake conversation and return ONLY a valid JSON object with these exact keys (use null for missing values):

{{
  "purchase_purpose": "investment" | "end_user" | null,
  "investment_goal": "rental_yield" | "capital_appreciation" | null,
  "property_type": string,
  "bedrooms": string,
  "preferred_areas": string,
  "market_preference": "off_plan" | "ready" | "both" | null,
  "handover_timeline": string,
  "must_have_features": string,
  "budget_aed": string,
  "finance_type": "cash" | "mortgage" | null,
  "timeline_to_buy": string
}}

Conversation:
{conversation_text}

Return ONLY the JSON object, no explanation."""

    resp = cl.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        messages=[{"role": "user", "content": extraction_prompt}],
    )
    text = resp.content[0].text.strip()
    text = re.sub(r"^```json\s*|^```\s*|```$", "", text, flags=re.MULTILINE).strip()
    return json.loads(text)


def get_opening_message() -> str:
    return (
        "Hello! Welcome to Penta System. I'm your property advisor and I'll help you find "
        "exactly what you're looking for in Dubai.\n\n"
        "Let's start — are you looking for a property for personal use, or as an investment?"
    )
