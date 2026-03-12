import time
import hashlib
import re
from typing import Any
from sqlalchemy import event
from sqlalchemy.engine import Engine
from src.database import SessionLocal
from src.models.performance_monitoring import DatabaseQueryMetric


class DatabaseQueryTracker:
    """Tracker for database query performance"""
    
    def __init__(self):
        self.slow_query_threshold_ms = 500
        self.tracking_enabled = True
    
    def _normalize_query(self, statement: str) -> str:
        """Normalize SQL query for hashing"""
        normalized = re.sub(r'\s+', ' ', statement)
        normalized = re.sub(r'\d+', '?', normalized)
        normalized = re.sub(r"'[^']*'", '?', normalized)
        return normalized.strip()
    
    def _get_query_hash(self, statement: str) -> str:
        """Generate hash for query"""
        normalized = self._normalize_query(statement)
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def _get_query_type(self, statement: str) -> str:
        """Extract query type from statement"""
        statement = statement.strip().upper()
        if statement.startswith('SELECT'):
            return 'SELECT'
        elif statement.startswith('INSERT'):
            return 'INSERT'
        elif statement.startswith('UPDATE'):
            return 'UPDATE'
        elif statement.startswith('DELETE'):
            return 'DELETE'
        elif statement.startswith('CREATE'):
            return 'CREATE'
        elif statement.startswith('ALTER'):
            return 'ALTER'
        elif statement.startswith('DROP'):
            return 'DROP'
        else:
            return 'OTHER'
    
    def _extract_table_name(self, statement: str) -> str:
        """Extract primary table name from query"""
        try:
            statement = statement.strip().upper()
            
            patterns = [
                r'FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)',
                r'INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)',
                r'UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)',
                r'TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*)',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, statement)
                if match:
                    return match.group(1).lower()
            
            return None
        except Exception:
            return None
    
    def track_query(
        self,
        statement: str,
        execution_time_ms: float,
        rows_affected: int = None,
    ):
        """Track a database query"""
        if not self.tracking_enabled:
            return
        
        try:
            query_hash = self._get_query_hash(statement)
            query_type = self._get_query_type(statement)
            table_name = self._extract_table_name(statement)
            is_slow = execution_time_ms >= self.slow_query_threshold_ms
            
            db = SessionLocal()
            try:
                metric = DatabaseQueryMetric(
                    query_hash=query_hash,
                    query_type=query_type,
                    table_name=table_name,
                    execution_time_ms=execution_time_ms,
                    rows_affected=rows_affected,
                    is_slow=is_slow,
                )
                db.add(metric)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass


db_tracker = DatabaseQueryTracker()


@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Event listener for before query execution"""
    conn.info.setdefault('query_start_time', []).append(time.time())


@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Event listener for after query execution"""
    try:
        query_times = conn.info.get('query_start_time', [])
        if query_times:
            start_time = query_times.pop(-1)
            execution_time_ms = (time.time() - start_time) * 1000
            
            rows_affected = cursor.rowcount if cursor.rowcount >= 0 else None
            
            db_tracker.track_query(
                statement=statement,
                execution_time_ms=execution_time_ms,
                rows_affected=rows_affected,
            )
    except Exception:
        pass
