"""
Live/next-service computation. All of it runs in Africa/Lusaka (CAT,
UTC+2, no daylight saving) regardless of the server's own clock —
that's what the church's schedule is defined in.
"""
import re
from datetime import datetime, timedelta
from urllib.parse import quote
from zoneinfo import ZoneInfo

LUSAKA = ZoneInfo("Africa/Lusaka")
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def now_in_lusaka() -> datetime:
    return datetime.now(LUSAKA)


def is_within_service(now: datetime, day: str, start_time: str, end_time: str) -> bool:
    if WEEKDAYS[now.weekday()] != day:
        return False
    current_hm = now.strftime("%H:%M")
    return start_time <= current_hm <= end_time


def next_occurrence(now: datetime, day: str, start_time: str) -> datetime:
    """The next Lusaka-local datetime this weekday+time occurs at or after `now`."""
    target_weekday = WEEKDAYS.index(day)
    hour, minute = (int(x) for x in start_time.split(":"))
    candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    days_ahead = (target_weekday - now.weekday()) % 7
    candidate += timedelta(days=days_ahead)
    if candidate <= now:
        candidate += timedelta(days=7)
    return candidate


_YOUTUBE_PATTERNS = [
    r"youtu\.be/([A-Za-z0-9_-]+)",
    r"youtube\.com/watch\?v=([A-Za-z0-9_-]+)",
    r"youtube\.com/live/([A-Za-z0-9_-]+)",
    r"youtube\.com/embed/([A-Za-z0-9_-]+)",
]


def youtube_embed_url(url: str) -> str:
    if not url:
        return ""
    for pattern in _YOUTUBE_PATTERNS:
        m = re.search(pattern, url)
        if m:
            return f"https://www.youtube.com/embed/{m.group(1)}"
    return ""


def facebook_embed_url(url: str) -> str:
    if not url:
        return ""
    return f"https://www.facebook.com/plugins/video.php?href={quote(url, safe='')}&show_text=false"


def embed_url_for(youtube_url: str, facebook_url: str) -> str:
    if youtube_url:
        return youtube_embed_url(youtube_url)
    if facebook_url:
        return facebook_embed_url(facebook_url)
    return ""
