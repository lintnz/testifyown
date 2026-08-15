import os
import asyncio
import logging

logger = logging.getLogger(__name__)

SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


def _api_key():
    return (os.environ.get("RESEND_API_KEY") or "").strip()


async def send_email(to: str, subject: str, html: str):
    key = _api_key()
    if not key:
        logger.info(f"[EMAIL:MOCK] To={to} Subject={subject}")
        return {"status": "mock", "message": "Email logging only (no RESEND_API_KEY configured)"}
    try:
        import resend
        resend.api_key = key
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "success", "email_id": result.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return {"status": "error", "message": str(e)}


def new_testimonial_email(customer_name: str, preview: str, is_video: bool, view_url: str) -> str:
    kind = "🎥 Video testimonial" if is_video else "✍️ Written testimonial"
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fafafa;border-radius:16px">
      <h1 style="font-size:22px;margin:0 0 8px">You received a new testimonial 🎉</h1>
      <p style="color:#a3a3a3;margin:0 0 20px">{kind} from <strong style="color:#fff">{customer_name}</strong></p>
      <div style="background:#151515;border:1px solid #262626;border-radius:12px;padding:16px;margin-bottom:20px">
        <p style="margin:0;color:#e5e5e5;font-style:italic">"{preview}"</p>
      </div>
      <a href="{view_url}" style="display:inline-block;background:#ff5722;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600">View testimonial</a>
    </div>
    """


def welcome_submission_email(customer_name: str, business: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h1 style="font-size:22px">Thank you, {customer_name}! ❤️</h1>
      <p>Your testimonial for <strong>{business}</strong> has been submitted successfully. We really appreciate you taking the time to share your experience.</p>
    </div>
    """


def password_reset_email(reset_url: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h1 style="font-size:22px">Reset your password</h1>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="{reset_url}" style="display:inline-block;background:#ff5722;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600">Reset password</a>
      <p style="color:#888;font-size:13px;margin-top:16px">If you didn't request this, you can safely ignore this email.</p>
    </div>
    """
