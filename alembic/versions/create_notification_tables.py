"""create notification tables

Revision ID: notification_001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'notification_001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('channel', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('failed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_notification_user_status', 'notifications', ['user_id', 'status'])
    op.create_index('idx_notification_user_created', 'notifications', ['user_id', 'created_at'])
    op.create_index('idx_notification_institution', 'notifications', ['institution_id'])
    op.create_index('idx_notification_status', 'notifications', ['status'])
    op.create_index('idx_notification_channel', 'notifications', ['channel'])
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'])

    op.create_table(
        'notification_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email_enabled', sa.Boolean(), nullable=False),
        sa.Column('sms_enabled', sa.Boolean(), nullable=False),
        sa.Column('push_enabled', sa.Boolean(), nullable=False),
        sa.Column('in_app_enabled', sa.Boolean(), nullable=False),
        sa.Column('notification_types', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('quiet_hours_start', sa.String(length=5), nullable=True),
        sa.Column('quiet_hours_end', sa.String(length=5), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_notification_preferences_id'), 'notification_preferences', ['id'])
    op.create_index(op.f('ix_notification_preferences_user_id'), 'notification_preferences', ['user_id'], unique=True)

    op.create_table(
        'announcements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('audience_type', sa.String(length=20), nullable=False),
        sa.Column('audience_filter', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('channels', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('attachments', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_announcement_institution', 'announcements', ['institution_id'])
    op.create_index('idx_announcement_published', 'announcements', ['is_published', 'published_at'])
    op.create_index('idx_announcement_scheduled', 'announcements', ['scheduled_at'])
    op.create_index(op.f('ix_announcements_id'), 'announcements', ['id'])

    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('recipient_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('subject', sa.String(length=255), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted_by_sender', sa.Boolean(), nullable=False),
        sa.Column('is_deleted_by_recipient', sa.Boolean(), nullable=False),
        sa.Column('attachments', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['messages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_message_sender', 'messages', ['sender_id', 'created_at'])
    op.create_index('idx_message_recipient', 'messages', ['recipient_id', 'is_read', 'created_at'])
    op.create_index('idx_message_institution', 'messages', ['institution_id'])
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'])

    op.create_table(
        'notification_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('channel', sa.String(length=20), nullable=False),
        sa.Column('subject_template', sa.String(length=255), nullable=True),
        sa.Column('body_template', sa.Text(), nullable=False),
        sa.Column('variables', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_template_institution_type', 'notification_templates', ['institution_id', 'notification_type'])
    op.create_index('idx_template_type_channel', 'notification_templates', ['notification_type', 'channel'])
    op.create_index(op.f('ix_notification_templates_id'), 'notification_templates', ['id'])


def downgrade() -> None:
    op.drop_table('notification_templates')
    op.drop_table('messages')
    op.drop_table('announcements')
    op.drop_table('notification_preferences')
    op.drop_table('notifications')
