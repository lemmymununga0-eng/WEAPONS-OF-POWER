import pytest

from app.zambia import normalize_phone


VALID_ZAMBIAN = [
    ("0971234567", "+260971234567"),
    ("971234567", "+260971234567"),
    ("+260 97 123 4567", "+260971234567"),
    ("260971234567", "+260971234567"),
    ("+260-97-123-4567", "+260971234567"),
    ("0761234567", "+260761234567"),
]

INVALID_ZAMBIAN = [
    "12345",
    "097123456",  # 8 digits after the leading 0, not 9
    "09712345678",  # 10 digits after the leading 0
    "+2609712345",  # too short
    "",
    "abc1234567",
]

VALID_INTERNATIONAL = [
    "+14155551234",
    "+442071838750",
]

INVALID_INTERNATIONAL = [
    "07123456789",  # not E.164 (no leading +)
    "+1",  # too short
    "not a number",
]


@pytest.mark.parametrize("raw,expected", VALID_ZAMBIAN)
def test_valid_zambian_numbers(raw, expected):
    assert normalize_phone(raw, "Zambia") == expected


@pytest.mark.parametrize("raw", INVALID_ZAMBIAN)
def test_invalid_zambian_numbers(raw):
    with pytest.raises(ValueError):
        normalize_phone(raw, "Zambia")


@pytest.mark.parametrize("raw", VALID_INTERNATIONAL)
def test_valid_international_numbers(raw):
    assert normalize_phone(raw, "Kenya") == raw


@pytest.mark.parametrize("raw", INVALID_INTERNATIONAL)
def test_invalid_international_numbers(raw):
    with pytest.raises(ValueError):
        normalize_phone(raw, "Kenya")
