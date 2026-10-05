"""Finalize Shop → Instrument architecture.

Revision ID: 0006_shops_and_instrument_location
Revises: 0005_gst_number_on_inspections
Create Date: 2026-10-05

The baseline migration creates the current SQLAlchemy model schema.
Therefore the Shop architecture is already present when 0001_baseline
runs against a fresh database.

This migration intentionally acts as the version marker for the
Shop architecture rather than recreating tables that already exist.
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_shops_and_instrument_location"
down_revision = "0005_gst_number_on_inspections"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    required_tables = {
        "shops",
        "instruments",
        "verification_applications",
    }

    existing_tables = set(inspector.get_table_names())
    missing_tables = required_tables - existing_tables

    if missing_tables:
        raise RuntimeError(
            "Shop architecture schema is incomplete. "
            f"Missing tables: {sorted(missing_tables)}"
        )

    instrument_columns = {
        column["name"]
        for column in inspector.get_columns("instruments")
    }

    required_instrument_columns = {
        "shop_id",
        "measurement_type",
        "latitude",
        "longitude",
    }

    missing_columns = required_instrument_columns - instrument_columns

    if missing_columns:
        raise RuntimeError(
            "Shop architecture schema is incomplete. "
            f"Missing instrument columns: {sorted(missing_columns)}"
        )


def downgrade():
    # The Shop architecture is part of the baseline SQLAlchemy schema.
    # It is intentionally not removed during a downgrade.
    pass
