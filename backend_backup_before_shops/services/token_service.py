import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from config import EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES, PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
from models import AuthToken, User


def issue(db: Session, user: User, token_type: str) -> str:
    raw_token = secrets.token_urlsafe(32)
    expires_minutes = (
        PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        if token_type == "PASSWORD_RESET"
        else EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES
    )
    db.add(AuthToken(
        user_id=user.id,
        token_type=token_type,
        token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
        expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes),
    ))
    return raw_token


def consume(db: Session, raw_token: str, token_type: str) -> AuthToken | None:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    token = db.query(AuthToken).filter(
        AuthToken.token_hash == token_hash,
        AuthToken.token_type == token_type,
        AuthToken.used_at.is_(None),
        AuthToken.expires_at > datetime.utcnow(),
    ).first()
    if token:
        token.used_at = datetime.utcnow()
    return token