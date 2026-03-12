from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from src.models.rate_limit import RateLimitViolation, RateLimitStats
from src.schemas.rate_limit import (
    RateLimitViolationCreate,
    RateLimitViolationResponse,
    RateLimitDashboardResponse,
    RateLimitViolationFilter,
)
from src.middleware.rate_limit import get_rate_limit_for_role


class RateLimitService:
    @staticmethod
    def create_violation(
        db: Session,
        violation_data: RateLimitViolationCreate
    ) -> RateLimitViolation:
        violation = RateLimitViolation(**violation_data.model_dump())
        db.add(violation)
        db.commit()
        db.refresh(violation)
        return violation
    
    @staticmethod
    def get_violations(
        db: Session,
        filters: RateLimitViolationFilter
    ) -> tuple[List[RateLimitViolation], int]:
        query = db.query(RateLimitViolation)
        
        if filters.user_id:
            query = query.filter(RateLimitViolation.user_id == filters.user_id)
        
        if filters.role_slug:
            query = query.filter(RateLimitViolation.role_slug == filters.role_slug)
        
        if filters.path:
            query = query.filter(RateLimitViolation.path.like(f"%{filters.path}%"))
        
        if filters.ip_address:
            query = query.filter(RateLimitViolation.ip_address == filters.ip_address)
        
        if filters.start_date:
            query = query.filter(RateLimitViolation.created_at >= filters.start_date)
        
        if filters.end_date:
            query = query.filter(RateLimitViolation.created_at <= filters.end_date)
        
        total = query.count()
        
        offset = (filters.page - 1) * filters.page_size
        violations = query.order_by(desc(RateLimitViolation.created_at)).offset(offset).limit(filters.page_size).all()
        
        return violations, total
    
    @staticmethod
    def get_violations_count_by_period(
        db: Session,
        days: int
    ) -> int:
        start_date = datetime.utcnow() - timedelta(days=days)
        return db.query(RateLimitViolation).filter(
            RateLimitViolation.created_at >= start_date
        ).count()
    
    @staticmethod
    def get_violations_by_role(
        db: Session,
        days: int = 7
    ) -> List[dict]:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        results = db.query(
            RateLimitViolation.role_slug,
            func.count(RateLimitViolation.id).label('count')
        ).filter(
            RateLimitViolation.created_at >= start_date
        ).group_by(
            RateLimitViolation.role_slug
        ).order_by(
            desc('count')
        ).all()
        
        return [
            {
                "role": r.role_slug or "anonymous",
                "violations": r.count
            }
            for r in results
        ]
    
    @staticmethod
    def get_violations_by_endpoint(
        db: Session,
        days: int = 7,
        limit: int = 10
    ) -> List[dict]:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        results = db.query(
            RateLimitViolation.path,
            RateLimitViolation.method,
            func.count(RateLimitViolation.id).label('count')
        ).filter(
            RateLimitViolation.created_at >= start_date
        ).group_by(
            RateLimitViolation.path,
            RateLimitViolation.method
        ).order_by(
            desc('count')
        ).limit(limit).all()
        
        return [
            {
                "endpoint": f"{r.method} {r.path}",
                "violations": r.count
            }
            for r in results
        ]
    
    @staticmethod
    def get_top_violators(
        db: Session,
        days: int = 7,
        limit: int = 10
    ) -> List[dict]:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        results = db.query(
            RateLimitViolation.user_id,
            RateLimitViolation.role_slug,
            RateLimitViolation.ip_address,
            func.count(RateLimitViolation.id).label('count')
        ).filter(
            RateLimitViolation.created_at >= start_date
        ).group_by(
            RateLimitViolation.user_id,
            RateLimitViolation.role_slug,
            RateLimitViolation.ip_address
        ).order_by(
            desc('count')
        ).limit(limit).all()
        
        return [
            {
                "user_id": r.user_id,
                "role": r.role_slug or "anonymous",
                "ip_address": r.ip_address,
                "violations": r.count
            }
            for r in results
        ]
    
    @staticmethod
    def get_dashboard_data(db: Session) -> RateLimitDashboardResponse:
        violations_today = RateLimitService.get_violations_count_by_period(db, 1)
        violations_7_days = RateLimitService.get_violations_count_by_period(db, 7)
        violations_30_days = RateLimitService.get_violations_count_by_period(db, 30)
        
        violations_by_role = RateLimitService.get_violations_by_role(db, 7)
        violations_by_endpoint = RateLimitService.get_violations_by_endpoint(db, 7, 10)
        top_violators = RateLimitService.get_top_violators(db, 7, 10)
        
        recent_violations = db.query(RateLimitViolation).order_by(
            desc(RateLimitViolation.created_at)
        ).limit(20).all()
        
        rate_limit_config = {
            "super_admin": {"limit": "1000/minute", "description": "Highest tier"},
            "institution_admin": {"limit": "500/minute", "description": "Admin tier"},
            "manager": {"limit": "300/minute", "description": "Manager tier"},
            "teacher": {"limit": "200/minute", "description": "Teacher tier"},
            "staff": {"limit": "150/minute", "description": "Staff tier"},
            "student": {"limit": "100/minute", "description": "Student tier"},
            "parent": {"limit": "100/minute", "description": "Parent tier"},
            "anonymous": {"limit": "50/minute", "description": "Unauthenticated users"},
        }
        
        return RateLimitDashboardResponse(
            total_violations_today=violations_today,
            total_violations_last_7_days=violations_7_days,
            total_violations_last_30_days=violations_30_days,
            violations_by_role=violations_by_role,
            violations_by_endpoint=violations_by_endpoint,
            top_violators=top_violators,
            recent_violations=[RateLimitViolationResponse.model_validate(v) for v in recent_violations],
            rate_limit_config=rate_limit_config,
        )
    
    @staticmethod
    def cleanup_old_violations(db: Session, days: int = 90) -> int:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        deleted = db.query(RateLimitViolation).filter(
            RateLimitViolation.created_at < cutoff_date
        ).delete()
        db.commit()
        return deleted
