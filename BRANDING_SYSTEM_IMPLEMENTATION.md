# White-Label Branding System Implementation

## Overview
Comprehensive white-label branding system for institution-specific customization including logos, color schemes, custom domains, email templates, and login page customization.

## Files Created

### Backend

#### Models
- `src/models/branding.py` - InstitutionBranding model with comprehensive branding fields

#### Schemas
- `src/schemas/branding.py` - Pydantic schemas for branding operations
  - InstitutionBrandingBase
  - InstitutionBrandingCreate
  - InstitutionBrandingUpdate
  - InstitutionBrandingResponse
  - BrandingPreviewResponse
  - CustomDomainRequest
  - CustomDomainResponse
  - UploadLogoResponse

#### Services
- `src/services/branding_service.py` - Business logic for branding operations
  - get_branding_by_institution_id
  - get_branding_by_domain
  - create_branding
  - update_branding
  - upload_logo (with S3 integration)
  - set_custom_domain
  - verify_domain
  - get_branding_preview
  - delete_branding

#### API Endpoints
- `src/api/v1/super_admin.py` - Extended with branding endpoints
  - GET `/super-admin/institutions/{id}/branding` - Get branding
  - POST `/super-admin/institutions/{id}/branding` - Create branding
  - PUT `/super-admin/institutions/{id}/branding` - Update branding
  - POST `/super-admin/institutions/{id}/branding/upload-logo` - Upload assets to S3
  - POST `/super-admin/institutions/{id}/branding/custom-domain` - Set custom domain
  - POST `/super-admin/institutions/{id}/branding/verify-domain` - Verify domain ownership
  - GET `/super-admin/institutions/{id}/branding/preview` - Get preview data
  - DELETE `/super-admin/institutions/{id}/branding` - Delete branding
  - GET `/super-admin/branding/current` - Get current branding by domain (public)

#### Middleware
- `src/middleware/branding_middleware.py` - Middleware for domain-based branding detection
  - BrandingMiddleware class
  - get_branding_context helper function

#### Migrations
- `alembic/versions/add_institution_branding.py` - Database migration for institution_branding table

### Frontend

#### API Client
- `frontend/src/api/superAdmin.ts` - Extended with branding API methods
  - getBranding
  - createBranding
  - updateBranding
  - uploadLogo
  - setCustomDomain
  - verifyDomain
  - getBrandingPreview
  - deleteBranding

#### Components
- `frontend/src/pages/SuperAdmin/BrandingManager.tsx` - Complete branding management UI
  - Tabbed interface for different branding sections
  - Live preview panel
  - Color pickers
  - File upload for logos/images
  - Custom domain configuration
  - Email branding settings
  - Login page customization
  - Advanced settings

## Features Implemented

### 1. Logo and Asset Management
- Main logo upload to S3
- Favicon upload
- Email logo upload
- Login background image upload
- Automatic old file deletion on upload
- S3 integration with presigned URLs

### 2. Color Scheme Customization
- Primary color
- Secondary color
- Accent color
- Background color
- Text color
- Live preview of color changes
- Visual color picker with hex input

### 3. Custom Domain Configuration
- Custom domain setup
- Subdomain support (e.g., school.yourdomain.com)
- SSL enablement flag
- Domain verification system
- DNS record generation for verification
- Domain ownership verification endpoint

### 4. Email Branding
- Custom email logo
- Email header color
- Custom email footer text
- Custom "From" name for emails

### 5. Login Page Customization
- Custom background image
- Banner text
- Welcome message
- Full visual customization

### 6. Advanced Settings
- Institution name override
- Custom CSS injection
- Custom meta tags (JSON)
- Social media links configuration
- "Powered by" branding toggle
- Active/inactive branding control

### 7. Live Preview
- Real-time preview of branding changes
- Preview dialog for full view
- Color scheme visualization
- Logo display preview

### 8. Domain-Based Branding Middleware
- Automatic branding detection by custom domain
- Subdomain-based branding resolution
- Request state branding context
- Response headers for debugging

## Database Schema

### institution_branding Table
```sql
- id (PK)
- institution_id (FK to institutions, unique)
- logo_url, logo_s3_key
- favicon_url, favicon_s3_key
- primary_color, secondary_color, accent_color, background_color, text_color
- custom_domain (unique), subdomain (unique)
- ssl_enabled, domain_verified
- email_logo_url, email_logo_s3_key
- email_header_color, email_footer_text, email_from_name
- login_background_url, login_background_s3_key
- login_banner_text, login_welcome_message
- institution_name_override
- custom_css
- custom_meta_tags (JSON)
- social_links (JSON)
- show_powered_by
- is_active
- created_at, updated_at
```

## API Endpoints Summary

### Super Admin Branding Endpoints
- `GET /api/v1/super-admin/institutions/{id}/branding` - Get branding config
- `POST /api/v1/super-admin/institutions/{id}/branding` - Create branding
- `PUT /api/v1/super-admin/institutions/{id}/branding` - Update branding
- `POST /api/v1/super-admin/institutions/{id}/branding/upload-logo?field={field}` - Upload file
- `POST /api/v1/super-admin/institutions/{id}/branding/custom-domain` - Configure domain
- `POST /api/v1/super-admin/institutions/{id}/branding/verify-domain` - Verify domain
- `GET /api/v1/super-admin/institutions/{id}/branding/preview` - Get preview
- `DELETE /api/v1/super-admin/institutions/{id}/branding` - Delete branding
- `GET /api/v1/super-admin/branding/current` - Get current domain's branding

## Security Features
- Super admin only access for all management endpoints
- S3 file validation (type and size)
- Domain format validation
- Unique domain/subdomain constraints
- Automatic old file cleanup on replacement
- SQL injection protection via ORM

## Integration Points

### S3 Integration
- Uses existing `src/utils/s3_client.py`
- Automatic file upload with unique naming
- Folder organization by institution and field type
- Presigned URL support for private files

### Email System
- Branding data available for email template customization
- Custom logos and colors in emails
- Custom footer text and from name

### Login System
- Branding middleware provides context for login pages
- Custom background, logos, and messages
- Domain-specific branding resolution

## Usage Guide

### For Super Admins

1. **Access Branding Manager**
   - Navigate to institution details
   - Click "Manage Branding" or similar action
   - Route: `/super-admin/institutions/{id}/branding`

2. **Upload Logos**
   - Go to "Logo & Assets" tab
   - Click upload buttons for each asset type
   - Supported formats: JPG, PNG, SVG, WebP
   - Max size: 10MB

3. **Configure Colors**
   - Go to "Color Scheme" tab
   - Use color pickers or enter hex codes
   - See live preview on the right panel

4. **Set Custom Domain**
   - Go to "Custom Domain" tab
   - Click "Configure Custom Domain"
   - Enter domain name and SSL preference
   - Follow DNS setup instructions
   - Click "Verify" to confirm ownership

5. **Customize Email Branding**
   - Go to "Email Branding" tab
   - Upload email logo
   - Set header color and footer text
   - Configure from name

6. **Customize Login Page**
   - Go to "Login Page" tab
   - Upload background image
   - Set banner text and welcome message

7. **Advanced Settings**
   - Go to "Advanced" tab
   - Override institution name
   - Add custom CSS
   - Configure social links
   - Toggle powered-by branding

8. **Save Changes**
   - Click "Save Changes" button
   - Changes apply immediately
   - Use "Preview" to see full result

### For Developers

1. **Add Branding Middleware** (if not already added to main.py)
   ```python
   from src.middleware.branding_middleware import BrandingMiddleware
   
   app.add_middleware(BrandingMiddleware)
   ```

2. **Access Branding in Endpoints**
   ```python
   from src.middleware.branding_middleware import get_branding_context
   
   @router.get("/some-endpoint")
   async def endpoint(request: Request):
       branding = get_branding_context(request)
       if branding:
           # Use branding data
           logo_url = branding['logo_url']
   ```

3. **Use in Email Templates**
   ```python
   branding = get_branding_by_institution_id(db, institution_id)
   email_html = render_template(
       'email.html',
       logo_url=branding.email_logo_url,
       header_color=branding.email_header_color
   )
   ```

## Testing Checklist

- [ ] Create branding for institution
- [ ] Update branding colors
- [ ] Upload logo file
- [ ] Upload favicon
- [ ] Upload email logo
- [ ] Upload login background
- [ ] Configure custom domain
- [ ] Verify domain
- [ ] Test subdomain resolution
- [ ] Preview branding
- [ ] Test email branding display
- [ ] Test login page customization
- [ ] Test custom CSS injection
- [ ] Delete branding
- [ ] Test middleware domain detection
- [ ] Test S3 file cleanup on replacement
- [ ] Test validation errors
- [ ] Test permissions (super admin only)

## Future Enhancements

1. **Multi-language Support**
   - Localized branding text fields
   - Language-specific logos

2. **Theme Templates**
   - Pre-built color scheme templates
   - Industry-specific themes

3. **A/B Testing**
   - Multiple branding variants
   - Usage analytics

4. **White-label Mobile Apps**
   - Mobile app branding configuration
   - App store assets management

5. **Advanced Domain Features**
   - Automatic SSL certificate provisioning
   - CDN integration
   - Multi-domain support

6. **Branding Analytics**
   - Track branding changes
   - Version history
   - Rollback capability

## Notes

- All file uploads are stored in S3 under `branding/{institution_id}/{field}/`
- Domain verification is currently simulated; implement actual DNS checking in production
- Custom CSS is stored but requires frontend implementation to inject
- Middleware adds minimal overhead by caching domain lookups
- All endpoints require super admin authentication
- Public endpoint `/branding/current` allows unauthenticated access for domain-based branding
