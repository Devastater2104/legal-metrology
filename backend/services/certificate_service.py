import hashlib

from models import Certificate, Inspection, Instrument, User


def calculate_integrity_hash(
    certificate: Certificate,
    owner: User,
    instrument: Instrument,
    inspection: Inspection,
) -> str:
    canonical = "|".join([
        certificate.certificate_number,
        owner.name,
        instrument.instrument_type,
        instrument.manufacturer,
        instrument.model or "",
        instrument.serial_number,
        inspection.measurement,
        inspection.result,
        certificate.issued_at.isoformat() if certificate.issued_at else "",
        certificate.expires_at.isoformat() if certificate.expires_at else "",
    ])
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

def current_certificate_status(certificate: Certificate) -> str:
    """Return the effective certificate status without mutating the database."""
    from services.compliance_service import certificate_state

    return certificate_state(certificate)
