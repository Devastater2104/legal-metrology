"""Create or baseline the current Legal Metrology schema.

Revision ID: 0001_baseline
Revises:
"""
from alembic import op
from sqlalchemy import inspect, text

from database import Base
import models

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)
    inspector = inspect(bind)
    columns = {
        table: {column["name"] for column in inspector.get_columns(table)}
        for table in inspector.get_table_names()
    }
    additions = {
        "users": {
            "email_verified": "BOOLEAN NOT NULL DEFAULT 0",
            "auth_provider": "VARCHAR NOT NULL DEFAULT 'local'",
            "google_subject_id": "VARCHAR",
        },
        "certificates": {
            "expires_at": "DATETIME",
            "integrity_hash": "VARCHAR",
            "revoked_at": "DATETIME",
            "revocation_reason": "VARCHAR",
        },
        "inspections": {
            "latitude": "VARCHAR",
            "longitude": "VARCHAR",
            "captured_at": "DATETIME",
        },
        "verification_applications": {"assigned_officer_id": "INTEGER"},
    }
    for table, table_additions in additions.items():
        for name, definition in table_additions.items():
            if table in columns and name not in columns[table]:
                bind.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))


def downgrade() -> None:
    # Baseline downgrades are intentionally non-destructive.
    pass
