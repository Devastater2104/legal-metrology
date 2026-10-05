from database import SessionLocal
from models import User

# Demo officer positions around Dhanbad.
# These are locations only; the scheduler calculates distances/scores.
OFFICERS = [
    ("Field Officer", 23.8148, 86.4417, "AVAILABLE"),
    ("Amit Kumar", 23.8008, 86.4302, "AVAILABLE"),
    ("Priya Sharma", 23.8225, 86.4580, "AVAILABLE"),
    ("Vikram Das", 23.8500, 86.4200, "AVAILABLE"),
    ("Arjun Mehta", 23.7700, 86.3900, "AVAILABLE"),
    ("Rahul Verma", 23.9000, 86.5200, "BUSY"),
    ("Neha Singh", 23.7350, 86.3500, "AVAILABLE"),
]

db = SessionLocal()

for name, lat, lon, availability in OFFICERS:
    officer = (
        db.query(User)
        .filter(User.name == name, User.role == "OFFICER")
        .first()
    )

    if officer is None:
        print(f"Skipping missing officer: {name}")
        continue

    officer.latitude = lat
    officer.longitude = lon
    officer.availability_status = availability

    print(
        f"{name}: {lat}, {lon} | {availability}"
    )

db.commit()
db.close()

print("\nOfficer location/availability data updated.")
print("Scores will be calculated dynamically by the scheduler.")
