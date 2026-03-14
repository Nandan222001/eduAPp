# Branding System Quick Start Guide

## Setup

### 1. Run Database Migration
```bash
alembic upgrade head
```

### 2. Configure AWS S3 (if not already done)
Update `.env`:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name
```

### 3. Add Middleware (Optional - for domain-based branding)
In `src/main.py`, add:
```python
from src.middleware.branding_middleware import BrandingMiddleware

app.add_middleware(BrandingMiddleware)
```

## Quick Usage

### Create Branding for Institution
```bash
POST /api/v1/super-admin/institutions/1/branding
{
  "institution_id": 1,
  "primary_color": "#1976d2",
  "secondary_color": "#dc004e"
}
```

### Upload Logo
```bash
POST /api/v1/super-admin/institutions/1/branding/upload-logo?field=logo
Content-Type: multipart/form-data
file: <logo.png>
```

### Update Color Scheme
```bash
PUT /api/v1/super-admin/institutions/1/branding
{
  "primary_color": "#ff5722",
  "secondary_color": "#03a9f4"
}
```

### Set Custom Domain
```bash
POST /api/v1/super-admin/institutions/1/branding/custom-domain
{
  "custom_domain": "school.example.com",
  "ssl_enabled": true
}
```

### Get Branding by Domain
```bash
GET /api/v1/super-admin/branding/current
Host: school.example.com
```

## Frontend Component Usage

### Navigate to Branding Manager
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate(`/super-admin/institutions/${institutionId}/branding`);
```

### Or Direct Import
```typescript
import { BrandingManager } from '@/pages/SuperAdmin';

// Use in routes
<Route path="/super-admin/institutions/:institutionId/branding" element={<BrandingManager />} />
```

## API Client Usage

```typescript
import superAdminApi from '@/api/superAdmin';

// Get branding
const branding = await superAdminApi.getBranding(institutionId);

// Upload logo
const file = document.getElementById('file-input').files[0];
await superAdminApi.uploadLogo(institutionId, 'logo', file);

// Update colors
await superAdminApi.updateBranding(institutionId, {
  primary_color: '#ff5722',
  secondary_color: '#03a9f4'
});

// Set custom domain
const result = await superAdminApi.setCustomDomain(institutionId, {
  custom_domain: 'school.example.com',
  ssl_enabled: true
});
```

## Available Branding Fields

### Logo & Assets
- `logo_url` - Main institution logo
- `favicon_url` - Browser favicon
- `email_logo_url` - Logo for email templates
- `login_background_url` - Login page background image

### Colors
- `primary_color` - Primary theme color
- `secondary_color` - Secondary theme color
- `accent_color` - Accent/highlight color
- `background_color` - Background color
- `text_color` - Default text color
- `email_header_color` - Email header background color

### Domain Configuration
- `custom_domain` - Custom domain (e.g., school.example.com)
- `subdomain` - Subdomain prefix (e.g., 'school' for school.platform.com)
- `ssl_enabled` - Whether SSL is enabled
- `domain_verified` - Domain ownership verification status

### Email Branding
- `email_from_name` - Sender name for emails
- `email_footer_text` - Footer text in emails

### Login Page
- `login_banner_text` - Banner text on login page
- `login_welcome_message` - Welcome message on login page

### Advanced
- `institution_name_override` - Override displayed institution name
- `custom_css` - Custom CSS code
- `custom_meta_tags` - Custom meta tags (JSON)
- `social_links` - Social media links (JSON)
- `show_powered_by` - Show/hide powered by branding
- `is_active` - Enable/disable branding

## Access Control

All branding management endpoints require super admin authentication:
```python
from src.dependencies.auth import require_super_admin

@router.post("/branding")
async def endpoint(current_user: User = Depends(require_super_admin)):
    # Only super admins can access
    pass
```

## Common Tasks

### Change Institution Colors
1. Navigate to BrandingManager
2. Go to "Color Scheme" tab
3. Use color pickers or enter hex codes
4. Click "Save Changes"

### Upload New Logo
1. Navigate to BrandingManager
2. Go to "Logo & Assets" tab
3. Click "Upload Logo" button
4. Select image file (max 10MB)
5. Old logo is automatically replaced

### Configure Custom Domain
1. Navigate to BrandingManager
2. Go to "Custom Domain" tab
3. Click "Configure Custom Domain"
4. Enter domain name
5. Enable SSL if needed
6. Follow DNS setup instructions
7. Click "Verify" to confirm

### Preview Branding
1. Click "Preview" button in header
2. Or use GET `/branding/preview` endpoint
3. View how branding appears to users

## File Upload Specifications

### Supported Formats
- JPEG/JPG
- PNG
- SVG
- WebP

### Size Limits
- Maximum: 10MB per file
- Recommended logo size: 200x60px
- Recommended favicon: 32x32px or 64x64px

### S3 Storage Structure
```
branding/
  {institution_id}/
    logo/
      20240314120000_abc12345_logo.png
    favicon/
      20240314120000_def67890_favicon.ico
    email_logo/
      20240314120000_ghi23456_email-logo.png
    login_background/
      20240314120000_jkl78901_background.jpg
```

## Error Handling

### Common Errors
- `404` - Branding not found (auto-created on first access)
- `400` - Invalid domain format or duplicate domain
- `413` - File too large (>10MB)
- `415` - Unsupported file type
- `403` - Unauthorized (requires super admin)

### Example Error Response
```json
{
  "detail": "This custom domain is already in use"
}
```

## Testing Commands

```bash
# Create branding
curl -X POST http://localhost:8000/api/v1/super-admin/institutions/1/branding \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"institution_id": 1}'

# Upload logo
curl -X POST http://localhost:8000/api/v1/super-admin/institutions/1/branding/upload-logo?field=logo \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@logo.png"

# Get branding
curl http://localhost:8000/api/v1/super-admin/institutions/1/branding \
  -H "Authorization: Bearer $TOKEN"
```

## Next Steps

1. Run migrations: `alembic upgrade head`
2. Create branding for test institution
3. Upload logo and set colors
4. Test domain-based branding resolution
5. Integrate branding into email templates
6. Add branding to login page UI

## Support

For issues or questions:
- Check `BRANDING_SYSTEM_IMPLEMENTATION.md` for detailed documentation
- Review API endpoint responses for error details
- Verify S3 configuration in `.env`
- Ensure super admin permissions
