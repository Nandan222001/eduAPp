# Institution Management - Quick Start Guide

## Setup

### 1. Install Dependencies

```bash
# Backend (if needed)
poetry install

# Frontend
cd frontend
npm install
```

### 2. Database

No new migrations required. Uses existing tables:
- institutions
- subscriptions
- payments
- invoices
- usage_records
- users
- roles

### 3. Start Services

```bash
# Backend
uvicorn src.main:app --reload

# Frontend
cd frontend
npm run dev
```

## Access Points

### Super Admin Dashboard
- URL: `http://localhost:5173/super-admin`
- Main dashboard with overview metrics

### Institution Management
- List: `http://localhost:5173/super-admin/institutions`
- Create: `http://localhost:5173/super-admin/institutions/create`
- View: `http://localhost:5173/super-admin/institutions/:id`
- Edit: `http://localhost:5173/super-admin/institutions/:id/edit`
- Subscription: `http://localhost:5173/super-admin/institutions/:id/subscription`
- Analytics: `http://localhost:5173/super-admin/institutions/:id/analytics`

## API Endpoints

### List Institutions
```http
GET /api/v1/super-admin/institutions?page=1&page_size=20&search=&status=&plan=&sort_by=created_at&sort_order=desc
```

### Create Institution
```http
POST /api/v1/super-admin/institutions
Content-Type: application/json

{
  "name": "Example School",
  "slug": "example-school",
  "domain": "school.example.com",
  "description": "Description here",
  "max_users": 100,
  "admin_user": {
    "email": "admin@school.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "password": "securepassword123"
  },
  "subscription": {
    "plan_name": "Pro",
    "billing_cycle": "monthly",
    "price": 999.99,
    "max_users": 100,
    "max_storage_gb": 50,
    "trial_days": 14
  }
}
```

### Update Institution
```http
PUT /api/v1/super-admin/institutions/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "is_active": true,
  "max_users": 200
}
```

### Update Subscription
```http
PUT /api/v1/super-admin/institutions/{id}/subscription
Content-Type: application/json

{
  "plan_name": "Enterprise",
  "billing_cycle": "yearly",
  "price": 9999.99,
  "max_users": 500,
  "auto_renew": true
}
```

### Get Institution Details
```http
GET /api/v1/super-admin/institutions/{id}/details
```

### Get Billing History
```http
GET /api/v1/super-admin/institutions/{id}/billing-history
```

### Get Usage Metrics
```http
GET /api/v1/super-admin/institutions/{id}/usage
```

### Get Analytics
```http
GET /api/v1/super-admin/institutions/{id}/analytics?days=30
```

## Frontend Components

### Pages
- `InstitutionsList.tsx` - List view with data grid
- `InstitutionDetail.tsx` - Detail page with tabs
- `InstitutionCreate.tsx` - Multi-step creation wizard
- `InstitutionSubscription.tsx` - Subscription management
- `InstitutionAnalytics.tsx` - Analytics dashboard
- `UsageMetricsPanel.tsx` - Usage metrics component

### API Client
- `frontend/src/api/superAdmin.ts` - All API methods

### Routing
- Defined in `frontend/src/App.tsx`
- Protected by `requireSuperAdmin` prop

## Features Implemented

### ✅ Institution List View
- Search by name, slug, domain
- Filter by status (active/inactive)
- Filter by plan (Basic/Pro/Enterprise)
- Sort by name, created_at, total_users, revenue
- Pagination (20 items per page)
- Status indicators with color coding

### ✅ Institution Detail Page
- Profile information tab
- Subscription details tab
- Usage & analytics tab
- Edit capability
- Metric cards (users, students, teachers, revenue)

### ✅ Institution Creation Wizard
- Step 1: Basic information
- Step 2: Admin user creation
- Step 3: Subscription setup (optional)
- Form validation
- Auto-slug generation

### ✅ Subscription Management
- View current subscription
- Update plan/billing
- Upgrade/downgrade
- Billing history table
- Payment/invoice tracking

### ✅ Usage Analytics
- Time range selector (7-365 days)
- User activity trend chart
- User distribution chart
- Engagement metrics (DAU/WAU/MAU)
- Revenue tracking
- Interactive visualizations

## Testing

### Create Test Institution

```bash
curl -X POST http://localhost:8000/api/v1/super-admin/institutions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -d '{
    "name": "Test School",
    "slug": "test-school",
    "admin_user": {
      "email": "admin@test.com",
      "first_name": "Test",
      "last_name": "Admin",
      "password": "testpass123"
    }
  }'
```

### List Institutions

```bash
curl -X GET "http://localhost:8000/api/v1/super-admin/institutions?page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

### Get Analytics

```bash
curl -X GET "http://localhost:8000/api/v1/super-admin/institutions/1/analytics?days=30" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

## Common Issues

### 1. Super Admin Access
- Ensure user has `super_admin` role in database
- Check JWT token is valid
- Verify role permissions

### 2. Chart.js Not Loading
```bash
cd frontend
npm install chart.js react-chartjs-2
```

### 3. Slug Already Exists
- Use unique slug for each institution
- Auto-generation may need adjustment for similar names

### 4. Password Too Short
- Minimum 8 characters required
- Implement stronger password policy as needed

## Customization

### Add New Filter
1. Update `InstitutionsList.tsx` state
2. Add filter UI component
3. Pass parameter to `listInstitutions` API call
4. Update backend query in `super_admin.py`

### Add New Metric
1. Add field to `InstitutionListItem` schema
2. Update backend query aggregation
3. Add column to table in `InstitutionsList.tsx`
4. Update sort options if needed

### Add New Chart
1. Import chart type from `chart.js`
2. Register in ChartJS.register()
3. Create data object with labels and datasets
4. Add chart component to page

## Security Notes

- All endpoints require super admin authentication
- Passwords are hashed before storage
- Input validation on all forms
- CSRF protection enabled
- SQL injection prevention via ORM

## Performance Tips

- Use pagination for large datasets
- Enable database indexes on filtered fields
- Cache analytics data when possible
- Lazy load detailed data
- Implement debouncing on search inputs

## Next Steps

1. Add bulk operations
2. Implement export functionality
3. Add email notifications
4. Create audit logs
5. Add advanced filters
6. Implement real-time updates
7. Add custom report builder
8. Integration with payment gateway
