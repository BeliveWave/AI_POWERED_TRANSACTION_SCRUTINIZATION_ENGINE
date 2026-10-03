import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal
from app.models.user import User
from app.services.user_service import user_service, _is_expired, _verify_token_hash
from app.services.auth_service import auth_service
from app.schemas.user import UserCreate, UserLogin, UserResetPassword, ChangePasswordRequest
from fastapi import HTTPException

def test_full_auth_lifecycle():
    db = SessionLocal()
    test_email = "audit_test_analyst@bank.internal"
    test_username = "audit_analyst_01"
    initial_password = "SecurePassword2026!#"
    new_password = "UpdatedPassword2026!$"

    # Cleanup any prior test run
    existing = db.query(User).filter((User.email == test_email) | (User.username == test_username)).first()
    if existing:
        db.delete(existing)
        db.commit()

    print("\n--- TEST 1: Password Strength Validation ---")
    try:
        UserCreate(email=test_email, username=test_username, full_name="Test Analyst", password="short")
        assert False, "Should have failed on short password"
    except Exception as e:
        assert "at least 12 characters" in str(e)
        print("  [PASS] Short password rejected (<12 chars)")

    try:
        UserCreate(email=test_email, username=test_username, full_name="Test Analyst", password="alllowercaseletters123!")
        assert False, "Should have failed on missing uppercase"
    except Exception as e:
        assert "uppercase letter" in str(e)
        print("  [PASS] Missing uppercase rejected")

    try:
        UserCreate(email=test_email, username=test_username, full_name="Test Analyst", password="NoSpecialChar123456")
        assert False, "Should have failed on missing symbol"
    except Exception as e:
        assert "special character" in str(e)
        print("  [PASS] Missing special character rejected")

    print("\n--- TEST 2: Registration ---")
    valid_in = UserCreate(email=test_email, username=test_username, full_name="Test Analyst", password=initial_password)
    new_user = user_service.register_new_user(db, valid_in)
    assert new_user.id is not None
    assert new_user.email == test_email
    print(f"  [PASS] User registered successfully: id={new_user.id}")

    # Duplicate registration check
    try:
        user_service.register_new_user(db, valid_in)
        assert False, "Duplicate registration should fail"
    except HTTPException as e:
        assert e.status_code == 400
        print("  [PASS] Duplicate email/username rejected")

    print("\n--- TEST 3: Login ---")
    # Correct credentials
    login_res = auth_service.authenticate_user(db, UserLogin(username_or_email=test_username, password=initial_password))
    assert "access_token" in login_res
    print("  [PASS] Login with username succeeded")

    login_email_res = auth_service.authenticate_user(db, UserLogin(username_or_email=test_email, password=initial_password))
    assert "access_token" in login_email_res
    print("  [PASS] Login with email succeeded")

    # Incorrect credentials
    try:
        auth_service.authenticate_user(db, UserLogin(username_or_email=test_username, password="WrongPassword123!"))
        assert False, "Wrong password should fail"
    except HTTPException as e:
        assert e.status_code == 401
        print("  [PASS] Wrong password rejected (HTTP 401)")

    print("\n--- TEST 4: Forgot Password Workflow ---")
    # Non-existent email (enumeration prevention)
    res_non_exist = user_service.forgot_password(db, "nobody_exists@bank.com")
    assert "instructions have been sent" in res_non_exist["message"]
    print("  [PASS] Non-existent email returns generic message (no user enumeration)")

    # Real user forgot password
    res_real = user_service.forgot_password(db, test_email)
    assert "instructions have been sent" in res_real["message"]
    
    # Reload user from DB to verify hash storage
    u = db.query(User).filter(User.email == test_email).first()
    assert u.reset_otp is not None
    assert ":" in u.reset_otp, "Should store token_hash:otp_hash composite"
    assert u.reset_otp_expires_at is not None
    print("  [PASS] Reset token hash & OTP hash stored in DB (not plaintext)")

    print("\n--- TEST 5: Verify Token & OTP Validation ---")
    stored_composite = u.reset_otp
    parts = stored_composite.split(":")
    token_hash = parts[0]
    otp_hash = parts[1]

    # Verify invalid token fails
    try:
        user_service.verify_reset_token(db, test_email, "invalid_random_token_123")
        assert False, "Invalid token should fail"
    except HTTPException as e:
        assert e.status_code == 400
        print("  [PASS] Invalid reset token rejected")

    # Simulate token hash match helper
    assert not _verify_token_hash(stored_composite, "wrong_token")
    print("  [PASS] Candidate hash check correctly rejects invalid tokens")

    print("\n--- TEST 6: Password Reset & Invalidation ---")
    # Set a known test OTP to verify reset
    import hashlib
    test_otp = "854921"
    u.reset_otp = f"dummy_token_hash:{hashlib.sha256(test_otp.encode('utf-8')).hexdigest()}"
    u.reset_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    # Reset password with correct OTP
    reset_in = UserResetPassword(
        email=test_email,
        otp=test_otp,
        new_password=new_password,
        confirm_password=new_password
    )
    reset_res = user_service.reset_password(db, reset_in)
    assert "successfully reset" in reset_res["message"]
    print("  [PASS] Password reset succeeded")

    # Verify token is invalidated
    db.refresh(u)
    assert u.reset_otp is None, "Token must be invalidated (single-use)"
    assert u.reset_otp_expires_at is None
    print("  [PASS] Reset token immediately invalidated in DB (single-use enforced)")

    # Attempt to reuse the same OTP
    try:
        user_service.reset_password(db, reset_in)
        assert False, "Reusing reset token should fail"
    except HTTPException as e:
        assert e.status_code == 400
        print("  [PASS] Replay / reuse of reset token rejected")

    print("\n--- TEST 7: Login With New Password ---")
    new_login_res = auth_service.authenticate_user(db, UserLogin(username_or_email=test_username, password=new_password))
    assert "access_token" in new_login_res
    print("  [PASS] Login with new password succeeded")

    try:
        auth_service.authenticate_user(db, UserLogin(username_or_email=test_username, password=initial_password))
        assert False, "Old password should no longer work"
    except HTTPException as e:
        assert e.status_code == 401
        print("  [PASS] Old password rejected")

    print("\n--- TEST 8: Change Password (Authenticated) ---")
    change_in = ChangePasswordRequest(
        current_password=new_password,
        new_password="EvenNewerPassword2026!@",
        confirm_password="EvenNewerPassword2026!@"
    )
    change_res = user_service.change_password(db, u, change_in)
    assert "updated successfully" in change_res["message"]
    print("  [PASS] Authenticated password change succeeded")

    # Cleanup test analyst
    db.delete(u)
    db.commit()
    db.close()
    print("\n==========================================")
    print("ALL 8 BACKEND AUTH LIFECYCLE TESTS PASSED!")
    print("==========================================\n")

if __name__ == "__main__":
    test_full_auth_lifecycle()
