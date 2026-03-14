from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, HttpUrl


class ColorScheme(BaseModel):
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    accent_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    background_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    text_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')


class EmailBranding(BaseModel):
    email_logo_url: Optional[str] = None
    email_header_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    email_footer_text: Optional[str] = None
    email_from_name: Optional[str] = Field(None, max_length=100)


class LoginPageCustomization(BaseModel):
    login_background_url: Optional[str] = None
    login_banner_text: Optional[str] = Field(None, max_length=255)
    login_welcome_message: Optional[str] = None


class SocialLinks(BaseModel):
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    linkedin: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    website: Optional[str] = None


class InstitutionBrandingBase(BaseModel):
    # Logo and favicon
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    
    # Color scheme
    primary_color: Optional[str] = Field("#1976d2", pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field("#dc004e", pattern=r'^#[0-9A-Fa-f]{6}$')
    accent_color: Optional[str] = Field("#f50057", pattern=r'^#[0-9A-Fa-f]{6}$')
    background_color: Optional[str] = Field("#ffffff", pattern=r'^#[0-9A-Fa-f]{6}$')
    text_color: Optional[str] = Field("#000000", pattern=r'^#[0-9A-Fa-f]{6}$')
    
    # Custom domain
    custom_domain: Optional[str] = Field(None, max_length=255)
    subdomain: Optional[str] = Field(None, max_length=100)
    ssl_enabled: Optional[bool] = False
    
    # Email branding
    email_logo_url: Optional[str] = None
    email_header_color: Optional[str] = Field("#1976d2", pattern=r'^#[0-9A-Fa-f]{6}$')
    email_footer_text: Optional[str] = None
    email_from_name: Optional[str] = Field(None, max_length=100)
    
    # Login page customization
    login_background_url: Optional[str] = None
    login_banner_text: Optional[str] = Field(None, max_length=255)
    login_welcome_message: Optional[str] = None
    
    # Additional customization
    institution_name_override: Optional[str] = Field(None, max_length=255)
    custom_css: Optional[str] = None
    custom_meta_tags: Optional[Dict[str, Any]] = None
    
    # Social media links
    social_links: Optional[Dict[str, str]] = None
    
    # Feature flags
    show_powered_by: Optional[bool] = True
    is_active: Optional[bool] = True


class InstitutionBrandingCreate(InstitutionBrandingBase):
    institution_id: int


class InstitutionBrandingUpdate(BaseModel):
    # Logo and favicon
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    
    # Color scheme
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    accent_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    background_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    text_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    
    # Custom domain
    custom_domain: Optional[str] = Field(None, max_length=255)
    subdomain: Optional[str] = Field(None, max_length=100)
    ssl_enabled: Optional[bool] = None
    
    # Email branding
    email_logo_url: Optional[str] = None
    email_header_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    email_footer_text: Optional[str] = None
    email_from_name: Optional[str] = Field(None, max_length=100)
    
    # Login page customization
    login_background_url: Optional[str] = None
    login_banner_text: Optional[str] = Field(None, max_length=255)
    login_welcome_message: Optional[str] = None
    
    # Additional customization
    institution_name_override: Optional[str] = Field(None, max_length=255)
    custom_css: Optional[str] = None
    custom_meta_tags: Optional[Dict[str, Any]] = None
    
    # Social media links
    social_links: Optional[Dict[str, str]] = None
    
    # Feature flags
    show_powered_by: Optional[bool] = None
    is_active: Optional[bool] = None


class InstitutionBrandingResponse(InstitutionBrandingBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    logo_s3_key: Optional[str] = None
    favicon_s3_key: Optional[str] = None
    email_logo_s3_key: Optional[str] = None
    login_background_s3_key: Optional[str] = None
    domain_verified: bool = False
    created_at: datetime
    updated_at: datetime


class BrandingPreviewResponse(BaseModel):
    branding: InstitutionBrandingResponse
    institution_name: str
    preview_url: str


class CustomDomainRequest(BaseModel):
    custom_domain: str = Field(..., max_length=255)
    ssl_enabled: bool = False


class CustomDomainResponse(BaseModel):
    custom_domain: str
    subdomain: Optional[str]
    domain_verified: bool
    ssl_enabled: bool
    verification_instructions: str
    dns_records: list[Dict[str, str]]


class UploadLogoResponse(BaseModel):
    url: str
    s3_key: str
    field: str
