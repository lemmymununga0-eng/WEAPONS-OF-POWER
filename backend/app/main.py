"""
FastAPI entrypoint — Section 09 of the project blueprint.

Run locally with:
    uvicorn app.main:app --reload

The interactive API docs are then at http://localhost:8000/docs
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine, SessionLocal, sync_schema
from .seed import seed_if_empty
from .routes import church_info, ministries, events, sermons, contact, admin, service_times, branches, clusters
from . import uploads as uploads_module

app = FastAPI(title="Weapons of Power Ministry International — API")

# CORS: allow the frontend dev server (and, in production, your real domain)
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=uploads_module.UPLOADS_DIR), name="uploads")

app.include_router(church_info.router)
app.include_router(ministries.router)
app.include_router(events.router)
app.include_router(sermons.router)
app.include_router(contact.router)
app.include_router(admin.router)
app.include_router(service_times.router)
app.include_router(branches.router)
app.include_router(clusters.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    sync_schema()
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}
