from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import date

NAVY = colors.HexColor('#0A2342')
GOLD = colors.HexColor('#C9A84C')
LIGHT = colors.HexColor('#F8FAFC')
GRAY = colors.HexColor('#6B7280')
BORDER = colors.HexColor('#E2E8F0')

doc = SimpleDocTemplate(
    "Penta_CRM_Documentation.pdf",
    pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
    title="Penta CRM — System Documentation",
    author="Penta Real Estate",
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle('Title', fontSize=28, fontName='Helvetica-Bold', textColor=NAVY, spaceAfter=6, alignment=TA_CENTER)
subtitle_style = ParagraphStyle('Subtitle', fontSize=13, fontName='Helvetica', textColor=GRAY, spaceAfter=4, alignment=TA_CENTER)
h1_style = ParagraphStyle('H1', fontSize=18, fontName='Helvetica-Bold', textColor=NAVY, spaceBefore=20, spaceAfter=8, borderPad=4)
h2_style = ParagraphStyle('H2', fontSize=13, fontName='Helvetica-Bold', textColor=NAVY, spaceBefore=14, spaceAfter=6)
body_style = ParagraphStyle('Body', fontSize=10, fontName='Helvetica', textColor=colors.HexColor('#374151'), spaceAfter=5, leading=16)
bullet_style = ParagraphStyle('Bullet', fontSize=10, fontName='Helvetica', textColor=colors.HexColor('#374151'), spaceAfter=4, leading=15, leftIndent=16, bulletIndent=4)
label_style = ParagraphStyle('Label', fontSize=9, fontName='Helvetica-Bold', textColor=GOLD, spaceAfter=2, spaceBefore=4)
code_style = ParagraphStyle('Code', fontSize=9, fontName='Courier', textColor=NAVY, spaceAfter=4, backColor=LIGHT, leftIndent=10, rightIndent=10, leading=14)

def h1(text): return Paragraph(text, h1_style)
def h2(text): return Paragraph(text, h2_style)
def body(text): return Paragraph(text, body_style)
def bullet(text): return Paragraph(f"• {text}", bullet_style)
def label(text): return Paragraph(text.upper(), label_style)
def code(text): return Paragraph(text, code_style)
def space(n=8): return Spacer(1, n)
def divider(): return HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=10, spaceBefore=4)

def section_header(text):
    return Table(
        [[Paragraph(text, ParagraphStyle('SH', fontSize=16, fontName='Helvetica-Bold', textColor=colors.white, spaceAfter=0))]],
        colWidths=['100%'],
        style=TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), NAVY),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING', (0,0), (-1,-1), 14),
            ('RIGHTPADDING', (0,0), (-1,-1), 14),
            ('ROUNDEDCORNERS', [6]),
        ])
    )

def info_table(rows):
    data = [[Paragraph(k, ParagraphStyle('K', fontSize=9, fontName='Helvetica-Bold', textColor=NAVY)),
             Paragraph(v, ParagraphStyle('V', fontSize=9, fontName='Helvetica', textColor=colors.HexColor('#374151')))]
            for k, v in rows]
    return Table(data, colWidths=[4.5*cm, 12*cm], style=TableStyle([
        ('BACKGROUND', (0,0), (0,-1), LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))

def feature_table(headers, rows, col_widths=None):
    data = [[Paragraph(h, ParagraphStyle('TH', fontSize=9, fontName='Helvetica-Bold', textColor=colors.white))
             for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), ParagraphStyle('TD', fontSize=9, fontName='Helvetica', textColor=colors.HexColor('#374151')))
                     for c in row])
    cw = col_widths or [16.5*cm / len(headers)] * len(headers)
    return Table(data, colWidths=cw, style=TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT]),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))

story = []

# ── COVER PAGE ──────────────────────────────────────────────────────────────
story += [
    space(60),
    Paragraph("PENTA CRM", ParagraphStyle('Cover', fontSize=36, fontName='Helvetica-Bold', textColor=NAVY, alignment=TA_CENTER)),
    space(8),
    Paragraph("Real Estate", ParagraphStyle('CoverSub', fontSize=14, fontName='Helvetica', textColor=GOLD, alignment=TA_CENTER, letterSpacing=4)),
    space(24),
    HRFlowable(width="60%", thickness=2, color=GOLD, hAlign='CENTER'),
    space(24),
    Paragraph("System Documentation", ParagraphStyle('CoverTitle', fontSize=20, fontName='Helvetica-Bold', textColor=NAVY, alignment=TA_CENTER)),
    space(8),
    Paragraph("Complete guide to all modules, features, public forms, and system architecture", subtitle_style),
    space(60),
    Paragraph(f"Version 1.0  ·  {date.today().strftime('%B %Y')}", ParagraphStyle('Date', fontSize=10, fontName='Helvetica', textColor=GRAY, alignment=TA_CENTER)),
    Paragraph("Confidential — Internal Use Only", ParagraphStyle('Conf', fontSize=9, fontName='Helvetica', textColor=GRAY, alignment=TA_CENTER)),
    PageBreak(),
]

# ── TABLE OF CONTENTS ────────────────────────────────────────────────────────
story += [
    Paragraph("Table of Contents", ParagraphStyle('TOCTitle', fontSize=20, fontName='Helvetica-Bold', textColor=NAVY, spaceAfter=20)),
    divider(),
]
toc_items = [
    ("1.", "System Overview", "3"),
    ("2.", "Architecture & Technology Stack", "3"),
    ("3.", "User Roles & Access", "4"),
    ("4.", "Live URLs & Links", "4"),
    ("5.", "CRM Module", "5"),
    ("6.", "Partnerships Module", "6"),
    ("7.", "Agents Dashboard Module", "7"),
    ("8.", "AI Model Module", "8"),
    ("9.", "Public Forms", "9"),
    ("10.", "Referral Partner System", "10"),
    ("11.", "WhatsApp & Webhook Integrations", "11"),
    ("12.", "Database & Backend", "11"),
]
toc_data = [[
    Paragraph(n, ParagraphStyle('TN', fontSize=10, fontName='Helvetica-Bold', textColor=GOLD)),
    Paragraph(t, ParagraphStyle('TT', fontSize=10, fontName='Helvetica', textColor=NAVY)),
    Paragraph(p, ParagraphStyle('TP', fontSize=10, fontName='Helvetica', textColor=GRAY, alignment=TA_LEFT)),
] for n, t, p in toc_items]
story.append(Table(toc_data, colWidths=[1.2*cm, 13.8*cm, 1.5*cm], style=TableStyle([
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ('LINEBELOW', (0,0), (-1,-1), 0.5, BORDER),
    ('LEFTPADDING', (0,0), (-1,-1), 4),
])))
story += [PageBreak()]

# ── 1. SYSTEM OVERVIEW ───────────────────────────────────────────────────────
story += [
    section_header("1. System Overview"),
    space(10),
    body("Penta CRM is a full-stack real estate management platform built specifically for Penta Real Estate (Dubai). "
         "It manages the complete client and partner lifecycle — from lead capture and follow-up to AI-driven client matching "
         "and partner referral management."),
    space(6),
    body("The system is divided into five main modules, each accessible via a dedicated section of the platform:"),
    space(6),
    feature_table(
        ["Module", "Who Uses It", "Purpose"],
        [
            ["CRM", "Admin, Agents", "Lead management, pipeline tracking, client reports"],
            ["Partnerships", "Admin only", "Partner outreach, WhatsApp campaigns, commissions"],
            ["Agents Dashboard", "All agents", "Property vault, events, videos, client & referral reports"],
            ["AI Model", "Admin only", "Scraping, property matching, AI intake processing"],
            ["Public Forms", "External clients & partners", "Client intake form + Referral partner application form"],
        ],
        [4.5*cm, 4*cm, 8*cm]
    ),
    space(16),

    section_header("2. Architecture & Technology Stack"),
    space(10),
    h2("Frontend"),
    info_table([
        ("Framework", "React 18 + Vite"),
        ("Styling", "Inline styles (no CSS framework)"),
        ("Routing", "React Router v6"),
        ("HTTP Client", "Axios (api.js) + native fetch for public forms"),
        ("Charts", "Recharts"),
        ("Deployment", "Netlify Drop (manual drag & drop of /dist folder)"),
        ("Live URL", "https://dashboard.pentadxb.ae"),
    ]),
    space(10),
    h2("Backend"),
    info_table([
        ("Framework", "FastAPI (Python)"),
        ("Database ORM", "SQLAlchemy 2.0"),
        ("Database", "PostgreSQL (Railway managed)"),
        ("Auth", "JWT tokens via python-jose"),
        ("AI / LLM", "Anthropic Claude API"),
        ("File processing", "ReportLab (PDF), openpyxl (Excel)"),
        ("Deployment", "Railway (auto-deploy from GitHub push)"),
        ("Live API URL", "https://penta-crm-production.up.railway.app"),
    ]),
    space(10),
    h2("Key Integrations"),
    feature_table(
        ["Integration", "Purpose"],
        [
            ["Meta WhatsApp Business API", "Send outbound WhatsApp messages to partners"],
            ["Meta Lead Ads Webhook", "Auto-capture leads from Facebook/Instagram ad forms"],
            ["Cloudinary", "Property image storage and CDN delivery"],
            ["Anthropic Claude API", "AI client matching, intake analysis, report generation"],
            ["SMTP (Hostinger)", "Email notifications via partnerships@pentadxb.com"],
            ["Zapier Webhook", "Receive leads from external sources via Zapier"],
        ],
        [6*cm, 10.5*cm]
    ),
    PageBreak(),
]

# ── 3. USER ROLES ────────────────────────────────────────────────────────────
story += [
    section_header("3. User Roles & Access"),
    space(10),
    feature_table(
        ["Role", "Access Level", "Can See"],
        [
            ["admin", "Full access", "All modules: CRM, Partnerships, Agents, AI Model, all data"],
            ["broker / agent", "Restricted", "CRM (own leads), Agents Dashboard (assigned data only)"],
            ["team_leader", "Mid-level", "CRM (own + team leads), can assign leads to team members"],
        ],
        [3*cm, 3.5*cm, 10*cm]
    ),
    space(10),
    body("Admin credentials are seeded on first startup. Agents and team leaders are created via the Users page (admin only)."),
    space(16),

    section_header("4. Live URLs & Links"),
    space(10),
    h2("Internal System (Login Required)"),
    info_table([
        ("Main Dashboard", "https://dashboard.pentadxb.ae"),
        ("CRM Module", "https://dashboard.pentadxb.ae/crm"),
        ("Partnerships", "https://dashboard.pentadxb.ae/partnerships"),
        ("Agents Dashboard", "https://dashboard.pentadxb.ae/agents"),
        ("AI Model", "https://dashboard.pentadxb.ae/ai"),
        ("Login Page", "https://dashboard.pentadxb.ae/login"),
    ]),
    space(10),
    h2("Public Forms (No Login Required — Share These Links)"),
    info_table([
        ("Client Intake Form", "https://dashboard.pentadxb.ae/intake"),
        ("Referral Partner Application", "https://dashboard.pentadxb.ae/referral"),
    ]),
    space(10),
    h2("Backend API"),
    info_table([
        ("API Base URL", "https://penta-crm-production.up.railway.app"),
        ("API Docs", "https://penta-crm-production.up.railway.app/docs"),
    ]),
    PageBreak(),
]

# ── 5. CRM MODULE ────────────────────────────────────────────────────────────
story += [
    section_header("5. CRM Module"),
    space(10),
    body("The CRM module is the core lead management system. Accessible at /crm after login."),
    space(8),
    h2("Pages & Features"),
    feature_table(
        ["Page", "Path", "Features"],
        [
            ["Dashboard", "/crm", "KPI cards (total leads, new leads, meetings, deals), leads-by-stage bar chart, recent activity feed"],
            ["Pipeline", "/crm/kanban", "Drag-and-drop Kanban board with all lead stages, quick status updates"],
            ["Leads", "/crm/leads", "Full lead list with search, filter by stage, add lead, bulk import from Excel, stage color badges"],
            ["Lead Detail", "/crm/leads/:id", "Full lead profile, activity log, notes, stage changes, WhatsApp link"],
            ["Client Reports", "/crm/client-reports", "AI-generated client intake reports, assign to agents, view full brief"],
            ["Referral Partners", "/crm/referral-partners", "Partner applications from the public form, assign to agents, update status"],
            ["Customers", "/crm/customers", "Closed-deal customers (admin only)"],
            ["Users", "/crm/users", "Create and manage agent accounts (admin only)"],
        ],
        [3.2*cm, 4*cm, 9.3*cm]
    ),
    space(10),
    h2("Lead Stages"),
    feature_table(
        ["Stage", "Color", "Meaning"],
        [
            ["New Lead", "Indigo", "Just captured, not yet contacted"],
            ["Follow Up", "Amber", "Requires follow-up call"],
            ["No Answer", "Slate", "Called but no response"],
            ["Pre Meeting", "Purple", "Meeting scheduled"],
            ["Meeting Done", "Cyan", "Meeting completed, evaluating"],
            ["Deal Closed", "Green", "Successful transaction"],
            ["Not Interested", "Orange", "Client declined"],
            ["Wrong Number", "Pink", "Invalid contact"],
            ["Junk", "Red", "Spam or invalid lead"],
        ],
        [3.5*cm, 2.5*cm, 10.5*cm]
    ),
    space(10),
    h2("Lead Sources"),
    body("When adding a lead manually, choose from: Meta Ads, Website, WhatsApp, Referral, Property Finder, Bayut, Walk-in, Other — "
         "or select '＋ Add new source...' to type any custom source name."),
    PageBreak(),
]

# ── 6. PARTNERSHIPS MODULE ───────────────────────────────────────────────────
story += [
    section_header("6. Partnerships Module"),
    space(10),
    body("Admin-only module for managing B2B referral partners and outreach campaigns. Accessible at /partnerships."),
    space(8),
    h2("Pages & Features"),
    feature_table(
        ["Page", "Path", "Features"],
        [
            ["Dashboard", "/partnerships", "Partner stats, outreach summary, commission totals"],
            ["Partners", "/partnerships/partners", "Full partner database, add/edit/delete, filter by type and status"],
            ["Outreach", "/partnerships/outreach", "Send bulk WhatsApp messages, daily limit (50/day), 5-day cooldown"],
            ["Templates", "/partnerships/templates", "Create/manage WhatsApp message templates, submit to Meta for approval"],
            ["Replies", "/partnerships/replies", "Incoming WhatsApp replies with AI-generated response suggestions"],
            ["Commissions", "/partnerships/commissions", "Track commissions owed and paid per partner"],
            ["Applications", "/partnerships/applications", "Referral applications from the public /referral form (see Section 10)"],
        ],
        [3.2*cm, 4.5*cm, 8.8*cm]
    ),
    space(10),
    h2("WhatsApp Outreach Rules"),
    feature_table(
        ["Rule", "Value"],
        [
            ["Daily send limit", "50 messages per day"],
            ["Cooldown between messages to same partner", "5 days"],
            ["Blocked statuses", "Not Interested, Inactive"],
            ["Template approval", "Templates must be submitted and approved by Meta before use in bulk campaigns"],
        ],
        [6*cm, 10.5*cm]
    ),
    PageBreak(),
]

# ── 7. AGENTS DASHBOARD ──────────────────────────────────────────────────────
story += [
    section_header("7. Agents Dashboard Module"),
    space(10),
    body("Available to all logged-in users. Agents see only their assigned data. Accessible at /agents."),
    space(8),
    h2("Pages & Features"),
    feature_table(
        ["Page", "Path", "Features"],
        [
            ["Dashboard", "/agents", "Agent-specific stats: assigned leads, active clients, properties"],
            ["Client Reports", "/agents/client-reports", "AI intake submissions assigned to this agent, full client brief view"],
            ["Referral Partners", "/agents/referral-partners", "Referral applications assigned to this agent, status updates"],
            ["Property Vault", "/agents/properties", "Browse all listed properties with filters"],
            ["List Property", "/agents/list-property", "Submit a new property listing with images (Cloudinary upload)"],
            ["Promotions", "/agents/promotions", "Marketing materials and promotional assets"],
            ["Events", "/agents/events", "Company events and schedule"],
            ["Video Resources", "/agents/videos", "Training videos and resources"],
        ],
        [3.2*cm, 4.5*cm, 8.8*cm]
    ),
    space(10),
    h2("Data Visibility Rules"),
    bullet("Admin sees all client reports and referral applications across all agents."),
    bullet("Agents see only records assigned to them by the admin."),
    bullet("Counter badge shows total count — full total for admin, assigned-only count for agents."),
    PageBreak(),
]

# ── 8. AI MODEL MODULE ───────────────────────────────────────────────────────
story += [
    section_header("8. AI Model Module"),
    space(10),
    body("Admin-only module for AI-powered property matching, data scraping, and client report generation. Accessible at /ai."),
    space(8),
    h2("Pages & Features"),
    feature_table(
        ["Page", "Path", "Features"],
        [
            ["Dashboard", "/ai", "AI model overview and system status"],
            ["Off-Plan Listings", "/ai/offplan", "Browse and manage scraped off-plan property database"],
            ["Secondary Listings", "/ai/secondary", "Browse and manage scraped secondary market listings"],
            ["Client Matcher", "/ai/match", "AI matching engine — finds best property options for a client based on their intake"],
            ["Intake AI", "/ai/intake", "Review and process client intake submissions with AI analysis"],
            ["Scrape Control", "/ai/scrape", "Trigger property data scraping from Bayut and Reelly"],
        ],
        [3.5*cm, 4*cm, 9*cm]
    ),
    space(10),
    h2("How the AI Matching Works"),
    body("When a client submits the intake form, their preferences (budget, areas, bedrooms, features, timeline, purpose) "
         "are stored in the database. The admin can then run the AI Matcher which:"),
    bullet("Pulls the client's full brief from the intake submission"),
    bullet("Searches the scraped property database for matching listings"),
    bullet("Uses Claude AI to score and rank the best matches"),
    bullet("Generates a PDF report with the top recommendations"),
    bullet("The agent receives the report and shares it with the client"),
    PageBreak(),
]

# ── 9. PUBLIC FORMS ──────────────────────────────────────────────────────────
story += [
    section_header("9. Public Forms — Client Intake"),
    space(10),
    body("The client intake form is a public, shareable link — no login required. Share it with potential buyers/investors "
         "to capture their full property requirements."),
    space(6),
    info_table([
        ("URL", "https://dashboard.pentadxb.ae/intake"),
        ("Languages", "English and Arabic (full RTL support, Cairo font)"),
        ("Steps", "12 steps: Welcome → Purpose → Property Type → Bedrooms → Areas → Market → Budget → Payment → Features → Timeline → Notes → Contact → Review"),
        ("Submission", "Data saved to backend automatically on submission"),
        ("After submission", "Shows animated thank-you screen with AI scanning message"),
    ]),
    space(10),
    h2("Form Steps Detail"),
    feature_table(
        ["Step", "Fields Collected"],
        [
            ["Welcome", "Language selection (English / Arabic)"],
            ["Purpose", "Buy to live, buy to invest, or rent"],
            ["Property Type", "Apartment, Villa, Townhouse, Penthouse, Studio, etc. (multi-select)"],
            ["Bedrooms", "Studio, 1BR, 2BR, 3BR, 4BR, 5BR+"],
            ["Areas", "Dubai areas of interest (multi-select) + custom area input"],
            ["Market", "Off-plan, ready (secondary), or both"],
            ["Budget", "Min/max budget range slider (AED)"],
            ["Payment", "Cash, mortgage, or flexible — plus mortgage pre-approval details"],
            ["Features", "Pool, gym, parking, view, garden, smart home, etc. + custom features"],
            ["Timeline", "Immediate, 3 months, 6 months, 1 year, flexible"],
            ["Notes", "Viewed properties? Working with other brokers? Additional notes"],
            ["Contact", "Full name, WhatsApp, email, nationality, currently in Dubai?"],
            ["Review", "Summary of all answers before final submission"],
        ],
        [3.5*cm, 13*cm]
    ),
    space(10),
    body("After submission, the admin sees the client report in CRM → Client Reports and can assign it to an agent. "
         "The agent then sees it in their Agents Dashboard → Client Reports tab."),
    PageBreak(),
]

# ── 10. REFERRAL SYSTEM ──────────────────────────────────────────────────────
story += [
    section_header("10. Referral Partner System"),
    space(10),
    body("A public application form for people who want to join the Penta Real Estate referral network. "
         "Share the link during campaigns or networking events."),
    space(6),
    info_table([
        ("URL", "https://dashboard.pentadxb.ae/referral"),
        ("Languages", "English and Arabic (full RTL support)"),
        ("Steps", "3 steps: Welcome → Personal Info → Agreement → Thank You"),
        ("Submission", "Saved as a Referral Application in the backend"),
        ("Admin view", "Partnerships → Applications (see and manage all applications)"),
        ("Agent view", "Agents Dashboard → Referral Partners (assigned applications only)"),
    ]),
    space(10),
    h2("Form Fields"),
    feature_table(
        ["Field", "Required", "Notes"],
        [
            ["Full Name", "Yes", "Applicant's full name"],
            ["WhatsApp Number", "Yes", "Primary contact number"],
            ["Email Address", "No", "Optional email"],
            ["Job / Profession", "No", "e.g. Broker, Consultant, Business Owner"],
            ["Nationality", "No", "Selected from comprehensive dropdown"],
            ["Agreement Checkbox", "Yes", "Must agree to 4 referral terms before submitting"],
        ],
        [4*cm, 2.5*cm, 10*cm]
    ),
    space(10),
    h2("Application Status Progression"),
    feature_table(
        ["Status", "Meaning"],
        [
            ["Interested", "Just submitted — initial stage"],
            ["Registered", "Admin has reviewed and registered them in the system"],
            ["Signed Agreement", "Partnership agreement signed"],
            ["Start Referring", "Active partner, actively sending referrals"],
        ],
        [4.5*cm, 12*cm]
    ),
    space(10),
    h2("Assignment Flow"),
    bullet("New application comes in → appears in Partnerships → Applications with status 'Interested'"),
    bullet("Admin reviews, updates status, and assigns to an agent"),
    bullet("Assigned agent sees the application in Agents Dashboard → Referral Partners"),
    bullet("Agent can update status as the relationship progresses"),
    PageBreak(),
]

# ── 11. INTEGRATIONS ─────────────────────────────────────────────────────────
story += [
    section_header("11. WhatsApp & Webhook Integrations"),
    space(10),
    h2("WhatsApp Business API (Meta)"),
    body("Connected to Meta's WhatsApp Business API for outbound partner outreach."),
    bullet("Send text messages or approved templates to partners"),
    bullet("Daily limit: 50 messages, 5-day cooldown per contact"),
    bullet("Incoming replies are captured and shown with AI suggestions"),
    bullet("Webhook endpoint: POST /api/whatsapp/webhook"),
    space(8),
    h2("Meta Lead Ads Webhook"),
    body("Automatically captures leads from Facebook and Instagram Lead Ad forms."),
    bullet("Webhook endpoint: POST /api/webhook/meta-leads"),
    bullet("Fetches full lead data from Meta Graph API"),
    bullet("Creates lead record automatically in CRM"),
    bullet("Verify token: penta-meta-leads-2024"),
    space(8),
    h2("Zapier Webhook"),
    body("Receive leads from any external source via Zapier."),
    bullet("Endpoint: POST /api/webhook/zapier"),
    bullet("Requires header: X-Webhook-Secret"),
    bullet("Accepts: full_name, phone, email, source, budget, property_type, preferred_area, notes"),
    space(16),

    section_header("12. Database & Backend"),
    space(10),
    h2("Database (PostgreSQL on Railway)"),
    body("All data is stored in a persistent PostgreSQL database managed by Railway. "
         "Tables are auto-created on startup via SQLAlchemy's create_all()."),
    space(6),
    feature_table(
        ["Table", "Stores"],
        [
            ["users", "Admin, agent, and team leader accounts"],
            ["leads", "All CRM leads with stage, source, assignment"],
            ["activities", "Lead activity log (calls, notes, stage changes)"],
            ["partners", "B2B referral partners for outreach"],
            ["referral_applications", "Public referral form submissions"],
            ["client_intakes", "Public client intake form submissions"],
            ["agent_property_picks", "Property listings submitted by agents"],
            ["outreach_messages", "WhatsApp messages sent to partners"],
            ["incoming_replies", "WhatsApp replies received from partners"],
            ["whatsapp_templates", "Message templates for WhatsApp campaigns"],
            ["commissions", "Commission records per partner per deal"],
            ["customers", "Closed-deal customer records"],
            ["notifications", "In-app notifications for agents"],
        ],
        [5*cm, 11.5*cm]
    ),
    space(10),
    h2("Deployment"),
    info_table([
        ("Backend deploy", "Push to GitHub → Railway auto-deploys within ~2 minutes"),
        ("Frontend deploy", "Run 'npm run build' in /frontend → drag /dist folder to Netlify"),
        ("Environment vars", "Set in Railway dashboard (DATABASE_URL, API tokens, SMTP, etc.)"),
    ]),
    space(20),
    divider(),
    Paragraph("Penta Real Estate · Penta CRM Documentation · Confidential",
              ParagraphStyle('Footer', fontSize=9, fontName='Helvetica', textColor=GRAY, alignment=TA_CENTER)),
]

doc.build(story)
print("PDF generated: Penta_CRM_Documentation.pdf")
