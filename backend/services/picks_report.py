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
    IMG_W  = 68   # mm
    IMG_H  = 52   # mm
    TEXT_W = INNER - IMG_W*mm - 4*mm

    for i, pick in enumerate(picks):
        price_str  = _fmt_price(pick.price_aed)
        title_str  = pick.title or f"Property {i+1}"
        area_str   = pick.area or ""
        specs_parts = []
        if pick.bedrooms:  specs_parts.append(f"🛏  {pick.bedrooms} BR")
        if pick.bathrooms: specs_parts.append(f"🚿  {pick.bathrooms} BA")
        if pick.size_sqft: specs_parts.append(f"📐  {int(pick.size_sqft):,} sqft")
        specs_str = "    ".join(specs_parts)
        notes_str  = pick.notes or ""
        link_str   = (pick.listing_url or "")[:65] + ("…" if len(pick.listing_url or "") > 65 else "")

        # Fetch image
        img = _fetch_rl_image(pick.image_url, IMG_W, IMG_H) if pick.image_url else None

        # Number badge
        badge = Table(
            [[_p(f'<font color="white" size="9"><b>#{i+1}</b></font>', normal)]],
            colWidths=[10*mm],
        )
        badge.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), NAVY),
            ("ALIGN",         (0,0),(-1,-1), "CENTER"),
            ("TOPPADDING",    (0,0),(-1,-1), 4),
            ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ]))

        # Text block
        txt = []
        txt.append(_p(
            f'<font color="#0A2342" size="12"><b>{title_str}</b></font>',
            style(spaceAfter=3),
        ))
        if price_str:
            txt.append(_p(
                f'<font color="#C9A84C" size="15"><b>{price_str}</b></font>',
                style(spaceAfter=4),
            ))
        if specs_str:
            txt.append(_p(
                f'<font color="#1E293B" size="9">{specs_str}</font>',
                style(spaceAfter=3),
            ))
        if area_str:
            txt.append(_p(
                f'<font color="#64748B" size="9">📍  {area_str}</font>',
                style(spaceAfter=3),
            ))
        if notes_str:
            txt.append(_p(
                f'<font color="#64748B" size="8"><i>{notes_str}</i></font>',
                style(spaceAfter=4),
            ))
        txt.append(_p(
            f'<font color="#1155CC" size="7">{link_str}</font>',
            normal,
        ))

        if img:
            # Two-column: image left, text right
            card_data = [[img, txt]]
            col_w = [IMG_W*mm, TEXT_W]
        else:
            # Full-width text
            card_data = [[txt]]
            col_w = [INNER]

        card = Table(card_data, colWidths=col_w)
        card.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), WHITE),
            ("VALIGN",        (0,0),(-1,-1), "TOP"),
            ("LEFTPADDING",   (0,0),(-1,-1), 8),
            ("RIGHTPADDING",  (0,0),(-1,-1), 8),
            ("TOPPADDING",    (0,0),(-1,-1), 10),
            ("BOTTOMPADDING", (0,0),(-1,-1), 10),
            ("BOX",           (0,0),(-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ("LINEBELOW",     (0,0),(0,0 if img else -1), 3, GOLD),
        ]))

        story.append(KeepTogether([card, Spacer(1, 5*mm)]))

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
