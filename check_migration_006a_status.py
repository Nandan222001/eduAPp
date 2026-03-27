"""
Script to check the status of migration 006a without relying on database connectivity through alembic.
This script will:
1. Check if the alembic_version table exists and what version is recorded
2. Check if questions_bank table exists
3. Document findings about migration 006a completion status
"""
import sys
import pymysql
from datetime import datetime

def check_database_state():
    """Check the current database state for migration 006a"""
    
    print("=" * 80)
    print("DATABASE STATE CHECK FOR MIGRATION 006a")
    print("=" * 80)
    print(f"Timestamp: {datetime.now()}")
    print()
    
    # Database connection parameters (using defaults from config)
    db_config = {
        'host': 'localhost',
        'port': 3306,
        'user': 'mysql',
        'password': 'mysql_password',
        'database': 'mysql_db',
        'charset': 'utf8mb4'
    }
    
    try:
        # Connect to database
        print("Attempting to connect to database...")
        print(f"Host: {db_config['host']}")
        print(f"Port: {db_config['port']}")
        print(f"User: {db_config['user']}")
        print(f"Database: {db_config['database']}")
        print()
        
        connection = pymysql.connect(**db_config)
        print("✓ Successfully connected to database")
        print()
        
        cursor = connection.cursor()
        
        # Check 1: Check if alembic_version table exists
        print("-" * 80)
        print("CHECK 1: Alembic Version Table")
        print("-" * 80)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = %s 
            AND table_name = 'alembic_version'
        """, (db_config['database'],))
        
        alembic_table_exists = cursor.fetchone()[0] > 0
        
        if alembic_table_exists:
            print("✓ alembic_version table exists")
            
            # Get current version
            cursor.execute("SELECT version_num FROM alembic_version")
            version = cursor.fetchone()
            
            if version:
                current_version = version[0]
                print(f"✓ Current migration version: {current_version}")
            else:
                print("⚠ alembic_version table exists but is empty")
                current_version = None
        else:
            print("✗ alembic_version table does not exist")
            current_version = None
        
        print()
        
        # Check 2: Check if questions_bank table exists
        print("-" * 80)
        print("CHECK 2: questions_bank Table")
        print("-" * 80)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = %s 
            AND table_name = 'questions_bank'
        """, (db_config['database'],))
        
        questions_bank_exists = cursor.fetchone()[0] > 0
        
        if questions_bank_exists:
            print("✓ questions_bank table exists")
            
            # Get table structure
            cursor.execute(f"SHOW CREATE TABLE questions_bank")
            create_table = cursor.fetchone()[1]
            print()
            print("Table structure:")
            print(create_table)
            print()
            
            # Get row count
            cursor.execute("SELECT COUNT(*) FROM questions_bank")
            row_count = cursor.fetchone()[0]
            print(f"✓ Row count: {row_count}")
        else:
            print("✗ questions_bank table does not exist")
        
        print()
        
        # Check 3: Check if previous_year_papers table exists
        print("-" * 80)
        print("CHECK 3: previous_year_papers Table")
        print("-" * 80)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = %s 
            AND table_name = 'previous_year_papers'
        """, (db_config['database'],))
        
        pyp_exists = cursor.fetchone()[0] > 0
        
        if pyp_exists:
            print("✓ previous_year_papers table exists")
            
            # Get row count
            cursor.execute("SELECT COUNT(*) FROM previous_year_papers")
            row_count = cursor.fetchone()[0]
            print(f"✓ Row count: {row_count}")
        else:
            print("✗ previous_year_papers table does not exist")
        
        print()
        
        # Check 4: Check if topic_predictions table exists
        print("-" * 80)
        print("CHECK 4: topic_predictions Table")
        print("-" * 80)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = %s 
            AND table_name = 'topic_predictions'
        """, (db_config['database'],))
        
        tp_exists = cursor.fetchone()[0] > 0
        
        if tp_exists:
            print("✓ topic_predictions table exists")
            
            # Get row count
            cursor.execute("SELECT COUNT(*) FROM topic_predictions")
            row_count = cursor.fetchone()[0]
            print(f"✓ Row count: {row_count}")
        else:
            print("✗ topic_predictions table does not exist")
        
        print()
        
        # Summary and Recommendation
        print("=" * 80)
        print("SUMMARY AND RECOMMENDATIONS")
        print("=" * 80)
        
        if current_version:
            print(f"Current Migration Version: {current_version}")
        else:
            print("Current Migration Version: UNKNOWN (alembic_version table missing or empty)")
        
        print()
        
        migration_006a_complete = questions_bank_exists and pyp_exists and tp_exists
        
        if migration_006a_complete:
            print("✓ Migration 006a appears to be COMPLETE")
            print("  All three tables created by migration 006a exist:")
            print("  - previous_year_papers")
            print("  - questions_bank")
            print("  - topic_predictions")
            
            if current_version and current_version >= '006a':
                print()
                print("✓ Alembic version is at or past 006a")
                print("  No action needed - migration 006a has been successfully applied.")
            else:
                print()
                print("⚠ WARNING: Tables exist but alembic_version may not reflect this")
                print("  This could indicate manual table creation or alembic_version corruption.")
                print("  You may need to stamp the database with the correct version:")
                print("  Run: alembic stamp 006a")
        else:
            print("✗ Migration 006a appears to be INCOMPLETE")
            print("  Missing tables:")
            if not pyp_exists:
                print("  - previous_year_papers")
            if not questions_bank_exists:
                print("  - questions_bank")
            if not tp_exists:
                print("  - topic_predictions")
            
            print()
            print("⚠ RECOMMENDATION: Re-run migration 006a")
            print("  Run: alembic upgrade 006a")
        
        print()
        
        cursor.close()
        connection.close()
        
    except pymysql.err.OperationalError as e:
        print(f"✗ Database connection failed: {e}")
        print()
        print("POSSIBLE ISSUES:")
        print("1. MySQL server is not running")
        print("2. Database credentials are incorrect")
        print("3. Database does not exist")
        print("4. Network connectivity issues")
        print()
        print("Please check:")
        print("- MySQL server is running")
        print("- Database credentials in .env file match your MySQL setup")
        print("- Database 'mysql_db' has been created")
        return False
        
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("=" * 80)
    return True

if __name__ == "__main__":
    success = check_database_state()
    sys.exit(0 if success else 1)
