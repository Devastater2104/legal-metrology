from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from config import CERTIFICATE_EXPIRY_WARNING_DAYS
from models import Certificate, Inspection, Instrument, VerificationApplication


def certificate_state(certificate: Certificate | None) -> str:
    if not certificate:
        return "REVERIFICATION_REQUIRED"

    if certificate.status == "REVOKED":
        return "REVOKED"

    if certificate.expires_at and certificate.expires_at <= datetime.utcnow():
        return "EXPIRED"

    if (
        certificate.expires_at
        and certificate.expires_at
        <= datetime.utcnow() + timedelta(days=CERTIFICATE_EXPIRY_WARNING_DAYS)
    ):
        return "EXPIRING_SOON"

    return "VALID"


def instrument_risk(db: Session, instrument_id: int) -> dict:
    instrument = (
        db.query(Instrument)
        .filter(Instrument.id == instrument_id)
        .first()
    )

    if not instrument:
        return {
            "level": "HIGH",
            "score": 100,
            "reasons": ["Instrument not found"],
        }

    applications = (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.instrument_id == instrument_id
        )
        .all()
    )

    certificate = None

    for application in applications:
        certificate = (
            db.query(Certificate)
            .filter(
                Certificate.application_id == application.id
            )
            .first()
        )

        if certificate:
            break

    reasons = []
    score = 0

    state = certificate_state(certificate)

    if state == "EXPIRED":
        score += 50
        reasons.append("Certificate expired")

    if state == "REVOKED":
        score += 60
        reasons.append("Certificate revoked")

    if state == "EXPIRING_SOON":
        score += 20
        reasons.append("Certificate expiring soon")

    if state == "REVERIFICATION_REQUIRED":
        score += 30
        reasons.append("Reverification required")

    failures = (
        db.query(Inspection)
        .join(
            VerificationApplication,
            Inspection.application_id
            == VerificationApplication.id,
        )
        .filter(
            VerificationApplication.instrument_id == instrument_id,
            Inspection.result == "FAIL",
        )
        .count()
    )

    if failures:
        score += 15 + max(0, failures - 1) * 10
        reasons.append(
            f"{failures} previous failed inspection(s)"
        )

    # Only applications that are genuinely waiting for review
    # should be considered pending.
    pending_statuses = {
        "SUBMITTED",
        "UNDER_REVIEW",
    }

    pending = any(
        application.status in pending_statuses
        for application in applications
    )

    if pending:
        score += 10
        reasons.append(
            "Verification application is still pending"
        )

    score = min(100, score)

    level = (
        "HIGH"
        if score >= 60
        else "MEDIUM"
        if score >= 25
        else "LOW"
    )

    return {
        "instrument_id": instrument_id,
        "level": level,
        "score": score,
        "state": state,
        "reasons": reasons
        or ["No active compliance concerns detected"],
    }


def user_summary(db: Session, user_id: int) -> dict:
    instruments = (
        db.query(Instrument)
        .filter(Instrument.owner_id == user_id)
        .all()
    )

    result = [
        instrument_risk(db, instrument.id)
        for instrument in instruments
    ]

    applications = (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.user_id == user_id
        )
        .all()
    )

    certificates = []

    for application in applications:
        certificate = (
            db.query(Certificate)
            .filter(
                Certificate.application_id == application.id
            )
            .first()
        )

        if certificate:
            certificates.append(certificate)

    states = [
        certificate_state(certificate)
        for certificate in certificates
    ]

    return {
        "total_instruments": len(instruments),
        "pending_applications": sum(
            application.status
            not in {"CERTIFICATE_ISSUED", "REJECTED"}
            for application in applications
        ),
        "valid_certificates": states.count("VALID"),
        "expiring_certificates": states.count("EXPIRING_SOON"),
        "expired_certificates": states.count("EXPIRED"),
        "revoked_certificates": states.count("REVOKED"),
        "risks": result,
        "reverification_required": sum(
            item["state"] == "REVERIFICATION_REQUIRED"
            for item in result
        ),
    }