import re


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower().strip()).strip("-")
    return slug or "branch"
