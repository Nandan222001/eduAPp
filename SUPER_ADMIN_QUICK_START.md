# Super Admin Dashboard - Quick Start Guide

## Overview
The Super Admin Dashboard provides comprehensive oversight of all institutions on the platform.

## Access

### URL
```
http://localhost:5173/super-admin
```

### Requirements
- User account with `is_superuser = True`
- Active login session

## Creating a Super Admin User

### Option 1: Using Python Script
```bash
# Navigate to project root
cd /path/to/project

# Run the create admin script with super admin flag
python scripts/create_admin.py --super-admin
```

### Option 2: Direct Database Update
```sql
-- Update existing user to super admin
UPDATE users 
SET is_superuser = TRUE 
WHERE email = 'your-admin@example.com';
```

### Option 3: During User Creation
```python
from src.models.user import User

user = User(
    email="superadmin@example.com",
    username="superadmin",
    hashed_password=hash_password("secure_password"),
    first_name="Super",
    last_name="Admin",
    is_superuser=True,  # Set to True
    institution_id=1,
    role_id=1,
)
db.add(user)
db.commit()
```

## Dashboard Sections

### 1. Key Metrics
- Total Institutions
- Active Subscriptions
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)

### 2. Subscription Distribution
Visual breakdown of all subscription statuses:
- Active (Green)
- Trial (Blue)
- Expired (Red)
- Cancelled (Orange)

### 3. Platform Usage
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- DAU/MAU Ratio
- Total and Active Users

### 4. Revenue Trend
6-month historical view of:
- MRR per month
- ARR projection
- Revenue growth

### 5. Recent Activity
Real-time feed of:
- New registrations
- Subscription changes
- Payments
- Alerts

### 6. Institution Comparison Table
Sortable and filterable table with:
- Institution details
- User statistics
- Revenue data
- Engagement metrics
- Last activity

### 7. Quick Actions
- Onboard New Institution
- Bulk Import Institutions
- Generate Reports
- Schedule Demo

## Common Tasks

### View Institution Details
1. Scroll to Institution Comparison Table
2. Find institution in the list
3. Click "View Details" button

### Filter by Subscription Status
1. Locate the "Filter by Status" dropdown
2. Select desired status (Active, Trial, Expired, Cancelled)
3. Table updates automatically

### Sort Institution Data
1. Click any column header in the comparison table
2. Click again to reverse sort order
3. Current sort indicated by arrow icon

### Refresh Dashboard
1. Click the refresh icon (↻) in the top right
2. Dashboard reloads all data from API

## API Endpoints

### Get Dashboard Data
```
GET /api/v1/super-admin/dashboard
Authorization: Bearer <token>
```

### Get Institution Details
```
GET /api/v1/super-admin/institutions/{id}/details
Authorization: Bearer <token>
```

### Get Revenue Breakdown
```
GET /api/v1/super-admin/statistics/revenue-breakdown
Authorization: Bearer <token>
```

### Get User Growth
```
GET /api/v1/super-admin/statistics/user-growth?days=30
Authorization: Bearer <token>
```

## Troubleshooting

### Cannot Access Dashboard
**Error:** Redirected to /unauthorized

**Solution:**
1. Verify user has `is_superuser = true` in database
2. Log out and log back in
3. Check browser console for errors

### Dashboard Shows No Data
**Possible Causes:**
1. No institutions in database
2. API connection issue
3. Authentication token expired

**Solution:**
1. Check database has institutions: `SELECT COUNT(*) FROM institutions;`
2. Open browser DevTools → Network tab
3. Look for failed API requests
4. Refresh page or re-login

### Loading Never Completes
**Solution:**
1. Check backend server is running
2. Verify API endpoint is accessible
3. Check browser console for errors
4. Clear browser cache and reload

## Best Practices

### Regular Monitoring
- Check dashboard daily for key metrics
- Monitor trials expiring soon
- Review recent activity feed
- Track revenue trends

### Performance
- Use filters to narrow down large datasets
- Export data for detailed analysis
- Schedule regular report generation

### Security
- Log out when finished
- Use strong passwords
- Enable 2FA if available
- Monitor audit logs regularly

## Features Summary

| Feature | Description | Status |
|---------|-------------|--------|
| Key Metrics Cards | Institution count, subscriptions, MRR/ARR | ✅ Complete |
| Subscription Distribution | Visual status breakdown | ✅ Complete |
| Platform Usage Stats | DAU/MAU metrics | ✅ Complete |
| Revenue Trend Chart | 6-month historical view | ✅ Complete |
| Recent Activity Feed | Real-time updates | ✅ Complete |
| Institution Table | Sortable, filterable comparison | ✅ Complete |
| Quick Actions | Institution management buttons | ✅ Complete |
| Alerts Panel | Urgent action items | ✅ Complete |

## Next Steps

After familiarizing yourself with the dashboard:

1. **Review Institutions**: Check performance metrics for each institution
2. **Monitor Revenue**: Track MRR/ARR trends
3. **Manage Trials**: Contact institutions with expiring trials
4. **Generate Reports**: Create detailed analytics reports
5. **Onboard New Institutions**: Use quick action buttons

## Support

For issues or questions:
- Check implementation documentation
- Review API documentation at `/docs`
- Contact development team
- Check application logs

## Advanced Usage

### Custom Filtering
Combine table sorting with status filtering for targeted analysis:
1. Filter by "Trial" status
2. Sort by "Engagement" descending
3. Identify high-performing trial institutions

### Revenue Analysis
1. Review revenue trend chart
2. Compare with subscription distribution
3. Calculate conversion rates from trial to paid
4. Identify revenue growth opportunities

### Engagement Monitoring
1. Sort by engagement percentage
2. Identify low-engagement institutions
3. Plan intervention strategies
4. Track improvement over time
