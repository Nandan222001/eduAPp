from functools import wraps
from typing import Callable, Optional
from fastapi import Request
from src.middleware.rate_limit import limiter, get_rate_limit_for_role, get_role_from_request


def apply_rate_limit(custom_limit: Optional[str] = None) -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            if custom_limit:
                limit = custom_limit
            else:
                role_slug = get_role_from_request(request)
                limit = get_rate_limit_for_role(role_slug)
            
            return await limiter.limit(limit)(func)(request, *args, **kwargs)
        
        return wrapper
    return decorator


def rate_limit_by_role(
    super_admin: str = "1000/minute",
    institution_admin: str = "500/minute",
    manager: str = "300/minute",
    teacher: str = "200/minute",
    staff: str = "150/minute",
    student: str = "100/minute",
    parent: str = "100/minute",
    default: str = "50/minute"
) -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            role_slug = get_role_from_request(request)
            
            role_limits = {
                "super_admin": super_admin,
                "institution_admin": institution_admin,
                "manager": manager,
                "teacher": teacher,
                "staff": staff,
                "student": student,
                "parent": parent,
            }
            
            limit = role_limits.get(role_slug, default)
            
            return await limiter.limit(limit)(func)(request, *args, **kwargs)
        
        return wrapper
    return decorator
