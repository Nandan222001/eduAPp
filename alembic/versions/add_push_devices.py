"""add push devices

Revision ID: add_push_devices
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'add_push_devices'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'push_devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=500), nullable=False),
        sa.Column('platform', sa.String(length=20), nullable=False),
        sa.Column('device_name', sa.String(length=255), nullable=True),
        sa.Column('os_version', sa.String(length=50), nullable=True),
        sa.Column('app_version', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_push_device_user', 'push_devices', ['user_id'])
    op.create_index('idx_push_device_token', 'push_devices', ['token'], unique=True)
    op.create_index('idx_push_device_active', 'push_devices', ['is_active'])
    op.create_index(op.f('ix_push_devices_id'), 'push_devices', ['id'])
    
    op.create_table(
        'push_device_topics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False),
        sa.Column('topic', sa.String(length=100), nullable=False),
        sa.Column('subscribed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['push_devices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_push_device_topic', 'push_device_topics', ['device_id', 'topic'])
    op.create_index(op.f('ix_push_device_topics_id'), 'push_device_topics', ['id'])
    op.create_index(op.f('ix_push_device_topics_device_id'), 'push_device_topics', ['device_id'])


def downgrade():
    op.drop_index(op.f('ix_push_device_topics_device_id'), table_name='push_device_topics')
    op.drop_index(op.f('ix_push_device_topics_id'), table_name='push_device_topics')
    op.drop_index('idx_push_device_topic', table_name='push_device_topics')
    op.drop_table('push_device_topics')
    
    op.drop_index(op.f('ix_push_devices_id'), table_name='push_devices')
    op.drop_index('idx_push_device_active', table_name='push_devices')
    op.drop_index('idx_push_device_token', table_name='push_devices')
    op.drop_index('idx_push_device_user', table_name='push_devices')
    op.drop_table('push_devices')
