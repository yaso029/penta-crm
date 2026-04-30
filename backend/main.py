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
    finally:
        db.close()


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    seed_admin()
    start_scheduler()


@app.on_event("shutdown")
def shutdown():
    stop_scheduler()


@app.get("/")
def root():
    return {"status": "Penta CRM API running", "version": "2.0.0"}
