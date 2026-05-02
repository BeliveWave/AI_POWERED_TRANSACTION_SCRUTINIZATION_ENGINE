import random
import string
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

def generate_otp(length=6):
    """Generates a numeric OTP of given length."""
    return ''.join(random.choices(string.digits, k=length))

def send_reset_otp(email: str, otp: str):
    """
    Sends the OTP to the user's email.
    Currently MOCKED to print to console.
    """
    print(f"\n" + "="*50)
    print(f"📧 [EMAIL MOCK] To: {email}")
    print(f"🔑 OTP for Password Reset: {otp}")
    print(f"="*50 + "\n")
    return True

def send_welcome_email(email: str):
    """
    Sends a welcome email to newsletter subscribers.
    If SMTP credentials are in the environment, it sends a real email.
    Otherwise, it mocks the email to the console.
    """
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")

    subject = "Welcome to Sentinel! 🛡️"
    body = f"""
    Hello,

    Thank you for subscribing to the Sentinel newsletter!
    We're excited to have you on board. You'll receive the latest tips, trends, and offers about our system and security straight to your inbox.

    Stay secure,
    The Sentinel Team
    """

    if smtp_username and smtp_password:
        try:
            msg = MIMEMultipart()
            msg['From'] = f"Sentinel <{smtp_username}>"
            msg['To'] = email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            print(f"❌ Failed to send real email: {e}")
            # Fallback to mock below if real email fails

    # Mock Email output
    print(f"\n" + "="*50)
    print(f"📧 [EMAIL MOCK] To: {email}")
    print(f"✉️  Subject: {subject}")
    print(f"📝 Body:\n{body}")
    print(f"="*50 + "\n")
    return True

