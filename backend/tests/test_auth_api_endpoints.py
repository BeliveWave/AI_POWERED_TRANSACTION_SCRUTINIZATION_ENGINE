import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User

client = TestClient(app)

def test_api_auth_endpoints():
    db = SessionLocal()
    test_email = "e2e_analyst@bank.internal"
    test_username = "e2e_analyst"
    initial_pass = "SecurePass2026!#"
    updated_pass = "SuperNewPass2026!$"

    # Clean up prior test
    existing = db.query(User).filter((User.email == test_email) | (User.username == test_username)).first()
    if existing:
        db.delete(existing)
        db.commit()
    db.close()

    print("\n--- E2E TEST 1: Register via /api/auth/register ---")
    reg_payload = {
        "email": test_email,
        "username": test_username,
        "full_name": "E2E Test Analyst",
        "password": initial_pass
    }
    r = client.post("/api/auth/register", json=reg_payload)
    assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
    user_data = r.json()
    assert user_data["email"] == test_email
    assert user_data["username"] == test_username
    print("  [PASS] Registration HTTP 201 succeeded")

    # Test backward-compatible /auth/register endpoint for duplicate rejection
    r_dup = client.post("/auth/register", json=reg_payload)
    assert r_dup.status_code == 400
    print("  [PASS] Backward compatible /auth/register works & rejected duplicate")

    print("\n--- E2E TEST 2: Login via /api/auth/login ---")
    login_payload = {
        "username_or_email": test_username,
        "password": initial_pass
    }
    r_login = client.post("/api/auth/login", json=login_payload)
    assert r_login.status_code == 200, f"Expected 200, got {r_login.status_code}: {r_login.text}"
    token_data = r_login.json()
    assert "access_token" in token_data
    access_token = token_data["access_token"]
    print("  [PASS] Login HTTP 200 returned bearer token")

    print("\n--- E2E TEST 3: Access Protected /api/auth/me ---")
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    r_me = client.get("/api/auth/me", headers=auth_headers)
    assert r_me.status_code == 200
    assert r_me.json()["username"] == test_username
    print("  [PASS] Protected endpoint /api/auth/me accessed successfully")

    # Test without header
    r_unauth = client.get("/api/auth/me")
    assert r_unauth.status_code == 401
    print("  [PASS] Missing token returns HTTP 401 Unauthorized")

    print("\n--- E2E TEST 4: Forgot Password via /api/auth/forgot-password ---")
    r_forgot = client.post("/api/auth/forgot-password", json={"email": test_email})
    assert r_forgot.status_code == 200
    assert "instructions have been sent" in r_forgot.json()["message"]
    print("  [PASS] Forgot password initiated")

    # Non-existent email returns same response (no user enumeration)
    r_forgot_ghost = client.post("/api/auth/forgot-password", json={"email": "nobody@bank.com"})
    assert r_forgot_ghost.status_code == 200
    assert r_forgot_ghost.json()["message"] == r_forgot.json()["message"]
    print("  [PASS] Non-existent email identical response (prevents account enumeration)")

    print("\n--- E2E TEST 5: Verify Token & Reset Password ---")
    # Fetch reset hash from database to simulate user receiving the 6-digit code or link token
    db = SessionLocal()
    u = db.query(User).filter(User.email == test_email).first()
    assert u.reset_otp is not None
    # Let's set a known test OTP to verify the full HTTP roundtrip
    import hashlib
    test_otp = "741852"
    u.reset_otp = f"test_url_token_hash:{hashlib.sha256(test_otp.encode('utf-8')).hexdigest()}"
    db.commit()
    db.close()

    # Verify token endpoint
    r_verify = client.post("/api/auth/verify-reset-token", json={"email": test_email, "token": test_otp})
    assert r_verify.status_code == 200
    assert r_verify.json()["valid"] is True
    print("  [PASS] /api/auth/verify-reset-token validated token before submission")

    # Reset password endpoint
    reset_payload = {
        "email": test_email,
        "token": test_otp,
        "new_password": updated_pass,
        "confirm_password": updated_pass
    }
    r_reset = client.post("/api/auth/reset-password", json=reset_payload)
    assert r_reset.status_code == 200
    assert "successfully reset" in r_reset.json()["message"]
    print("  [PASS] /api/auth/reset-password successfully updated password")

    # Verify single-use: replay must fail
    r_replay = client.post("/api/auth/reset-password", json=reset_payload)
    assert r_replay.status_code == 400
    print("  [PASS] Replay of reset token rejected (HTTP 400)")

    print("\n--- E2E TEST 6: Login with New Password & Verify Old Rejected ---")
    r_old_login = client.post("/api/auth/login", json={"username_or_email": test_username, "password": initial_pass})
    assert r_old_login.status_code == 401
    print("  [PASS] Old password rejected (HTTP 401)")

    r_new_login = client.post("/api/auth/login", json={"username_or_email": test_username, "password": updated_pass})
    assert r_new_login.status_code == 200
    new_token = r_new_login.json()["access_token"]
    print("  [PASS] New password authenticated successfully (HTTP 200)")

    print("\n--- E2E TEST 7: Change Password via /api/auth/change-password ---")
    change_payload = {
        "current_password": updated_pass,
        "new_password": "EvenNewerPass2026!#",
        "confirm_password": "EvenNewerPass2026!#"
    }
    r_change = client.post("/api/auth/change-password", json=change_payload, headers={"Authorization": f"Bearer {new_token}"})
    assert r_change.status_code == 200
    print("  [PASS] Authenticated password change succeeded")

    print("\n--- E2E TEST 8: Logout via /api/auth/logout ---")
    r_logout = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {new_token}"})
    assert r_logout.status_code == 200
    print("  [PASS] /api/auth/logout returned HTTP 200")

    # Cleanup
    db = SessionLocal()
    u_del = db.query(User).filter(User.email == test_email).first()
    if u_del:
        db.delete(u_del)
        db.commit()
    db.close()

    print("\n==================================================")
    print("ALL 8 END-TO-END HTTP API AUTH TESTS PASSED!")
    print("==================================================\n")

if __name__ == "__main__":
    test_api_auth_endpoints()
