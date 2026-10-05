"""Add GST number to field inspections.

Revision ID: 0005_gst_number_on_inspections
Revises: 0004_scheduling_fields
"""

from alembic import op
from sqlalchemy import inspect, text

revision = "0005_gst_number_on_inspections"
down_revision = "0004_scheduling_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {
        column["name"]
        for column in inspect(bind).get_columns("inspections")
    }
    if "gst_number" not in columns:
        bind.execute(
            text(
                "ALTER TABLE inspections "
                "ADD COLUMN gst_number VARCHAR(15)"
            )
        )


def downgrade() -> None:
    # SQLite-compatible non-destructive downgrade.
    pass
