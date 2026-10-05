from datetime import datetime

from sqlalchemy.orm import Session

from models import Certificate, Inspection, User, VerificationApplication

PRIORITY_SCORE = {"LOW": 10, "NORMAL": 25, "HIGH": 45, "URGENT": 65}


def recommendations(db: Session, application: VerificationApplication) -> dict:
    age_days = max(0, (datetime.utcnow() - application.created_at).days)
    urgency = PRIORITY_SCORE.get(application.priority, PRIORITY_SCORE["NORMAL"]) + min(age_days, 30)
    certificate = db.query(Certificate).filter(Certificate.application_id == application.id).first()
    expiry_note = None
    if certificate and certificate.expires_at:
        days_until_expiry = (certificate.expires_at - datetime.utcnow()).days
        if days_until_expiry <= 30:
            urgency += 20
            expiry_note = f"Certificate expires in {max(0, days_until_expiry)} day(s)"
    officers = db.query(User).filter(User.role == "OFFICER").order_by(User.name).all()
    result = []
    for officer in officers:
        assigned = db.query(VerificationApplication).filter(
            VerificationApplication.assigned_officer_id == officer.id,
            VerificationApplication.status.in_(["ASSIGNED", "SCHEDULED"]),
        ).count()
        completed = db.query(Inspection).filter(Inspection.officer_id == officer.id).count()
        score = max(0, min(100, 100 - assigned * 10 + urgency))
        reasons = [f"Application priority is {application.priority.lower()}"]
        if age_days:
            reasons.append(f"Application is {age_days} day(s) old")
        if assigned == 0:
            reasons.append("No current scheduled workload")
        else:
            reasons.append(f"{assigned} active assignment(s)")
        if expiry_note:
            reasons.append(expiry_note)
        result.append({
            "officer_id": officer.id,
            "officer_name": officer.name,
            "score": score,
            "workload": assigned,
            "completed_inspections": completed,
            "distance_km": None,
            "reasons": reasons + ["Distance unavailable: officer coordinates are not stored"],
        })
    result.sort(key=lambda item: (-item["score"], item["workload"], item["officer_name"]))
    return {
        "application_id": application.id,
        "priority": application.priority,
        "age_days": age_days,
        "urgency_score": min(100, urgency),
        "recommendations": result,
        "explanation": "Prototype deterministic scheduling recommendation; it does not autonomously assign officers.",
    }