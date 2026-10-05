from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from config import CERTIFICATE_EXPIRY_WARNING_DAYS
from models import Certificate, Notification, VerificationApplication
from services.notification_service import create


def check_expiry(db: Session) -> int:
    now = datetime.utcnow()
    warning_date = now + timedelta(days=CERTIFICATE_EXPIRY_WARNING_DAYS)
    changed = 0
    certificates = db.query(Certificate).filter(Certificate.expires_at.is_not(None)).all()
    for certificate in certificates:
        # Revocation is a terminal administrative state and must never be
        # overwritten by the time-based expiry checker.
        if certificate.status == "REVOKED":
            continue

        application = db.query(VerificationApplication).filter(
            VerificationApplication.id == certificate.application_id,
        ).first()
        if not application:
            continue
        new_status = "EXPIRED" if certificate.expires_at <= now else (
            "EXPIRING_SOON" if certificate.expires_at <= warning_date else "VALID"
        )
        if certificate.status != new_status:
            certificate.status = new_status
            changed += 1
        if new_status in {"EXPIRED", "EXPIRING_SOON"}:
            existing = db.query(Notification).filter(
                Notification.user_id == application.user_id,
                Notification.type == f"CERTIFICATE_{new_status}",
                Notification.related_entity_type == "certificate",
                Notification.related_entity_id == str(certificate.id),
            ).first()
            if not existing:
                create(
                    db,
                    application.user_id,
                    "Certificate status update",
                    f"Certificate {certificate.certificate_number} is {new_status.lower().replace('_', ' ')}.",
                    f"CERTIFICATE_{new_status}",
                    "certificate",
                    certificate.id,
                )
    db.commit()
    return changed