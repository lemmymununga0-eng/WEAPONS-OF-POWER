"""Loads backend/.env into the environment before anything else is imported.

Real environment variables (for example on Render) always win over the file,
so the same code runs locally from .env and online from the host's settings.
Set WOPMI_SKIP_DOTENV=1 to ignore the file (the test suite does this).
"""
import os


def _load_dotenv() -> None:
    if os.environ.get("WOPMI_SKIP_DOTENV"):
        return
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    try:
        with open(path, encoding="utf-8-sig") as f:
            lines = f.read().splitlines()
    except OSError:
        return
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv()
