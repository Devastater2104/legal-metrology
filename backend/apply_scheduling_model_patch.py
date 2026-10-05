from pathlib import Path

root = Path.home() / "legal-metrology" / "backend"

models = root / "models.py"
text = models.read_text()
needle = '    google_subject_id = Column(String, unique=True, nullable=True, index=True)\n'
addition = (
    needle
    + '    latitude = Column(Float, nullable=True)\n'
    + '    longitude = Column(Float, nullable=True)\n'
    + '    availability_status = Column(String, nullable=False, default="AVAILABLE")\n'
)
if "availability_status = Column(String" not in text:
    if needle not in text:
        raise SystemExit("User model insertion point not found")
    models.write_text(text.replace(needle, addition, 1))
    print("Updated models.py")

schemas = root / "schemas.py"
text = schemas.read_text()
old = '''class OfficerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
'''
new = '''class OfficerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability_status: str = "AVAILABLE"
'''
if "availability_status: str = "AVAILABLE"" not in text:
    if old not in text:
        raise SystemExit("OfficerResponse insertion point not found")
    schemas.write_text(text.replace(old, new, 1))
    print("Updated schemas.py")
