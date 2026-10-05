"""Store browser-reported inspection location and capture time.

Revision ID: 0002_geotagged_inspections
Revises: 0001_baseline
"""
from alembic import op
from sqlalchemy import inspect, text

revision = "0002_geotagged_inspections"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("inspections")}
    for name, definition in {
        "latitude": "VARCHAR",
        "longitude": "VARCHAR",
        "captured_at": "DATETIME",
    }.items():
        if name not in columns:
            bind.execute(text(f"ALTER TABLE inspections ADD COLUMN {name} {definition}"))


def downgrade() -> None:
    pass