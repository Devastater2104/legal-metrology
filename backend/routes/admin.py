from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import (
    Certificate,
    Inspection,
    Instrument,
    Shop,
    User,
    VerificationApplication,
)
from schemas import (
    ApplicationAssignment,
    InspectionSchedule,
    ApplicationResponse,
    CertificateRevocation,
    CertificateResponse,
    InspectionResponse,
    OfficerResponse,
    AuditLogResponse,
)
from services import (
    audit_service,
    expiry_service,
    notification_service,
)
from services.certificate_service import calculate_integrity_hash
from services.compliance_service import certificate_state
from services import (
    analytics_service,
    compliance_service,
    scheduling_service,
)
from config import CERTIFICATE_VALIDITY_DAYS


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
def admin_dashboard(
    current_user: User = Depends(require_role("ADMIN")),
):
    return {
        "message": "Admin dashboard access granted",
        "user_id": current_user.id,
        "role": current_user.role,
    }


@router.get(
    "/officers",
    response_model=list[OfficerResponse],
)
def list_officers(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    return (
        db.query(User)
        .filter(User.role == "OFFICER")
        .order_by(User.name)
        .all()
    )


@router.get(
    "/applications",
    response_model=list[ApplicationResponse],
)
def list_applications(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    return (
        db.query(VerificationApplication)
        .order_by(VerificationApplication.id.desc())
        .all()
    )


@router.patch(
    "/applications/{application_id}/assign",
    response_model=ApplicationResponse,
)
def assign_application(
    application_id: int,
    assignment: ApplicationAssignment,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    application = (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    officer = (
        db.query(User)
        .filter(
            User.id == assignment.officer_id,
            User.role == "OFFICER",
        )
        .first()
    )

    if not officer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Officer not found",
        )

    application.assigned_officer_id = officer.id
    application.status = "ASSIGNED"

    db.commit()
    db.refresh(application)

    audit_service.log(
        db,
        "OFFICER_ASSIGNED",
        "application",
        application.id,
        current_user,
    )

    notification_service.create(
        db,
        application.user_id,
        "Application assigned",
        f"Application #{application.id} has been assigned for review.",
        "APPLICATION_ASSIGNED",
        "application",
        application.id,
    )

    notification_service.create(
        db,
        officer.id,
        "New application assignment",
        f"Application #{application.id} is assigned to you.",
        "APPLICATION_ASSIGNED",
        "application",
        application.id,
    )

    db.commit()

    return application


@router.get(
    "/inspections",
    response_model=list[InspectionResponse],
)
def list_inspections(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    return (
        db.query(Inspection)
        .order_by(Inspection.id.desc())
        .all()
    )


@router.post(
    "/applications/{application_id}/certificate",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED,
)
def issue_certificate(
    application_id: int,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    application = (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    inspection = (
        db.query(Inspection)
        .filter(
            Inspection.application_id == application.id
        )
        .first()
    )

    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inspection is required first",
        )

    if inspection.result != "PASS":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only passed inspections can be certified",
        )

    existing_certificate = (
        db.query(Certificate)
        .filter(
            Certificate.application_id == application.id
        )
        .first()
    )

    if existing_certificate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Certificate already issued",
        )

    certificate = Certificate(
        application_id=application.id,
        certificate_number="PENDING",
        issued_by=current_user.id,
        expires_at=datetime.utcnow()
        + timedelta(days=CERTIFICATE_VALIDITY_DAYS),
    )

    db.add(certificate)
    db.flush()

    certificate.certificate_number = (
        f"LM-{certificate.issued_at.year}-{certificate.id:06d}"
    )

    owner = (
        db.query(User)
        .filter(User.id == application.user_id)
        .first()
    )

    instrument = (
        db.query(Instrument)
        .filter(
            Instrument.id == application.instrument_id
        )
        .first()
    )

    certificate.integrity_hash = calculate_integrity_hash(
        certificate,
        owner,
        instrument,
        inspection,
    )

    application.status = "CERTIFICATE_ISSUED"

    db.commit()
    db.refresh(certificate)

    audit_service.log(
        db,
        "CERTIFICATE_ISSUED",
        "certificate",
        certificate.id,
        current_user,
    )

    notification_service.create(
        db,
        application.user_id,
        "Certificate issued",
        f"Certificate {certificate.certificate_number} is now available.",
        "CERTIFICATE_ISSUED",
        "certificate",
        certificate.id,
    )

    db.commit()

    return certificate



@router.get("/certification-shops")
def list_certification_shops(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    shops = db.query(Shop).order_by(Shop.id.desc()).all()
    result = []

    for shop in shops:
        instruments = (
            db.query(Instrument)
            .filter(Instrument.shop_id == shop.id)
            .order_by(Instrument.id.asc())
            .all()
        )

        rows = []

        for instrument in instruments:
            application = (
                db.query(VerificationApplication)
                .filter(VerificationApplication.instrument_id == instrument.id)
                .order_by(VerificationApplication.id.desc())
                .first()
            )
            if not application:
                continue

            inspection = (
                db.query(Inspection)
                .filter(Inspection.application_id == application.id)
                .order_by(Inspection.id.desc())
                .first()
            )

            certificate = (
                db.query(Certificate)
                .filter(Certificate.application_id == application.id)
                .order_by(Certificate.id.desc())
                .first()
            )

            rows.append({
                "instrument_id": instrument.id,
                "application_id": application.id,
                "instrument_type": instrument.instrument_type,
                "measurement_type": instrument.measurement_type,
                "manufacturer": instrument.manufacturer,
                "model": instrument.model,
                "serial_number": instrument.serial_number,
                "capacity": instrument.capacity,
                "accuracy_class": instrument.accuracy_class,
                "application_status": application.status,
                "application_priority": application.priority,
                "inspection": (
                    {
                        "id": inspection.id,
                        "result": inspection.result,
                        "measurement": inspection.measurement,
                        "observations": inspection.observations,
                        "latitude": inspection.latitude,
                        "longitude": inspection.longitude,
                        "captured_at": inspection.captured_at,
                        "inspected_at": inspection.inspected_at,
                        "officer_id": inspection.officer_id,
                    }
                    if inspection else None
                ),
                "certificate": (
                    {
                        "id": certificate.id,
                        "certificate_number": certificate.certificate_number,
                        "status": certificate_state(certificate),
                        "issued_at": certificate.issued_at,
                        "expires_at": certificate.expires_at,
                    }
                    if certificate else None
                ),
            })

        if not rows:
            continue

        passed = sum(
            1 for row in rows
            if row["inspection"] and row["inspection"]["result"] == "PASS"
        )
        failed = sum(
            1 for row in rows
            if row["inspection"] and row["inspection"]["result"] == "FAIL"
        )
        ready = sum(
            1 for row in rows
            if row["inspection"]
            and row["inspection"]["result"] == "PASS"
            and not row["certificate"]
        )

        result.append({
            "shop": {
                "id": shop.id,
                "name": shop.name,
                "gst_number": shop.gst_number,
                "address": shop.address,
                "latitude": shop.latitude,
                "longitude": shop.longitude,
            },
            "total_instruments": len(rows),
            "passed": passed,
            "failed": failed,
            "certificates_ready": ready,
            "instruments": rows,
        })

    return result


@router.post("/shops/{shop_id}/certificates")
def issue_shop_certificates(
    shop_id: int,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    """
    Issue exactly ONE certificate for a shop.

    Every instrument in the shop must have a completed PASS inspection.
    If even one instrument is missing, pending, or FAIL, nothing is created.
    """

    shop = db.query(Shop).filter(Shop.id == shop_id).first()

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    instruments = (
        db.query(Instrument)
        .filter(Instrument.shop_id == shop.id)
        .order_by(Instrument.id.asc())
        .all()
    )

    if not instruments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No instruments found for this shop",
        )

    # Validate EVERY instrument before creating anything.
    instrument_records = []

    for instrument in instruments:
        application = (
            db.query(VerificationApplication)
            .filter(
                VerificationApplication.instrument_id == instrument.id
            )
            .order_by(VerificationApplication.id.desc())
            .first()
        )

        if not application:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Shop cannot be certified. Instrument "
                    f"{instrument.serial_number} has no verification application."
                ),
            )

        inspection = (
            db.query(Inspection)
            .filter(
                Inspection.application_id == application.id
            )
            .order_by(Inspection.id.desc())
            .first()
        )

        if not inspection:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Shop cannot be certified. Instrument "
                    f"{instrument.serial_number} has no completed inspection."
                ),
            )

        if inspection.result != "PASS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Shop cannot be certified. Instrument "
                    f"{instrument.serial_number} has result "
                    f"{inspection.result}, not PASS."
                ),
            )

        instrument_records.append(
            {
                "instrument": instrument,
                "application": application,
                "inspection": inspection,
            }
        )

    # Check whether this shop already has a certificate.
    application_ids = [
        record["application"].id
        for record in instrument_records
    ]

    existing_shop_certificate = (
        db.query(Certificate)
        .filter(
            Certificate.application_id.in_(application_ids)
        )
        .order_by(Certificate.id.asc())
        .first()
    )

    if existing_shop_certificate:
        return {
            "id": existing_shop_certificate.id,
            "application_id": existing_shop_certificate.application_id,
            "certificate_number": existing_shop_certificate.certificate_number,
            "issued_by": existing_shop_certificate.issued_by,
            "status": certificate_state(existing_shop_certificate),
            "issued_at": existing_shop_certificate.issued_at,
            "expires_at": existing_shop_certificate.expires_at,
            "integrity_hash": existing_shop_certificate.integrity_hash,
            "revoked_at": existing_shop_certificate.revoked_at,
            "revocation_reason": existing_shop_certificate.revocation_reason,
        }

    # ALL instruments passed.
    # Create EXACTLY ONE certificate.
    anchor = instrument_records[0]
    application = anchor["application"]
    instrument = anchor["instrument"]
    inspection = anchor["inspection"]

    certificate = Certificate(
        application_id=application.id,
        certificate_number="PENDING",
        issued_by=current_user.id,
        expires_at=(
            datetime.utcnow()
            + timedelta(days=CERTIFICATE_VALIDITY_DAYS)
        ),
    )

    db.add(certificate)
    db.flush()

    certificate.certificate_number = (
        f"LM-{certificate.issued_at.year}-{certificate.id:06d}"
    )

    owner = (
        db.query(User)
        .filter(User.id == application.user_id)
        .first()
    )

    certificate.integrity_hash = calculate_integrity_hash(
        certificate,
        owner,
        instrument,
        inspection,
    )

    # Every instrument application is covered by this ONE shop certificate.
    for record in instrument_records:
        record["application"].status = "CERTIFICATE_ISSUED"

    db.commit()
    db.refresh(certificate)

    audit_service.log(
        db,
        "SHOP_CERTIFICATE_ISSUED",
        "certificate",
        certificate.id,
        current_user,
    )

    notification_service.create(
        db,
        application.user_id,
        "Shop certificate issued",
        (
            f"Certificate {certificate.certificate_number} has been issued "
            f"for {shop.name}, covering "
            f"{len(instrument_records)} instruments."
        ),
        "CERTIFICATE_ISSUED",
        "certificate",
        certificate.id,
    )

    db.commit()

    return {
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


@router.get(
    "/certificates",
    response_model=list[CertificateResponse],
)
def list_certificates(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    certificates = (
        db.query(Certificate)
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


@router.post(
    "/certificates/{certificate_id}/revoke",
    response_model=CertificateResponse,
)
def revoke_certificate(
    certificate_id: int,
    revocation: CertificateRevocation,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    certificate = (
        db.query(Certificate)
        .filter(
            Certificate.id == certificate_id
        )
        .first()
    )

    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )

    if certificate.status == "REVOKED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Certificate already revoked",
        )

    certificate.status = "REVOKED"
    certificate.revoked_at = datetime.utcnow()
    certificate.revocation_reason = revocation.reason

    application = (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.id
            == certificate.application_id
        )
        .first()
    )

    if application:
        application.status = "REJECTED"

        audit_service.log(
            db,
            "CERTIFICATE_REVOKED",
            "certificate",
            certificate.id,
            current_user,
        )

        notification_service.create(
            db,
            application.user_id,
            "Certificate revoked",
            f"Certificate {certificate.certificate_number} was revoked.",
            "CERTIFICATE_REVOKED",
            "certificate",
            certificate.id,
        )

    db.commit()
    db.refresh(certificate)

    return certificate


@router.get(
    "/audit-logs",
    response_model=list[AuditLogResponse],
)
def list_audit_logs(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    from models import AuditLog

    return (
        db.query(AuditLog)
        .order_by(AuditLog.id.desc())
        .limit(200)
        .all()
    )


@router.post("/certificates/check-expiry")
def check_certificate_expiry(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    changed = expiry_service.check_expiry(db)

    audit_service.log(
        db,
        "CERTIFICATE_EXPIRY_CHECKED",
        "certificate",
        user=current_user,
    )

    db.commit()

    return {
        "updated_certificates": changed
    }


@router.get(
    "/scheduling/recommendations/{application_id}"
)
def scheduling_recommendations(
    application_id: int,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    application = (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    return scheduling_service.recommendations(
        db,
        application,
    )


@router.patch(
    "/applications/{application_id}/schedule",
    response_model=ApplicationResponse,
)
def schedule_application(
    application_id: int,
    schedule: InspectionSchedule,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    application = (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.id == application_id
        )
        .first()
    )

    officer = (
        db.query(User)
        .filter(
            User.id == schedule.officer_id,
            User.role == "OFFICER",
        )
        .first()
    )

    if not application or not officer:
        raise HTTPException(
            status_code=404,
            detail="Application or officer not found",
        )

    application.assigned_officer_id = officer.id
    application.scheduled_at = schedule.scheduled_at
    application.status = "SCHEDULED"

    audit_service.log(
        db,
        "INSPECTION_SCHEDULED",
        "application",
        application.id,
        current_user,
    )

    notification_service.create(
        db,
        application.user_id,
        "Inspection scheduled",
        f"Application #{application.id} is scheduled.",
        "INSPECTION_SCHEDULED",
        "application",
        application.id,
    )

    notification_service.create(
        db,
        officer.id,
        "Inspection scheduled",
        f"Application #{application.id} is scheduled.",
        "INSPECTION_SCHEDULED",
        "application",
        application.id,
    )

    db.commit()
    db.refresh(application)

    return application


@router.get("/analytics/overview")
def admin_analytics_overview(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    return analytics_service.overview(db)


@router.get("/analytics/time-series")
def admin_analytics_time_series(
    period: str = "30d",
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    days = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "6m": 180,
        "1y": 365,
    }.get(period, 30)

    return analytics_service.time_series(
        db,
        days,
    )


@router.get("/analytics/officer-workload")
def admin_officer_workload(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    return {
        "officers": analytics_service.officer_workload(db)
    }


@router.get("/compliance/attention")
def compliance_attention(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    items = []

    # Only these statuses are actually waiting for
    # administrative assignment.
    assignment_pending_statuses = {
        "SUBMITTED",
        "UNDER_REVIEW",
    }

    applications = (
        db.query(VerificationApplication)
        .all()
    )

    for application in applications:
        if (
            application.assigned_officer_id is None
            and application.status
            in assignment_pending_statuses
        ):
            items.append(
                {
                    "type": "UNASSIGNED_APPLICATION",
                    "title": "Application awaiting assignment",
                    "description": (
                        f"Application #{application.id} has no officer."
                    ),
                    "related_id": application.id,
                }
            )

    for instrument in (
        db.query(Instrument).all()
    ):
        risk = compliance_service.instrument_risk(
            db,
            instrument.id,
        )

        if risk["level"] != "LOW":
            items.append(
                {
                    "type": "COMPLIANCE_RISK",
                    "title": (
                        f"Instrument #{instrument.id} needs attention"
                    ),
                    "description": "; ".join(
                        risk["reasons"]
                    ),
                    "related_id": instrument.id,
                    "risk": risk,
                }
            )

    return {
        "items": items
    }