from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Certificate, Inspection, Instrument, Shop, User, VerificationApplication
from services import audit_service, pdf_service


router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get("/{certificate_id}/pdf")
def download_certificate_pdf(
    certificate_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(
            Certificate,
            VerificationApplication,
            Instrument,
            Inspection,
            User,
        )
        .join(
            VerificationApplication,
            Certificate.application_id == VerificationApplication.id,
        )
        .join(
            Instrument,
            VerificationApplication.instrument_id == Instrument.id,
        )
        .join(
            Inspection,
            Inspection.application_id == VerificationApplication.id,
        )
        .join(
            User,
            VerificationApplication.user_id == User.id,
        )
        .filter(Certificate.id == certificate_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )

    certificate, application, instrument, inspection, owner = record

    allowed = current_user.role == "ADMIN" or (
        current_user.role == "USER"
        and application.user_id == current_user.id
    ) or (
        current_user.role == "OFFICER"
        and application.assigned_officer_id == current_user.id
    )

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Certificate access denied",
        )

    # The certificate is anchored to one application, but a shop
    # certificate represents every instrument belonging to that shop.
    shop = (
        db.query(Shop)
        .filter(Shop.id == instrument.shop_id)
        .first()
    )

    shop_instruments = []

    if shop:
        instruments = (
            db.query(Instrument)
            .filter(Instrument.shop_id == shop.id)
            .order_by(Instrument.id.asc())
            .all()
        )

        for shop_instrument in instruments:
            shop_application = (
                db.query(VerificationApplication)
                .filter(
                    VerificationApplication.instrument_id
                    == shop_instrument.id
                )
                .order_by(VerificationApplication.id.desc())
                .first()
            )

            if not shop_application:
                continue

            shop_inspection = (
                db.query(Inspection)
                .filter(
                    Inspection.application_id
                    == shop_application.id
                )
                .order_by(Inspection.id.desc())
                .first()
            )

            if not shop_inspection:
                continue

            shop_instruments.append(
                {
                    "instrument": shop_instrument,
                    "application": shop_application,
                    "inspection": shop_inspection,
                }
            )

    officer = (
        db.query(User)
        .filter(User.id == application.assigned_officer_id)
        .first()
    )

    if not officer:
        officer = current_user

    pdf_bytes = pdf_service.generate_certificate_pdf(
        certificate,
        owner,
        instrument,
        inspection,
        officer,
        shop=shop,
        shop_instruments=shop_instruments,
    )

    audit_service.log(
        db,
        "CERTIFICATE_DOWNLOADED",
        "certificate",
        certificate.id,
        current_user,
    )

    db.commit()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{certificate.certificate_number}.pdf"'
            ),
        },
    )

