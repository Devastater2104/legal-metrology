from datetime import datetime
from math import atan2, cos, radians, sin, sqrt

from sqlalchemy.orm import Session

from models import Certificate, Inspection, Instrument, Shop, User, VerificationApplication


# Transparent 100-point decision model.
# These are weights, not fixed officer scores:
# the actual score is calculated from the current application,
# shop coordinates, officer coordinates, workload and availability.
WEIGHTS = {
    "location": 40,
    "workload": 25,
    "availability": 20,
    "priority": 10,
    "age": 5,
}

PRIORITY_SCORE = {
    "LOW": 4,
    "NORMAL": 6,
    "HIGH": 8,
    "URGENT": 10,
}


def _distance_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None

    earth_radius_km = 6371.0

    lat1_r = radians(float(lat1))
    lat2_r = radians(float(lat2))
    delta_lat = radians(float(lat2) - float(lat1))
    delta_lon = radians(float(lon2) - float(lon1))

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1_r)
        * cos(lat2_r)
        * sin(delta_lon / 2) ** 2
    )

    return earth_radius_km * 2 * atan2(
        sqrt(a),
        sqrt(max(0.0, 1 - a)),
    )


def _location_points(distance):
    """
    Convert the real travel distance into the location component.
    Closer officers receive more points; the values are derived,
    not hard-coded per officer.
    """
    if distance is None:
        return 0

    if distance <= 2:
        return 40
    if distance <= 5:
        return 36
    if distance <= 10:
        return 30
    if distance <= 20:
        return 22
    if distance <= 35:
        return 14
    if distance <= 50:
        return 8
    return 4


def _workload_points(active_assignments):
    """
    Current active workload -> workload component.
    Fewer active assignments means more capacity.
    """
    if active_assignments <= 0:
        return 25
    if active_assignments == 1:
        return 21
    if active_assignments == 2:
        return 17
    if active_assignments == 3:
        return 12
    if active_assignments == 4:
        return 8

    return max(2, 8 - ((active_assignments - 4) * 2))


def _availability_points(status):
    status = (status or "AVAILABLE").upper()

    if status == "AVAILABLE":
        return 20
    if status == "BUSY":
        return 9
    if status == "UNAVAILABLE":
        return 0

    return 10


def _priority_points(priority):
    return PRIORITY_SCORE.get(
        (priority or "NORMAL").upper(),
        PRIORITY_SCORE["NORMAL"],
    )


def recommendations(db: Session, application: VerificationApplication) -> dict:
    now = datetime.utcnow()

    age_days = max(
        0,
        (now - application.created_at).days,
    )

    priority = (
        application.priority or "NORMAL"
    ).upper()

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

    certificate = (
        db.query(Certificate)
        .filter(Certificate.application_id == application.id)
        .first()
    )

    expiry_bonus = 0
    expiry_note = None

    if certificate and certificate.expires_at:
        days_until_expiry = (
            certificate.expires_at - now
        ).days

        if days_until_expiry <= 30:
            expiry_bonus = min(
                5,
                max(0, 30 - max(0, days_until_expiry)) // 6 + 1,
            )

            expiry_note = (
                f"Certificate expires in "
                f"{max(0, days_until_expiry)} day(s)"
            )

    shop_latitude = getattr(shop, "latitude", None) if shop else None
    shop_longitude = getattr(shop, "longitude", None) if shop else None

    officers = (
        db.query(User)
        .filter(User.role == "OFFICER")
        .order_by(User.name)
        .all()
    )

    result = []

    for officer in officers:
        active_assignments = (
            db.query(VerificationApplication)
            .filter(
                VerificationApplication.assigned_officer_id == officer.id,
                VerificationApplication.status.in_(
                    ["ASSIGNED", "SCHEDULED", "INSPECTION_PENDING"]
                ),
            )
            .count()
        )

        completed_inspections = (
            db.query(Inspection)
            .filter(Inspection.officer_id == officer.id)
            .count()
        )

        officer_latitude = getattr(officer, "latitude", None)
        officer_longitude = getattr(officer, "longitude", None)

        distance = _distance_km(
            shop_latitude,
            shop_longitude,
            officer_latitude,
            officer_longitude,
        )

        availability = (
            getattr(
                officer,
                "availability_status",
                None,
            )
            or "AVAILABLE"
        ).upper()

        location_points = _location_points(distance)
        workload_points = _workload_points(active_assignments)
        availability_points = _availability_points(availability)
        priority_points = _priority_points(priority)

        age_points = min(
            WEIGHTS["age"],
            age_days,
        )

        raw_score = (
            location_points
            + workload_points
            + availability_points
            + priority_points
            + age_points
        )

        # Keep the score in the 0-100 range. Priority/age apply
        # equally to all officers for a given application; location,
        # workload and availability create the officer-specific gap.
        score = round(
            min(
                100,
                raw_score,
            )
        )

        reasons = []

        if distance is None:
            reasons.append(
                "Shop/officer coordinates are incomplete"
            )
        elif distance <= 5:
            reasons.append(
                f"Very close to shop ({distance:.1f} km)"
            )
        elif distance <= 10:
            reasons.append(
                f"Nearby shop ({distance:.1f} km)"
            )
        elif distance <= 20:
            reasons.append(
                f"Moderate travel distance ({distance:.1f} km)"
            )
        else:
            reasons.append(
                f"Longer travel distance ({distance:.1f} km)"
            )

        if active_assignments == 0:
            reasons.append("No active assignments")
        elif active_assignments == 1:
            reasons.append("1 active assignment")
        else:
            reasons.append(
                f"{active_assignments} active assignments"
            )

        if availability == "AVAILABLE":
            reasons.append("Officer is available")
        elif availability == "BUSY":
            reasons.append("Officer is currently busy")
        else:
            reasons.append("Officer is unavailable")

        reasons.append(
            f"{priority.title()} priority application"
        )

        if age_days:
            reasons.append(
                f"Application is {age_days} day(s) old"
            )

        if expiry_note:
            reasons.append(expiry_note)

        result.append(
            {
                "officer_id": officer.id,
                "officer_name": officer.name,
                "score": score,
                "workload": active_assignments,
                "active_assignments": active_assignments,
                "completed_inspections": completed_inspections,
                "distance_km": (
                    round(distance, 1)
                    if distance is not None
                    else None
                ),
                "availability": availability,
                "is_available": availability == "AVAILABLE",
                "latitude": officer_latitude,
                "longitude": officer_longitude,
                "score_breakdown": {
                    "location": location_points,
                    "workload": workload_points,
                    "availability": availability_points,
                    "priority": priority_points,
                    "application_age": age_points,
                    "expiry": expiry_bonus,
                },
                "reasons": reasons,
            }
        )

    # Highest score first. Ties are then resolved by:
    # 1. shorter actual distance
    # 2. lower workload
    # 3. officer name
    result.sort(
        key=lambda item: (
            -item["score"],
            item["distance_km"] is None,
            item["distance_km"]
            if item["distance_km"] is not None
            else float("inf"),
            item["workload"],
            item["officer_name"],
        )
    )

    for rank, item in enumerate(result, start=1):
        item["rank"] = rank
        item["recommended"] = (
            rank == 1
            and item["availability"] != "UNAVAILABLE"
        )

    best = next(
        (
            item
            for item in result
            if item["availability"] != "UNAVAILABLE"
        ),
        None,
    )

    return {
        "application_id": application.id,
        "priority": priority,
        "age_days": age_days,
        "urgency_score": min(
            100,
            _priority_points(priority)
            + min(age_days, 5)
            + expiry_bonus,
        ),
        "application_context": {
            "application_id": application.id,
            "instrument_id": instrument.id if instrument else None,
            "instrument_type": (
                instrument.instrument_type
                if instrument
                else None
            ),
            "serial_number": (
                instrument.serial_number
                if instrument
                else None
            ),
            "shop_id": shop.id if shop else None,
            "shop_name": shop.name if shop else None,
            "shop_address": shop.address if shop else None,
            "shop_latitude": shop_latitude,
            "shop_longitude": shop_longitude,
        },
        "recommendations": result,
        "best_officer_id": (
            best["officer_id"]
            if best
            else None
        ),
        "explanation": (
            "Dynamic multi-factor recommendation calculated "
            "from the current shop location, officer location, "
            "active workload, availability, application priority "
            "and application age. The administrator retains final "
            "assignment authority."
        ),
    }
