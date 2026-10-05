from database import SessionLocal
from models import User, Shop

db = SessionLocal()

print("\nOFFICERS")
print("-" * 72)

for officer in (
    db.query(User)
    .filter(User.role == "OFFICER")
    .order_by(User.name)
    .all()
):
    print(
        f"{officer.name:20} "
        f"lat={getattr(officer, 'latitude', None)} "
        f"lon={getattr(officer, 'longitude', None)} "
        f"status={getattr(officer, 'availability_status', None)}"
    )

print("\nSHOPS")
print("-" * 72)

for shop in db.query(Shop).order_by(Shop.id).all():
    print(
        f"{shop.name:35} "
        f"lat={shop.latitude} "
        f"lon={shop.longitude}"
    )

db.close()
