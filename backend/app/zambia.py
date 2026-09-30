"""Zambia-specific helpers: provinces list and phone number normalisation."""
import re

PROVINCES = [
    "Central",
    "Copperbelt",
    "Eastern",
    "Luapula",
    "Lusaka",
    "Muchinga",
    "Northern",
    "North-Western",
    "Southern",
    "Western",
]


def normalize_phone(raw: str, country: str = "Zambia") -> str:
    """
    Zambian numbers become +260XXXXXXXXX (exactly 9 digits after 260).
    Accepts 0971234567, 971234567, +260 97 123 4567, 260971234567 and
    similar. Non-Zambian numbers must already be in E.164 format
    (+ followed by 8-15 digits). Raises ValueError with a message safe
    to show the admin directly.
    """
    if not raw or not raw.strip():
        raise ValueError("Phone number is required.")

    cleaned = re.sub(r"[\s\-()]", "", raw.strip())

    if country != "Zambia":
        if re.fullmatch(r"\+\d{8,15}", cleaned):
            return cleaned
        raise ValueError(
            f"'{raw}' isn't a valid international phone number. Use E.164 format, e.g. +14155551234."
        )

    digits = None
    if cleaned.startswith("+260"):
        digits = cleaned[4:]
    elif cleaned.startswith("260"):
        digits = cleaned[3:]
    elif cleaned.startswith("0"):
        digits = cleaned[1:]
    elif re.fullmatch(r"\d{9}", cleaned):
        digits = cleaned

    if digits is None or not re.fullmatch(r"\d{9}", digits):
        raise ValueError(
            f"'{raw}' isn't a valid Zambian phone number. "
            "Use a format like 0971234567, +260971234567, or 971234567."
        )

    return f"+260{digits}"


def whatsapp_link(normalized_phone: str) -> str:
    """https://wa.me/260XXXXXXXXX — no plus sign, no spaces."""
    return f"https://wa.me/{normalized_phone.lstrip('+')}"


def call_link(normalized_phone: str) -> str:
    return f"tel:{normalized_phone}"
