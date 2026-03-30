"""create plagiarism detection tables

Revision ID: 018
Revises: 018a_impersonation_debug
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '018'
down_revision = '018a_impersonation_debug'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Skip if required tables don't exist
    if 'assignments' not in inspector.get_table_names() or 'submissions' not in inspector.get_table_names():
        return
    
    if 'plagiarism_checks' not in inspector.get_table_names():
        op.create_table(
            'plagiarism_checks',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('assignment_id', sa.Integer(), nullable=False),
            sa.Column('submission_id', sa.Integer(), nullable=True),
            sa.Column('content_type', sa.Enum('TEXT', 'SOURCE_CODE', 'MIXED', name='contenttype'), nullable=False),
            sa.Column('comparison_scope', sa.Enum('WITHIN_BATCH', 'CROSS_BATCH', 'CROSS_INSTITUTION', 'ALL', name='comparisonscope'), nullable=False),
            sa.Column('enable_cross_institution', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('anonymize_cross_institution', sa.Boolean(), nullable=False, server_default=sa.text('1')),
            sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='plagiarismcheckstatus'), nullable=False),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('total_comparisons', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('matches_found', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('processing_time_seconds', sa.Float(), nullable=True),
            sa.Column('check_settings', sa.JSON(), nullable=True),
            sa.Column('started_at', sa.DateTime(), nullable=True),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_plagiarism_check_institution', 'plagiarism_checks', ['institution_id'])
        op.create_index('idx_plagiarism_check_assignment', 'plagiarism_checks', ['assignment_id'])
        op.create_index('idx_plagiarism_check_submission', 'plagiarism_checks', ['submission_id'])
        op.create_index('idx_plagiarism_check_status', 'plagiarism_checks', ['status'])
    
    if 'plagiarism_results' not in inspector.get_table_names():
        op.create_table(
            'plagiarism_results',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('check_id', sa.Integer(), nullable=False),
            sa.Column('submission_id', sa.Integer(), nullable=False),
            sa.Column('matched_submission_id', sa.Integer(), nullable=True),
            sa.Column('similarity_score', sa.Float(), nullable=False),
            sa.Column('text_similarity', sa.Float(), nullable=True),
            sa.Column('code_similarity', sa.Float(), nullable=True),
            sa.Column('matched_segments_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('matched_text_percentage', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('is_external_source', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('external_source_info', sa.JSON(), nullable=True),
            sa.Column('is_cross_institution', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('anonymized_match_info', sa.JSON(), nullable=True),
            sa.Column('has_citations', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('citation_info', sa.JSON(), nullable=True),
            sa.Column('is_false_positive', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('false_positive_reason', sa.Text(), nullable=True),
            sa.Column('review_status', sa.String(50), nullable=True),
            sa.Column('reviewed_by', sa.Integer(), nullable=True),
            sa.Column('reviewed_at', sa.DateTime(), nullable=True),
            sa.Column('review_decision', sa.Enum('CONFIRMED_PLAGIARISM', 'FALSE_POSITIVE', 'LEGITIMATE_CITATION', 'NEEDS_INVESTIGATION', 'DISMISSED', name='reviewdecision'), nullable=True),
            sa.Column('review_notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['check_id'], ['plagiarism_checks.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['matched_submission_id'], ['submissions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['reviewed_by'], ['teachers.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_plagiarism_result_check', 'plagiarism_results', ['check_id'])
        op.create_index('idx_plagiarism_result_submission', 'plagiarism_results', ['submission_id'])
        op.create_index('idx_plagiarism_result_matched_submission', 'plagiarism_results', ['matched_submission_id'])
        op.create_index('idx_plagiarism_result_similarity', 'plagiarism_results', ['similarity_score'])
        op.create_index('idx_plagiarism_result_review_status', 'plagiarism_results', ['review_status'])
        op.create_index('idx_plagiarism_result_reviewed_by', 'plagiarism_results', ['reviewed_by'])
    
    if 'plagiarism_match_segments' not in inspector.get_table_names():
        op.create_table(
            'plagiarism_match_segments',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('result_id', sa.Integer(), nullable=False),
            sa.Column('source_start', sa.Integer(), nullable=False),
            sa.Column('source_end', sa.Integer(), nullable=False),
            sa.Column('source_text', sa.Text(), nullable=False),
            sa.Column('match_start', sa.Integer(), nullable=False),
            sa.Column('match_end', sa.Integer(), nullable=False),
            sa.Column('match_text', sa.Text(), nullable=False),
            sa.Column('segment_similarity', sa.Float(), nullable=False),
            sa.Column('segment_length', sa.Integer(), nullable=False),
            sa.Column('is_code_segment', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('code_analysis', sa.JSON(), nullable=True),
            sa.Column('is_citation', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('citation_context', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['result_id'], ['plagiarism_results.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_match_segment_result', 'plagiarism_match_segments', ['result_id'])
    
    if 'code_ast_fingerprints' not in inspector.get_table_names() and 'submission_files' in inspector.get_table_names():
        op.create_table(
            'code_ast_fingerprints',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('submission_id', sa.Integer(), nullable=False),
            sa.Column('file_id', sa.Integer(), nullable=True),
            sa.Column('language', sa.String(50), nullable=False),
            sa.Column('structure_hash', sa.String(64), nullable=False),
            sa.Column('variable_pattern_hash', sa.String(64), nullable=False),
            sa.Column('function_pattern_hash', sa.String(64), nullable=False),
            sa.Column('ast_features', sa.JSON(), nullable=False),
            sa.Column('total_nodes', sa.Integer(), nullable=False),
            sa.Column('total_functions', sa.Integer(), nullable=False),
            sa.Column('total_variables', sa.Integer(), nullable=False),
            sa.Column('complexity_score', sa.Float(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['file_id'], ['submission_files.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_ast_fingerprint_submission', 'code_ast_fingerprints', ['submission_id'])
        op.create_index('idx_ast_fingerprint_file', 'code_ast_fingerprints', ['file_id'])
        op.create_index('idx_ast_fingerprint_structure_hash', 'code_ast_fingerprints', ['structure_hash'])
        op.create_index('idx_ast_fingerprint_language', 'code_ast_fingerprints', ['language'])
    
    if 'citation_patterns' not in inspector.get_table_names():
        op.create_table(
            'citation_patterns',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('submission_id', sa.Integer(), nullable=False),
            sa.Column('citation_type', sa.String(50), nullable=False),
            sa.Column('citation_text', sa.Text(), nullable=False),
            sa.Column('start_position', sa.Integer(), nullable=False),
            sa.Column('end_position', sa.Integer(), nullable=False),
            sa.Column('reference_info', sa.JSON(), nullable=True),
            sa.Column('is_valid', sa.Boolean(), nullable=False, server_default=sa.text('1')),
            sa.Column('validation_notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_citation_pattern_submission', 'citation_patterns', ['submission_id'])
        op.create_index('idx_citation_pattern_type', 'citation_patterns', ['citation_type'])
    
    if 'plagiarism_privacy_consents' not in inspector.get_table_names():
        op.create_table(
            'plagiarism_privacy_consents',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('institution_id', sa.Integer(), nullable=False),
            sa.Column('allow_cross_institution_comparison', sa.Boolean(), nullable=False, server_default=sa.text('0')),
            sa.Column('allow_anonymized_sharing', sa.Boolean(), nullable=False, server_default=sa.text('1')),
            sa.Column('data_retention_days', sa.Integer(), nullable=False, server_default='365'),
            sa.Column('consent_given_by', sa.Integer(), nullable=True),
            sa.Column('consent_given_at', sa.DateTime(), nullable=True),
            sa.Column('privacy_settings', sa.JSON(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['consent_given_by'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('institution_id', name='uq_institution_privacy_consent')
        )
        op.create_index('idx_privacy_consent_institution', 'plagiarism_privacy_consents', ['institution_id'])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if 'plagiarism_privacy_consents' in inspector.get_table_names():
        op.drop_index('idx_privacy_consent_institution', table_name='plagiarism_privacy_consents')
        op.drop_table('plagiarism_privacy_consents')
    
    if 'citation_patterns' in inspector.get_table_names():
        op.drop_index('idx_citation_pattern_type', table_name='citation_patterns')
        op.drop_index('idx_citation_pattern_submission', table_name='citation_patterns')
        op.drop_table('citation_patterns')
    
    if 'code_ast_fingerprints' in inspector.get_table_names():
        op.drop_index('idx_ast_fingerprint_language', table_name='code_ast_fingerprints')
        op.drop_index('idx_ast_fingerprint_structure_hash', table_name='code_ast_fingerprints')
        op.drop_index('idx_ast_fingerprint_file', table_name='code_ast_fingerprints')
        op.drop_index('idx_ast_fingerprint_submission', table_name='code_ast_fingerprints')
        op.drop_table('code_ast_fingerprints')
    
    if 'plagiarism_match_segments' in inspector.get_table_names():
        op.drop_index('idx_match_segment_result', table_name='plagiarism_match_segments')
        op.drop_table('plagiarism_match_segments')
    
    if 'plagiarism_results' in inspector.get_table_names():
        op.drop_index('idx_plagiarism_result_reviewed_by', table_name='plagiarism_results')
        op.drop_index('idx_plagiarism_result_review_status', table_name='plagiarism_results')
        op.drop_index('idx_plagiarism_result_similarity', table_name='plagiarism_results')
        op.drop_index('idx_plagiarism_result_matched_submission', table_name='plagiarism_results')
        op.drop_index('idx_plagiarism_result_submission', table_name='plagiarism_results')
        op.drop_index('idx_plagiarism_result_check', table_name='plagiarism_results')
        op.drop_table('plagiarism_results')
    
    if 'plagiarism_checks' in inspector.get_table_names():
        op.drop_index('idx_plagiarism_check_status', table_name='plagiarism_checks')
        op.drop_index('idx_plagiarism_check_submission', table_name='plagiarism_checks')
        op.drop_index('idx_plagiarism_check_assignment', table_name='plagiarism_checks')
        op.drop_index('idx_plagiarism_check_institution', table_name='plagiarism_checks')
        op.drop_table('plagiarism_checks')
    
    try:
        op.execute('DROP TYPE IF EXISTS reviewdecision')
    except:
        pass
    try:
        op.execute('DROP TYPE IF EXISTS plagiarismcheckstatus')
    except:
        pass
    try:
        op.execute('DROP TYPE IF EXISTS comparisonscope')
    except:
        pass
    try:
        op.execute('DROP TYPE IF EXISTS contenttype')
    except:
        pass
