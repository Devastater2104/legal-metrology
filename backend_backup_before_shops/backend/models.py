from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    email = Column(String, unique=True, index=True, nullable=False)

    phone = Column(String, nullable=True)

    password_hash = Column(String, nullable=False)

    role = Column(String, nullable=False, default="USER")

    organization = Column(String, nullable=True)

    email_verified = Column(Boolean, nullable=False, default=False)
    auth_provider = Column(String, nullable=False, default="local")
    google_subject_id = Column(String, unique=True, nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class Instrument(Base):
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    instrument_type = Column(String, nullable=False)
    manufacturer = Column(String, nullable=False)
    model = Column(String, nullable=True)
    serial_number = Column(String, unique=True, index=True, nullable=False)
    capacity = Column(String, nullable=True)
    accuracy_class = Column(String, nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class VerificationApplication(Base):
    __tablename__ = "verification_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    instrument_id = Column(
        Integer,
        ForeignKey("instruments.id"),
        nullable=False,
        index=True,
    )
    assigned_officer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    status = Column(String, nullable=False, default="SUBMITTED", index=True)
    priority = Column(String, nullable=False, default="NORMAL", index=True)
    scheduled_at = Column(DateTime, nullable=True, index=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(
        Integer,
        ForeignKey("verification_applications.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    gst_number = Column(String(15), nullable=True)
    measurement = Column(String, nullable=False)
    observations = Column(String, nullable=True)
    result = Column(String, nullable=False)
    inspected_at = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    captured_at = Column(DateTime, nullable=True)
    ocr_data = Column(JSON, nullable=True)
    photo_urls = Column(JSON, nullable=True)


class InspectionPhoto(Base):
    __tablename__ = "inspection_photos"

    id = Column(String, primary_key=True)
    application_id = Column(Integer, ForeignKey("verification_applications.id"), nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    storage_name = Column(String, nullable=False, unique=True)
    content_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(
        Integer,
        ForeignKey("verification_applications.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    certificate_number = Column(String, unique=True, index=True, nullable=False)
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="VALID")
    issued_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    integrity_hash = Column(String, nullable=True, index=True)
    revoked_at = Column(DateTime, nullable=True)
    revocation_reason = Column(String, nullable=True)


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_type = Column(String, nullable=False, index=True)
    token_hash = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    actor_role = Column(String, nullable=True)
    action = Column(String, nullable=False, index=True)
    entity_type = Column(String, nullable=True)
    entity_id = Column(String, nullable=True)
    description = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, nullable=False, default="INFO")
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    related_entity_type = Column(String, nullable=True)
    related_entity_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)