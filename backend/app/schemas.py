"""Pydantic schemas — request/response shapes for the API."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# ---------- Church info ----------

class ServiceTimeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    day: str
    label: str
    start_time: str
    end_time: str
    sort_order: int


class ServiceTimeIn(BaseModel):
    day: str
    label: str
    start_time: str
    end_time: str
    sort_order: int = 0


class ServiceTimeReorderIn(BaseModel):
    ids: List[int]


class ChurchInfoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    founder_name: str
    founder_title: str
    founder_bio: str
    founder_photo: str
    church_photo: str
    location: str
    mission: str
    give_details: str
    phone: str
    whatsapp: str
    email: str
    facebook: str
    service_times: List[ServiceTimeOut] = []


class ChurchInfoIn(BaseModel):
    name: Optional[str] = None
    founder_name: Optional[str] = None
    founder_title: Optional[str] = None
    founder_bio: Optional[str] = None
    location: Optional[str] = None
    mission: Optional[str] = None
    give_details: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    facebook: Optional[str] = None


# ---------- Ministries ----------

class MinistryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    leader: str
    meeting_time: str
    image_path: str


# ---------- Events ----------

class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    event_date: str
    event_time: str
    location: str
    flyer_path: str


# ---------- Sermons ----------

class SermonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    speaker: str
    sermon_date: str
    media_path: str
    external_link: str
    notes: str
    category: str
    scripture: str
    published: bool


# ---------- Contact ----------

class ContactMessageIn(BaseModel):
    name: str
    contact_info: str
    message: str


class ContactMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    contact_info: str
    message: str
    created_at: datetime
    read: bool


# ---------- Clusters & Branches ----------

class ClusterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    province: str
    overseer_name: str
    overseer_photo: str
    overseer_phone: str
    description: str


class BranchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    country: str
    province: Optional[str] = None
    town: str
    cluster_id: Optional[int] = None
    address: str
    directions_note: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_headquarters: bool
    service_times: str
    branch_photo: str
    pastor_name: str
    pastor_title: str
    pastor_photo: str
    pastor_phone: str
    pastor_whatsapp: str
    pastor_email: str
    show_pastor_contacts: bool
    active: bool
    sort_order: int


# ---------- Livestream ----------

class LivestreamSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    youtube_url: str
    facebook_url: str
    auto_live: bool
    manual_live: bool
    manual_title: str


class LivestreamSettingsIn(BaseModel):
    youtube_url: Optional[str] = None
    facebook_url: Optional[str] = None
    auto_live: Optional[bool] = None
    manual_live: Optional[bool] = None
    manual_title: Optional[str] = None


class NextServiceOut(BaseModel):
    label: str
    starts_at: str


class LiveStatusOut(BaseModel):
    is_live: bool
    title: str
    embed_url: str
    next_service: Optional[NextServiceOut] = None


# ---------- Auth ----------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    username: str
    password: str


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str
