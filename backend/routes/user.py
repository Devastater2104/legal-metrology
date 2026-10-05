from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import (
    Certificate,
    Instrument,
    Shop,
    User,
    VerificationApplication,
)
from schemas import (
    ApplicationCreate,
    ApplicationResponse,
    CertificateResponse,
    InstrumentCreate,
    InstrumentResponse,
    ShopCreate,
    ShopDetailResponse,
    ShopSummary,
)
from services import audit_service, notification_service
from services.compliance_service import certificate_state, user_summary


router = APIRouter(prefix="/user", tags=["User"])


@router.get("/dashboard")
def user_dashboard(
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    shops = (
        db.query(Shop)
        .filter(Shop.owner_id == current_user.id)
        .order_by(Shop.id.desc())
        .all()
    )

    instruments = (
        db.query(Instrument)
        .filter(Instrument.owner_id == current_user.id)
        .all()
    )

    applications = (
        db.query(VerificationApplication)
        .filter(VerificationApplication.user_id == current_user.id)
        .all()
    )

    pending_statuses = {
        "SUBMITTED",
        "UNDER_REVIEW",
        "ASSIGNED",
        "SCHEDULED",
        "INSPECTION_PENDING",
    }

    return {
        "message": "User dashboard access granted",
        "user_id": current_user.id,
        "role": current_user.role,
        "shop_count": len(shops),
        "instrument_count": len(instruments),
        "pending_verification_count": sum(
            1
            for application in applications
            if application.status in pending_statuses
        ),
        "shops": [
            {
                "id": shop.id,
                "owner_id": shop.owner_id,
                "name": shop.name,
                "gst_number": shop.gst_number,
                "address": shop.address,
                "latitude": shop.latitude,
                "longitude": shop.longitude,
                "created_at": shop.created_at,
                "instrument_count": sum(
                    1
                    for instrument in instruments
                    if instrument.shop_id == shop.id
                ),
                "pending_verification_count": sum(
                    1
                    for application in applications
                    if application.status in pending_statuses
                    and any(
                        instrument.id == application.instrument_id
                        and instrument.shop_id == shop.id
                        for instrument in instruments
                    )
                ),
            }
            for shop in shops
        ],
    }


@router.post(
    "/shops",
    response_model=ShopSummary,
    status_code=status.HTTP_201_CREATED,
)
def create_shop(
    shop_data: ShopCreate,
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    shop = Shop(
        owner_id=current_user.id,
        **shop_data.model_dump(),
    )

    db.add(shop)
    db.commit()
    db.refresh(shop)

    audit_service.log(
        db,
        "SHOP_CREATED",
        "shop",
        shop.id,
        current_user,
    )
    db.commit()

    return {
        **shop.__dict__,
        "instrument_count": 0,
        "pending_verification_count": 0,
    }


@router.get(
    "/shops",
    response_model=list[ShopSummary],
)
def list_shops(
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    shops = (
        db.query(Shop)
        .filter(Shop.owner_id == current_user.id)
        .order_by(Shop.id.desc())
        .all()
    )

    instruments = (
        db.query(Instrument)
        .filter(Instrument.owner_id == current_user.id)
        .all()
    )

    applications = (
        db.query(VerificationApplication)
        .filter(VerificationApplication.user_id == current_user.id)
        .all()
    )

    pending_statuses = {
        "SUBMITTED",
        "UNDER_REVIEW",
        "ASSIGNED",
        "SCHEDULED",
        "INSPECTION_PENDING",
    }

    result = []

    for shop in shops:
        shop_instrument_ids = {
            instrument.id
            for instrument in instruments
            if instrument.shop_id == shop.id
        }

        pending_count = sum(
            1
            for application in applications
            if application.instrument_id in shop_instrument_ids
            and application.status in pending_statuses
        )

        result.append(
            {
                "id": shop.id,
                "owner_id": shop.owner_id,
                "name": shop.name,
                "gst_number": shop.gst_number,
                "address": shop.address,
                "latitude": shop.latitude,
                "longitude": shop.longitude,
                "created_at": shop.created_at,
                "instrument_count": len(shop_instrument_ids),
                "pending_verification_count": pending_count,
            }
        )

    return result


@router.delete("/shops/{shop_id}")
def delete_shop(
    shop_id: int,
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    # Safety rule: shops with instruments cannot be deleted because
    # verification/certificate history may depend on them.
    shop = (
        db.query(Shop)
        .filter(
            Shop.id == shop_id,
            Shop.owner_id == current_user.id,
        )
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    instrument_count = (
        db.query(Instrument)
        .filter(Instrument.shop_id == shop.id)
        .count()
    )

    if instrument_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This shop cannot be deleted because it has "
                f"{instrument_count} registered instrument(s). "
                "This protects verification and certificate records."
            ),
        )

    db.delete(shop)
    db.commit()

    audit_service.log(
        db,
        "SHOP_DELETED",
        "shop",
        shop_id,
        current_user,
    )
    db.commit()

    return {
        "message": "Shop deleted successfully",
        "shop_id": shop_id,
    }


@router.get(
    "/shops/{shop_id}",
    response_model=ShopDetailResponse,
)
def get_shop(
    shop_id: int,
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    shop = (
        db.query(Shop)
        .filter(
            Shop.id == shop_id,
            Shop.owner_id == current_user.id,
        )
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    instruments = (
        db.query(Instrument)
        .filter(
            Instrument.shop_id == shop.id,
            Instrument.owner_id == current_user.id,
        )
        .order_by(Instrument.id.desc())
        .all()
    )

    return {
        "id": shop.id,
        "owner_id": shop.owner_id,
        "name": shop.name,
        "gst_number": shop.gst_number,
        "address": shop.address,
        "latitude": shop.latitude,
        "longitude": shop.longitude,
        "created_at": shop.created_at,
        "instruments": instruments,
    }


@router.get(
    "/shops/{shop_id}/instruments",
    response_model=list[InstrumentResponse],
)
def list_shop_instruments(
    shop_id: int,
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    shop = (
        db.query(Shop)
        .filter(
            Shop.id == shop_id,
            Shop.owner_id == current_user.id,
        )
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    return (
        db.query(Instrument)
        .filter(
            Instrument.shop_id == shop.id,
            Instrument.owner_id == current_user.id,
        )
        .order_by(Instrument.id.desc())
        .all()
    )


def _create_instrument(
    instrument_data: InstrumentCreate,
    current_user: User,
    db: Session,
    shop: Shop | None,
):
    payload = instrument_data.model_dump()

    # The shop is now canonical. Do not copy shop address/GPS into a new
    # instrument when it belongs to a shop.
    if shop:
        payload["shop_id"] = shop.id
        payload["location"] = shop.address
        payload["latitude"] = shop.latitude
        payload["longitude"] = shop.longitude

    instrument = Instrument(
        owner_id=current_user.id,
        **payload,
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

    audit_service.log(
        db,
        "INSTRUMENT_CREATED",
        "instrument",
        instrument.id,
        current_user,
    )
    db.commit()

    return instrument


@router.post(
    "/shops/{shop_id}/instruments",
    response_model=InstrumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_shop_instrument(
    shop_id: int,
    instrument_data: InstrumentCreate,
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    shop = (
        db.query(Shop)
        .filter(
            Shop.id == shop_id,
            Shop.owner_id == current_user.id,
        )
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    return _create_instrument(
        instrument_data,
        current_user,
        db,
        shop,
    )


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
    # Backward-compatible endpoint. New UI should use
    # POST /user/shops/{shop_id}/instruments.
    shop = None

    if instrument_data.shop_id is not None:
        shop = (
            db.query(Shop)
            .filter(
                Shop.id == instrument_data.shop_id,
                Shop.owner_id == current_user.id,
            )
            .first()
        )

        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shop not found",
            )

    return _create_instrument(
        instrument_data,
        current_user,
        db,
        shop,
    )


@router.get(
    "/instruments",
    response_model=list[InstrumentResponse],
)
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
    "/instruments/{instrument_id}/application",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def apply_for_instrument_verification(
    instrument_id: int,
    application_data: ApplicationCreate,
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    if application_data.instrument_id != instrument_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Instrument ID does not match application request",
        )

    return create_application(
        application_data,
        current_user,
        db,
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

    audit_service.log(
        db,
        "APPLICATION_SUBMITTED",
        "application",
        application.id,
        current_user,
    )

    admins = (
        db.query(User)
        .filter(User.role == "ADMIN")
        .all()
    )

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


@router.get(
    "/applications",
    response_model=list[ApplicationResponse],
)
def list_applications(
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    return (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.user_id
            == current_user.id
        )
        .order_by(
            VerificationApplication.id.desc()
        )
        .all()
    )


@router.get(
    "/certificates",
    response_model=list[CertificateResponse],
)
def list_certificates(
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    certificates = (
        db.query(Certificate)
        .join(
            VerificationApplication,
            Certificate.application_id
            == VerificationApplication.id,
        )
        .filter(
            VerificationApplication.user_id
            == current_user.id
        )
        .order_by(
            Certificate.id.desc()
        )
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
def compliance_summary(
    current_user: User = Depends(require_role("USER")),
    db: Session = Depends(get_db),
):
    return user_summary(
        db,
        current_user.id,
    )
