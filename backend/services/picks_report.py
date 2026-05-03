"""
Branded PDF brochure: client brief + agent-curated property cards with images.
"""
import io
import re
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, Image as RLImage,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

GOLD   = colors.HexColor("#C9A84C")
NAVY   = colors.HexColor("#0A2342")
LGRAY  = colors.HexColor("#F4F6F9")
MGRAY  = colors.HexColor("#94A3B8")
TEXT   = colors.HexColor("#1E293B")
WHITE  = colors.white

W, H   = A4
MARGIN = 16 * mm
INNER  = W - 2 * MARGIN


# ─── Image fetcher ────────────────────────────────────────────────────────────

def _fetch_rl_image(url: str, max_w_mm: float, max_h_mm: float):
    """Download image URL → ReportLab Image sized to fit box, or None."""
    if not url:
        return None
    max_w = max_w_mm * mm
    max_h = max_h_mm * mm
    headers = {"User-Agent": "Mozilla/5.0 (compatible; ReportLab/4.0)"}
    try:
        import httpx
        from PIL import Image as PILImage
        resp = httpx.get(url, timeout=10, follow_redirects=True, headers=headers)
        if resp.status_code != 200 or len(resp.content) < 1000:
            return None
        pil = PILImage.open(io.BytesIO(resp.content)).convert("RGB")
        buf = io.BytesIO()
        pil.save(buf, format="JPEG", quality=78, optimize=True)
        buf.seek(0)
        img = RLImage(buf)
        ratio = min(max_w / img.imageWidth, max_h / img.imageHeight)
        img.drawWidth  = img.imageWidth  * ratio
        img.drawHeight = img.imageHeight * ratio
        return img
    except Exception:
        return None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _fmt_price(v):
    if not v:
        return None
    try:
        v = float(v)
    except Exception:
        return str(v)
    if v >= 1_000_000:
        return f"AED {v / 1_000_000:.2f}M"
    return f"AED {int(v):,}"

def _p(text, style):
    return Paragraph(str(text), style)


# ─── Main generator ───────────────────────────────────────────────────────────

def generate_picks_pdf(session, picks) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
        title=f"Property Report — {session.client_name or 'Client'}",
    )

    ss = getSampleStyleSheet()
    normal = ss["Normal"]

    def style(**kw):
        return ParagraphStyle("x", parent=normal, **kw)

    story = []

    # ── Cover header ──────────────────────────────────────────────────────────
    hdr = Table(
        [[
            _p('<font color="#C9A84C" size="26"><b>P</b></font>', normal),
            _p('<font color="white" size="15"><b>Penta System</b></font><br/>'
               '<font color="#C9A84C" size="7" >REAL ESTATE PLATFORM</font>', normal),
            _p(f'<font color="white" size="9">Property Report<br/>'
               f'{datetime.utcnow().strftime("%d %B %Y")}</font>',
               style(alignment=TA_RIGHT)),
        ]],
        colWidths=[12*mm, 110*mm, None],
    )
    hdr.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), NAVY),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
        ("LEFTPADDING",   (0,0),(0,-1),  8),
        ("LEFTPADDING",   (1,0),(1,-1),  6),
        ("RIGHTPADDING",  (-1,0),(-1,-1),14),
        ("TOPPADDING",    (0,0),(-1,-1), 12),
        ("BOTTOMPADDING", (0,0),(-1,-1), 12),
    ]))
    story.append(hdr)
    story.append(Spacer(1, 5*mm))

    # ── Client profile ────────────────────────────────────────────────────────
    def pr(label, val):
        if not val:
            return None
        return [
            _p(f'<font color="#94A3B8" size="8">{label}</font>', normal),
            _p(f'<font color="#1E293B" size="9"><b>{val}</b></font>', normal),
        ]

    client_rows = [
        [_p('<font color="white" size="10"><b>Client Profile</b></font>', normal), ""]
    ]
    for row in [
        pr("Name",             session.client_name),
        pr("Phone",            session.client_phone),
        pr("Email",            session.client_email),
        pr("Budget",           session.budget_aed),
        pr("Property Type",    session.property_type),
        pr("Bedrooms",         session.bedrooms),
        pr("Preferred Areas",  session.preferred_areas),
        pr("Market",           session.market_preference),
        pr("Purpose",          session.purchase_purpose),
    ]:
        if row:
            client_rows.append(row)

    ct = Table(client_rows, colWidths=[38*mm, INNER - 38*mm])
    ct.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0),  NAVY),
        ("BACKGROUND",    (0,1),(-1,-1), LGRAY),
        ("SPAN",          (0,0),(-1,0)),
        ("LINEBELOW",     (0,0),(-1,0),  2, GOLD),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(-1,-1), 6),
        ("BOTTOMPADDING", (0,0),(-1,-1), 6),
        ("BOX",           (0,0),(-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story.append(ct)
    story.append(Spacer(1, 7*mm))

    # ── Section heading ───────────────────────────────────────────────────────
    story.append(Table(
        [[
            _p(f'<font color="#0A2342" size="12"><b>Curated Properties</b></font>', normal),
            _p(f'<font color="#94A3B8" size="9">{len(picks)} options selected by your agent</font>',
               style(alignment=TA_RIGHT)),
        ]],
        colWidths=[INNER * 0.6, INNER * 0.4],
    ))
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD))
    story.append(Spacer(1, 4*mm))

    # ── Property cards ────────────────────────────────────────────────────────
    IMG_W  = 72   # mm
    IMG_H  = 58   # mm
    TEXT_W = INNER - IMG_W*mm - 6*mm

    for i, pick in enumerate(picks):
        title_str  = pick.title or f"Property {i+1}"
        price_str  = _fmt_price(pick.price_aed)

        # Fetch image
        img = _fetch_rl_image(pick.image_url, IMG_W, IMG_H) if pick.image_url else None

        # ── Number badge row ──
        badge_row = Table(
            [[_p(f'<font color="white" size="8"><b>  #{i+1}  </b></font>', normal)]],
            colWidths=[INNER],
        )
        badge_row.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), NAVY),
            ("TOPPADDING",    (0,0),(-1,-1), 4),
            ("BOTTOMPADDING", (0,0),(-1,-1), 4),
            ("LEFTPADDING",   (0,0),(-1,-1), 8),
        ]))

        # ── Text block ──────────────────────────────────────
        txt = []

        # Title
        txt.append(_p(
            f'<font color="#0A2342" size="13"><b>{title_str}</b></font>',
            style(spaceAfter=2),
        ))

        # Developer
        dev = getattr(pick, "developer", None) or ""
        if dev:
            txt.append(_p(
                f'<font color="#64748B" size="8">{dev}</font>',
                style(spaceAfter=4),
            ))

        # Price
        if price_str:
            txt.append(_p(
                f'<font color="#C9A84C" size="16"><b>{price_str}</b></font>',
                style(spaceAfter=5),
            ))

        # Specs row
        specs = []
        if pick.bedrooms:  specs.append(f"🛏 {pick.bedrooms} BR")
        if pick.bathrooms: specs.append(f"🚿 {pick.bathrooms} BA")
        if pick.size_sqft: specs.append(f"📐 {int(pick.size_sqft):,} sqft")
        if pick.property_type: specs.append(f"🏢 {pick.property_type}")
        if specs:
            txt.append(_p(
                f'<font color="#1E293B" size="9">{"    ".join(specs)}</font>',
                style(spaceAfter=4),
            ))

        # Info rows table (area / handover / payment plan)
        info_rows = []
        if pick.area:
            info_rows.append(("📍 Location", pick.area))
        completion = getattr(pick, "completion_date", None) or ""
        if completion:
            info_rows.append(("🗓 Handover", completion))
        payment = getattr(pick, "payment_plan", None) or ""
        if payment:
            info_rows.append(("💳 Payment Plan", payment))

        if info_rows:
            for label, val in info_rows:
                txt.append(Table(
                    [[
                        _p(f'<font color="#94A3B8" size="8">{label}</font>', normal),
                        _p(f'<font color="#1E293B" size="8"><b>{val}</b></font>', normal),
                    ]],
                    colWidths=[32*mm, TEXT_W - 34*mm if img else INNER - 34*mm],
                ))
            txt.append(Spacer(1, 4))

        # Highlights
        highlights = getattr(pick, "highlights", None) or ""
        if highlights:
            txt.append(_p(
                f'<font color="#0A2342" size="8">⭐  {highlights}</font>',
                style(spaceAfter=3),
            ))

        # Agent notes
        if pick.notes:
            txt.append(_p(
                f'<font color="#64748B" size="8"><i>📝  {pick.notes}</i></font>',
                style(spaceAfter=0),
            ))

        # ── Assemble card ─────────────────────────────────
        if img:
            card_data = [[img, txt]]
            col_w = [IMG_W*mm, TEXT_W]
        else:
            card_data = [[txt]]
            col_w = [INNER]

        card_body = Table(card_data, colWidths=col_w)
        card_body.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), WHITE),
            ("VALIGN",        (0,0),(-1,-1), "TOP"),
            ("LEFTPADDING",   (0,0),(-1,-1), 8),
            ("RIGHTPADDING",  (0,0),(-1,-1), 10),
            ("TOPPADDING",    (0,0),(-1,-1), 10),
            ("BOTTOMPADDING", (0,0),(-1,-1), 12),
        ]))

        # Outer wrapper with border
        outer = Table([[badge_row], [card_body]], colWidths=[INNER])
        outer.setStyle(TableStyle([
            ("BOX",           (0,0),(-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ("LINEBELOW",     (0,0),(-1,0),  2,   GOLD),
            ("LEFTPADDING",   (0,0),(-1,-1), 0),
            ("RIGHTPADDING",  (0,0),(-1,-1), 0),
            ("TOPPADDING",    (0,0),(-1,-1), 0),
            ("BOTTOMPADDING", (0,0),(-1,-1), 0),
        ]))

        story.append(KeepTogether([outer, Spacer(1, 6*mm)]))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0")))
    story.append(Spacer(1, 3*mm))
    story.append(_p(
        f'<font color="#94A3B8" size="7">This report was prepared by Penta System on '
        f'{datetime.utcnow().strftime("%d %B %Y")}. Property details are sourced from '
        f'publicly available listings and are subject to change. Not a contractual offer.</font>',
        style(alignment=TA_CENTER),
    ))

    doc.build(story)
    return buf.getvalue()
