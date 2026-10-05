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


def get_instrument_certificate(
    db: Session,
    instrument: Instrument,
) -> Certificate | None:
    """
    Resolve the certificate applicable to an instrument.

    New shop architecture:
        Shop
          ├── Instrument A
          ├── Instrument B
          └── Instrument C
                  ↓
          One verification application
                  ↓
          One certificate

    Therefore, when an instrument belongs to a shop, a certificate
    issued for any application belonging to an instrument in that
    same shop applies to the whole shop.

    Legacy architecture:
        If shop_id is NULL, retain the old behavior and look only
        at applications for the individual instrument.
    """

    # ---------------------------------------------------------
    # NEW SHOP-LEVEL CERTIFICATE LOGIC
    # ---------------------------------------------------------
    if instrument.shop_id is not None:
        shop_instrument_ids = [
            row[0]
            for row in (
                db.query(Instrument.id)
                .filter(Instrument.shop_id == instrument.shop_id)
                .all()
            )
        ]

        if shop_instrument_ids:
            certificate = (
                db.query(Certificate)
                .join(
                    VerificationApplication,
                    Certificate.application_id
                    == VerificationApplication.id,
                )
                .filter(
                    VerificationApplication.instrument_id.in_(
                        shop_instrument_ids
                    ),
                    VerificationApplication.user_id
                    == instrument.owner_id,
                )
                .order_by(
                    Certificate.issued_at.desc()
                )
                .first()
            )

            if certificate:
                return certificate

    # ---------------------------------------------------------
    # LEGACY / FALLBACK INSTRUMENT-LEVEL LOGIC
    # ---------------------------------------------------------
    return (
        db.query(Certificate)
        .join(
            VerificationApplication,
            Certificate.application_id
            == VerificationApplication.id,
        )
        .filter(
            VerificationApplication.instrument_id
            == instrument.id,
            VerificationApplication.user_id
            == instrument.owner_id,
        )
        .order_by(
            Certificate.issued_at.desc()
        )
        .first()
    )


def instrument_risk(db: Session, instrument_id: int) -> dict:
    instrument = (
        db.query(Instrument)
        .filter(Instrument.id == instrument_id)
        .first()
    )

    if not instrument:
        return {
            "instrument_id": instrument_id,
            "level": "HIGH",
            "score": 100,
            "state": "REVERIFICATION_REQUIRED",
            "reasons": ["Instrument not found"],
        }

    applications = (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.instrument_id == instrument_id
        )
        .all()
    )

    # ---------------------------------------------------------
    # IMPORTANT:
    # Certificate is now resolved at SHOP level when the
    # instrument belongs to a shop.
    # ---------------------------------------------------------
    certificate = get_instrument_certificate(
        db,
        instrument,
    )

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

    # ---------------------------------------------------------
    # Failed inspections remain instrument-specific.
    # ---------------------------------------------------------
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
        "certificate_number": (
            certificate.certificate_number
            if certificate
            else None
        ),
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

    # ---------------------------------------------------------
    # IMPORTANT:
    # Compliance counts are now PER INSTRUMENT, not per
    # certificate.
    #
    # A shop may have:
    #   2 instruments
    #   1 certificate
    #
    # The dashboard should therefore show:
    #   Valid: 2
    #
    # rather than:
    #   Valid: 1
    # ---------------------------------------------------------
    states = [
        item["state"]
        for item in result
    ]

    return {
        "total_instruments": len(instruments),

        "pending_applications": sum(
            application.status
            not in {"CERTIFICATE_ISSUED", "REJECTED"}
            for application in applications
        ),

        "valid_certificates": states.count("VALID"),

        "expiring_certificates": states.count(
            "EXPIRING_SOON"
        ),

        "expired_certificates": states.count(
            "EXPIRED"
        ),

        "revoked_certificates": states.count(
            "REVOKED"
        ),

        "risks": result,

        "reverification_required": states.count(
            "REVERIFICATION_REQUIRED"
        ),
    }