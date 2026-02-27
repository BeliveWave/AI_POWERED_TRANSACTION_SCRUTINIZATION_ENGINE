import pyotp
import qrcode
import io
import base64

def generate_totp_secret():
    """Generates a random secret key for TOTP."""
    return pyotp.random_base32()

def get_totp_uri(secret: str, username: str, issuer_name: str = "AI Transaction Engine"):
    """Generates the provisioning URI for the Google Authenticator app."""
    return pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name=issuer_name)

def verify_totp(secret: str, token: str):
    """Verifies a TOTP token against the secret."""
    totp = pyotp.TOTP(secret)
    return totp.verify(token)

def generate_qr_code(uri: str):
    """Generates a QR code image as a base64 string."""
    img = qrcode.make(uri)
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"
