from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.db import engine, Base
from backend.database import models
from backend.database.db import SessionLocal
from backend.services.auth_service import hash_password
from backend.api import auth, users, leads, webhook, notifications, dashboard, import_leads
import os

app = FastAPI(title="Pentad CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(leads.router)
app.include_router(webhook.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(import_leads.router)


def seed_admin():
    db = SessionLocal()
    try:
        # Update old default admin if it exists
        old = db.query(models.User).filter(models.User.email == "admin@pentadcrm.com").first()
        if old:
            old.full_name = "Yaso"
            old.email = "yaso@pentacrm.com"
            old.password_hash = hash_password("Yaso@123")
            db.commit()
            return
        # Create if no admin exists yet
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


@app.get("/")
def root():
    return {"status": "Pentad CRM API running"}
