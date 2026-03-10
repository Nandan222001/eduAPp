"""create chapters and topics tables

Revision ID: 006
Revises: 005
Create Date: 2024-01-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('chapters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('grade_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['grade_id'], ['grades.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('subject_id', 'grade_id', 'name', name='uq_subject_grade_chapter_name'),
        sa.UniqueConstraint('subject_id', 'grade_id', 'code', name='uq_subject_grade_chapter_code')
    )
    op.create_index('idx_chapter_institution', 'chapters', ['institution_id'])
    op.create_index('idx_chapter_subject', 'chapters', ['subject_id'])
    op.create_index('idx_chapter_grade', 'chapters', ['grade_id'])
    op.create_index('idx_chapter_active', 'chapters', ['is_active'])
    
    op.create_table('topics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('chapter_id', 'name', name='uq_chapter_topic_name'),
        sa.UniqueConstraint('chapter_id', 'code', name='uq_chapter_topic_code')
    )
    op.create_index('idx_topic_institution', 'topics', ['institution_id'])
    op.create_index('idx_topic_chapter', 'topics', ['chapter_id'])
    op.create_index('idx_topic_active', 'topics', ['is_active'])


def downgrade():
    op.drop_index('idx_topic_active', table_name='topics')
    op.drop_index('idx_topic_chapter', table_name='topics')
    op.drop_index('idx_topic_institution', table_name='topics')
    op.drop_table('topics')
    
    op.drop_index('idx_chapter_active', table_name='chapters')
    op.drop_index('idx_chapter_grade', table_name='chapters')
    op.drop_index('idx_chapter_subject', table_name='chapters')
    op.drop_index('idx_chapter_institution', table_name='chapters')
    op.drop_table('chapters')
