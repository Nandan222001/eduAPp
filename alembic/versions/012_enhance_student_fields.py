"""enhance student fields

Revision ID: 012
Revises: 011
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('students', sa.Column('photo_url', sa.String(length=500), nullable=True))
    op.add_column('students', sa.Column('emergency_contact_name', sa.String(length=255), nullable=True))
    op.add_column('students', sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True))
    op.add_column('students', sa.Column('emergency_contact_relation', sa.String(length=100), nullable=True))
    op.add_column('students', sa.Column('previous_school', sa.String(length=255), nullable=True))
    op.add_column('students', sa.Column('medical_conditions', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('status', sa.String(length=20), nullable=False, server_default='active'))
    
    op.create_index('idx_student_status', 'students', ['status'])


def downgrade():
    op.drop_index('idx_student_status', table_name='students')
    
    op.drop_column('students', 'status')
    op.drop_column('students', 'medical_conditions')
    op.drop_column('students', 'previous_school')
    op.drop_column('students', 'emergency_contact_relation')
    op.drop_column('students', 'emergency_contact_phone')
    op.drop_column('students', 'emergency_contact_name')
    op.drop_column('students', 'photo_url')
