"""
File upload helper — Phase 3's "let the church upload things" feature.

Saves to a local uploads/ folder for development. In production, swap
this function's body for a call to an object-storage SDK (e.g.
Cloudinary, S3) — nothing else in the app needs to change, since routes
only ever store and return the path/URL this function gives back.
"""
import os
import uuid

from fastapi import UploadFile

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20MB

# Content-type -> extension. The saved file's extension is always taken from
# this map (never from the client-supplied filename), and files whose
# declared content-type isn't in here are rejected — keeps someone from
# uploading e.g. an .html/.svg file that would later be served back as a
# script-capable type from /uploads.
IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
AUDIO_VIDEO_TYPES = {
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}


def save_upload(file: UploadFile, allowed_types: dict) -> str:
    ext = allowed_types.get(file.content_type)
    if ext is None:
        allowed = ", ".join(sorted(allowed_types))
        raise ValueError(f"Unsupported file type '{file.content_type}'. Allowed: {allowed}")

    safe_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOADS_DIR, safe_name)

    size = 0
    with open(dest_path, "wb") as out:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                out.close()
                os.remove(dest_path)
                raise ValueError("File too large (20MB limit)")
            out.write(chunk)

    return f"/uploads/{safe_name}"
