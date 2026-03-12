from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.dependencies.auth import get_current_user, require_super_admin
from src.models.user import User
from src.schemas.rate_limit import (
    RateLimitDashboardResponse,
    RateLimitViolationResponse,
    RateLimitViolationFilter,
)
from src.services.rate_limit_service import RateLimitService
from src.middleware.rate_limit import limiter, get_rate_limit_for_role

router = APIRouter()


@router.get("/dashboard", response_model=RateLimitDashboardResponse)
async def get_rate_limit_dashboard(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    return RateLimitService.get_dashboard_data(db)


@router.get("/violations", response_model=dict)
async def get_rate_limit_violations(
    user_id: Optional[int] = Query(None),
    role_slug: Optional[str] = Query(None),
    path: Optional[str] = Query(None),
    ip_address: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    filters = RateLimitViolationFilter(
        user_id=user_id,
        role_slug=role_slug,
        path=path,
        ip_address=ip_address,
        page=page,
        page_size=page_size,
    )
    
    violations, total = RateLimitService.get_violations(db, filters)
    
    return {
        "violations": [RateLimitViolationResponse.model_validate(v) for v in violations],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/violations/by-role", response_model=List[dict])
async def get_violations_by_role(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    return RateLimitService.get_violations_by_role(db, days)


@router.get("/violations/by-endpoint", response_model=List[dict])
async def get_violations_by_endpoint(
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    return RateLimitService.get_violations_by_endpoint(db, days, limit)


@router.get("/violations/top-violators", response_model=List[dict])
async def get_top_violators(
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    return RateLimitService.get_top_violators(db, days, limit)


@router.delete("/violations/cleanup")
async def cleanup_old_violations(
    days: int = Query(90, ge=30, le=365),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    deleted_count = RateLimitService.cleanup_old_violations(db, days)
    return {
        "message": f"Successfully deleted {deleted_count} old violations",
        "deleted_count": deleted_count,
    }


@router.get("/config", response_model=dict)
async def get_rate_limit_config(
    current_user: User = Depends(get_current_user),
):
    user_role = current_user.role.slug if current_user.role else None
    user_limit = get_rate_limit_for_role(user_role)
    
    all_limits = {
        "super_admin": "1000/minute",
        "institution_admin": "500/minute",
        "manager": "300/minute",
        "teacher": "200/minute",
        "staff": "150/minute",
        "student": "100/minute",
        "parent": "100/minute",
        "anonymous": "50/minute",
    }
    
    return {
        "your_role": user_role or "unknown",
        "your_limit": user_limit,
        "all_limits": all_limits,
        "description": "Rate limits are applied per minute per user/IP",
    }


@router.get("/my-usage")
async def get_my_rate_limit_usage(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = RateLimitViolationFilter(
        user_id=current_user.id,
        page=1,
        page_size=100,
    )
    
    violations, total = RateLimitService.get_violations(db, filters)
    
    user_role = current_user.role.slug if current_user.role else None
    user_limit = get_rate_limit_for_role(user_role)
    
    return {
        "user_id": current_user.id,
        "role": user_role,
        "rate_limit": user_limit,
        "total_violations": total,
        "recent_violations": [RateLimitViolationResponse.model_validate(v) for v in violations[:10]],
        "message": "Monitor your API usage to avoid rate limit violations",
    }
