from typing import List, Dict, Any, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


class DatabaseMaintenanceRepository:
    """Repository for database maintenance queries."""
    
    @staticmethod
    def get_table_stats(db: Session, table_name: str) -> Dict[str, Any]:
        """Get statistics for a specific table."""
        query = text("""
            SELECT
                schemaname,
                relname as table_name,
                n_live_tup as live_tuples,
                n_dead_tup as dead_tuples,
                n_mod_since_analyze as modifications_since_analyze,
                last_vacuum,
                last_autovacuum,
                last_analyze,
                last_autoanalyze,
                vacuum_count,
                autovacuum_count,
                analyze_count,
                autoanalyze_count
            FROM
                pg_stat_user_tables
            WHERE
                schemaname = 'public' AND relname = :table_name
        """)
        
        result = db.execute(query, {"table_name": table_name})
        row = result.fetchone()
        
        if not row:
            return None
        
        return {
            "schema": row[0],
            "table_name": row[1],
            "live_tuples": row[2],
            "dead_tuples": row[3],
            "modifications_since_analyze": row[4],
            "last_vacuum": str(row[5]) if row[5] else None,
            "last_autovacuum": str(row[6]) if row[6] else None,
            "last_analyze": str(row[7]) if row[7] else None,
            "last_autoanalyze": str(row[8]) if row[8] else None,
            "vacuum_count": row[9],
            "autovacuum_count": row[10],
            "analyze_count": row[11],
            "autoanalyze_count": row[12]
        }
    
    @staticmethod
    def get_index_stats(db: Session, index_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get statistics for indexes."""
        if index_name:
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
                    schemaname = 'public' AND indexname = :index_name
            """)
            result = db.execute(query, {"index_name": index_name})
        else:
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
                    pg_relation_size(indexrelid) DESC
            """)
            result = db.execute(query)
        
        rows = result.fetchall()
        
        indexes = []
        for row in rows:
            indexes.append({
                "schema": row[0],
                "table": row[1],
                "index": row[2],
                "scans": row[3],
                "tuples_read": row[4],
                "tuples_fetched": row[5],
                "size": row[6],
                "size_bytes": row[7]
            })
        
        return indexes
    
    @staticmethod
    def get_table_sizes(db: Session, limit: int = 20) -> List[Dict[str, Any]]:
        """Get table sizes ordered by total size."""
        query = text("""
            SELECT
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
                pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
                pg_total_relation_size(schemaname||'.'||tablename) as total_bytes
            FROM
                pg_tables
            WHERE
                schemaname = 'public'
            ORDER BY
                pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, {"limit": limit})
        rows = result.fetchall()
        
        tables = []
        for row in rows:
            tables.append({
                "schema": row[0],
                "table": row[1],
                "total_size": row[2],
                "table_size": row[3],
                "indexes_size": row[4],
                "total_bytes": row[5]
            })
        
        return tables
    
    @staticmethod
    def get_long_running_queries(db: Session, min_duration_seconds: int = 60) -> List[Dict[str, Any]]:
        """Get currently running queries that exceed the minimum duration."""
        query = text("""
            SELECT
                pid,
                usename,
                datname,
                state,
                LEFT(query, 200) as query_sample,
                EXTRACT(EPOCH FROM (now() - query_start)) as duration_seconds,
                query_start,
                state_change,
                wait_event_type,
                wait_event
            FROM
                pg_stat_activity
            WHERE
                state != 'idle'
                AND query NOT LIKE '%pg_stat_activity%'
                AND EXTRACT(EPOCH FROM (now() - query_start)) > :min_duration
            ORDER BY
                query_start ASC
        """)
        
        result = db.execute(query, {"min_duration": min_duration_seconds})
        rows = result.fetchall()
        
        queries = []
        for row in rows:
            queries.append({
                "pid": row[0],
                "user": row[1],
                "database": row[2],
                "state": row[3],
                "query_sample": row[4],
                "duration_seconds": float(row[5]) if row[5] else 0,
                "query_start": str(row[6]),
                "state_change": str(row[7]) if row[7] else None,
                "wait_event_type": row[8],
                "wait_event": row[9]
            })
        
        return queries
    
    @staticmethod
    def get_duplicate_indexes(db: Session) -> List[Dict[str, Any]]:
        """Identify duplicate indexes (indexes on same columns)."""
        query = text("""
            SELECT
                indrelid::regclass as table_name,
                array_agg(indexrelid::regclass) as duplicate_indexes,
                array_agg(pg_size_pretty(pg_relation_size(indexrelid))) as sizes,
                array_agg(pg_relation_size(indexrelid)) as size_bytes
            FROM
                pg_index
            GROUP BY
                indrelid, indkey
            HAVING
                COUNT(*) > 1
        """)
        
        result = db.execute(query)
        rows = result.fetchall()
        
        duplicates = []
        for row in rows:
            duplicates.append({
                "table": str(row[0]),
                "indexes": row[1],
                "sizes": row[2],
                "size_bytes": row[3]
            })
        
        return duplicates
    
    @staticmethod
    def get_missing_indexes(db: Session, min_seq_scans: int = 1000) -> List[Dict[str, Any]]:
        """Suggest tables that might benefit from indexes based on sequential scan counts."""
        query = text("""
            SELECT
                schemaname,
                relname as table_name,
                seq_scan,
                seq_tup_read,
                idx_scan,
                CASE 
                    WHEN seq_scan > 0 THEN ROUND((100.0 * idx_scan / NULLIF(seq_scan + idx_scan, 0)), 2)
                    ELSE 0
                END as index_usage_percent,
                n_live_tup as live_tuples,
                pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as table_size
            FROM
                pg_stat_user_tables
            WHERE
                schemaname = 'public'
                AND seq_scan > :min_seq_scans
                AND idx_scan < seq_scan
            ORDER BY
                seq_scan DESC
        """)
        
        result = db.execute(query, {"min_seq_scans": min_seq_scans})
        rows = result.fetchall()
        
        tables = []
        for row in rows:
            tables.append({
                "schema": row[0],
                "table": row[1],
                "seq_scan": row[2],
                "seq_tup_read": row[3],
                "idx_scan": row[4],
                "index_usage_percent": float(row[5]) if row[5] else 0,
                "live_tuples": row[6],
                "table_size": row[7]
            })
        
        return tables
    
    @staticmethod
    def get_bloat_estimate(db: Session) -> List[Dict[str, Any]]:
        """Estimate table and index bloat."""
        query = text("""
            SELECT
                schemaname,
                tablename,
                ROUND(CASE WHEN otta=0 THEN 0.0 ELSE sml.relpages/otta::numeric END,1) AS table_bloat_ratio,
                CASE WHEN relpages < otta THEN 0 ELSE bs*(sml.relpages-otta)::bigint END AS table_waste_bytes,
                pg_size_pretty(CASE WHEN relpages < otta THEN 0 ELSE bs*(sml.relpages-otta)::bigint END) AS table_waste,
                pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
            FROM (
                SELECT
                    schemaname, tablename, cc.relpages, bs,
                    CEIL((cc.reltuples*((datahdr+ma-
                        (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta
                FROM (
                    SELECT
                        ma,bs,schemaname,tablename,
                        (datawidth+(hdr+ma-(case when hdr%ma=0 THEN ma ELSE hdr%ma END)))::numeric AS datahdr,
                        (maxfracsum*(nullhdr+ma-(case when nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr2
                    FROM (
                        SELECT
                            schemaname, tablename, hdr, ma, bs,
                            SUM((1-null_frac)*avg_width) AS datawidth,
                            MAX(null_frac) AS maxfracsum,
                            hdr+(
                                SELECT 1+count(*)/8
                                FROM pg_stats s2
                                WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
                            ) AS nullhdr
                        FROM pg_stats s, (
                            SELECT
                                (SELECT current_setting('block_size')::numeric) AS bs,
                                CASE WHEN substring(v,12,3) IN ('8.0','8.1','8.2') THEN 27 ELSE 23 END AS hdr,
                                CASE WHEN v ~ 'mingw32' THEN 8 ELSE 4 END AS ma
                            FROM (SELECT version() AS v) AS foo
                        ) AS constants
                        WHERE schemaname = 'public'
                        GROUP BY 1,2,3,4,5
                    ) AS foo
                ) AS rs
                JOIN pg_class cc ON cc.relname = rs.tablename
                JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = rs.schemaname
            ) AS sml
            WHERE schemaname = 'public'
            ORDER BY table_waste_bytes DESC
            LIMIT 20
        """)
        
        try:
            result = db.execute(query)
            rows = result.fetchall()
            
            bloat = []
            for row in rows:
                bloat.append({
                    "schema": row[0],
                    "table": row[1],
                    "bloat_ratio": float(row[2]) if row[2] else 0,
                    "waste_bytes": row[3],
                    "waste": row[4],
                    "table_size": row[5]
                })
            
            return bloat
        except Exception as e:
            logger.error(f"Error estimating bloat: {str(e)}")
            return []
    
    @staticmethod
    def get_autovacuum_progress(db: Session) -> List[Dict[str, Any]]:
        """Get current autovacuum progress."""
        query = text("""
            SELECT
                p.pid,
                p.datname,
                p.relid::regclass as table_name,
                p.phase,
                p.heap_blks_total,
                p.heap_blks_scanned,
                p.heap_blks_vacuumed,
                ROUND(100.0 * p.heap_blks_scanned / NULLIF(p.heap_blks_total, 0), 2) as percent_complete,
                a.query_start,
                EXTRACT(EPOCH FROM (now() - a.query_start)) as duration_seconds
            FROM
                pg_stat_progress_vacuum p
                JOIN pg_stat_activity a ON p.pid = a.pid
            WHERE
                a.datname = current_database()
        """)
        
        result = db.execute(query)
        rows = result.fetchall()
        
        progress = []
        for row in rows:
            progress.append({
                "pid": row[0],
                "database": row[1],
                "table": str(row[2]),
                "phase": row[3],
                "heap_blocks_total": row[4],
                "heap_blocks_scanned": row[5],
                "heap_blocks_vacuumed": row[6],
                "percent_complete": float(row[7]) if row[7] else 0,
                "start_time": str(row[8]),
                "duration_seconds": float(row[9]) if row[9] else 0
            })
        
        return progress
    
    @staticmethod
    def reset_query_statistics(db: Session) -> bool:
        """Reset pg_stat_statements statistics."""
        try:
            db.execute(text("SELECT pg_stat_statements_reset()"))
            return True
        except Exception as e:
            logger.error(f"Error resetting query statistics: {str(e)}")
            return False
