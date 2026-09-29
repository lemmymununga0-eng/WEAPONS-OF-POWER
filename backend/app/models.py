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

from sqlalchemy import Column, Integer, String, Text, DateTime
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
    phone = Column(String, default="")
    whatsapp = Column(String, default="")
    email = Column(String, default="")
    facebook = Column(String, default="")


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


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    event_date = Column(String, nullable=False)    # "2026-10-12"
    event_time = Column(String, default="")
    location = Column(String, default="")
    flyer_path = Column(String, default="")


class Sermon(Base):
    __tablename__ = "sermons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    speaker = Column(String, default="")
    sermon_date = Column(String, default="")
    media_path = Column(String, default="")        # uploaded audio/video
    external_link = Column(String, default="")      # or a YouTube/link instead
    notes = Column(Text, default="")


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_info = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
