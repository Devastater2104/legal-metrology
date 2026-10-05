"""Store OCR suggestions and inspection photo references.

Revision ID: 0003_ocr_inspection_data
Revises: 0002_geotagged_inspections
"""
from alembic import op
from sqlalchemy import inspect, text

revision = "0003_ocr_inspection_data"
down_revision = "0002_geotagged_inspections"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspection_columns = {column["name"] for column in inspect(bind).get_columns("inspections")}
    for name in ("ocr_data", "photo_urls"):
        if name not in inspection_columns:
            bind.execute(text(f"ALTER TABLE inspections ADD COLUMN {name} JSON"))
    if "inspection_photos" not in inspect(bind).get_table_names():
        bind.execute(text(
            "CREATE TABLE inspection_photos ("
            "id VARCHAR PRIMARY KEY, application_id INTEGER NOT NULL, uploaded_by INTEGER NOT NULL, "
            "storage_name VARCHAR NOT NULL UNIQUE, content_type VARCHAR NOT NULL, created_at DATETIME, "
            "FOREIGN KEY(application_id) REFERENCES verification_applications(id), "
            "FOREIGN KEY(uploaded_by) REFERENCES users(id))"
        ))


def downgrade() -> None:
    pass