"""
Branded PDF brochure: client brief + agent-curated property cards with images.
"""
import io
import json as _json
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
    IMG_W_MM    = 72     # mm — main image column width
    THUMB_H_MM  = 28     # mm — thumbnail strip height
    TEXT_PAD_L  = 16     # pt — left padding on text column (gap from image)
    TEXT_PAD_R  = 10     # pt — right padding on text column
    TEXT_PAD_NL = 14     # pt — left padding when no image
    TEXT_PAD_NR = 14     # pt — right padding when no image

    IMG_W_PTS   = IMG_W_MM * mm
    TEXT_W      = INNER - IMG_W_PTS
    TEXT_INNER  = TEXT_W - TEXT_PAD_L - TEXT_PAD_R   # available content inside text col

    for i, pick in enumerate(picks):
        title_str = pick.title or f"Property {i+1}"
        price_str = _fmt_price(pick.price_aed)

        # ── Collect all image URLs (main + up to 4 extras) ────────────────
        all_img_urls = []
        if pick.image_url:
            all_img_urls.append(pick.image_url)
        try:
            extras = _json.loads(getattr(pick, "images_json", None) or "[]")
            all_img_urls.extend([u for u in (extras or []) if u])
        except Exception:
            pass
        all_img_urls = all_img_urls[:5]
        n_imgs      = len(all_img_urls)
        has_extras  = n_imgs > 1

        # Main image — shorter when a thumbnail strip will follow
        main_h_mm = 40 if has_extras else 52
        main_img  = _fetch_rl_image(all_img_urls[0], IMG_W_MM, main_h_mm) if n_imgs > 0 else None

        # ── Number badge row ──────────────────────────────────────────────
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

        # ── Text block ────────────────────────────────────────────────────
        txt = []

        txt.append(_p(
            f'<font color="#0A2342" size="13"><b>{title_str}</b></font>',
            style(spaceAfter=2),
        ))

        dev = getattr(pick, "developer", None) or ""
        if dev:
            txt.append(_p(
                f'<font color="#64748B" size="8">{dev}</font>',
                style(spaceAfter=4),
            ))

        if price_str:
            txt.append(_p(
                f'<font color="#C9A84C" size="16"><b>{price_str}</b></font>',
                style(spaceAfter=5),
            ))

        specs = []
        if pick.bedrooms:    specs.append(f"🛏 {pick.bedrooms} BR")
        if pick.bathrooms:   specs.append(f"🚿 {pick.bathrooms} BA")
        if pick.size_sqft:   specs.append(f"📐 {int(pick.size_sqft):,} sqft")
        if pick.property_type: specs.append(f"🏢 {pick.property_type}")
        if specs:
            txt.append(_p(
                f'<font color="#1E293B" size="9">{"    ".join(specs)}</font>',
                style(spaceAfter=4),
            ))

        # Info rows (Location / Handover / Payment Plan)
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
            info_label_w = 32 * mm
            if main_img:
                info_val_w = TEXT_INNER - info_label_w - 4
            else:
                info_val_w = INNER - TEXT_PAD_NL - TEXT_PAD_NR - info_label_w - 4
            info_val_w = max(info_val_w, 50)
            for label, val in info_rows:
                txt.append(Table(
                    [[
                        _p(f'<font color="#94A3B8" size="8">{label}</font>', normal),
                        _p(f'<font color="#1E293B" size="8"><b>{val}</b></font>', normal),
                    ]],
                    colWidths=[info_label_w, info_val_w],
                ))
            txt.append(Spacer(1, 4))

        highlights = getattr(pick, "highlights", None) or ""
        if highlights:
            txt.append(_p(
                f'<font color="#0A2342" size="8">⭐  {highlights}</font>',
                style(spaceAfter=3),
            ))

        if pick.notes:
            txt.append(_p(
                f'<font color="#64748B" size="8"><i>📝  {pick.notes}</i></font>',
                style(spaceAfter=0),
            ))

        # ── Assemble card body ────────────────────────────────────────────
        if main_img:
            card_data = [[main_img, txt]]
            col_w     = [IMG_W_PTS, TEXT_W]
            body_style = TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), WHITE),
                ("VALIGN",        (0,0),(-1,-1), "TOP"),
                ("LEFTPADDING",   (0,0),(0,-1),  6),
                ("RIGHTPADDING",  (0,0),(0,-1),  0),
                ("LEFTPADDING",   (1,0),(1,-1),  TEXT_PAD_L),
                ("RIGHTPADDING",  (1,0),(1,-1),  TEXT_PAD_R),
                ("TOPPADDING",    (0,0),(-1,-1), 10),
                ("BOTTOMPADDING", (0,0),(-1,-1), 12),
            ])
        else:
            card_data = [[txt]]
            col_w     = [INNER]
            body_style = TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), WHITE),
                ("VALIGN",        (0,0),(-1,-1), "TOP"),
                ("LEFTPADDING",   (0,0),(-1,-1), TEXT_PAD_NL),
                ("RIGHTPADDING",  (0,0),(-1,-1), TEXT_PAD_NR),
                ("TOPPADDING",    (0,0),(-1,-1), 10),
                ("BOTTOMPADDING", (0,0),(-1,-1), 12),
            ])

        card_body = Table(card_data, colWidths=col_w)
        card_body.setStyle(body_style)

        # ── Thumbnail strip (when 2+ images) ─────────────────────────────
        thumb_strip = None
        if has_extras:
            n_thumbs   = min(n_imgs - 1, 4)
            thumb_urls = all_img_urls[1:1+n_thumbs]
            thumb_w_pts = INNER / n_thumbs
            thumb_w_mm  = thumb_w_pts / mm

            thumb_cells = []
            for turl in thumb_urls:
                timg = _fetch_rl_image(turl, thumb_w_mm - 1.5, THUMB_H_MM - 2)
                if timg:
                    tc = Table([[timg]], colWidths=[thumb_w_pts])
                    tc.setStyle(TableStyle([
                        ("BACKGROUND",    (0,0),(-1,-1), WHITE),
                        ("ALIGN",         (0,0),(-1,-1), "CENTER"),
                        ("LEFTPADDING",   (0,0),(-1,-1), 2),
                        ("RIGHTPADDING",  (0,0),(-1,-1), 2),
                        ("TOPPADDING",    (0,0),(-1,-1), 3),
                        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
                    ]))
                    thumb_cells.append(tc)
                else:
                    thumb_cells.append(
                        _p('<font color="#94A3B8" size="8">—</font>',
                           style(alignment=TA_CENTER))
                    )

            thumb_strip = Table([thumb_cells], colWidths=[thumb_w_pts]*n_thumbs)
            thumb_strip.setStyle(TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), LGRAY),
                ("TOPPADDING",    (0,0),(-1,-1), 0),
                ("BOTTOMPADDING", (0,0),(-1,-1), 0),
                ("LEFTPADDING",   (0,0),(-1,-1), 0),
                ("RIGHTPADDING",  (0,0),(-1,-1), 0),
                ("LINEABOVE",     (0,0),(-1,0),  0.5, colors.HexColor("#E2E8F0")),
            ]))

        # ── Outer wrapper with border ─────────────────────────────────────
        outer_rows = [[badge_row], [card_body]]
        if thumb_strip:
            outer_rows.append([thumb_strip])

        outer = Table(outer_rows, colWidths=[INNER])
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
