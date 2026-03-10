# Institution Management Interface - Implementation Guide

## Overview

This document describes the complete institution management interface for Super Admin, including institution list view, detail pages, creation wizard, subscription management, and usage analytics.

## Backend Implementation

### 1. API Endpoints (src/api/v1/super_admin.py)

#### Institution Management

- **GET /api/v1/super-admin/institutions**
  - Paginated list of institutions with filtering and sorting
  - Query parameters: page, page_size, search, status, plan, sort_by, sort_order
  - Returns: InstitutionListResponse with items, pagination metadata

- **POST /api/v1/super-admin/institutions**
  - Create new institution with admin user and optional subscription
  - Request body: InstitutionCreate (name, slug, domain, admin_user, subscription)
  - Returns: Institution ID and success message

- **PUT /api/v1/super-admin/institutions/{institution_id}**
  - Update institution details
  - Request body: InstitutionUpdate (name, slug, domain, description, is_active, max_users)
  - Returns: Updated institution data

- **GET /api/v1/super-admin/institutions/{institution_id}/details**
  - Get detailed information about institution
  - Returns: Institution data, subscription, stats, usage records

#### Subscription Management

- **PUT /api/v1/super-admin/institutions/{institution_id}/subscription**
  - Update or upgrade/downgrade subscription
  - Request body: SubscriptionUpdate (plan_name, billing_cycle, price, max_users, etc.)
  - Returns: Updated subscription data

- **GET /api/v1/super-admin/institutions/{institution_id}/billing-history**
  - Get billing history (payments and invoices)
  - Returns: List of BillingHistoryItem objects

#### Analytics & Usage

- **GET /api/v1/super-admin/institutions/{institution_id}/usage**
  - Get current usage metrics
  - Returns: List of UsageMetric objects with current values and limits

- **GET /api/v1/super-admin/institutions/{institution_id}/analytics**
  - Get detailed analytics for institution
  - Query parameters: days (default: 30)
  - Returns: InstitutionAnalytics with user metrics, engagement, usage trends, revenue

### 2. Schemas (src/schemas/super_admin.py)

New schemas added:

```python
# Institution Management
- InstitutionListItem: Single institution in list view
- InstitutionListResponse: Paginated list response
- AdminUserCreate: Admin user creation data
- SubscriptionPlanCreate: Subscription plan configuration
- InstitutionCreate: Complete institution creation data
- InstitutionUpdate: Institution update fields

# Subscription & Billing
- SubscriptionUpdate: Subscription modification data
- BillingHistoryItem: Single billing record
- UsageMetric: Usage tracking metric

# Analytics
- InstitutionAnalytics: Complete analytics data structure
```

## Frontend Implementation

### 1. Pages

#### InstitutionsList.tsx
- Data grid with search, filter, and sort functionality
- Filter by status (active/inactive) and plan (Basic/Pro/Enterprise)
- Sort by name, created_at, total_users, revenue
- Pagination support (20 items per page)
- Quick actions: View details, Edit institution
- Status chips with color coding

#### InstitutionDetail.tsx
- Three-tab layout:
  1. Profile Information: Basic details, timestamps
  2. Subscription: Current plan, billing info
  3. Usage & Analytics: Link to detailed analytics
- Metric cards: Total users, students, teachers, revenue
- Edit dialog for updating institution details
- Navigation to subscription management and analytics

#### InstitutionCreate.tsx
- Multi-step wizard (3 steps):
  1. Basic Information: Name, slug, domain, description, max users
  2. Admin User: Create admin account (email, name, password)
  3. Subscription Plan: Optional subscription setup
- Auto-slug generation from institution name
- Form validation at each step
- Password visibility toggle

#### InstitutionSubscription.tsx
- Current subscription details display
- Subscription metric cards (plan, billing cycle, period)
- Update subscription dialog
- Billing history table with payments and invoices
- Status indicators for payment status

#### InstitutionAnalytics.tsx
- Time range selector (7, 30, 90, 180, 365 days)
- User metrics cards (total, active, new users, revenue)
- Line chart: User activity trend over time
- Bar chart: User distribution (students, teachers, etc.)
- Engagement metrics: DAU, WAU, MAU, engagement rate
- Revenue summary with total and recent revenue

### 2. API Client (frontend/src/api/superAdmin.ts)

Added methods:
```typescript
- listInstitutions(params): Get paginated institution list
- createInstitution(data): Create new institution
- updateInstitution(id, data): Update institution
- updateSubscription(id, data): Update subscription
- getBillingHistory(id): Get billing history
- getUsageMetrics(id): Get usage metrics
- getInstitutionAnalytics(id, days): Get analytics data
```

### 3. Routing (frontend/src/App.tsx)

Added routes under `/super-admin`:
```
/super-admin/institutions - List view
/super-admin/institutions/create - Creation wizard
/super-admin/institutions/:id - Detail page
/super-admin/institutions/:id/edit - Edit page (same as detail)
/super-admin/institutions/:id/subscription - Subscription management
/super-admin/institutions/:id/analytics - Analytics dashboard
```

### 4. Dependencies

Added to package.json:
```json
"chart.js": "^4.4.1",
"react-chartjs-2": "^5.2.0"
```

## Features

### Institution List View
- Search by name, slug, or domain
- Filter by status (active/inactive)
- Filter by subscription plan
- Sort by multiple fields (name, created date, users, revenue)
- Pagination with configurable page size
- Color-coded status chips
- Quick access to view/edit

### Institution Creation
- Step-by-step wizard interface
- Automatic slug generation
- Admin user creation with password
- Optional subscription setup with trial
- Form validation and error handling
- Success navigation to detail page

### Institution Detail
- Comprehensive profile information
- Real-time metrics display
- Subscription status and details
- Edit capability with dialog interface
- Tab-based organization
- Links to subscription and analytics

### Subscription Management
- View current subscription details
- Update plan, billing cycle, pricing
- Upgrade/downgrade capabilities
- Complete billing history
- Payment and invoice tracking
- Status indicators

### Analytics Dashboard
- Flexible time range selection
- Interactive charts (Chart.js)
- User activity trends
- Engagement metrics (DAU/WAU/MAU)
- User distribution visualization
- Revenue tracking
- Exportable data visualization

## Security

- All endpoints protected with `require_super_admin` dependency
- Input validation using Pydantic schemas
- Unique constraint checks (slug, domain, email)
- Password hashing for admin user creation
- RBAC enforcement on all routes

## Data Flow

1. **List Institutions**: Query DB → Filter/Sort → Aggregate stats → Return paginated list
2. **Create Institution**: Validate → Create Institution → Create Admin User → Create Subscription → Commit
3. **Update Institution**: Validate → Check uniqueness → Update fields → Commit
4. **Analytics**: Query usage data → Aggregate metrics → Calculate trends → Return analytics

## Performance Considerations

- Pagination to handle large datasets
- Indexed fields for fast filtering/sorting
- Aggregated queries for statistics
- Lazy loading of detailed data
- Caching opportunities for analytics

## Error Handling

- HTTP 400 for validation errors
- HTTP 404 for not found resources
- HTTP 500 for server errors
- Detailed error messages in responses
- Frontend error boundaries and alerts

## Future Enhancements

1. Bulk operations (import/export)
2. Advanced analytics filters
3. Custom report generation
4. Email notifications for events
5. Audit log for changes
6. Institution cloning/templates
7. Multi-tenancy improvements
8. Real-time updates with WebSocket
9. Advanced billing features
10. Integration with payment gateways

## Testing

To test the implementation:

1. Backend:
```bash
pytest tests/test_super_admin.py
```

2. Frontend:
```bash
cd frontend
npm install
npm run dev
```

3. Access the interface at:
```
http://localhost:5173/super-admin/institutions
```

## Dependencies Installation

Backend (already in pyproject.toml):
- FastAPI
- SQLAlchemy
- Pydantic

Frontend (update package.json):
```bash
cd frontend
npm install chart.js react-chartjs-2
```

## Environment Variables

No additional environment variables required. Uses existing configuration from `.env`:
- Database connection
- JWT settings
- API base URL

## Database Migrations

No new migrations needed. Uses existing tables:
- institutions
- subscriptions
- payments
- invoices
- usage_records
- users

## Deployment Notes

1. Install frontend dependencies: `npm install`
2. Build frontend: `npm run build`
3. Restart backend service
4. Verify super admin role exists in database
5. Test all endpoints with super admin credentials

## Support

For issues or questions:
- Check API documentation: `/docs` endpoint
- Review error logs in `logs/` directory
- Verify user has super_admin role
- Check database connectivity
