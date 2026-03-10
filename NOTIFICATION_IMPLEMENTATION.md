# Notification and Communication System Implementation

## Overview
This document describes the comprehensive notification and communication system implemented for the FastAPI application. The system supports multi-channel notifications, announcement broadcasting, real-time messaging, and async background job processing.

## Features

### 1. Multi-Channel Notifications
- **In-App Notifications**: Real-time notifications displayed within the application
- **Email Notifications**: Using SendGrid API for reliable email delivery
- **SMS Notifications**: Using MSG91 API for SMS delivery
- **Push Notifications**: Using Firebase Cloud Messaging (FCM) for mobile push notifications

### 2. Announcement Broadcasting
- Create and manage announcements with audience targeting
- Support for multiple audience types:
  - All users in institution
  - By role (teachers, students, admins)
  - By grade
  - By section
  - Custom user lists
- Schedule announcements for future delivery
- Set expiration dates for time-sensitive announcements
- Attach files and media to announcements

### 3. Real-Time Messaging
- WebSocket-based real-time communication
- Direct messaging between users
- Message threads and conversations
- Message search functionality
- Read receipts and unread counts
- Message attachments support

### 4. Notification Preferences
- User-customizable notification settings
- Channel-specific preferences (email, SMS, push, in-app)
- Notification type filtering
- Quiet hours configuration

### 5. Background Job Processing
- Celery-based async task processing
- Scheduled announcement delivery
- Bulk notification processing
- Failed notification retry mechanism
- Automatic cleanup of old notifications
- Digest notification generation

## Architecture

### Models

#### Notification
```python
- id: Primary key
- institution_id: Institution reference
- user_id: User reference
- title: Notification title
- message: Notification content
- notification_type: Type of notification
- priority: low/medium/high/urgent
- channel: in_app/email/sms/push
- status: pending/sent/failed/read
- data: Additional JSON data
- timestamps: read_at, sent_at, failed_at
```

#### NotificationPreference
```python
- user_id: User reference
- email_enabled: Boolean
- sms_enabled: Boolean
- push_enabled: Boolean
- in_app_enabled: Boolean
- notification_types: JSON config
- quiet_hours_start: Time
- quiet_hours_end: Time
```

#### Announcement
```python
- institution_id: Institution reference
- created_by: User reference
- title: Announcement title
- content: Announcement content
- audience_type: all/institution/grade/section/role/custom
- audience_filter: JSON filter criteria
- priority: Notification priority
- channels: List of channels to use
- scheduled_at: Optional scheduled delivery time
- expires_at: Optional expiration time
- is_published: Publication status
- attachments: JSON list of attachments
```

#### Message
```python
- institution_id: Institution reference
- sender_id: Sender user reference
- recipient_id: Recipient user reference
- parent_id: For threading messages
- subject: Message subject
- content: Message content
- is_read: Read status
- is_deleted_by_sender: Soft delete flag
- is_deleted_by_recipient: Soft delete flag
- attachments: JSON list of attachments
```

#### NotificationTemplate
```python
- institution_id: Optional institution reference
- name: Template name
- notification_type: Type identifier
- channel: Target channel
- subject_template: Subject with variables
- body_template: Body with variables
- variables: List of available variables
- is_active: Active status
```

### Services

#### NotificationService
- Create and manage notifications
- Send notifications through providers
- Check user preferences and quiet hours
- Get notification statistics
- Template rendering

#### AnnouncementService
- Create and manage announcements
- Target audience resolution
- Publish and broadcast announcements
- Get user-specific announcements

#### MessagingService
- Send and receive messages
- Conversation management
- Thread management
- Message search

#### NotificationProviders
- EmailProvider (SendGrid)
- SMSProvider (MSG91)
- PushProvider (FCM)
- InAppProvider

#### WebSocketManager
- Manage WebSocket connections
- Send real-time notifications
- Broadcast to institution/users
- Connection lifecycle management

### API Endpoints

#### Notifications
```
GET    /api/v1/notifications/              - List notifications
GET    /api/v1/notifications/stats         - Get statistics
GET    /api/v1/notifications/{id}          - Get notification details
PATCH  /api/v1/notifications/{id}/read     - Mark as read
POST   /api/v1/notifications/mark-all-read - Mark all as read
DELETE /api/v1/notifications/{id}          - Delete notification
GET    /api/v1/notifications/preferences/me - Get preferences
PUT    /api/v1/notifications/preferences/me - Update preferences
POST   /api/v1/notifications/bulk          - Send bulk notifications
```

#### Announcements
```
POST   /api/v1/announcements/                - Create announcement
GET    /api/v1/announcements/                - List announcements
GET    /api/v1/announcements/my-announcements - Get user's announcements
GET    /api/v1/announcements/{id}            - Get announcement details
PUT    /api/v1/announcements/{id}            - Update announcement
DELETE /api/v1/announcements/{id}            - Delete announcement
POST   /api/v1/announcements/{id}/publish    - Publish announcement
```

#### Messages
```
POST   /api/v1/messages/                     - Send message
GET    /api/v1/messages/inbox                - Get inbox
GET    /api/v1/messages/sent                 - Get sent messages
GET    /api/v1/messages/unread-count         - Get unread count
GET    /api/v1/messages/conversation/{id}    - Get conversation
GET    /api/v1/messages/{id}                 - Get message details
GET    /api/v1/messages/{id}/thread          - Get message thread
PATCH  /api/v1/messages/{id}/read            - Mark message as read
POST   /api/v1/messages/mark-all-read        - Mark all as read
DELETE /api/v1/messages/{id}                 - Delete message
GET    /api/v1/messages/search/              - Search messages
```

#### Notification Templates
```
POST   /api/v1/notification-templates/       - Create template
GET    /api/v1/notification-templates/       - List templates
GET    /api/v1/notification-templates/{id}   - Get template details
PUT    /api/v1/notification-templates/{id}   - Update template
DELETE /api/v1/notification-templates/{id}   - Delete template
```

#### WebSocket
```
WS     /api/v1/ws/ws?token={token}           - WebSocket connection
```

### Celery Tasks

#### send_notification
Sends a single notification through the appropriate provider.

#### send_bulk_notifications
Sends notifications to multiple users efficiently.

#### send_scheduled_announcements
Periodic task that publishes scheduled announcements.

#### cleanup_old_notifications
Periodic task that removes old read notifications (default: 90 days).

#### retry_failed_notifications
Retries failed notifications with exponential backoff.

#### send_digest_notifications
Sends daily/weekly digest of unread notifications.

## Configuration

### Environment Variables

```bash
# SendGrid Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDER_EMAIL=noreply@example.com
SENDER_NAME=System

# MSG91 SMS Configuration
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=SENDER

# Firebase Cloud Messaging (Push Notifications)
FCM_SERVER_KEY=your_fcm_server_key

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## Setup and Deployment

### 1. Install Dependencies
```bash
poetry install
```

### 2. Run Database Migrations
```bash
alembic upgrade head
```

### 3. Start Celery Worker
```bash
celery -A worker.celery_app worker --loglevel=info
```

### 4. Start Celery Beat (for scheduled tasks)
```bash
celery -A beat.celery_app beat --loglevel=info
```

### 5. Start FastAPI Application
```bash
uvicorn src.main:app --reload
```

## Usage Examples

### Creating a Notification
```python
from src.services.notification_service import NotificationService
from src.tasks.notification_tasks import send_notification

service = NotificationService(db)
notification = service.create_notification(
    institution_id=1,
    user_id=10,
    title="Assignment Due",
    message="Your assignment is due tomorrow",
    notification_type="assignment",
    channel="email",
    priority="high"
)

# Queue for async sending
send_notification.delay(notification.id)
```

### Creating an Announcement
```python
from src.services.announcement_service import AnnouncementService

service = AnnouncementService(db)
announcement = service.create_announcement(
    institution_id=1,
    created_by=5,
    announcement_data={
        "title": "School Holiday",
        "content": "School will be closed on Monday",
        "audience_type": "all",
        "priority": "high",
        "channels": ["in_app", "email"],
        "scheduled_at": "2024-01-15T09:00:00"
    }
)
```

### Sending a Message
```python
from src.services.messaging_service import MessagingService

service = MessagingService(db)
message = service.send_message(
    institution_id=1,
    sender_id=10,
    message_data={
        "recipient_id": 20,
        "subject": "Question about homework",
        "content": "Can you help me understand chapter 5?",
        "attachments": []
    }
)
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/ws?token=YOUR_ACCESS_TOKEN');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'notification') {
        console.log('New notification:', data);
    }
};

// Send ping
ws.send(JSON.stringify({type: 'ping', timestamp: Date.now()}));
```

## Best Practices

1. **Always check user preferences** before sending notifications
2. **Respect quiet hours** for SMS and push notifications
3. **Use templates** for consistent messaging
4. **Queue bulk operations** using Celery tasks
5. **Monitor failed notifications** and retry appropriately
6. **Clean up old data** regularly to maintain performance
7. **Use appropriate priority levels** for notifications
8. **Implement rate limiting** for user-generated messages
9. **Log all notification events** for audit trails
10. **Test notification delivery** in staging environment

## Security Considerations

1. **Authentication**: All API endpoints require valid JWT tokens
2. **Authorization**: Users can only access their own notifications/messages
3. **Institution Isolation**: All queries are scoped to user's institution
4. **Input Validation**: All inputs validated using Pydantic schemas
5. **XSS Prevention**: Sanitize HTML content in notifications
6. **Rate Limiting**: Implement rate limits on message sending
7. **Sensitive Data**: Never log API keys or sensitive user data
8. **WebSocket Auth**: Token-based authentication for WebSocket connections

## Monitoring and Maintenance

### Key Metrics to Monitor
- Notification delivery success rate
- Average delivery time by channel
- Failed notification count
- WebSocket connection count
- Celery queue length
- Database query performance

### Regular Maintenance Tasks
- Clean up old notifications (automated)
- Review failed notification logs
- Update notification templates
- Monitor API rate limits
- Review user preference patterns
- Optimize database indexes

## Troubleshooting

### Notifications Not Sending
1. Check Celery worker is running
2. Verify API keys are configured correctly
3. Check user preferences allow the channel
4. Review notification status and error messages

### WebSocket Disconnections
1. Verify token is valid
2. Check network connectivity
3. Implement reconnection logic in client
4. Review server logs for errors

### High Latency
1. Check Celery queue length
2. Review database query performance
3. Optimize bulk operations
4. Consider horizontal scaling

## Future Enhancements

1. **Rich Media Support**: Images, videos in notifications
2. **Notification Analytics**: Delivery rates, read rates, engagement
3. **A/B Testing**: Test different notification formats
4. **Smart Batching**: Intelligent grouping of similar notifications
5. **Multi-language Support**: Localized notification content
6. **Integration APIs**: Webhooks for external systems
7. **Mobile App Support**: Native mobile notification handling
8. **AI-powered Timing**: Optimal delivery time prediction
