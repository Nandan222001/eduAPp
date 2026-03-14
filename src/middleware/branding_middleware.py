from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.branding import InstitutionBranding
from src.models.institution import Institution
import json


class BrandingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to serve institution-specific branding based on custom domain or subdomain.
    Sets branding context in request state for downstream handlers.
    """
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Get the host from the request
        host = request.headers.get("host", "").split(":")[0]
        
        # Skip for health check and static endpoints
        if request.url.path in ["/health", "/", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Create database session
        db: Session = SessionLocal()
        
        try:
            branding = None
            institution = None
            
            # Try to find branding by custom domain or subdomain
            branding = db.query(InstitutionBranding).filter(
                (InstitutionBranding.custom_domain == host) |
                (InstitutionBranding.subdomain == host.split('.')[0])
            ).first()
            
            if branding:
                # Get institution
                institution = db.query(Institution).filter(
                    Institution.id == branding.institution_id
                ).first()
                
                # Set branding context in request state
                request.state.branding = {
                    "id": branding.id,
                    "institution_id": branding.institution_id,
                    "institution_name": branding.institution_name_override or (institution.name if institution else None),
                    "logo_url": branding.logo_url,
                    "favicon_url": branding.favicon_url,
                    "primary_color": branding.primary_color,
                    "secondary_color": branding.secondary_color,
                    "accent_color": branding.accent_color,
                    "background_color": branding.background_color,
                    "text_color": branding.text_color,
                    "custom_domain": branding.custom_domain,
                    "subdomain": branding.subdomain,
                    "login_background_url": branding.login_background_url,
                    "login_banner_text": branding.login_banner_text,
                    "login_welcome_message": branding.login_welcome_message,
                    "show_powered_by": branding.show_powered_by,
                    "custom_css": branding.custom_css,
                    "social_links": branding.social_links,
                }
            else:
                # No custom branding, set default
                request.state.branding = None
            
        finally:
            db.close()
        
        # Add branding info to response headers for client-side access
        response = await call_next(request)
        
        if hasattr(request.state, "branding") and request.state.branding:
            # Add a custom header with branding ID for debugging
            response.headers["X-Institution-Branding"] = str(request.state.branding["id"])
        
        return response


def get_branding_context(request: Request) -> dict:
    """
    Helper function to get branding context from request state.
    Can be used as a dependency in route handlers.
    """
    return getattr(request.state, "branding", None)
