"""create document vault tables

Revision ID: 024_create_document_vault
Revises: 023_create_conference
Create Date: 2024-01-18 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '024_create_document_vault'
down_revision: Union[str, None] = '023_create_conference'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'family_documents',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('uploaded_by_user_id', sa.Integer(), nullable=True),
        sa.Column('document_name', sa.String(length=255), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('s3_key', sa.String(length=500), nullable=False),
        sa.Column('encryption_key', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('expiry_date', sa.DateTime(), nullable=True),
        sa.Column('shared_with', sa.JSON(), nullable=True),
        sa.Column('uploaded_by_role', sa.String(length=50), nullable=True),
        sa.Column('ocr_text', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('is_sensitive', sa.Boolean(), nullable=False),
        sa.Column('is_archived', sa.Boolean(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_family_documents_id'), 'family_documents', ['id'])
    op.create_index(op.f('ix_family_documents_institution_id'), 'family_documents', ['institution_id'])
    op.create_index(op.f('ix_family_documents_student_id'), 'family_documents', ['student_id'])
    op.create_index(op.f('ix_family_documents_uploaded_by_user_id'), 'family_documents', ['uploaded_by_user_id'])
    op.create_index('idx_family_doc_institution_student', 'family_documents', ['institution_id', 'student_id'])
    op.create_index('idx_family_doc_type', 'family_documents', ['document_type'])
    op.create_index('idx_family_doc_expiry', 'family_documents', ['expiry_date'])
    op.create_index('idx_family_doc_created', 'family_documents', ['created_at'])
    op.create_index('idx_family_doc_deleted', 'family_documents', ['is_deleted'])
    op.create_index('idx_family_doc_archived', 'family_documents', ['is_archived'])
    op.create_index('idx_family_doc_s3_key', 'family_documents', ['s3_key'], unique=True)

    op.create_table(
        'document_access_logs',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('action_type', sa.String(length=50), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('user_role', sa.String(length=50), nullable=True),
        sa.Column('user_name', sa.String(length=255), nullable=True),
        sa.Column('access_granted', sa.Boolean(), nullable=False),
        sa.Column('denial_reason', sa.String(length=255), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['family_documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_access_logs_id'), 'document_access_logs', ['id'])
    op.create_index(op.f('ix_document_access_logs_document_id'), 'document_access_logs', ['document_id'])
    op.create_index(op.f('ix_document_access_logs_user_id'), 'document_access_logs', ['user_id'])
    op.create_index(op.f('ix_document_access_logs_institution_id'), 'document_access_logs', ['institution_id'])
    op.create_index('idx_doc_access_document_user', 'document_access_logs', ['document_id', 'user_id'])
    op.create_index('idx_doc_access_action', 'document_access_logs', ['action_type'])
    op.create_index('idx_doc_access_created', 'document_access_logs', ['created_at'])

    op.create_table(
        'document_shares',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('shared_by_user_id', sa.Integer(), nullable=True),
        sa.Column('shared_with_user_id', sa.Integer(), nullable=True),
        sa.Column('share_type', sa.String(length=50), nullable=False),
        sa.Column('permissions', sa.JSON(), nullable=True),
        sa.Column('expiry_date', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['family_documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['shared_with_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_shares_id'), 'document_shares', ['id'])
    op.create_index('idx_doc_share_document', 'document_shares', ['document_id'])
    op.create_index('idx_doc_share_with_user', 'document_shares', ['shared_with_user_id'])
    op.create_index('idx_doc_share_active', 'document_shares', ['is_active'])
    op.create_index('idx_doc_share_expiry', 'document_shares', ['expiry_date'])

    op.create_table(
        'document_expiration_alerts',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('days_before_expiry', sa.Integer(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('is_sent', sa.Boolean(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['family_documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_expiration_alerts_id'), 'document_expiration_alerts', ['id'])
    op.create_index('idx_doc_alert_document', 'document_expiration_alerts', ['document_id'])
    op.create_index('idx_doc_alert_sent', 'document_expiration_alerts', ['is_sent'])


def downgrade() -> None:
    op.drop_table('document_expiration_alerts')
    op.drop_table('document_shares')
    op.drop_table('document_access_logs')
    op.drop_table('family_documents')
