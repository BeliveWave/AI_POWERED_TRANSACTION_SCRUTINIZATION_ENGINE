import secrets
import string
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger(__name__)

def generate_otp(length: int = 6) -> str:
    """Generates a cryptographically secure numeric OTP of given length."""
    return ''.join(secrets.choice(string.digits) for _ in range(length))

def generate_reset_token(nbytes: int = 32) -> str:
    """Generates a cryptographically secure URL-safe token."""
    return secrets.token_urlsafe(nbytes)

def send_password_reset_email(email: str, raw_token: str, otp_code: str, reset_url: str) -> bool:
    """
    Dispatches password reset instructions containing both a direct URL and a 6-digit OTP code.
    If SMTP credentials are provided, sends a real HTML+Text email.
    Otherwise, logs to server console in development mock format.
    """
    subject = "Sentinel Security: Password Reset Request"
    from_header = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or 'security@sentinel.bank'}>"

    # Plain text version for non-HTML email clients
    plain_text = f"""
Sentinel Fraud Scrutinization Engine — Security Advisory
=========================================================

A password reset request was received for your account ({email}).

RESET LINK:
{reset_url}

VERIFICATION CODE:
{otp_code}

This link and verification code will expire in 15 minutes.
If you did not initiate this request, you may safely disregard this message.

— Sentinel Security Team
"""

    # Responsive HTML version
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }}
    .container {{ max-width: 520px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 32px; }}
    .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: #27272a; color: #a1a1aa; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }}
    .title {{ font-size: 20px; font-weight: 700; margin-top: 16px; margin-bottom: 8px; color: #ffffff; }}
    .desc {{ font-size: 13px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px; }}
    .btn {{ display: inline-block; padding: 10px 24px; background-color: #ffffff; color: #09090b !important; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 6px; }}
    .code-box {{ margin-top: 24px; padding: 16px; background-color: #09090b; border: 1px dashed #3f3f46; border-radius: 6px; text-align: center; }}
    .otp {{ font-family: monospace; font-size: 24px; font-weight: 700; letter-spacing: 0.25em; color: #ffffff; margin: 8px 0; }}
    .footer {{ margin-top: 28px; padding-top: 16px; border-top: 1px solid #27272a; font-size: 11px; color: #71717a; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Security Notice</span>
    <h1 class="title">Password Reset Verification</h1>
    <p class="desc">
      We received a request to reset the password for your Sentinel analyst account (<strong>{email}</strong>). 
      Click the button below to choose a new password:
    </p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{reset_url}" class="btn" target="_blank">Reset Password</a>
    </div>
    <div class="code-box">
      <span style="font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">Or enter this 6-digit code:</span>
      <div class="otp">{otp_code}</div>
      <span style="font-size: 11px; color: #71717a;">Valid for 15 minutes</span>
    </div>
    <div class="footer">
      If you did not request a password reset, you can safely ignore this email. No changes will be made to your account.
      <br><br>
      © Sentinel Fraud Intelligence Middleware.
    </div>
  </div>
</body>
</html>
"""

    if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg['From'] = from_header
            msg['To'] = email
            msg['Subject'] = subject
            msg.attach(MIMEText(plain_text, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            server = smtplib.SMTP(settings.SMTP_SERVER, int(settings.SMTP_PORT), timeout=10)
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            logger.info(f"Password reset email dispatched to {email}")
            return True
        except Exception as e:
            logger.warning(f"Failed to dispatch real SMTP email: {e}. Falling back to console output.")

    # Development / Mock Console Output
    print("\n" + "="*70)
    print("[SENTINEL AUTH] PASSWORD RESET NOTIFICATION")
    print("="*70)
    print(f"Recipient:     {email}")
    print(f"Reset URL:     {reset_url}")
    print(f"6-Digit Code:  {otp_code}")
    print(f"Expiration:    15 minutes")
    print("="*70 + "\n")
    return True

def send_reset_otp(email: str, otp: str, reset_url: str = None) -> bool:
    """Backwards-compatible wrapper."""
    url = reset_url or f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={otp}&email={email}"
    return send_password_reset_email(email, otp, otp, url)

def send_welcome_email(email: str) -> bool:
    """Sends a welcome email to subscribers."""
    subject = "Welcome to Sentinel!"
    body = """
Hello,

Thank you for subscribing to Sentinel Fraud Scrutinization updates!

Stay secure,
The Sentinel Team
"""
    if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart()
            msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg['To'] = email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(settings.SMTP_SERVER, int(settings.SMTP_PORT), timeout=10)
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            logger.warning(f"Failed to send newsletter email: {e}")

    print("\n" + "="*50)
    print(f"[EMAIL MOCK] To: {email} | Subject: {subject}")
    print("="*50 + "\n")
    return True
