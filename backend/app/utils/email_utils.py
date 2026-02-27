import random
import string
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
