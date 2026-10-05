from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Certificate, Inspection, User, VerificationApplication, Instrument
from services.compliance_service import certificate_state, instrument_risk


def overview(db: Session) -> dict:
    applications = db.query(VerificationApplication).all()
    certificates = db.query(Certificate).all()
    inspections = db.query(Inspection).all()
    instruments = db.query(Instrument).all()
    return {
        "instruments": {"total": len(instruments), "verified": sum(instrument_risk(db, i.id)["state"] == "VALID" for i in instruments), "requiring_reverification": sum(instrument_risk(db, i.id)["state"] == "REVERIFICATION_REQUIRED" for i in instruments)},
        "applications": {"total": len(applications), "by_status": {status: sum(a.status == status for a in applications) for status in {a.status for a in applications}}},
        "certificates": {"total": len(certificates), "by_status": {state: sum(certificate_state(c) == state for c in certificates) for state in {certificate_state(c) for c in certificates}}},
        "inspections": {"total": len(inspections), "passed": sum(i.result == "PASS" for i in inspections), "failed": sum(i.result == "FAIL" for i in inspections)},
        "users": {"total": db.query(User).count()},
        "officers": {"total": db.query(User).filter(User.role == "OFFICER").count()},
    }


def officer_workload(db: Session) -> list[dict]:
    officers = db.query(User).filter(User.role == "OFFICER").all()
    return [{
        "officer_id": officer.id,
        "officer_name": officer.name,
        "assigned_applications": db.query(VerificationApplication).filter(VerificationApplication.assigned_officer_id == officer.id, VerificationApplication.status.in_(["ASSIGNED", "SCHEDULED"])).count(),
        "completed_inspections": db.query(Inspection).filter(Inspection.officer_id == officer.id).count(),
        "passed_inspections": db.query(Inspection).filter(Inspection.officer_id == officer.id, Inspection.result == "PASS").count(),
        "failed_inspections": db.query(Inspection).filter(Inspection.officer_id == officer.id, Inspection.result == "FAIL").count(),
    } for officer in officers]


def time_series(db: Session, days: int = 30) -> dict:
    start = datetime.utcnow() - timedelta(days=days)
    def counts(model, date_column):
        rows = db.query(func.date(date_column), func.count()).filter(date_column >= start).group_by(func.date(date_column)).all()
        return [{"date": str(day), "count": count} for day, count in rows]
    return {
        "applications": counts(VerificationApplication, VerificationApplication.created_at),
        "inspections": counts(Inspection, Inspection.inspected_at),
        "certificates": counts(Certificate, Certificate.issued_at),
        "inspection_results": {
            "PASS": counts_filtered(db, Inspection, Inspection.inspected_at, Inspection.result == "PASS", start),
            "FAIL": counts_filtered(db, Inspection, Inspection.inspected_at, Inspection.result == "FAIL", start),
        },
    }


def counts_filtered(db: Session, model, date_column, condition, start):
    rows = db.query(func.date(date_column), func.count()).filter(date_column >= start, condition).group_by(func.date(date_column)).all()
    return [{"date": str(day), "count": count} for day, count in rows]