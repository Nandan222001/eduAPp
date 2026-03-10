# Notification System Quick Start Guide

## Prerequisites

1. Redis server running (required for Celery)
2. PostgreSQL database
3. SendGrid API key (for emails)
4. MSG91 API key (for SMS)
5. FCM server key (for push notifications)

## Installation

### 1. Install Dependencies
```bash
poetry install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and configure:

```bash
# Notification Service Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDER_EMAIL=noreply@example.com
SENDER_NAME=Your School Name

MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=SCHOOL

FCM_SERVER_KEY=your_fcm_server_key

# Celery (uses Redis)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 3. Run Database Migration
```bash
alembic upgrade head
```

### 4. Start Services

#### Terminal 1: Start FastAPI Server
```bash
uvicorn src.main:app --reload
```

#### Terminal 2: Start Celery Worker
```bash
celery -A worker.celery_app worker --loglevel=info
```

#### Terminal 3: Start Celery Beat (for scheduled tasks)
```bash
celery -A beat.celery_app beat --loglevel=info
```

## API Quick Examples

### 1. Send a Notification to a User

**Endpoint:** `POST /api/v1/notifications/bulk`

```bash
curl -X POST "http://localhost:8000/api/v1/notifications/bulk" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [1, 2, 3],
    "title": "New Assignment Posted",
    "message": "A new assignment has been posted for Math class",
    "notification_type": "assignment",
    "channel": "in_app",
    "priority": "medium"
  }'
```

### 2. Create an Announcement

**Endpoint:** `POST /api/v1/announcements/`

```bash
curl -X POST "http://localhost:8000/api/v1/announcements/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "School Holiday Notice",
    "content": "School will remain closed on Monday due to public holiday",
    "audience_type": "all",
    "priority": "high",
    "channels": ["in_app", "email"]
  }'
```

### 3. Publish an Announcement

**Endpoint:** `POST /api/v1/announcements/{id}/publish`

```bash
curl -X POST "http://localhost:8000/api/v1/announcements/1/publish" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Send a Direct Message

**Endpoint:** `POST /api/v1/messages/`

```bash
curl -X POST "http://localhost:8000/api/v1/messages/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": 5,
    "subject": "Question about homework",
    "content": "Can you help me understand chapter 5?"
  }'
```

### 5. Get Notifications

**Endpoint:** `GET /api/v1/notifications/`

```bash
curl -X GET "http://localhost:8000/api/v1/notifications/?skip=0&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Update Notification Preferences

**Endpoint:** `PUT /api/v1/notifications/preferences/me`

```bash
curl -X PUT "http://localhost:8000/api/v1/notifications/preferences/me" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email_enabled": true,
    "sms_enabled": false,
    "push_enabled": true,
    "in_app_enabled": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00"
  }'
```

## WebSocket Connection

### JavaScript Example

```javascript
// Connect to WebSocket
const token = 'YOUR_ACCESS_TOKEN';
const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/ws?token=${token}`);

// Connection opened
ws.onopen = () => {
    console.log('Connected to notification service');
};

// Listen for messages
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
    
    switch(data.type) {
        case 'notification':
            showNotification(data.title, data.message);
            break;
        case 'new_message':
            updateMessageBadge();
            break;
        case 'new_announcement':
            showAnnouncement(data.title);
            break;
    }
};

// Handle errors
ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

// Handle close
ws.onclose = () => {
    console.log('Disconnected from notification service');
    // Implement reconnection logic here
};

// Send ping to keep connection alive
setInterval(() => {
    ws.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now()
    }));
}, 30000); // Every 30 seconds
```

## Audience Targeting Examples

### 1. Target All Users
```json
{
  "audience_type": "all",
  "audience_filter": null
}
```

### 2. Target by Role
```json
{
  "audience_type": "role",
  "audience_filter": {
    "role_ids": [2, 3]
  }
}
```

### 3. Target by Grade
```json
{
  "audience_type": "grade",
  "audience_filter": {
    "grade_ids": [5, 6, 7]
  }
}
```

### 4. Target by Section
```json
{
  "audience_type": "section",
  "audience_filter": {
    "section_ids": [10, 11]
  }
}
```

### 5. Target Custom Users
```json
{
  "audience_type": "custom",
  "audience_filter": {
    "user_ids": [1, 5, 10, 15, 20]
  }
}
```

## Notification Types

Common notification types you can use:
- `assignment` - Assignment-related notifications
- `exam` - Exam-related notifications
- `attendance` - Attendance notifications
- `announcement` - General announcements
- `message` - Direct messages
- `grade` - Grade updates
- `fee` - Fee payment reminders
- `event` - Event notifications
- `alert` - Important alerts
- `digest` - Summary notifications

## Notification Channels

- `in_app` - In-application notifications
- `email` - Email notifications
- `sms` - SMS notifications
- `push` - Mobile push notifications

## Notification Priorities

- `low` - Low priority, can be batched
- `medium` - Normal priority
- `high` - High priority, send immediately
- `urgent` - Critical alerts, bypass quiet hours

## Scheduled Announcements

```bash
curl -X POST "http://localhost:8000/api/v1/announcements/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Exam Results",
    "content": "Final exam results will be published tomorrow",
    "audience_type": "all",
    "priority": "high",
    "channels": ["in_app", "email"],
    "scheduled_at": "2024-12-31T10:00:00"
  }'
```

The announcement will be automatically published by the Celery beat scheduler at the specified time.

## Monitoring

### Check Celery Task Status
```bash
celery -A worker.celery_app inspect active
celery -A worker.celery_app inspect stats
```

### View Failed Tasks
```bash
celery -A worker.celery_app inspect failed
```

### Purge Queue (Use with caution!)
```bash
celery -A worker.celery_app purge
```

## Testing

### Test Email Notification
```python
from src.services.notification_providers import EmailProvider

provider = EmailProvider(
    api_key="your_sendgrid_key",
    sender_email="test@example.com",
    sender_name="Test"
)

await provider.send(
    recipient="recipient@example.com",
    subject="Test Email",
    content="<h1>This is a test</h1>"
)
```

### Test SMS Notification
```python
from src.services.notification_providers import SMSProvider

provider = SMSProvider(
    auth_key="your_msg91_key",
    sender_id="SENDER"
)

await provider.send(
    recipient="919876543210",
    subject="Test",
    content="This is a test SMS"
)
```

## Common Issues and Solutions

### Issue: Notifications not sending
**Solution:** 
1. Check Celery worker is running
2. Verify API keys in `.env`
3. Check user notification preferences

### Issue: WebSocket connection fails
**Solution:**
1. Verify token is valid
2. Check WebSocket URL format
3. Ensure server is running

### Issue: Scheduled tasks not running
**Solution:**
1. Ensure Celery beat is running
2. Check Redis connection
3. Verify beat schedule configuration

## Production Considerations

1. **Use environment-specific configs** for different environments
2. **Set up monitoring** for Celery workers (e.g., Flower)
3. **Implement rate limiting** on API endpoints
4. **Use message queues** for high-volume scenarios
5. **Set up proper logging** and alerting
6. **Enable SSL/TLS** for WebSocket connections
7. **Implement retry logic** in clients
8. **Monitor API rate limits** for third-party services
9. **Regular database cleanup** of old notifications
10. **Load test** the system before deployment

## Support

For detailed implementation details, see `NOTIFICATION_IMPLEMENTATION.md`
