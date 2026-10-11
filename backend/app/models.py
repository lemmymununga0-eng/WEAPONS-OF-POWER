"""
Database models — one class per table.

This mirrors Section 07 (Data model) of the project blueprint. A couple
of things are simplified for the MVP: uploaded files are stored as a
path directly on the row that owns them (Ministry.image_path,
Event.flyer_path, Sermon.media_path) instead of a separate MediaAsset
table — enough for one small site, and easy to split out later if the
church ends up with a large media library.
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey
from .database import Base


class ChurchInfo(Base):
    """Singleton row — the one record holding church-wide details."""
    __tablename__ = "church_info"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    founder_name = Column(String, nullable=False)
    founder_title = Column(String, nullable=False)
    founder_bio = Column(Text, default="")
    founder_photo = Column(String, default="")
    church_photo = Column(String, default="")
    location = Column(String, nullable=False)
    mission = Column(Text, default="")
    give_details = Column(Text, default="")
    airtel_number = Column(String, default="")
    airtel_name = Column(String, default="")
    mtn_number = Column(String, default="")
    mtn_name = Column(String, default="")
    zamtel_number = Column(String, default="")
    zamtel_name = Column(String, default="")
    bank_name = Column(String, default="")
    bank_account_name = Column(String, default="")
    bank_account_number = Column(String, default="")
    bank_branch = Column(String, default="")
    phone = Column(String, default="")
    whatsapp = Column(String, default="")
    email = Column(String, default="")
    facebook = Column(String, default="")
    history = Column(Text, default="")
    vision = Column(Text, default="")
    beliefs = Column(Text, default="")        # one belief/value per line
    office_hours = Column(String, default="")
    instagram = Column(String, default="")
    youtube = Column(String, default="")


class ServiceTime(Base):
    __tablename__ = "service_times"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String, nullable=False)          # "Sunday", "Tuesday", ...
    label = Column(String, nullable=False)         # "Morning Service"
    start_time = Column(String, nullable=False)    # "09:00"
    end_time = Column(String, nullable=False)      # "11:30"
    sort_order = Column(Integer, default=0)


class Ministry(Base):
    __tablename__ = "ministries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    leader = Column(String, default="")
    meeting_time = Column(String, default="")
    image_path = Column(String, default="")
    contact_info = Column(String, default="")
    is_active = Column(Boolean, default=True)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    event_date = Column(String, nullable=False)    # "2026-10-12"
    event_time = Column(String, default="")
    location = Column(String, default="")
    flyer_path = Column(String, default="")
    end_date = Column(String, default="")          # blank = same day as event_date
    speaker = Column(String, default="")
    registration_enabled = Column(Boolean, default=False)
    registration_url = Column(String, default="")
    published = Column(Boolean, default=True)


class Sermon(Base):
    __tablename__ = "sermons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    speaker = Column(String, default="")
    sermon_date = Column(String, default="")
    media_path = Column(String, default="")        # uploaded audio/video
    external_link = Column(String, default="")      # or a YouTube/link instead
    notes = Column(Text, default="")
    category = Column(String, default="")
    scripture = Column(String, default="")
    published = Column(Boolean, default=True)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_info = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read = Column(Boolean, default=False)


class Cluster(Base):
    """A group of branches under one overseer, e.g. 'Copperbelt Cluster'."""
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    province = Column(String, default="")
    overseer_name = Column(String, default="")
    overseer_photo = Column(String, default="")
    overseer_phone = Column(String, default="")
    description = Column(Text, default="")


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False, unique=True, index=True)
    country = Column(String, nullable=False, default="Zambia")
    # Province (when country is Zambia, one of the 10) or free-text region
    # (any other country). Nullable at the DB level because the seeded
    # headquarters branch starts without one — "required" is enforced by
    # the API on create/update, not by a DB constraint.
    province = Column(String, nullable=True)
    town = Column(String, default="")
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=True)
    address = Column(String, default="")
    directions_note = Column(String, default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_headquarters = Column(Boolean, default=False)
    service_times = Column(Text, default="")  # free text; HQ uses the ServiceTime table instead
    branch_photo = Column(String, default="")
    pastor_name = Column(String, nullable=False)
    pastor_title = Column(String, default="Pastor")
    pastor_photo = Column(String, default="")
    pastor_phone = Column(String, default="")
    pastor_whatsapp = Column(String, default="")
    pastor_email = Column(String, default="")
    show_pastor_contacts = Column(Boolean, default=True)
    active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LivestreamSettings(Base):
    """Singleton row — one record holding the livestream configuration."""
    __tablename__ = "livestream_settings"

    id = Column(Integer, primary_key=True, index=True)
    youtube_url = Column(String, default="")
    facebook_url = Column(String, default="")
    auto_live = Column(Boolean, default=True)  # treat scheduled ServiceTime windows as live
    manual_live = Column(Boolean, default=False)  # admin override, takes priority
    manual_title = Column(String, default="")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, default="")
    email = Column(String, default="")
    # super_admin | admin | content_manager. Accounts that existed before
    # roles were added are backfilled as super_admin by sync_schema.
    role = Column(String, default="super_admin")
    is_active = Column(Boolean, default=True)
    # True for the seeded default password and for temporary passwords set by
    # a super admin; blocks everything except changing the password.
    must_change_password = Column(Boolean, default=False)


class Leader(Base):
    __tablename__ = "leaders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    position = Column(String, default="")
    photo_path = Column(String, default="")
    biography = Column(Text, default="")
    sort_order = Column(Integer, default=0)
    is_founder = Column(Boolean, default=False)


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, default="")
    priority = Column(String, default="normal")  # normal | high
    start_date = Column(String, default="")       # blank = no start limit
    end_date = Column(String, default="")         # blank = no end limit
    published = Column(Boolean, default=True)


class PrayerRequest(Base):
    __tablename__ = "prayer_requests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="")
    email = Column(String, default="")
    phone = Column(String, default="")
    request = Column(Text, nullable=False)
    category = Column(String, default="Other")
    confidential = Column(Boolean, default=False)
    status = Column(String, default="New")  # New | In Progress | Prayed For | Closed
    created_at = Column(DateTime, default=datetime.utcnow)


class MediaItem(Base):
    __tablename__ = "media_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    kind = Column(String, nullable=False)       # video | photo
    category = Column(String, default="")
    url = Column(String, default="")            # external link (YouTube etc.)
    file_path = Column(String, default="")      # or an uploaded file
    created_at = Column(DateTime, default=datetime.utcnow)
    published = Column(Boolean, default=True)
