"""Add officer license number.

Revision ID: 0008_officer_license_number
Revises: 0007_officer_scheduling_fields
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_officer_license_number"
down_revision = "0007_officer_scheduling_fields"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "license_number",
            sa.String(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_users_license_number",
        "users",
        ["license_number"],
        unique=True,
    )


def downgrade():
    op.drop_index(
        "ix_users_license_number",
        table_name="users",
    )

    op.drop_column(
        "users",
        "license_number",
    )
