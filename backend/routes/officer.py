from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import (
    Inspection,
    InspectionPhoto,
    Instrument,
    Shop,
    User,
    VerificationApplication,
)
from schemas import ApplicationResponse, InspectionCreate, InspectionResponse, OCRFieldResponse
from services import audit_service, notification_service, ocr_service
from services.analytics_service import officer_workload


router = APIRouter(prefix="/officer", tags=["Officer"])


@router.get("/dashboard")
def officer_dashboard(current_user: User = Depends(require_role("OFFICER"))):
    return {
        "message": "Officer dashboard access granted",
        "user_id": current_user.id,
        "role": current_user.role,
    }


@router.get("/applications", response_model=list[ApplicationResponse])
def list_assigned_applications(
    current_user: User = Depends(require_role("OFFICER")),
    db: Session = Depends(get_db),
):
    applications = (
        db.query(VerificationApplication)
        .filter(
            VerificationApplication.assigned_officer_id == current_user.id
        )
        .order_by(VerificationApplication.id.desc())
        .all()
    )

    result = []

    for application in applications:
        instrument = (
            db.query(Instrument)
            .filter(Instrument.id == application.instrument_id)
            .first()
        )

        shop = None
        if instrument and instrument.shop_id:
            shop = (
                db.query(Shop)
                .filter(Shop.id == instrument.shop_id)
                .first()
            )

        user = (
            db.query(User)
            .filter(User.id == application.user_id)
            .first()
        )

        result.append({
            "id": application.id,
            "user_id": application.user_id,
            "instrument_id": application.instrument_id,
            "assigned_officer_id": application.assigned_officer_id,
            "status": application.status,
            "priority": application.priority,
            "scheduled_at": application.scheduled_at,
            "created_at": application.created_at,
            "notes": application.notes,

            "instrument": instrument,
            "shop": shop,
            "user": user,

            "business_name": shop.name if shop else None,
            "shop_address": shop.address if shop else None,
            "shop_gst_number": shop.gst_number if shop else None,
            "shop_latitude": shop.latitude if shop else None,
            "shop_longitude": shop.longitude if shop else None,
        })

    return result


@router.post("/applications/{application_id}/ocr", response_model=OCRFieldResponse)
async def process_inspection_photo(
    application_id: int,
    photo: UploadFile = File(...),
    current_user: User = Depends(require_role("OFFICER")),
    db: Session = Depends(get_db),
):
    application = db.query(VerificationApplication).filter(
        VerificationApplication.id == application_id,
        VerificationApplication.assigned_officer_id == current_user.id,
    ).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned application not found")

    audit_service.log(db, "OCR_PROCESSING_STARTED", "application", application.id, current_user)
    db.commit()
    try:
        content = await photo.read(ocr_service.MAX_IMAGE_BYTES + 1)
        photo_id, extracted, storage_name = ocr_service.process_image(
            content,
            photo.content_type or "",
        )
    except (ValueError, RuntimeError) as ocr_error:
        audit_service.log(db, "OCR_PROCESSING_FAILED", "application", application.id, current_user, str(ocr_error))
        db.commit()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ocr_error))

    db.add(InspectionPhoto(
        id=photo_id,
        application_id=application.id,
        uploaded_by=current_user.id,
        storage_name=storage_name,
        content_type=photo.content_type or "application/octet-stream",
    ))
    audit_service.log(db, "OCR_PROCESSING_COMPLETED", "application", application.id, current_user, "OCR suggestions generated")
    db.commit()
    instrument = db.query(Instrument).filter(Instrument.id == application.instrument_id).first()
    extracted["photo_id"] = photo_id
    extracted["photo_url"] = f"/officer/inspection-photos/{photo_id}"
    extracted["registered_instrument"] = {
        "manufacturer": instrument.manufacturer,
        "model": instrument.model,
        "serial_number": instrument.serial_number,
        "capacity": instrument.capacity,
    }
    return extracted


@router.get("/inspection-photos/{photo_id}")
def get_inspection_photo(
    photo_id: str,
    current_user: User = Depends(require_role("OFFICER", "ADMIN", "USER")),
    db: Session = Depends(get_db),
):
    photo = db.query(InspectionPhoto).filter(InspectionPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    application = db.query(VerificationApplication).filter(
        VerificationApplication.id == photo.application_id,
    ).first()
    if current_user.role == "OFFICER" and application.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Photo access denied")
    if current_user.role == "USER" and application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Photo access denied")
    path = ocr_service.UPLOAD_ROOT / photo.storage_name
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo file not found")
    return Response(content=path.read_bytes(), media_type=photo.content_type)


@router.post(
    "/applications/{application_id}/inspection",
    response_model=InspectionResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_inspection(
    application_id: int,
    inspection_data: InspectionCreate,
    current_user: User = Depends(require_role("OFFICER")),
    db: Session = Depends(get_db),
):
    application = db.query(VerificationApplication).filter(
        VerificationApplication.id == application_id,
        VerificationApplication.assigned_officer_id == current_user.id,
    ).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned application not found")

    existing_inspection = db.query(Inspection).filter(
        Inspection.application_id == application.id,
    ).first()
    if existing_inspection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This application already has an inspection",
        )

    photos = db.query(InspectionPhoto).filter(
        InspectionPhoto.id.in_(inspection_data.photo_ids),
        InspectionPhoto.application_id == application.id,
        InspectionPhoto.uploaded_by == current_user.id,
    ).all() if inspection_data.photo_ids else []
    if len(photos) != len(set(inspection_data.photo_ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid inspection photo reference")

    inspection = Inspection(
        application_id=application.id,
        officer_id=current_user.id,
        gst_number=inspection_data.gst_number,
        measurement=inspection_data.measurement,
        observations=inspection_data.observations,
        result=inspection_data.result,
        latitude=inspection_data.latitude,
        longitude=inspection_data.longitude,
        captured_at=inspection_data.captured_at,
        ocr_data=inspection_data.ocr_data,
        photo_urls=[f"/officer/inspection-photos/{photo.id}" for photo in photos],
    )
    application.status = "INSPECTED"
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    audit_service.log(db, "INSPECTION_SUBMITTED", "inspection", inspection.id, current_user)
    notification_service.create(
        db,
        application.user_id,
        "Inspection completed",
        f"Inspection for application #{application.id} was completed with result {inspection.result}.",
        "INSPECTION_COMPLETED",
        "application",
        application.id,
    )
    db.commit()
    return inspection


@router.get("/inspections", response_model=list[InspectionResponse])
def list_inspections(
    current_user: User = Depends(require_role("OFFICER")),
    db: Session = Depends(get_db),
):
    return (
        db.query(Inspection)
        .filter(Inspection.officer_id == current_user.id)
        .order_by(Inspection.id.desc())
        .all()
    )


@router.get("/workload")
def officer_workload_summary(current_user: User = Depends(require_role("OFFICER")), db: Session = Depends(get_db)):
    return next((item for item in officer_workload(db) if item["officer_id"] == current_user.id), {
        "officer_id": current_user.id,
        "officer_name": current_user.name,
        "assigned_applications": 0,
        "completed_inspections": 0,
        "passed_inspections": 0,
        "failed_inspections": 0,
    })
