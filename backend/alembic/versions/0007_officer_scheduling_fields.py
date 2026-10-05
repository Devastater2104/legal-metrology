"""Add officer scheduling location and availability.

Revision ID: 0007_officer_scheduling_fields
Revises: 0006_shops_and_instrument_location
"""

from alembic import op
import sqlalchemy as sa

revision = "0007_officer_scheduling_fields"
down_revision = "0006_shops_and_instrument_location"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "availability_status",
            sa.String(),
            nullable=False,
            server_default="AVAILABLE",
        ),
    )


def downgrade():
    op.drop_column("users", "availability_status")
    op.drop_column("users", "longitude")
    op.drop_column("users", "latitude")
