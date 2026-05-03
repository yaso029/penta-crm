"""
Branded PDF report: client brief + agent-curated property list.
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
    HRFlowable, KeepTogether,
)
from reportlab.platypus import Image as RLImage
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

GOLD = colors.HexColor("#C9A84C")
NAVY = colors.HexColor("#0A2342")
LIGHT_GRAY = colors.HexColor("#F4F6F9")
MID_GRAY = colors.HexColor("#888888")
TEXT = colors.HexColor("#1a1a2e")

W, H = A4
MARGIN = 18 * mm


def _fmt_price(v):
    if not v:
        return "Price on request"
    if v >= 1_000_000:
        return f"AED {v / 1_000_000:.2f}M"
    return f"AED {int(v):,}"


def _fetch_image(url: str, max_w: float, max_h: float):
    if not url:
        return None
    try:
        import httpx
        resp = httpx.get(url, timeout=8, follow_redirects=True,
                         headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code != 200:
            return None
        from PIL import Image as PILImage
        img = PILImage.open(io.BytesIO(resp.content)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=75)
        buf.seek(0)
        rl_img = RLImage(buf)
        ratio = min(max_w / rl_img.imageWidth, max_h / rl_img.imageHeight)
        rl_img.drawWidth = rl_img.imageWidth * ratio
        rl_img.drawHeight = rl_img.imageHeight * ratio
        return rl_img
    except Exception:
        return None


def generate_picks_pdf(session, picks) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
        title=f"Property Report — {session.client_name or 'Client'}",
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Header ─────────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph('<font color="#C9A84C" size="22"><b>P</b></font>', styles["Normal"]),
        Paragraph(
            '<font color="white" size="14"><b>Penta System</b></font><br/>'
            '<font color="#C9A84C" size="7">REAL ESTATE PLATFORM</font>',
            styles["Normal"]
        ),
        Paragraph(
            f'<font color="white" size="8">Property Report<br/>'
            f'{datetime.utcnow().strftime("%d %B %Y")}</font>',
            ParagraphStyle("right", alignment=TA_RIGHT, fontName="Helvetica"),
        ),
    ]]
    header_table = Table(header_data, colWidths=[14 * mm, 100 * mm, None])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, -1), 10),
        ("LEFTPADDING", (1, 0), (1, -1), 6),
        ("RIGHTPADDING", (-1, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [8]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6 * mm))

    # ── Client profile card ────────────────────────────────────────────────────
    def profile_row(label, value):
        if not value:
            return None
        return [
            Paragraph(f'<font color="{MID_GRAY.hexval()}" size="8">{label}</font>', styles["Normal"]),
            Paragraph(f'<font color="{TEXT.hexval()}" size="9"><b>{value}</b></font>', styles["Normal"]),
        ]

    profile_rows = [
        [Paragraph('<font color="white" size="10"><b>Client Profile</b></font>', styles["Normal"]), ""],
    ]
    for row in [
        profile_row("Name", session.client_name),
        profile_row("Phone", session.client_phone),
        profile_row("Email", session.client_email),
        profile_row("Budget", session.budget_aed),
        profile_row("Property Type", session.property_type),
        profile_row("Bedrooms", session.bedrooms),
        profile_row("Preferred Areas", session.preferred_areas),
        profile_row("Market Preference", session.market_preference),
        profile_row("Purpose", session.purchase_purpose),
    ]:
        if row:
            profile_rows.append(row)

    usable_w = W - 2 * MARGIN
    profile_table = Table(profile_rows, colWidths=[40 * mm, usable_w - 40 * mm])
    profile_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
        ("SPAN", (0, 0), (-1, 0)),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROUNDEDCORNERS", [6]),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
    ]))
    story.append(profile_table)
    story.append(Spacer(1, 8 * mm))

    # ── Section title ──────────────────────────────────────────────────────────
    story.append(Paragraph(
        f'<font color="{NAVY.hexval()}" size="12"><b>Curated Properties</b></font>'
        f'<font color="{MID_GRAY.hexval()}" size="9"> — {len(picks)} options selected by your agent</font>',
        styles["Normal"]
    ))
    story.append(Spacer(1, 4 * mm))

    # ── Property cards ─────────────────────────────────────────────────────────
    for i, pick in enumerate(picks):
        img = _fetch_image(pick.image_url, max_w=55 * mm, max_h=42 * mm)

        specs_parts = []
        if pick.bedrooms:
            specs_parts.append(f"🛏 {pick.bedrooms} BR")
        if pick.bathrooms:
            specs_parts.append(f"🚿 {pick.bathrooms} BA")
        if pick.size_sqft:
            specs_parts.append(f"📐 {int(pick.size_sqft):,} sqft")
        specs_line = "   ".join(specs_parts) if specs_parts else ""

        area_line = pick.area or ""
        price_line = _fmt_price(pick.price_aed)
        title_line = pick.title or pick.listing_url
        notes_line = pick.notes or ""
        link_text = pick.listing_url[:60] + ("…" if len(pick.listing_url) > 60 else "")

        text_col = [
            Paragraph(
                f'<font color="{NAVY.hexval()}" size="11"><b>{i+1}. {title_line}</b></font>',
                styles["Normal"]
            ),
            Spacer(1, 2 * mm),
            Paragraph(
                f'<font color="{GOLD.hexval()}" size="13"><b>{price_line}</b></font>',
                styles["Normal"]
            ),
        ]
        if specs_line:
            text_col += [Spacer(1, 2 * mm), Paragraph(f'<font color="{TEXT.hexval()}" size="9">{specs_line}</font>', styles["Normal"])]
        if area_line:
            text_col += [Spacer(1, 1.5 * mm), Paragraph(f'<font color="{MID_GRAY.hexval()}" size="9">📍 {area_line}</font>', styles["Normal"])]
        if notes_line:
            text_col += [Spacer(1, 2 * mm), Paragraph(f'<font color="{MID_GRAY.hexval()}" size="8"><i>{notes_line}</i></font>', styles["Normal"])]
        text_col += [
            Spacer(1, 3 * mm),
            Paragraph(f'<font color="#1155CC" size="7">{link_text}</font>', styles["Normal"]),
        ]

        if img:
            card_data = [[img, text_col]]
            col_widths = [58 * mm, usable_w - 62 * mm]
        else:
            card_data = [[text_col]]
            col_widths = [usable_w]

        card = Table(card_data, colWidths=col_widths)
        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("LINEBELOW", (0, 0), (0, 0), 2, GOLD) if img else ("LINEBELOW", (0, 0), (-1, 0), 0, colors.white),
            ("ROUNDEDCORNERS", [6]),
        ]))

        story.append(KeepTogether([card, Spacer(1, 4 * mm)]))

    # ── Footer ─────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0")))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        f'<font color="{MID_GRAY.hexval()}" size="8">This report was prepared by Penta System on '
        f'{datetime.utcnow().strftime("%d %B %Y")}. All property information was sourced from public listings. '
        f'Prices are indicative and subject to change.</font>',
        ParagraphStyle("footer", alignment=TA_CENTER, fontName="Helvetica"),
    ))

    doc.build(story)
    return buf.getvalue()
