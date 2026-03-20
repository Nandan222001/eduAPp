"""add institution logo

Revision ID: 014a_add_institution_logo
Revises: 013
Create Date: 2026-03-11 12:16:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '014a_add_institution_logo'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('institutions', sa.Column('logo_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('institutions', 'logo_url')
