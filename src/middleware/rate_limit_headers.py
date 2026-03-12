from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from src.utils.security import decode_token
from src.middleware.rate_limit import get_rate_limit_for_role
import time


class RateLimitHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        role_slug = None
        auth_header = request.headers.get("Authorization")
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            payload = decode_token(token)
            
            if payload:
                role_slug = payload.get("role_slug")
        
        response = await call_next(request)
        
        limit_str = get_rate_limit_for_role(role_slug)
        limit_value = int(limit_str.split("/")[0])
        
        response.headers["X-RateLimit-Limit"] = str(limit_value)
        response.headers["X-RateLimit-Policy"] = limit_str
        response.headers["X-RateLimit-Role"] = role_slug or "anonymous"
        
        if hasattr(response, "headers") and "X-RateLimit-Remaining" in response.headers:
            pass
        elif hasattr(request.state, "view_rate_limit"):
            response.headers["X-RateLimit-Remaining"] = str(request.state.view_rate_limit)
        
        return response
