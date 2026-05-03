"""
Branded PDF — Option 2 layout
  Left panel (40%): property info, specs, highlights
  Right panel (60%): large main photo
  Below (full width): gallery of extra photos — all large
"""
import io
import json as _json
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

GOLD  = colors.HexColor("#C9A84C")
NAVY  = colors.HexColor("#0A2342")
LGRAY = colors.HexColor("#F8FAFC")
YGOLD = colors.HexColor("#FFFBEB")
DBORD = colors.HexColor("#E2E8F0")
GRAY  = colors.HexColor("#94A3B8")
DTEXT = colors.HexColor("#1E293B")
STEXT = colors.HexColor("#64748B")
WHITE = colors.white

W, H   = A4
MARGIN = 16 * mm
INNER  = W - 2 * MARGIN          # ≈ 504.6 pts ≈ 178 mm

INFO_W  = INNER * 0.40            # ≈ 202 pts ≈ 71 mm
IMG_W   = INNER - INFO_W          # ≈ 303 pts ≈ 107 mm

INFO_PL = 14                      # left padding inside info panel
INFO_PR = 12                      # right padding
INFO_PT = 16                      # top padding
INFO_PB = 14                      # bottom padding
INFO_CW = INFO_W - INFO_PL - INFO_PR   # usable content width ≈ 176 pts

GALLERY_H_MM = 54                 # gallery image height
GALLERY_MAX_COLS = 3


# ─── Image helpers ────────────────────────────────────────────────────────────

def _fetch_rl_image(url: str, max_w_mm: float, max_h_mm: float, cover: bool = False):
    """Download & return a ReportLab Image. cover=True crops to fill the box."""
    if not url:
        return None
    headers = {"User-Agent": "Mozilla/5.0 (compatible; ReportLab/4.0)"}
    try:
        import httpx
        from PIL import Image as PILImage
        resp = httpx.get(url, timeout=12, follow_redirects=True, headers=headers)
        if resp.status_code != 200 or len(resp.content) < 1000:
            return None
        pil = PILImage.open(io.BytesIO(resp.content)).convert("RGB")

        if cover and pil.width > 0 and pil.height > 0:
            target_ratio = max_w_mm / max_h_mm
            img_ratio    = pil.width / pil.height
            if img_ratio > target_ratio:
                # image wider — crop left/right
                new_w = int(pil.height * target_ratio)
                left  = (pil.width - new_w) // 2
                pil   = pil.crop((left, 0, left + new_w, pil.height))
            else:
                # image taller — crop top/bottom
                new_h = int(pil.width / target_ratio)
                top   = (pil.height - new_h) // 2
                pil   = pil.crop((0, top, pil.width, top + new_h))

        buf = io.BytesIO()
        pil.save(buf, format="JPEG", quality=78, optimize=True)
        buf.seek(0)
        img   = RLImage(buf)
        max_w = max_w_mm * mm
        max_h = max_h_mm * mm
        ratio = min(max_w / img.imageWidth, max_h / img.imageHeight)
        img.drawWidth  = img.imageWidth  * ratio
        img.drawHeight = img.imageHeight * ratio
        return img
    except Exception:
        return None


# ─── Spec cell (small bordered box with value + label) ───────────────────────

def _spec_cell(val: str, label: str, w: float, normal):
    t = Table(
        [[Paragraph(f'<font color="#0A2342" size="12"><b>{val}</b></font>', normal)],
         [Paragraph(f'<font color="#94A3B8" size="8">{label}</font>',      normal)]],
        colWidths=[w],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), LGRAY),
        ("BOX",           (0,0),(-1,-1), 0.5,  DBORD),
        ("LEFTPADDING",   (0,0),(-1,-1), 9),
        ("RIGHTPADDING",  (0,0),(-1,-1), 9),
        ("TOPPADDING",    (0,0),(-1,-1), 7),
        ("BOTTOMPADDING", (0,0),(-1,-1), 7),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ]))
    return t


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
        topMargin=MARGIN,  bottomMargin=MARGIN,
        title=f"Property Report — {session.client_name or 'Client'}",
    )

    ss     = getSampleStyleSheet()
    normal = ss["Normal"]

    def st(**kw):
        return ParagraphStyle("_", parent=normal, **kw)

    story = []

    # ── Branded header ────────────────────────────────────────────────────────
    hdr = Table([[
        _p('<font color="#C9A84C" size="26"><b>P</b></font>', normal),
        _p('<font color="white" size="15"><b>Penta System</b></font><br/>'
           '<font color="#C9A84C" size="7">REAL ESTATE PLATFORM</font>', normal),
        _p(f'<font color="white" size="9">Property Report<br/>'
           f'{datetime.utcnow().strftime("%d %B %Y")}</font>',
           st(alignment=TA_RIGHT)),
    ]], colWidths=[12*mm, 110*mm, None])
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
        return [_p(f'<font color="#94A3B8" size="8">{label}</font>', normal),
                _p(f'<font color="#1E293B" size="9"><b>{val}</b></font>',  normal)]

    client_rows = [[_p('<font color="white" size="10"><b>Client Profile</b></font>', normal), ""]]
    for row in [
        pr("Name",            session.client_name),
        pr("Phone",           session.client_phone),
        pr("Email",           session.client_email),
        pr("Budget",          session.budget_aed),
        pr("Property Type",   session.property_type),
        pr("Bedrooms",        session.bedrooms),
        pr("Preferred Areas", session.preferred_areas),
        pr("Market",          session.market_preference),
        pr("Purpose",         session.purchase_purpose),
    ]:
        if row:
            client_rows.append(row)

    ct = Table(client_rows, colWidths=[38*mm, INNER - 38*mm])
    ct.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0),  NAVY),
        ("BACKGROUND",    (0,1),(-1,-1), colors.HexColor("#F4F6F9")),
        ("SPAN",          (0,0),(-1,0)),
        ("LINEBELOW",     (0,0),(-1,0),  2, GOLD),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(-1,-1), 6),
        ("BOTTOMPADDING", (0,0),(-1,-1), 6),
        ("BOX",           (0,0),(-1,-1), 0.5, DBORD),
    ]))
    story.append(ct)
    story.append(Spacer(1, 7*mm))

    # ── Section heading ───────────────────────────────────────────────────────
    story.append(Table([[
        _p('<font color="#0A2342" size="12"><b>Curated Properties</b></font>', normal),
        _p(f'<font color="#94A3B8" size="9">{len(picks)} options selected by your agent</font>',
           st(alignment=TA_RIGHT)),
    ]], colWidths=[INNER * 0.6, INNER * 0.4]))
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD))
    story.append(Spacer(1, 5*mm))

    # ── Property cards ────────────────────────────────────────────────────────
    GAP = 4   # gap between spec cells (pts)
    SPEC_W = (INFO_CW - GAP) / 2

    for i, pick in enumerate(picks):
        title_str = pick.title or f"Property {i+1}"
        price_str = _fmt_price(pick.price_aed)

        # Collect all image URLs (main + extras)
        all_imgs = []
        if pick.image_url:
            all_imgs.append(pick.image_url)
        try:
            extras = _json.loads(getattr(pick, "images_json", None) or "[]")
            all_imgs.extend([u for u in (extras or []) if u])
        except Exception:
            pass
        all_imgs     = all_imgs[:5]
        main_url     = all_imgs[0] if all_imgs else None
        gallery_urls = all_imgs[1:]

        # ── Left info panel ───────────────────────────────────────────────
        left = []

        # Small #N badge pill
        badge = Table(
            [[_p(f'<font color="white" size="9"><b>  #{i+1}  </b></font>', normal)]],
            colWidths=[18*mm],
        )
        badge.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), NAVY),
            ("TOPPADDING",    (0,0),(-1,-1), 4),
            ("BOTTOMPADDING", (0,0),(-1,-1), 4),
            ("LEFTPADDING",   (0,0),(-1,-1), 0),
            ("RIGHTPADDING",  (0,0),(-1,-1), 0),
        ]))
        left.append(badge)
        left.append(Spacer(1, 8))

        # Title
        left.append(_p(
            f'<font color="#0A2342" size="14"><b>{title_str}</b></font>',
            st(spaceAfter=3, leading=18),
        ))

        # Developer
        dev = getattr(pick, "developer", None) or ""
        if dev:
            left.append(_p(
                f'<font color="#94A3B8" size="9">{dev}</font>',
                st(spaceAfter=10),
            ))
        else:
            left.append(Spacer(1, 8))

        # Price
        if price_str:
            left.append(_p(
                f'<font color="#C9A84C" size="20"><b>{price_str}</b></font>',
                st(spaceAfter=12),
            ))

        # 2×2 spec grid
        spec_items = []
        if pick.bedrooms:      spec_items.append((pick.bedrooms,           "Bedrooms"))
        if pick.bathrooms:     spec_items.append((pick.bathrooms,          "Bathrooms"))
        if pick.size_sqft:     spec_items.append((f"{int(pick.size_sqft):,}", "sqft"))
        if pick.property_type: spec_items.append((pick.property_type,      "Type"))

        if spec_items:
            spec_rows = []
            for si in range(0, min(len(spec_items), 4), 2):
                c0 = _spec_cell(spec_items[si][0],   spec_items[si][1],   SPEC_W, normal)
                c1 = _spec_cell(spec_items[si+1][0], spec_items[si+1][1], SPEC_W, normal) \
                     if si+1 < len(spec_items) else ""
                spec_rows.append([c0, "", c1])

            sg = Table(spec_rows, colWidths=[SPEC_W, GAP, SPEC_W])
            sg.setStyle(TableStyle([
                ("LEFTPADDING",   (0,0),(-1,-1), 0),
                ("RIGHTPADDING",  (0,0),(-1,-1), 0),
                ("TOPPADDING",    (0,0),(-1,-1), 0),
                ("BOTTOMPADDING", (0,0),(-1,-1), GAP),
            ]))
            left.append(sg)
            left.append(Spacer(1, 10))

        # Info rows — Location / Handover / Payment Plan
        lbl_w  = 21 * mm
        val_w  = INFO_CW - lbl_w
        irows  = []

        if pick.area:
            irows.append(("Location",     pick.area))
        completion = getattr(pick, "completion_date", None) or ""
        if completion:
            irows.append(("Handover",     completion))
        payment = getattr(pick, "payment_plan", None) or ""
        if payment:
            irows.append(("Payment Plan", payment))

        if irows:
            it = Table(
                [[_p(f'<font color="#94A3B8" size="9">{lb}</font>', normal),
                  _p(f'<font color="#1E293B" size="9"><b>{vl}</b></font>', normal)]
                 for lb, vl in irows],
                colWidths=[lbl_w, val_w],
            )
            it.setStyle(TableStyle([
                ("LEFTPADDING",   (0,0),(-1,-1), 0),
                ("RIGHTPADDING",  (0,0),(-1,-1), 0),
                ("TOPPADDING",    (0,0),(-1,-1), 4),
                ("BOTTOMPADDING", (0,0),(-1,-1), 4),
                ("LINEBELOW",     (0,0),(-1,-2), 0.5, colors.HexColor("#F1F5F9")),
                ("VALIGN",        (0,0),(-1,-1), "TOP"),
            ]))
            left.append(it)
            left.append(Spacer(1, 10))

        # Highlights (gold left border, yellow bg)
        highlights = getattr(pick, "highlights", None) or ""
        if highlights:
            hl = Table(
                [[_p(f'<font color="#0A2342" size="9">{highlights}</font>', normal)]],
                colWidths=[INFO_CW],
            )
            hl.setStyle(TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), YGOLD),
                ("LINEBEFORE",    (0,0),(0,-1),  3, GOLD),
                ("LEFTPADDING",   (0,0),(-1,-1), 10),
                ("RIGHTPADDING",  (0,0),(-1,-1), 10),
                ("TOPPADDING",    (0,0),(-1,-1), 8),
                ("BOTTOMPADDING", (0,0),(-1,-1), 8),
            ]))
            left.append(hl)
            left.append(Spacer(1, 8))

        # Agent notes
        if pick.notes:
            left.append(_p(
                f'<font color="#64748B" size="8"><i>{pick.notes}</i></font>',
                st(spaceAfter=0),
            ))

        # ── Main right image ──────────────────────────────────────────────
        main_img = _fetch_rl_image(main_url, IMG_W / mm, 112, cover=True) if main_url else None

        # ── Top section table: [info | image] ─────────────────────────────
        if main_img:
            top = Table([[left, main_img]], colWidths=[INFO_W, IMG_W])
            top.setStyle(TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), WHITE),
                ("VALIGN",        (0,0),(-1,-1), "TOP"),
                # info panel padding
                ("LEFTPADDING",   (0,0),(0,-1),  INFO_PL),
                ("RIGHTPADDING",  (0,0),(0,-1),  INFO_PR),
                ("TOPPADDING",    (0,0),(0,-1),  INFO_PT),
                ("BOTTOMPADDING", (0,0),(0,-1),  INFO_PB),
                # image cell — no padding (fills edge to edge)
                ("LEFTPADDING",   (1,0),(1,-1),  0),
                ("RIGHTPADDING",  (1,0),(1,-1),  0),
                ("TOPPADDING",    (1,0),(1,-1),  0),
                ("BOTTOMPADDING", (1,0),(1,-1),  0),
                # gold vertical separator
                ("LINEAFTER",     (0,0),(0,-1),  2.5, GOLD),
            ]))
        else:
            top = Table([[left]], colWidths=[INNER])
            top.setStyle(TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), WHITE),
                ("VALIGN",        (0,0),(-1,-1), "TOP"),
                ("LEFTPADDING",   (0,0),(-1,-1), INFO_PL),
                ("RIGHTPADDING",  (0,0),(-1,-1), INFO_PR),
                ("TOPPADDING",    (0,0),(-1,-1), INFO_PT),
                ("BOTTOMPADDING", (0,0),(-1,-1), INFO_PB),
            ]))

        # ── Gallery section (extra images, all large) ─────────────────────
        gallery_tbl = None
        if gallery_urls:
            n     = len(gallery_urls)
            gcols = min(n, GALLERY_MAX_COLS)
            gw    = INNER / gcols          # pts per gallery column
            gh_mm = GALLERY_H_MM

            gal_rows = []
            for gi in range(0, n, gcols):
                row = []
                for gj in range(gcols):
                    idx = gi + gj
                    if idx < n:
                        gimg = _fetch_rl_image(
                            gallery_urls[idx], gw / mm, gh_mm, cover=True
                        )
                        row.append(gimg if gimg else "")
                    else:
                        row.append("")
                gal_rows.append(row)

            gallery_tbl = Table(gal_rows, colWidths=[gw] * gcols)
            gallery_tbl.setStyle(TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), WHITE),
                # gold top separator
                ("LINEABOVE",     (0,0),(-1,0),  2.5, GOLD),
                # thin white lines between gallery images (simulate gap)
                ("LINEAFTER",     (0,0),(-2,-1), 2,   WHITE),
                ("LINEBELOW",     (0,0),(-1,-2), 2,   WHITE),
                ("LEFTPADDING",   (0,0),(-1,-1), 0),
                ("RIGHTPADDING",  (0,0),(-1,-1), 0),
                ("TOPPADDING",    (0,0),(-1,-1), 0),
                ("BOTTOMPADDING", (0,0),(-1,-1), 0),
                ("ALIGN",         (0,0),(-1,-1), "CENTER"),
                ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
            ]))

        # ── Outer card (BOX border) ───────────────────────────────────────
        card_rows = [[top]]
        if gallery_tbl:
            card_rows.append([gallery_tbl])

        card = Table(card_rows, colWidths=[INNER])
        card.setStyle(TableStyle([
            ("BOX",           (0,0),(-1,-1), 0.5, DBORD),
            ("LEFTPADDING",   (0,0),(-1,-1), 0),
            ("RIGHTPADDING",  (0,0),(-1,-1), 0),
            ("TOPPADDING",    (0,0),(-1,-1), 0),
            ("BOTTOMPADDING", (0,0),(-1,-1), 0),
        ]))

        story.append(KeepTogether([card, Spacer(1, 7*mm)]))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=DBORD))
    story.append(Spacer(1, 3*mm))
    story.append(_p(
        f'<font color="#94A3B8" size="7">This report was prepared by Penta System on '
        f'{datetime.utcnow().strftime("%d %B %Y")}. Property details are sourced from '
        f'publicly available listings and are subject to change. Not a contractual offer.</font>',
        st(alignment=TA_CENTER),
    ))

    doc.build(story)
    return buf.getvalue()
