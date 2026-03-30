"""merge all current heads

Revision ID: 66c76cb241ba
Revises: 001a, 020, add_rate_limit_tables
Create Date: 2026-03-30 17:45:26.580000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '66c76cb241ba'
down_revision: Union[str, None] = ('001a', '020', 'add_rate_limit_tables')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
