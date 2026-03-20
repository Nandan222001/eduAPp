"""create olympics tables

Revision ID: 031
Revises: 030
Create Date: 2024-01-31 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON, ARRAY

revision = '031'
down_revision = 'homework_scanner_001'
branch_labels = None
depends_on = None


def upgrade():
    competition_scope_enum = sa.Enum('class', 'school', 'inter_school', 'national', name='competitionscope', create_type=True)
    
    op.create_table('competitions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('competition_type', sa.Enum('math_olympiad', 'speed_challenge', 'quiz_battle', 'coding_contest', 'essay', 'science_experiment', name='competitiontype'), nullable=False),
        sa.Column('scope', competition_scope_enum, nullable=False),
        sa.Column('status', sa.Enum('draft', 'upcoming', 'ongoing', 'completed', 'cancelled', name='competitionstatus'), nullable=False, server_default='draft'),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('rules', JSON, nullable=True),
        sa.Column('prize_pool', JSON, nullable=True),
        sa.Column('participating_institutions', ARRAY(sa.Integer), nullable=True),
        sa.Column('banner_url', sa.String(length=500), nullable=True),
        sa.Column('organizer_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organizer_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_competition_institution', 'competitions', ['institution_id'])
    op.create_index('idx_competition_type', 'competitions', ['competition_type'])
    op.create_index('idx_competition_scope', 'competitions', ['scope'])
    op.create_index('idx_competition_status', 'competitions', ['status'])
    op.create_index('idx_competition_dates', 'competitions', ['start_date', 'end_date'])
    op.create_index('idx_competition_organizer', 'competitions', ['organizer_id'])
    
    op.create_table('competition_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('competition_id', sa.Integer(), nullable=False),
        sa.Column('event_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_type', sa.Enum('individual', 'team', 'relay', name='eventtype'), nullable=False),
        sa.Column('max_participants', sa.Integer(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('question_set', JSON, nullable=True),
        sa.Column('scoring_rules', JSON, nullable=True),
        sa.Column('start_time', sa.DateTime(), nullable=True),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['competition_id'], ['competitions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_event_institution', 'competition_events', ['institution_id'])
    op.create_index('idx_event_competition', 'competition_events', ['competition_id'])
    op.create_index('idx_event_type', 'competition_events', ['event_type'])
    op.create_index('idx_event_times', 'competition_events', ['start_time', 'end_time'])
    
    op.create_table('competition_teams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('team_name', sa.String(length=200), nullable=False),
        sa.Column('team_leader_id', sa.Integer(), nullable=True),
        sa.Column('members', ARRAY(sa.Integer), nullable=False),
        sa.Column('total_score', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['event_id'], ['competition_events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_leader_id'], ['students.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id', 'team_name', name='uq_event_team_name')
    )
    op.create_index('idx_team_institution', 'competition_teams', ['institution_id'])
    op.create_index('idx_team_event', 'competition_teams', ['event_id'])
    op.create_index('idx_team_leader', 'competition_teams', ['team_leader_id'])
    op.create_index('idx_team_score', 'competition_teams', ['total_score'])
    op.create_index('idx_team_rank', 'competition_teams', ['rank'])
    
    op.create_table('competition_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('participant_student_id', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=True),
        sa.Column('score', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('time_taken', sa.Integer(), nullable=True),
        sa.Column('submission_data', JSON, nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='registered'),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('graded_at', sa.DateTime(), nullable=True),
        sa.Column('certificate_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['event_id'], ['competition_events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['participant_student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['competition_teams.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id', 'participant_student_id', name='uq_event_participant')
    )
    op.create_index('idx_entry_institution', 'competition_entries', ['institution_id'])
    op.create_index('idx_entry_event', 'competition_entries', ['event_id'])
    op.create_index('idx_entry_participant', 'competition_entries', ['participant_student_id'])
    op.create_index('idx_entry_team', 'competition_entries', ['team_id'])
    op.create_index('idx_entry_score', 'competition_entries', ['score'])
    op.create_index('idx_entry_rank', 'competition_entries', ['rank'])
    op.create_index('idx_entry_status', 'competition_entries', ['status'])
    
    op.create_table('competition_leaderboards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('competition_id', sa.Integer(), nullable=False),
        sa.Column('scope', competition_scope_enum, nullable=False),
        sa.Column('rankings', JSON, nullable=False),
        sa.Column('last_updated', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('total_participants', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('metadata', JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['competition_id'], ['competitions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('competition_id', 'scope', name='uq_competition_scope_leaderboard')
    )
    op.create_index('idx_leaderboard_institution', 'competition_leaderboards', ['institution_id'])
    op.create_index('idx_leaderboard_competition', 'competition_leaderboards', ['competition_id'])
    op.create_index('idx_leaderboard_scope', 'competition_leaderboards', ['scope'])
    op.create_index('idx_leaderboard_updated', 'competition_leaderboards', ['last_updated'])


def downgrade():
    op.drop_index('idx_leaderboard_updated', table_name='competition_leaderboards')
    op.drop_index('idx_leaderboard_scope', table_name='competition_leaderboards')
    op.drop_index('idx_leaderboard_competition', table_name='competition_leaderboards')
    op.drop_index('idx_leaderboard_institution', table_name='competition_leaderboards')
    op.drop_table('competition_leaderboards')
    
    op.drop_index('idx_entry_status', table_name='competition_entries')
    op.drop_index('idx_entry_rank', table_name='competition_entries')
    op.drop_index('idx_entry_score', table_name='competition_entries')
    op.drop_index('idx_entry_team', table_name='competition_entries')
    op.drop_index('idx_entry_participant', table_name='competition_entries')
    op.drop_index('idx_entry_event', table_name='competition_entries')
    op.drop_index('idx_entry_institution', table_name='competition_entries')
    op.drop_table('competition_entries')
    
    op.drop_index('idx_team_rank', table_name='competition_teams')
    op.drop_index('idx_team_score', table_name='competition_teams')
    op.drop_index('idx_team_leader', table_name='competition_teams')
    op.drop_index('idx_team_event', table_name='competition_teams')
    op.drop_index('idx_team_institution', table_name='competition_teams')
    op.drop_table('competition_teams')
    
    op.drop_index('idx_event_times', table_name='competition_events')
    op.drop_index('idx_event_type', table_name='competition_events')
    op.drop_index('idx_event_competition', table_name='competition_events')
    op.drop_index('idx_event_institution', table_name='competition_events')
    op.drop_table('competition_events')
    
    op.drop_index('idx_competition_organizer', table_name='competitions')
    op.drop_index('idx_competition_dates', table_name='competitions')
    op.drop_index('idx_competition_status', table_name='competitions')
    op.drop_index('idx_competition_scope', table_name='competitions')
    op.drop_index('idx_competition_type', table_name='competitions')
    op.drop_index('idx_competition_institution', table_name='competitions')
    op.drop_table('competitions')
    
    op.execute('DROP TYPE IF EXISTS eventtype')
    op.execute('DROP TYPE IF EXISTS competitionstatus')
    op.execute('DROP TYPE IF EXISTS competitionscope')
    op.execute('DROP TYPE IF EXISTS competitiontype')
