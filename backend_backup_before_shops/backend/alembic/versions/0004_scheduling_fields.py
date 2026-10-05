"""Add application priority and inspection scheduling fields.

Revision ID: 0004_scheduling_fields
Revises: 0003_ocr_inspection_data
"""
from alembic import op
from sqlalchemy import inspect, text

revision = "0004_scheduling_fields"
down_revision = "0003_ocr_inspection_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("verification_applications")}
    for name, definition in {
        "priority": "VARCHAR NOT NULL DEFAULT 'NORMAL'",
        "scheduled_at": "DATETIME",
    }.items():
        if name not in columns:
            bind.execute(text(f"ALTER TABLE verification_applications ADD COLUMN {name} {definition}"))


def downgrade() -> None:
    pass