from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import Certificate, Instrument, User, VerificationApplication
from schemas import (
    ApplicationCreate,
    ApplicationResponse,
    CertificateResponse,
    InstrumentCreate,
    InstrumentResponse,
)
from services import audit_service, notification_service
from services.compliance_service import certificate_state, user_summary


router = APIRouter(prefix="/user", tags=["User"])


@router.get("/dashboard")
def user_dashboard(current_user: User = Depends(require_role("USER"))):
    return {
        "message": "User dashboard access granted",
        "user_id": current_user.id,
        "role": current_user.role,
    }


@router.post(
    "/instruments",
    response_model=InstrumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_instrument(
    instrument_data: InstrumentCreate,
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    instrument = Instrument(
        owner_id=current_user.id,
        **instrument_data.model_dump(),
    )
    db.add(instrument)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Serial number already registered",
        )

    db.refresh(instrument)
    audit_service.log(db, "INSTRUMENT_CREATED", "instrument", instrument.id, current_user)
    db.commit()
    return instrument


@router.get("/instruments", response_model=list[InstrumentResponse])
def list_instruments(
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    return (
        db.query(Instrument)
        .filter(Instrument.owner_id == current_user.id)
        .order_by(Instrument.id.desc())
        .all()
    )


@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    instrument = (
        db.query(Instrument)
        .filter(
            Instrument.id == application_data.instrument_id,
            Instrument.owner_id == current_user.id,
        )
        .first()
    )
    if not instrument:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instrument not found",
        )

    active_application = (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.instrument_id == instrument.id,
            VerificationApplication.status != "REJECTED",
        )
        .first()
    )
    if active_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This instrument already has an active application",
        )

    application = VerificationApplication(
        user_id=current_user.id,
        **application_data.model_dump(),
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    audit_service.log(db, "APPLICATION_SUBMITTED", "application", application.id, current_user)
    admins = db.query(User).filter(User.role == "ADMIN").all()
    for admin in admins:
        notification_service.create(
            db,
            admin.id,
            "New verification application",
            f"Application #{application.id} was submitted.",
            "APPLICATION_SUBMITTED",
            "application",
            application.id,
        )
    db.commit()
    return application


@router.get("/applications", response_model=list[ApplicationResponse])
def list_applications(
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    return (
        db.query(VerificationApplication)
        .filter(VerificationApplication.user_id == current_user.id)
        .order_by(VerificationApplication.id.desc())
        .all()
    )


@router.get("/certificates", response_model=list[CertificateResponse])
def list_certificates(
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    certificates = (
        db.query(Certificate)
        .join(VerificationApplication, Certificate.application_id == VerificationApplication.id)
        .filter(VerificationApplication.user_id == current_user.id)
        .order_by(Certificate.id.desc())
        .all()
    )
    return [
        {
            "id": certificate.id,
            "application_id": certificate.application_id,
            "certificate_number": certificate.certificate_number,
            "issued_by": certificate.issued_by,
            "status": certificate_state(certificate),
            "issued_at": certificate.issued_at,
            "expires_at": certificate.expires_at,
            "integrity_hash": certificate.integrity_hash,
            "revoked_at": certificate.revoked_at,
            "revocation_reason": certificate.revocation_reason,
        }
        for certificate in certificates
    ]


@router.get("/compliance/summary")
def compliance_summary(current_user: User = Depends(require_role("USER")), db: Session = Depends(get_db)):
    return user_summary(db, current_user.id)
