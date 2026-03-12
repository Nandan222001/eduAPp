from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Index, BigInteger
from src.database import Base


class RateLimitViolation(Base):
    __tablename__ = "rate_limit_violations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    role_slug = Column(String(100), nullable=True, index=True)
    path = Column(String(500), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    ip_address = Column(String(45), nullable=False, index=True)
    limit_hit = Column(String(50), nullable=False)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index('idx_rate_limit_user_created', 'user_id', 'created_at'),
        Index('idx_rate_limit_role_created', 'role_slug', 'created_at'),
        Index('idx_rate_limit_path_created', 'path', 'created_at'),
        Index('idx_rate_limit_ip_created', 'ip_address', 'created_at'),
    )


class RateLimitStats(Base):
    __tablename__ = "rate_limit_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, index=True)
    role_slug = Column(String(100), nullable=True, index=True)
    total_requests = Column(BigInteger, default=0, nullable=False)
    total_violations = Column(BigInteger, default=0, nullable=False)
    unique_users = Column(Integer, default=0, nullable=False)
    unique_ips = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index('idx_rate_limit_stats_date_role', 'date', 'role_slug', unique=True),
    )
