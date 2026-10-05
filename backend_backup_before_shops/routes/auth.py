import logging
import importlib
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from database import get_db
from models import User
from schemas import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    VerifyEmailRequest,
)
from services import audit_service, notification_service, token_service
from config import ENVIRONMENT
from config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    PUBLIC_APP_URL,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

logger = logging.getLogger(__name__)

@router.post("/register", response_model=UserResponse)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    password_hash = hash_password(user_data.password)

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=password_hash,
        role="USER",
        organization=user_data.organization
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    verification_token = token_service.issue(db, new_user, "EMAIL_VERIFICATION")
    audit_service.log(db, "USER_REGISTERED", "user", new_user.id, new_user)
    db.commit()
    if ENVIRONMENT == "development":
        logger.info("Development email verification link: /verify-email?token=%s", verification_token)

    return new_user


@router.post("/login", response_model=TokenResponse)
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if not user:
        audit_service.log(db, "LOGIN_FAILED", "user", description="Unknown email")
        db.commit()
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_valid = verify_password(
        user_data.password,
        user.password_hash
    )

    if not password_valid:
        audit_service.log(db, "LOGIN_FAILED", "user", user=user, description="Invalid password")
        db.commit()
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        user_id=user.id,
        role=user.role
    )
    audit_service.log(db, "LOGIN_SUCCEEDED", "user", user.id, user)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role
    }


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        reset_token = token_service.issue(db, user, "PASSWORD_RESET")
        db.commit()
        if ENVIRONMENT == "development":
            logger.info("Development password reset link: /reset-password?token=%s", reset_token)
    return {"message": "If the account exists, password reset instructions have been sent."}


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    token = token_service.consume(db, request.token, "PASSWORD_RESET")
    if not token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == token.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    user.password_hash = hash_password(request.new_password)
    audit_service.log(db, "PASSWORD_RESET", "user", user.id, user)
    db.commit()
    return {"message": "Password reset successfully"}


@router.post("/verify-email")
def verify_email(
    request: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    token = token_service.consume(db, request.token, "EMAIL_VERIFICATION")
    if not token:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user = db.query(User).filter(User.id == token.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    user.email_verified = True
    audit_service.log(db, "EMAIL_VERIFIED", "user", user.id, user)
    db.commit()
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
def resend_verification(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == request.email).first()
    if user and not user.email_verified:
        verification_token = token_service.issue(db, user, "EMAIL_VERIFICATION")
        db.commit()
        if ENVIRONMENT == "development":
            logger.info("Development email verification link: /verify-email?token=%s", verification_token)
    return {"message": "If the account exists, verification instructions have been sent."}


@router.get("/google/status")
def google_status():
    return {"enabled": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)}


@router.get("/google")
def google_login():
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google login is not configured")
    state = jwt.encode(
        {
            "purpose": "google_oauth",
            "nonce": secrets.token_urlsafe(16),
            "exp": datetime.utcnow() + timedelta(minutes=10),
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )
    query = urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")


@router.get("/google/callback")
def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google login is not configured")
    try:
        state_payload = jwt.decode(state, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if state_payload.get("purpose") != "google_oauth":
            raise JWTError()
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid Google OAuth state")

    httpx = importlib.import_module("httpx")
    with httpx.Client(timeout=10) as client:
        token_response = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Google authorization failed")
        token_data = token_response.json()

    try:
        Request = importlib.import_module("google.auth.transport.requests").Request
        id_token = importlib.import_module("google.oauth2.id_token")
        identity = id_token.verify_oauth2_token(
            token_data["id_token"], Request(), GOOGLE_CLIENT_ID
        )
    except Exception as exc:
        logger.warning("Google identity validation failed: %s", type(exc).__name__)
        raise HTTPException(status_code=401, detail="Google identity could not be verified")

    subject = identity.get("sub")
    email = identity.get("email")
    if not subject or not email or not identity.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google account is not verified")

    user = db.query(User).filter(User.google_subject_id == subject).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            name=identity.get("name") or email,
            email=email,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role="USER",
            email_verified=True,
            auth_provider="google",
            google_subject_id=subject,
        )
        db.add(user)
        db.flush()
    else:
        user.google_subject_id = subject
        user.email_verified = True
        user.auth_provider = "google"

    audit_service.log(db, "GOOGLE_LOGIN", "user", user.id, user)
    db.commit()
    token = create_access_token(user.id, user.role)
    redirect = f"{PUBLIC_APP_URL.rstrip('/')}/auth/callback#" + urlencode({
        "access_token": token,
        "role": user.role,
    })
    return RedirectResponse(redirect)