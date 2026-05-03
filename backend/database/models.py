from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(500), nullable=False)
    role = Column(String(20), nullable=False, default="broker")
    team_leader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    team_leader = relationship(
        "User", remote_side=[id], foreign_keys=[team_leader_id],
        back_populates="team_members"
    )
    team_members = relationship(
        "User", foreign_keys=[team_leader_id],
        back_populates="team_leader", overlaps="team_leader"
    )
    leads_assigned = relationship("Lead", foreign_keys="Lead.assigned_to", back_populates="assignee")
    leads_created = relationship("Lead", foreign_keys="Lead.created_by", back_populates="creator")
    notifications = relationship("Notification", back_populates="user")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    phone = Column(String(50))
    email = Column(String(200))
    source = Column(String(50), default="other")
    budget = Column(String(100), nullable=True)
    property_type = Column(String(50), nullable=True)
    preferred_area = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    stage = Column(String(50), default="new")
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="leads_assigned")
    creator = relationship("User", foreign_keys=[created_by], back_populates="leads_created")
    activities = relationship("Activity", back_populates="lead", cascade="all, delete-orphan")
    commissions = relationship("Commission", back_populates="lead")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    type = Column(String(30), default="note")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="activities")
    user = relationship("User", foreign_keys=[user_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False)
    lead_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(200), nullable=True)
    synced_to_meta = Column(Boolean, default=False)
    synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    synced_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    triggered_by = Column(String(20), default="auto")
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Partnership Models ───────────────────────────────────────────────────────

class Partner(Base):
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    whatsapp_number = Column(String(50), nullable=True)
    email = Column(String(200), nullable=True)
    company = Column(String(200), nullable=True)
    partner_type = Column(String(100), default="Other")
    status = Column(String(50), default="New")
    commission_rate = Column(Float, default=0.5)
    total_referrals = Column(Integer, default=0)
    total_deals_closed = Column(Integer, default=0)
    total_commission_earned = Column(Float, default=0.0)
    last_contacted_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("OutreachMessage", back_populates="partner", cascade="all, delete-orphan")
    replies = relationship("IncomingReply", back_populates="partner", cascade="all, delete-orphan")
    commissions = relationship("Commission", back_populates="partner")


class WhatsAppTemplate(Base):
    __tablename__ = "whatsapp_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), default="MARKETING")
    body = Column(Text, nullable=False)
    buttons = Column(JSON, nullable=True)
    meta_status = Column(String(50), default="pending")
    meta_template_id = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    subject = Column(String(500), nullable=False)
    body_html = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OutreachMessage(Base):
    __tablename__ = "outreach_messages"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)
    channel = Column(String(20), nullable=False)
    template_id = Column(Integer, nullable=True)
    message_body = Column(Text, nullable=True)
    subject = Column(String(500), nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="sent")
    message_id = Column(String(200), nullable=True)

    partner = relationship("Partner", back_populates="messages")


class IncomingReply(Base):
    __tablename__ = "incoming_replies"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True)
    channel = Column(String(20), default="whatsapp")
    message_body = Column(Text, nullable=False)
    from_number = Column(String(50), nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)
    ai_suggestion = Column(String(50), nullable=True)
    action_taken = Column(String(50), nullable=True)

    partner = relationship("Partner", back_populates="replies")


class Commission(Base):
    __tablename__ = "commissions"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    referred_client_name = Column(String(200), nullable=True)
    property_value = Column(Float, default=0.0)
    commission_rate = Column(Float, default=0.5)
    commission_amount = Column(Float, default=0.0)
    status = Column(String(20), default="pending")
    paid_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    partner = relationship("Partner", back_populates="commissions")
    lead = relationship("Lead", back_populates="commissions")


# ─── Agents Dashboard Models ──────────────────────────────────────────────────

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    property_type = Column(String(50), nullable=False)
    transaction_type = Column(String(50), nullable=False)
    location = Column(String(200), nullable=False)
    price = Column(Float, nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    area_sqft = Column(Float, nullable=True)
    floor = Column(Integer, nullable=True)
    amenities = Column(JSON, nullable=True)
    images = Column(JSON, nullable=True)
    status = Column(String(30), default="available")
    developer = Column(String(200), nullable=True)
    project_name = Column(String(200), nullable=True)
    handover_date = Column(String(100), nullable=True)
    payment_plan = Column(Text, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    uploader = relationship("User", foreign_keys=[uploaded_by])


class AgentEvent(Base):
    __tablename__ = "agent_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String(50), default="other")
    event_date = Column(DateTime, nullable=True)
    location = Column(String(200), nullable=True)
    image_url = Column(String(500), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", foreign_keys=[created_by])


class AgentVideo(Base):
    __tablename__ = "agent_videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    youtube_url = Column(String(500), nullable=False)
    category = Column(String(50), default="other")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", foreign_keys=[created_by])


class AgentPromotion(Base):
    __tablename__ = "agent_promotions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    developer = Column(String(200), nullable=True)
    discount_percent = Column(Float, nullable=True)
    promo_details = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    image_url = Column(String(500), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", foreign_keys=[created_by])


# ─── AI Model Models ──────────────────────────────────────────────────────────

class SecondaryListing(Base):
    __tablename__ = "secondary_listings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    listing_id = Column(String(100), unique=True, nullable=False, index=True)
    source = Column(String(50), nullable=False)
    listing_url = Column(Text, nullable=False)
    title = Column(Text)
    price_aed = Column(Float)
    size_sqft = Column(Float)
    bedrooms = Column(String(20))
    bathrooms = Column(String(20))
    property_type = Column(String(50))
    furnishing_status = Column(String(50))
    floor_number = Column(String(20))
    building_name = Column(String(200))
    community = Column(String(200))
    area = Column(String(200))
    emirate = Column(String(100), default="Dubai")
    agent_name = Column(String(200))
    agency_name = Column(String(200))
    days_on_market = Column(Integer)
    scrape_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True)


class OffPlanListing(Base):
    __tablename__ = "offplan_listings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    listing_url = Column(Text, nullable=False, unique=True)
    source = Column(String(50), default="reelly")
    project_name = Column(String(300))
    developer_name = Column(String(200))
    handover_year = Column(Integer)
    completion_percentage = Column(Float)
    starting_price_aed = Column(Float)
    unit_types_available = Column(Text)
    payment_plan_details = Column(Text)
    completion_date_text = Column(String(50))
    sale_status = Column(String(50))
    cover_image_url = Column(Text)
    max_commission = Column(Integer)
    detail_json = Column(Text)
    detail_fetched_at = Column(Integer)
    community = Column(String(200))
    area = Column(String(200))
    emirate = Column(String(100), default="Dubai")
    scrape_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True)


class ClientIntake(Base):
    __tablename__ = "client_intakes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed = Column(Boolean, default=False)
    client_name = Column(String(200))
    client_phone = Column(String(50))
    client_email = Column(String(200))
    budget_aed = Column(String(200))
    property_type = Column(String(200))
    bedrooms = Column(String(100))
    preferred_areas = Column(Text)
    market_preference = Column(String(50))
    purchase_purpose = Column(String(50))
    messages_json = Column(Text, default="[]")


class AgentPropertyPick(Base):
    __tablename__ = "agent_property_picks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("client_intakes.session_id"), nullable=False, index=True)
    added_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    listing_url = Column(Text, nullable=False)
    title = Column(Text, nullable=True)
    price_aed = Column(Float, nullable=True)
    bedrooms = Column(String(20), nullable=True)
    bathrooms = Column(String(20), nullable=True)
    area = Column(String(200), nullable=True)
    size_sqft = Column(Float, nullable=True)
    property_type = Column(String(50), nullable=True)
    image_url = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ClientIntake", foreign_keys=[session_id])
    agent = relationship("User", foreign_keys=[added_by])


class AIScrapeLog(Base):
    __tablename__ = "ai_scrape_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    listings_found = Column(Integer, default=0)
    listings_new = Column(Integer, default=0)
    listings_updated = Column(Integer, default=0)
    status = Column(String(20), default="running")
    error_message = Column(Text, nullable=True)
