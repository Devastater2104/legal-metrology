import io
import os

import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Certificate, Inspection, Instrument, VerificationApplication
from schemas import PublicCertificateResponse
from services import audit_service
from services.compliance_service import certificate_state


router = APIRouter(prefix="/public", tags=["Public Verification"])


@router.get(
    "/certificates/{certificate_number}",
    response_model=PublicCertificateResponse,
)
def verify_certificate(certificate_number: str, db: Session = Depends(get_db)):
    record = (
        db.query(Certificate, Instrument, Inspection)
        .join(
            VerificationApplication,
            Certificate.application_id == VerificationApplication.id,
        )
        .join(Instrument, VerificationApplication.instrument_id == Instrument.id)
        .join(Inspection, Inspection.application_id == VerificationApplication.id)
        .filter(Certificate.certificate_number == certificate_number)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )

    certificate, instrument, inspection = record
    audit_service.log(db, "PUBLIC_CERTIFICATE_VERIFIED", "certificate", certificate.id)
    db.commit()
    return {
        "certificate_number": certificate.certificate_number,
        "status": certificate_state(certificate),
        "issued_at": certificate.issued_at,
        "expires_at": certificate.expires_at,
        "instrument_type": instrument.instrument_type,
        "manufacturer": instrument.manufacturer,
        "model": instrument.model,
        "serial_number": instrument.serial_number,
        "inspection_result": inspection.result,
        "integrity_hash": certificate.integrity_hash,
    }


@router.get("/certificates/{certificate_number}/qr", response_class=StreamingResponse)
def certificate_qr(certificate_number: str, db: Session = Depends(get_db)):
    certificate = db.query(Certificate).filter(
        Certificate.certificate_number == certificate_number,
    ).first()
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )

    app_url = os.getenv("PUBLIC_APP_URL", "http://127.0.0.1:5173")
    verification_url = f"{app_url.rstrip('/')}/verify/{certificate.certificate_number}"
    image = qrcode.make(verification_url)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="image/png")