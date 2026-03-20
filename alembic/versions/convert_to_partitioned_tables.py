"""convert attendance and analytics_events to partitioned tables

Revision ID: partition_001
Revises: 
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timedelta

revision = 'partition_001'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    """
    Convert attendance and analytics_events tables to partitioned tables.
    
    This migration:
    1. Renames existing tables to _old
    2. Creates new partitioned parent tables
    3. Creates initial partitions for the next 3 months
    4. Migrates data from old tables to new partitions
    5. Drops old tables
    
    WARNING: This may take time for large tables and requires maintenance window.
    """
    
    op.execute("ALTER TABLE attendances RENAME TO attendances_old")
    
    op.execute("""
        CREATE TABLE attendances (
            id INTEGER NOT NULL,
            institution_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            section_id INTEGER,
            subject_id INTEGER,
            date DATE NOT NULL,
            status VARCHAR NOT NULL DEFAULT 'present',
            marked_by_id INTEGER,
            remarks TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, date)
        ) PARTITION BY RANGE (date)
    """)
    
    current_date = datetime.utcnow()
    
    for month_offset in range(-2, 4):
        target_date = current_date + timedelta(days=30 * month_offset)
        year = target_date.year
        month = target_date.month
        
        next_month = month + 1
        next_year = year
        if next_month > 12:
            next_month = 1
            next_year += 1
        
        partition_name = f"attendances_y{year}m{month:02d}"
        start_date = f"{year}-{month:02d}-01"
        end_date = f"{next_year}-{next_month:02d}-01"
        
        op.execute(f"""
            CREATE TABLE {partition_name}
            PARTITION OF attendances
            FOR VALUES FROM ('{start_date}') TO ('{end_date}')
        """)
    
    op.execute("CREATE SEQUENCE IF NOT EXISTS attendances_id_seq")
    op.execute("ALTER TABLE attendances ALTER COLUMN id SET DEFAULT nextval('attendances_id_seq')")
    
    op.execute("""
        INSERT INTO attendances
        SELECT * FROM attendances_old
    """)
    
    op.create_index('idx_attendance_institution', 'attendances', ['institution_id'])
    op.create_index('idx_attendance_student', 'attendances', ['student_id'])
    op.create_index('idx_attendance_section', 'attendances', ['section_id'])
    op.create_index('idx_attendance_subject', 'attendances', ['subject_id'])
    op.create_index('idx_attendance_date', 'attendances', ['date'])
    op.create_index('idx_attendance_status', 'attendances', ['status'])
    op.create_index('idx_attendance_marked_by', 'attendances', ['marked_by_id'])
    op.create_index('idx_attendance_student_date', 'attendances', ['student_id', 'date'])
    op.create_index('idx_attendance_section_date', 'attendances', ['section_id', 'date'])
    
    op.execute("""
        ALTER TABLE attendances
        ADD CONSTRAINT fk_attendances_institution
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
    """)
    
    op.execute("""
        ALTER TABLE attendances
        ADD CONSTRAINT fk_attendances_student
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    """)
    
    op.execute("""
        ALTER TABLE attendances
        ADD CONSTRAINT fk_attendances_section
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
    """)
    
    op.execute("""
        ALTER TABLE attendances
        ADD CONSTRAINT fk_attendances_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    """)
    
    op.execute("""
        ALTER TABLE attendances
        ADD CONSTRAINT fk_attendances_marked_by
        FOREIGN KEY (marked_by_id) REFERENCES users(id) ON DELETE SET NULL
    """)
    
    op.execute("""
        ALTER TABLE attendances
        ADD CONSTRAINT uq_student_date_subject_attendance
        UNIQUE (student_id, date, subject_id)
    """)
    
    op.execute("DROP TABLE IF EXISTS attendances_old CASCADE")
    
    op.execute("ALTER TABLE analytics_events RENAME TO analytics_events_old")
    
    op.execute("""
        CREATE TABLE analytics_events (
            id UUID NOT NULL,
            event_name VARCHAR(255) NOT NULL,
            event_type VARCHAR(50) NOT NULL,
            user_id UUID,
            session_id VARCHAR(255),
            institution_id UUID,
            properties JSON,
            user_agent VARCHAR(500),
            ip_address VARCHAR(50),
            referrer VARCHAR(500),
            url VARCHAR(1000),
            country VARCHAR(100),
            city VARCHAR(100),
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
            PRIMARY KEY (id, created_at)
        ) PARTITION BY RANGE (created_at)
    """)
    
    for month_offset in range(-2, 4):
        target_date = current_date + timedelta(days=30 * month_offset)
        year = target_date.year
        month = target_date.month
        
        next_month = month + 1
        next_year = year
        if next_month > 12:
            next_month = 1
            next_year += 1
        
        partition_name = f"analytics_events_y{year}m{month:02d}"
        start_date = f"{year}-{month:02d}-01"
        end_date = f"{next_year}-{next_month:02d}-01"
        
        op.execute(f"""
            CREATE TABLE {partition_name}
            PARTITION OF analytics_events
            FOR VALUES FROM ('{start_date}') TO ('{end_date}')
        """)
    
    op.execute("""
        INSERT INTO analytics_events
        SELECT * FROM analytics_events_old
    """)
    
    op.create_index('idx_analytics_events_event_name', 'analytics_events', ['event_name'])
    op.create_index('idx_analytics_events_event_type', 'analytics_events', ['event_type'])
    op.create_index('idx_analytics_events_user_id', 'analytics_events', ['user_id'])
    op.create_index('idx_analytics_events_session_id', 'analytics_events', ['session_id'])
    op.create_index('idx_analytics_events_institution_id', 'analytics_events', ['institution_id'])
    op.create_index('idx_analytics_events_created_at', 'analytics_events', ['created_at'])
    op.create_index('idx_analytics_events_user_created', 'analytics_events', ['user_id', 'created_at'])
    op.create_index('idx_analytics_events_institution_created', 'analytics_events', ['institution_id', 'created_at'])
    op.create_index('idx_analytics_events_event_created', 'analytics_events', ['event_name', 'created_at'])
    
    op.execute("DROP TABLE IF EXISTS analytics_events_old CASCADE")


def downgrade():
    """
    Revert partitioned tables back to regular tables.
    
    WARNING: This will drop all partition-specific optimizations.
    """
    
    op.execute("ALTER TABLE attendances RENAME TO attendances_partitioned")
    
    op.execute("""
        CREATE TABLE attendances (
            id INTEGER PRIMARY KEY,
            institution_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            section_id INTEGER,
            subject_id INTEGER,
            date DATE NOT NULL,
            status VARCHAR NOT NULL DEFAULT 'present',
            marked_by_id INTEGER,
            remarks TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    op.execute("""
        INSERT INTO attendances
        SELECT * FROM attendances_partitioned
    """)
    
    op.create_index('idx_attendance_institution', 'attendances', ['institution_id'])
    op.create_index('idx_attendance_student', 'attendances', ['student_id'])
    op.create_index('idx_attendance_section', 'attendances', ['section_id'])
    op.create_index('idx_attendance_subject', 'attendances', ['subject_id'])
    op.create_index('idx_attendance_date', 'attendances', ['date'])
    op.create_index('idx_attendance_status', 'attendances', ['status'])
    op.create_index('idx_attendance_marked_by', 'attendances', ['marked_by_id'])
    op.create_index('idx_attendance_student_date', 'attendances', ['student_id', 'date'])
    op.create_index('idx_attendance_section_date', 'attendances', ['section_id', 'date'])
    
    op.execute("DROP TABLE IF EXISTS attendances_partitioned CASCADE")
    
    op.execute("ALTER TABLE analytics_events RENAME TO analytics_events_partitioned")
    
    op.execute("""
        CREATE TABLE analytics_events (
            id UUID PRIMARY KEY,
            event_name VARCHAR(255) NOT NULL,
            event_type VARCHAR(50) NOT NULL,
            user_id UUID,
            session_id VARCHAR(255),
            institution_id UUID,
            properties JSON,
            user_agent VARCHAR(500),
            ip_address VARCHAR(50),
            referrer VARCHAR(500),
            url VARCHAR(1000),
            country VARCHAR(100),
            city VARCHAR(100),
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
        )
    """)
    
    op.execute("""
        INSERT INTO analytics_events
        SELECT * FROM analytics_events_partitioned
    """)
    
    op.create_index('idx_analytics_events_event_name', 'analytics_events', ['event_name'])
    op.create_index('idx_analytics_events_event_type', 'analytics_events', ['event_type'])
    op.create_index('idx_analytics_events_user_id', 'analytics_events', ['user_id'])
    op.create_index('idx_analytics_events_session_id', 'analytics_events', ['session_id'])
    op.create_index('idx_analytics_events_institution_id', 'analytics_events', ['institution_id'])
    op.create_index('idx_analytics_events_created_at', 'analytics_events', ['created_at'])
    
    op.execute("DROP TABLE IF EXISTS analytics_events_partitioned CASCADE")
