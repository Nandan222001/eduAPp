from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy import text, inspect
from celery import shared_task
import logging

from src.celery_app import celery_app
from src.database import SessionLocal, engine
from src.redis_client import redis_client

logger = logging.getLogger(__name__)


@celery_app.task(name="db_maintenance.vacuum_analyze")
def vacuum_analyze_task():
    """
    Perform VACUUM ANALYZE on all tables to reclaim storage and update statistics.
    This helps with query performance by keeping statistics up to date.
    """
    logger.info("Starting VACUUM ANALYZE maintenance task")
    
    try:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            tables_to_vacuum = [
                'attendances',
                'attendance_corrections',
                'attendance_summaries',
                'analytics_events',
                'performance_metrics',
                'user_sessions',
                'feature_usage',
                'user_retention',
                'students',
                'teachers',
                'assignments',
                'submissions',
                'grades',
                'exams',
                'notifications'
            ]
            
            for table in tables_to_vacuum:
                try:
                    logger.info(f"Running VACUUM ANALYZE on {table}")
                    conn.execute(text(f"VACUUM ANALYZE {table}"))
                    logger.info(f"Completed VACUUM ANALYZE on {table}")
                except Exception as e:
                    logger.error(f"Error running VACUUM ANALYZE on {table}: {str(e)}")
                    continue
            
            logger.info("Completed VACUUM ANALYZE maintenance task")
            return {"status": "success", "tables_processed": len(tables_to_vacuum)}
    
    except Exception as e:
        logger.error(f"Error in VACUUM ANALYZE task: {str(e)}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="db_maintenance.analyze_index_usage")
def analyze_index_usage_task():
    """
    Analyze index usage statistics and identify unused or rarely used indexes.
    Stores recommendations in Redis for retrieval.
    """
    logger.info("Starting index usage analysis task")
    
    try:
        db = SessionLocal()
        
        query = text("""
            SELECT
                schemaname,
                tablename,
                indexname,
                idx_scan,
                idx_tup_read,
                idx_tup_fetch,
                pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
                pg_relation_size(indexrelid) as index_size_bytes
            FROM
                pg_stat_user_indexes
            WHERE
                schemaname = 'public'
            ORDER BY
                idx_scan ASC, pg_relation_size(indexrelid) DESC
        """)
        
        result = db.execute(query)
        rows = result.fetchall()
        
        unused_indexes = []
        rarely_used_indexes = []
        
        for row in rows:
            index_info = {
                "schema": row[0],
                "table": row[1],
                "index": row[2],
                "scans": row[3],
                "tuples_read": row[4],
                "tuples_fetched": row[5],
                "size": row[6],
                "size_bytes": row[7]
            }
            
            if row[3] == 0 and row[7] > 1024 * 1024:
                unused_indexes.append(index_info)
            elif row[3] < 10 and row[7] > 5 * 1024 * 1024:
                rarely_used_indexes.append(index_info)
        
        recommendations = {
            "generated_at": datetime.utcnow().isoformat(),
            "unused_indexes": unused_indexes,
            "rarely_used_indexes": rarely_used_indexes,
            "total_indexes_analyzed": len(rows)
        }
        
        redis_client.setex(
            "db_maintenance:index_recommendations",
            86400 * 7,
            str(recommendations)
        )
        
        logger.info(f"Index analysis completed. Found {len(unused_indexes)} unused and {len(rarely_used_indexes)} rarely used indexes")
        
        db.close()
        return recommendations
    
    except Exception as e:
        logger.error(f"Error in index usage analysis: {str(e)}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="db_maintenance.cleanup_dead_tuples")
def cleanup_dead_tuples_task():
    """
    Monitor and log dead tuple statistics, trigger VACUUM on tables with high dead tuple counts.
    """
    logger.info("Starting dead tuple cleanup task")
    
    try:
        db = SessionLocal()
        
        query = text("""
            SELECT
                schemaname,
                relname as table_name,
                n_live_tup as live_tuples,
                n_dead_tup as dead_tuples,
                ROUND((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as dead_tuple_ratio,
                last_vacuum,
                last_autovacuum,
                pg_size_pretty(pg_total_relation_size(relid)) as total_size
            FROM
                pg_stat_user_tables
            WHERE
                schemaname = 'public'
            ORDER BY
                n_dead_tup DESC
        """)
        
        result = db.execute(query)
        rows = result.fetchall()
        
        tables_needing_vacuum = []
        
        for row in rows:
            dead_tuple_ratio = row[4] if row[4] is not None else 0
            dead_tuples = row[3]
            
            if dead_tuple_ratio > 20 or dead_tuples > 10000:
                table_info = {
                    "schema": row[0],
                    "table": row[1],
                    "live_tuples": row[2],
                    "dead_tuples": dead_tuples,
                    "dead_tuple_ratio": dead_tuple_ratio,
                    "last_vacuum": str(row[5]) if row[5] else None,
                    "last_autovacuum": str(row[6]) if row[6] else None,
                    "total_size": row[7]
                }
                tables_needing_vacuum.append(table_info)
        
        db.close()
        
        if tables_needing_vacuum:
            logger.warning(f"Found {len(tables_needing_vacuum)} tables needing VACUUM")
            
            with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                for table in tables_needing_vacuum:
                    try:
                        logger.info(f"Running VACUUM on {table['table']} (dead ratio: {table['dead_tuple_ratio']}%)")
                        conn.execute(text(f"VACUUM ANALYZE {table['table']}"))
                    except Exception as e:
                        logger.error(f"Error vacuuming {table['table']}: {str(e)}")
        
        logger.info("Dead tuple cleanup completed")
        return {
            "status": "success",
            "tables_vacuumed": len(tables_needing_vacuum),
            "details": tables_needing_vacuum
        }
    
    except Exception as e:
        logger.error(f"Error in dead tuple cleanup: {str(e)}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="db_maintenance.log_slow_queries")
def log_slow_queries_task():
    """
    Monitor and log slow queries from pg_stat_statements.
    Requires pg_stat_statements extension to be enabled.
    """
    logger.info("Starting slow query logging task")
    
    try:
        db = SessionLocal()
        
        check_extension = text("""
            SELECT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
            )
        """)
        
        result = db.execute(check_extension)
        has_extension = result.scalar()
        
        if not has_extension:
            logger.warning("pg_stat_statements extension not installed, skipping slow query logging")
            db.close()
            return {"status": "skipped", "message": "pg_stat_statements not installed"}
        
        query = text("""
            SELECT
                queryid,
                LEFT(query, 200) as query_sample,
                calls,
                ROUND(total_exec_time::numeric, 2) as total_time_ms,
                ROUND(mean_exec_time::numeric, 2) as mean_time_ms,
                ROUND(min_exec_time::numeric, 2) as min_time_ms,
                ROUND(max_exec_time::numeric, 2) as max_time_ms,
                ROUND(stddev_exec_time::numeric, 2) as stddev_time_ms,
                rows as total_rows
            FROM
                pg_stat_statements
            WHERE
                mean_exec_time > 100
            ORDER BY
                mean_exec_time DESC
            LIMIT 50
        """)
        
        result = db.execute(query)
        rows = result.fetchall()
        
        slow_queries = []
        for row in rows:
            query_info = {
                "query_id": str(row[0]),
                "query_sample": row[1],
                "calls": row[2],
                "total_time_ms": float(row[3]),
                "mean_time_ms": float(row[4]),
                "min_time_ms": float(row[5]),
                "max_time_ms": float(row[6]),
                "stddev_time_ms": float(row[7]),
                "total_rows": row[8]
            }
            slow_queries.append(query_info)
        
        if slow_queries:
            logger.warning(f"Found {len(slow_queries)} slow queries")
            for q in slow_queries[:10]:
                logger.warning(
                    f"Slow query (mean: {q['mean_time_ms']}ms, calls: {q['calls']}): "
                    f"{q['query_sample']}"
                )
            
            redis_client.setex(
                "db_maintenance:slow_queries",
                86400,
                str({
                    "generated_at": datetime.utcnow().isoformat(),
                    "queries": slow_queries
                })
            )
        
        db.close()
        
        logger.info(f"Slow query logging completed. Found {len(slow_queries)} slow queries")
        return {
            "status": "success",
            "slow_queries_count": len(slow_queries),
            "queries": slow_queries[:10]
        }
    
    except Exception as e:
        logger.error(f"Error in slow query logging: {str(e)}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="db_maintenance.create_partitions")
def create_partitions_task():
    """
    Create table partitions for attendance and analytics_events tables.
    Creates monthly partitions for the next 3 months.
    """
    logger.info("Starting partition creation task")
    
    try:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            current_date = datetime.utcnow()
            
            for month_offset in range(0, 3):
                target_date = current_date + timedelta(days=30 * month_offset)
                year = target_date.year
                month = target_date.month
                
                next_month = month + 1
                next_year = year
                if next_month > 12:
                    next_month = 1
                    next_year += 1
                
                partition_name_attendance = f"attendances_y{year}m{month:02d}"
                partition_name_analytics = f"analytics_events_y{year}m{month:02d}"
                
                start_date = f"{year}-{month:02d}-01"
                end_date = f"{next_year}-{next_month:02d}-01"
                
                try:
                    check_partition = text(f"""
                        SELECT EXISTS (
                            SELECT 1 FROM pg_tables 
                            WHERE tablename = '{partition_name_attendance}'
                        )
                    """)
                    result = conn.execute(check_partition)
                    exists = result.scalar()
                    
                    if not exists:
                        create_attendance_partition = text(f"""
                            CREATE TABLE IF NOT EXISTS {partition_name_attendance}
                            PARTITION OF attendances
                            FOR VALUES FROM ('{start_date}') TO ('{end_date}')
                        """)
                        conn.execute(create_attendance_partition)
                        logger.info(f"Created partition: {partition_name_attendance}")
                    else:
                        logger.info(f"Partition already exists: {partition_name_attendance}")
                
                except Exception as e:
                    logger.error(f"Error creating attendance partition for {year}-{month:02d}: {str(e)}")
                
                try:
                    check_partition = text(f"""
                        SELECT EXISTS (
                            SELECT 1 FROM pg_tables 
                            WHERE tablename = '{partition_name_analytics}'
                        )
                    """)
                    result = conn.execute(check_partition)
                    exists = result.scalar()
                    
                    if not exists:
                        create_analytics_partition = text(f"""
                            CREATE TABLE IF NOT EXISTS {partition_name_analytics}
                            PARTITION OF analytics_events
                            FOR VALUES FROM ('{start_date}') TO ('{end_date}')
                        """)
                        conn.execute(create_analytics_partition)
                        logger.info(f"Created partition: {partition_name_analytics}")
                    else:
                        logger.info(f"Partition already exists: {partition_name_analytics}")
                
                except Exception as e:
                    logger.error(f"Error creating analytics partition for {year}-{month:02d}: {str(e)}")
            
            logger.info("Partition creation task completed")
            return {"status": "success", "message": "Partitions checked and created as needed"}
    
    except Exception as e:
        logger.error(f"Error in partition creation task: {str(e)}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="db_maintenance.cleanup_old_partitions")
def cleanup_old_partitions_task(months_to_keep: int = 12):
    """
    Drop old partitions that are older than the specified retention period.
    Default is to keep 12 months of data.
    """
    logger.info(f"Starting old partition cleanup task (keeping {months_to_keep} months)")
    
    try:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            cutoff_date = datetime.utcnow() - timedelta(days=30 * months_to_keep)
            
            query = text("""
                SELECT
                    schemaname,
                    tablename
                FROM
                    pg_tables
                WHERE
                    schemaname = 'public'
                    AND (
                        tablename LIKE 'attendances_y%'
                        OR tablename LIKE 'analytics_events_y%'
                    )
                ORDER BY
                    tablename
            """)
            
            result = conn.execute(query)
            partitions = result.fetchall()
            
            dropped_partitions = []
            
            for partition in partitions:
                table_name = partition[1]
                
                try:
                    if table_name.startswith('attendances_y'):
                        year_month = table_name.replace('attendances_y', '')
                    else:
                        year_month = table_name.replace('analytics_events_y', '')
                    
                    year = int(year_month[:4])
                    month = int(year_month[5:7])
                    
                    partition_date = datetime(year, month, 1)
                    
                    if partition_date < cutoff_date:
                        drop_query = text(f"DROP TABLE IF EXISTS {table_name}")
                        conn.execute(drop_query)
                        dropped_partitions.append(table_name)
                        logger.info(f"Dropped old partition: {table_name}")
                
                except Exception as e:
                    logger.error(f"Error processing partition {table_name}: {str(e)}")
                    continue
            
            logger.info(f"Partition cleanup completed. Dropped {len(dropped_partitions)} partitions")
            return {
                "status": "success",
                "partitions_dropped": len(dropped_partitions),
                "partitions": dropped_partitions
            }
    
    except Exception as e:
        logger.error(f"Error in partition cleanup task: {str(e)}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="db_maintenance.table_bloat_report")
def table_bloat_report_task():
    """
    Generate a report on table bloat to identify tables that need maintenance.
    """
    logger.info("Starting table bloat report task")
    
    try:
        db = SessionLocal()
        
        query = text("""
            SELECT
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
                pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
                pg_total_relation_size(schemaname||'.'||tablename) as total_bytes,
                ROUND(100 * pg_total_relation_size(schemaname||'.'||tablename) / NULLIF(pg_database_size(current_database()), 0), 2) AS percent_of_db
            FROM
                pg_tables
            WHERE
                schemaname = 'public'
            ORDER BY
                pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 20
        """)
        
        result = db.execute(query)
        rows = result.fetchall()
        
        bloat_report = []
        for row in rows:
            table_info = {
                "schema": row[0],
                "table": row[1],
                "total_size": row[2],
                "table_size": row[3],
                "indexes_size": row[4],
                "total_bytes": row[5],
                "percent_of_db": float(row[6]) if row[6] else 0
            }
            bloat_report.append(table_info)
        
        redis_client.setex(
            "db_maintenance:bloat_report",
            86400,
            str({
                "generated_at": datetime.utcnow().isoformat(),
                "tables": bloat_report
            })
        )
        
        db.close()
        
        logger.info(f"Table bloat report completed. Analyzed {len(bloat_report)} tables")
        return {
            "status": "success",
            "tables_analyzed": len(bloat_report),
            "report": bloat_report
        }
    
    except Exception as e:
        logger.error(f"Error in table bloat report: {str(e)}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="db_maintenance.reindex_tables")
def reindex_tables_task(tables: List[str] = None):
    """
    Rebuild indexes for specified tables to reduce bloat and improve performance.
    If no tables specified, reindexes high-traffic tables.
    """
    logger.info("Starting reindex task")
    
    if tables is None:
        tables = [
            'attendances',
            'analytics_events',
            'performance_metrics',
            'user_sessions',
            'students',
            'assignments'
        ]
    
    try:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            reindexed_tables = []
            
            for table in tables:
                try:
                    logger.info(f"Reindexing table: {table}")
                    conn.execute(text(f"REINDEX TABLE CONCURRENTLY {table}"))
                    reindexed_tables.append(table)
                    logger.info(f"Completed reindexing: {table}")
                except Exception as e:
                    logger.error(f"Error reindexing {table}: {str(e)}")
                    continue
            
            logger.info(f"Reindex task completed. Reindexed {len(reindexed_tables)} tables")
            return {
                "status": "success",
                "tables_reindexed": len(reindexed_tables),
                "tables": reindexed_tables
            }
    
    except Exception as e:
        logger.error(f"Error in reindex task: {str(e)}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="db_maintenance.update_statistics")
def update_statistics_task():
    """
    Force update of table statistics for query planner.
    More comprehensive than ANALYZE alone.
    """
    logger.info("Starting statistics update task")
    
    try:
        db = SessionLocal()
        
        query = text("""
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
        """)
        
        result = db.execute(query)
        tables = [row[0] for row in result.fetchall()]
        
        db.close()
        
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            for table in tables:
                try:
                    conn.execute(text(f"ANALYZE {table}"))
                    logger.debug(f"Updated statistics for: {table}")
                except Exception as e:
                    logger.error(f"Error updating statistics for {table}: {str(e)}")
                    continue
        
        logger.info(f"Statistics update completed for {len(tables)} tables")
        return {
            "status": "success",
            "tables_analyzed": len(tables)
        }
    
    except Exception as e:
        logger.error(f"Error in statistics update task: {str(e)}")
        return {"status": "error", "message": str(e)}
