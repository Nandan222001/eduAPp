from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class RateLimitViolationBase(BaseModel):
    user_id: Optional[int] = None
    role_slug: Optional[str] = None
    path: str
    method: str
    ip_address: str
    limit_hit: str
    user_agent: Optional[str] = None


class RateLimitViolationCreate(RateLimitViolationBase):
    pass


class RateLimitViolationResponse(RateLimitViolationBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class RateLimitStatsBase(BaseModel):
    date: datetime
    role_slug: Optional[str] = None
    total_requests: int = 0
    total_violations: int = 0
    unique_users: int = 0
    unique_ips: int = 0


class RateLimitStatsResponse(RateLimitStatsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RateLimitDashboardResponse(BaseModel):
    total_violations_today: int
    total_violations_last_7_days: int
    total_violations_last_30_days: int
    violations_by_role: List[dict]
    violations_by_endpoint: List[dict]
    top_violators: List[dict]
    recent_violations: List[RateLimitViolationResponse]
    rate_limit_config: dict


class RateLimitInfo(BaseModel):
    limit: str
    remaining: int
    reset: int


class RateLimitViolationFilter(BaseModel):
    user_id: Optional[int] = None
    role_slug: Optional[str] = None
    path: Optional[str] = None
    ip_address: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=100)
