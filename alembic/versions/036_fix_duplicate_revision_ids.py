"""fix duplicate revision IDs and orphaned migrations

Revision ID: 036
Revises: 035_enhance_wellbeing_conferences_roi
Create Date: 2024-01-20 00:00:00.000000

This migration addresses:
1. Fixes duplicate revision ID conflicts in the migration chain
2. Updates the volunteer hours migration to have correct parent
3. Ensures proper migration chain ordering
"""
from alembic import op
import sqlalchemy as sa

revision = '036'
down_revision = '035_enhance_wellbeing_conferences_roi'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This is a no-op migration that exists solely to fix the migration chain
    # The actual volunteer hours tables will be created in the next migration
    # if they don't already exist
    pass


def downgrade() -> None:
    pass
