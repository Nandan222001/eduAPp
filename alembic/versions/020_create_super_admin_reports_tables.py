"""create super admin reports tables

Revision ID: 020_super_admin_reports
Revises: 019_create_career_pathway_tables
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '020_super_admin_reports'
down_revision = '019_create_career_pathway_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Scheduled Reports
    op.create_table(
        'scheduled_reports',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('report_name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('report_config', JSONB, nullable=False),
        sa.Column('schedule', JSONB, nullable=False),
        sa.Column('email_recipients', JSONB, nullable=False),
        sa.Column('store_in_s3', sa.Boolean(), default=True, nullable=False),
        sa.Column('s3_bucket', sa.String(255), nullable=True),
        sa.Column('s3_prefix', sa.String(500), nullable=True),
        sa.Column('retention_days', sa.Integer(), default=90, nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('last_run_at', sa.DateTime(), nullable=True, index=True),
        sa.Column('next_run_at', sa.DateTime(), nullable=True, index=True),
        sa.Column('last_status', sa.String(50), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('execution_count', sa.Integer(), default=0, nullable=False),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_scheduled_report_active', 'scheduled_reports', ['is_active'])
    op.create_index('idx_scheduled_report_next_run', 'scheduled_reports', ['next_run_at'])
    
    # Report Executions
    op.create_table(
        'report_executions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('scheduled_report_id', sa.Integer(), sa.ForeignKey('scheduled_reports.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('status', sa.String(50), nullable=False, index=True),
        sa.Column('started_at', sa.DateTime(), nullable=False, index=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('row_count', sa.Integer(), nullable=True),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=True),
        sa.Column('s3_key', sa.String(1000), nullable=True),
        sa.Column('download_url', sa.String(1000), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('execution_metadata', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    
    # Data Export Jobs
    op.create_table(
        'data_export_jobs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('export_name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('entity_types', JSONB, nullable=False),
        sa.Column('institution_ids', JSONB, nullable=True),
        sa.Column('date_from', sa.DateTime(), nullable=True),
        sa.Column('date_to', sa.DateTime(), nullable=True),
        sa.Column('fields_config', JSONB, nullable=False),
        sa.Column('anonymization_config', JSONB, nullable=False),
        sa.Column('output_format', sa.String(50), nullable=False),
        sa.Column('compression', sa.Boolean(), default=True, nullable=False),
        sa.Column('purpose', sa.Text(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, index=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('row_count', sa.Integer(), nullable=True),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=True),
        sa.Column('s3_key', sa.String(1000), nullable=True),
        sa.Column('download_url', sa.String(1000), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True),
    )
    
    # Compliance Reports
    op.create_table(
        'compliance_reports',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('report_id', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('report_type', sa.String(100), nullable=False, index=True),
        sa.Column('period_start', sa.DateTime(), nullable=False, index=True),
        sa.Column('period_end', sa.DateTime(), nullable=False, index=True),
        sa.Column('institution_ids', JSONB, nullable=True),
        sa.Column('filters', JSONB, nullable=True),
        sa.Column('summary', JSONB, nullable=False),
        sa.Column('output_format', sa.String(50), nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=True),
        sa.Column('s3_key', sa.String(1000), nullable=True),
        sa.Column('download_url', sa.String(1000), nullable=True),
        sa.Column('generated_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('generated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True, index=True),
    )
    op.create_index('idx_compliance_report_period', 'compliance_reports', ['period_start', 'period_end'])
    
    # Executive Dashboards
    op.create_table(
        'executive_dashboards',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('template_id', sa.String(100), nullable=False, index=True),
        sa.Column('template_name', sa.String(255), nullable=False),
        sa.Column('period_start', sa.DateTime(), nullable=False, index=True),
        sa.Column('period_end', sa.DateTime(), nullable=False, index=True),
        sa.Column('metrics', JSONB, nullable=False),
        sa.Column('summary', JSONB, nullable=False),
        sa.Column('insights', JSONB, nullable=True),
        sa.Column('chart_data', JSONB, nullable=True),
        sa.Column('generated_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('generated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True),
    )
    op.create_index('idx_exec_dashboard_period', 'executive_dashboards', ['period_start', 'period_end'])
    
    # Security Audit Reports
    op.create_table(
        'security_audit_reports',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('report_id', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('period_start', sa.DateTime(), nullable=False, index=True),
        sa.Column('period_end', sa.DateTime(), nullable=False, index=True),
        sa.Column('institution_ids', JSONB, nullable=True),
        sa.Column('failed_login_count', sa.Integer(), default=0, nullable=False),
        sa.Column('suspicious_activity_count', sa.Integer(), default=0, nullable=False),
        sa.Column('data_access_count', sa.Integer(), default=0, nullable=False),
        sa.Column('impersonation_count', sa.Integer(), default=0, nullable=False),
        sa.Column('anomalies', JSONB, nullable=True),
        sa.Column('summary', JSONB, nullable=False),
        sa.Column('s3_key', sa.String(1000), nullable=True),
        sa.Column('download_url', sa.String(1000), nullable=True),
        sa.Column('generated_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('generated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True),
    )
    op.create_index('idx_security_audit_period', 'security_audit_reports', ['period_start', 'period_end'])
    
    # Data Retention Policies
    op.create_table(
        'data_retention_policies',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('policy_name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('entity_type', sa.String(100), nullable=False, index=True),
        sa.Column('retention_days', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('filters', JSONB, nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('auto_execute', sa.Boolean(), default=False, nullable=False),
        sa.Column('execution_schedule', sa.String(255), nullable=True),
        sa.Column('last_executed_at', sa.DateTime(), nullable=True, index=True),
        sa.Column('next_execution_at', sa.DateTime(), nullable=True, index=True),
        sa.Column('records_processed', sa.Integer(), default=0, nullable=False),
        sa.Column('last_execution_status', sa.String(50), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_retention_policy_active', 'data_retention_policies', ['is_active'])
    op.create_index('idx_retention_policy_next_execution', 'data_retention_policies', ['next_execution_at'])
    
    # Data Retention Executions
    op.create_table(
        'data_retention_executions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('policy_id', sa.Integer(), sa.ForeignKey('data_retention_policies.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('status', sa.String(50), nullable=False, index=True),
        sa.Column('started_at', sa.DateTime(), nullable=False, index=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('records_processed', sa.Integer(), default=0, nullable=False),
        sa.Column('records_archived', sa.Integer(), default=0, nullable=False),
        sa.Column('records_deleted', sa.Integer(), default=0, nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('execution_metadata', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    
    # Archival Jobs
    op.create_table(
        'archival_jobs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('job_name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('entity_type', sa.String(100), nullable=False, index=True),
        sa.Column('date_from', sa.DateTime(), nullable=True),
        sa.Column('date_to', sa.DateTime(), nullable=False),
        sa.Column('filters', JSONB, nullable=True),
        sa.Column('s3_bucket', sa.String(255), nullable=True),
        sa.Column('s3_prefix', sa.String(500), nullable=True),
        sa.Column('s3_key', sa.String(1000), nullable=True),
        sa.Column('compression', sa.Boolean(), default=True, nullable=False),
        sa.Column('delete_after_archive', sa.Boolean(), default=False, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, index=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('records_archived', sa.Integer(), default=0, nullable=False),
        sa.Column('records_deleted', sa.Integer(), default=0, nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('archival_metadata', JSONB, nullable=True),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True),
    )
    op.create_index('idx_archival_job_status', 'archival_jobs', ['status'])
    op.create_index('idx_archival_job_dates', 'archival_jobs', ['date_from', 'date_to'])
    
    # Report Builder Saved Queries
    op.create_table(
        'report_builder_saved_queries',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('query_name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('entity_type', sa.String(100), nullable=False, index=True),
        sa.Column('query_config', JSONB, nullable=False),
        sa.Column('is_public', sa.Boolean(), default=False, nullable=False),
        sa.Column('is_favorite', sa.Boolean(), default=False, nullable=False),
        sa.Column('execution_count', sa.Integer(), default=0, nullable=False),
        sa.Column('last_executed_at', sa.DateTime(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_saved_query_public', 'report_builder_saved_queries', ['is_public'])
    op.create_index('idx_saved_query_favorite', 'report_builder_saved_queries', ['is_favorite'])


def downgrade():
    op.drop_table('report_builder_saved_queries')
    op.drop_table('archival_jobs')
    op.drop_table('data_retention_executions')
    op.drop_table('data_retention_policies')
    op.drop_table('security_audit_reports')
    op.drop_table('executive_dashboards')
    op.drop_table('compliance_reports')
    op.drop_table('data_export_jobs')
    op.drop_table('report_executions')
    op.drop_table('scheduled_reports')
