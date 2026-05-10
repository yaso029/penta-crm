from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.db import engine, Base
from backend.database import models
from backend.database.db import SessionLocal
from backend.services.auth_service import hash_password
from backend.api import auth, users, leads, webhook, notifications, dashboard, import_leads, customers
from backend.services.sync_scheduler import start_scheduler, stop_scheduler
from backend.api import partners, whatsapp_routes, email_routes, commissions, partnerships_dashboard
from backend.api import agents_dashboard
from backend.api import ai_routes
from backend.api import client_reports
from backend.api import public_intake
from backend.api import public_referral
from backend.api import referral_applications
from backend.api import hr
import os

app = FastAPI(title="Penta CRM API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CRM routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(leads.router)
app.include_router(webhook.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(import_leads.router)
app.include_router(customers.router)

# Partnerships routes
app.include_router(partners.router)
app.include_router(whatsapp_routes.router)
app.include_router(email_routes.router)
app.include_router(commissions.router)
app.include_router(partnerships_dashboard.router)

# Agents Dashboard routes
app.include_router(agents_dashboard.router)

# AI Model routes (admin-only)
app.include_router(ai_routes.router)

# Client Reports — all agents
app.include_router(client_reports.router)

# Public intake — no auth (client-facing form)
app.include_router(public_intake.router)

# Referral applications — public form + authenticated management
app.include_router(public_referral.router)
app.include_router(referral_applications.router)

# HR module — admin only
app.include_router(hr.router)


def seed_admin():
    db = SessionLocal()
    try:
        old = db.query(models.User).filter(models.User.email == "admin@pentadcrm.com").first()
        if old:
            old.full_name = "Yaso"
            old.email = "yaso@pentacrm.com"
            old.password_hash = hash_password("Yaso@123")
            db.commit()
            return
        existing = db.query(models.User).filter(models.User.email == "yaso@pentacrm.com").first()
        if not existing:
            admin = models.User(
                full_name="Yaso",
                email="yaso@pentacrm.com",
                password_hash=hash_password("Yaso@123"),
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
        else:
            existing.password_hash = hash_password("Yaso@123")
            db.commit()
    finally:
        db.close()


def _run_migrations():
    from sqlalchemy import text
    new_cols = [
        ("developer",        "VARCHAR(200)"),
        ("completion_date",  "VARCHAR(100)"),
        ("payment_plan",     "TEXT"),
        ("highlights",       "TEXT"),
        ("images_json",      "TEXT"),
    ]
    intake_cols = [
        ("assigned_to", "INTEGER"),
    ]
    with engine.connect() as conn:
        for col, coltype in new_cols:
            try:
                conn.execute(text(
                    f"ALTER TABLE agent_property_picks ADD COLUMN IF NOT EXISTS {col} {coltype}"
                ))
            except Exception:
                pass
        for col, coltype in intake_cols:
            try:
                conn.execute(text(
                    f"ALTER TABLE client_intakes ADD COLUMN IF NOT EXISTS {col} {coltype}"
                ))
            except Exception:
                pass
        conn.commit()


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    seed_admin()
    start_scheduler()


@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()


@app.get("/")
def root():
    return {"status": "Penta CRM API running", "version": "2.0.0"}
