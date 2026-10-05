from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: str = "USER"
    organization: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    organization: Optional[str] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    actor_role: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    description: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class InstrumentCreate(BaseModel):
    instrument_type: str
    manufacturer: str
    model: Optional[str] = None
    serial_number: str
    capacity: Optional[str] = None
    accuracy_class: Optional[str] = None
    location: Optional[str] = None


class InstrumentResponse(InstrumentCreate):
    id: int
    owner_id: int

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    instrument_id: int
    notes: Optional[str] = None


class ApplicationResponse(ApplicationCreate):
    id: int
    user_id: int
    assigned_officer_id: Optional[int] = None
    status: str
    priority: str = "NORMAL"
    scheduled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationAssignment(BaseModel):
    officer_id: int


class InspectionSchedule(BaseModel):
    officer_id: int
    scheduled_at: datetime


class OfficerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


class InspectionCreate(BaseModel):
    measurement: str
    gst_number: Optional[str] = None
    observations: Optional[str] = None
    result: Literal["PASS", "FAIL"]
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    captured_at: datetime
    ocr_data: Optional[dict] = None
    photo_ids: list[str] = Field(default_factory=list)


class InspectionResponse(BaseModel):
    measurement: str
    observations: Optional[str] = None
    result: Literal["PASS", "FAIL"]
    id: int
    application_id: int
    officer_id: int
    gst_number: Optional[str] = None
    inspected_at: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    captured_at: Optional[datetime] = None
    ocr_data: Optional[dict] = None
    photo_urls: Optional[list[str]] = None

    class Config:
        from_attributes = True


class OCRFieldResponse(BaseModel):
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    capacity: Optional[str] = None
    raw_text: str
    confidence: Optional[dict] = None
    photo_id: str
    photo_url: str
    registered_instrument: Optional[dict] = None


class CertificateResponse(BaseModel):
    id: int
    application_id: int
    certificate_number: str
    issued_by: int
    status: str
    issued_at: datetime
    expires_at: Optional[datetime] = None
    integrity_hash: Optional[str] = None
    revoked_at: Optional[datetime] = None
    revocation_reason: Optional[str] = None

    class Config:
        from_attributes = True


class PublicCertificateResponse(BaseModel):
    certificate_number: str
    status: str
    issued_at: datetime
    expires_at: Optional[datetime] = None
    instrument_type: str
    manufacturer: str
    model: Optional[str] = None
    serial_number: str
    inspection_result: str
    integrity_hash: Optional[str] = None


class CertificateRevocation(BaseModel):
    reason: str