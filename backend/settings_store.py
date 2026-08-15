import os
from db import db

SETTING_KEYS = [
    "recaptcha_site_key",
    "recaptcha_secret_key",
    "resend_api_key",
    "sender_email",
    "google_places_api_key",
]


def _env_defaults():
    return {
        "recaptcha_site_key": os.environ.get("RECAPTCHA_SITE_KEY", ""),
        "recaptcha_secret_key": os.environ.get("RECAPTCHA_SECRET_KEY", ""),
        "resend_api_key": os.environ.get("RESEND_API_KEY", ""),
        "sender_email": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
        "google_places_api_key": os.environ.get("GOOGLE_PLACES_API_KEY", ""),
    }


async def get_settings() -> dict:
    doc = await db.platform_settings.find_one({"id": "global"}, {"_id": 0}) or {}
    defaults = _env_defaults()
    out = {}
    for k in SETTING_KEYS:
        v = (doc.get(k) or "").strip() if isinstance(doc.get(k), str) else doc.get(k)
        out[k] = v if v else defaults.get(k, "")
    return out


async def get_setting(key: str) -> str:
    return (await get_settings()).get(key, "")


async def update_settings(data: dict):
    clean = {k: (v or "") for k, v in data.items() if k in SETTING_KEYS}
    clean["id"] = "global"
    await db.platform_settings.update_one({"id": "global"}, {"$set": clean}, upsert=True)
    return await get_settings()
