"""add rate limit tables

Revision ID: add_rate_limit_tables
Revises: 
Create Date: 2024-01-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'add_rate_limit_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'rate_limit_violations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('role_slug', sa.String(length=100), nullable=True),
        sa.Column('path', sa.String(length=500), nullable=False),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=False),
        sa.Column('limit_hit', sa.String(length=50), nullable=False),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_rate_limit_violations_id'), 'rate_limit_violations', ['id'], unique=False)
    op.create_index(op.f('ix_rate_limit_violations_user_id'), 'rate_limit_violations', ['user_id'], unique=False)
    op.create_index(op.f('ix_rate_limit_violations_role_slug'), 'rate_limit_violations', ['role_slug'], unique=False)
    op.create_index(op.f('ix_rate_limit_violations_path'), 'rate_limit_violations', ['path'], unique=False)
    op.create_index(op.f('ix_rate_limit_violations_ip_address'), 'rate_limit_violations', ['ip_address'], unique=False)
    op.create_index(op.f('ix_rate_limit_violations_created_at'), 'rate_limit_violations', ['created_at'], unique=False)
    op.create_index('idx_rate_limit_user_created', 'rate_limit_violations', ['user_id', 'created_at'], unique=False)
    op.create_index('idx_rate_limit_role_created', 'rate_limit_violations', ['role_slug', 'created_at'], unique=False)
    op.create_index('idx_rate_limit_path_created', 'rate_limit_violations', ['path', 'created_at'], unique=False)
    op.create_index('idx_rate_limit_ip_created', 'rate_limit_violations', ['ip_address', 'created_at'], unique=False)
    
    op.create_table(
        'rate_limit_stats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('role_slug', sa.String(length=100), nullable=True),
        sa.Column('total_requests', sa.BigInteger(), nullable=False),
        sa.Column('total_violations', sa.BigInteger(), nullable=False),
        sa.Column('unique_users', sa.Integer(), nullable=False),
        sa.Column('unique_ips', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_rate_limit_stats_id'), 'rate_limit_stats', ['id'], unique=False)
    op.create_index(op.f('ix_rate_limit_stats_date'), 'rate_limit_stats', ['date'], unique=False)
    op.create_index(op.f('ix_rate_limit_stats_role_slug'), 'rate_limit_stats', ['role_slug'], unique=False)
    op.create_index('idx_rate_limit_stats_date_role', 'rate_limit_stats', ['date', 'role_slug'], unique=True)


def downgrade() -> None:
    op.drop_index('idx_rate_limit_stats_date_role', table_name='rate_limit_stats')
    op.drop_index(op.f('ix_rate_limit_stats_role_slug'), table_name='rate_limit_stats')
    op.drop_index(op.f('ix_rate_limit_stats_date'), table_name='rate_limit_stats')
    op.drop_index(op.f('ix_rate_limit_stats_id'), table_name='rate_limit_stats')
    op.drop_table('rate_limit_stats')
    
    op.drop_index('idx_rate_limit_ip_created', table_name='rate_limit_violations')
    op.drop_index('idx_rate_limit_path_created', table_name='rate_limit_violations')
    op.drop_index('idx_rate_limit_role_created', table_name='rate_limit_violations')
    op.drop_index('idx_rate_limit_user_created', table_name='rate_limit_violations')
    op.drop_index(op.f('ix_rate_limit_violations_created_at'), table_name='rate_limit_violations')
    op.drop_index(op.f('ix_rate_limit_violations_ip_address'), table_name='rate_limit_violations')
    op.drop_index(op.f('ix_rate_limit_violations_path'), table_name='rate_limit_violations')
    op.drop_index(op.f('ix_rate_limit_violations_role_slug'), table_name='rate_limit_violations')
    op.drop_index(op.f('ix_rate_limit_violations_user_id'), table_name='rate_limit_violations')
    op.drop_index(op.f('ix_rate_limit_violations_id'), table_name='rate_limit_violations')
    op.drop_table('rate_limit_violations')
