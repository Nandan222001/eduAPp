# Backend Notifications Integration Guide

This document explains how to integrate the Expo push notifications system with existing backend services.

## Database Models

### PushDevice Model
Stores device information for push notifications:

```python
from src.models.push_device import PushDevice

# Query active devices for a user
devices = db.query(PushDevice).filter(
    PushDevice.user_id == user_id,
    PushDevice.is_active == True
).all()
```

### PushDeviceTopic Model
Manages topic subscriptions:

```python
from src.models.push_device import PushDeviceTopic

# Get devices subscribed to a topic
devices = db.query(PushDevice).join(
    PushDeviceTopic,
    PushDevice.id == PushDeviceTopic.device_id
).filter(
    PushDeviceTopic.topic == "assignments"
).all()
```

## API Endpoints

### Register Device
```http
POST /api/v1/notifications/register-device
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "device_name": "iPhone 14",
  "os_version": "17.0",
  "app_version": "1.0.0",
  "topics": ["assignments", "grades", "attendance", "announcements"]
}
```

### Subscribe to Topic
```http
POST /api/v1/notifications/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "topic": "assignments"
}
```

### Send Push Notification

#### Using NotificationService

```python
from src.services.notification_service import NotificationService
from src.database import get_db

db = next(get_db())
service = NotificationService(db)

# Create and send notification
notification = service.create_notification(
    institution_id=institution_id,
    user_id=user_id,
    title="New Assignment",
    message="You have a new assignment in Mathematics",
    notification_type="assignment_created",
    channel="push",
    priority="high",
    notification_group="assignments",
    data={
        "screen": "Assignment",
        "id": assignment_id,
        "params": {
            "courseId": course_id
        }
    }
)

# Send asynchronously
await service.send_notification(notification.id)
```

#### Sending to Topic

```python
# Send to all devices subscribed to assignments
result = service.send_push_notification_to_topic(
    topic="assignments",
    title="New Assignment Posted",
    message="Check out the new assignment in Biology",
    data={
        "screen": "Assignment",
        "id": assignment_id
    },
    institution_id=institution_id
)
```

## Integration Examples

### Assignments Module

When creating a new assignment:

```python
# src/services/assignment_service.py
from src.services.notification_service import NotificationService

class AssignmentService:
    def create_assignment(self, assignment_data, created_by_id):
        # Create assignment
        assignment = Assignment(**assignment_data)
        self.db.add(assignment)
        self.db.commit()
        
        # Send notifications to enrolled students
        notification_service = NotificationService(self.db)
        
        students = self._get_enrolled_students(assignment.course_id)
        for student in students:
            notification = notification_service.create_notification(
                institution_id=assignment.institution_id,
                user_id=student.user_id,
                title=f"New Assignment: {assignment.title}",
                message=f"Due: {assignment.due_date.strftime('%b %d, %Y')}",
                notification_type="assignment_created",
                channel="push",
                priority="high",
                notification_group="assignments",
                data={
                    "screen": "Assignment",
                    "id": assignment.id,
                    "course_id": assignment.course_id,
                }
            )
            # Queue for async sending
            send_notification.delay(notification.id)
        
        return assignment
```

### Grades Module

When posting grades:

```python
# src/services/grade_service.py
class GradeService:
    def publish_grades(self, exam_id):
        exam = self.db.query(Exam).filter(Exam.id == exam_id).first()
        grades = self.db.query(Grade).filter(Grade.exam_id == exam_id).all()
        
        notification_service = NotificationService(self.db)
        
        for grade in grades:
            notification = notification_service.create_notification(
                institution_id=exam.institution_id,
                user_id=grade.student.user_id,
                title="Grade Posted",
                message=f"Your grade for {exam.title} is available",
                notification_type="grade_published",
                channel="push",
                priority="high",
                notification_group="grades",
                data={
                    "screen": "Grade",
                    "id": grade.id,
                    "exam_id": exam_id,
                }
            )
            send_notification.delay(notification.id)
```

### Attendance Module

For attendance alerts:

```python
# src/services/attendance_service.py
class AttendanceService:
    def mark_absent(self, student_id, date, course_id):
        attendance = Attendance(
            student_id=student_id,
            date=date,
            course_id=course_id,
            status="absent"
        )
        self.db.add(attendance)
        self.db.commit()
        
        # Notify student and parents
        student = self.db.query(Student).filter(Student.id == student_id).first()
        notification_service = NotificationService(self.db)
        
        # Notify student
        notification_service.create_notification(
            institution_id=student.institution_id,
            user_id=student.user_id,
            title="Attendance Alert",
            message=f"You were marked absent for {course.name}",
            notification_type="attendance_alert",
            channel="push",
            priority="medium",
            notification_group="attendance",
            data={
                "screen": "Attendance",
                "date": date.isoformat(),
            }
        )
```

### Announcements Module

For school announcements:

```python
# src/services/announcement_service.py
class AnnouncementService:
    def publish_announcement(self, announcement_id):
        announcement = self.db.query(Announcement).filter(
            Announcement.id == announcement_id
        ).first()
        
        announcement.is_published = True
        announcement.published_at = datetime.utcnow()
        self.db.commit()
        
        # Send to topic for immediate delivery
        notification_service = NotificationService(self.db)
        result = notification_service.send_push_notification_to_topic(
            topic="announcements",
            title=announcement.title,
            message=announcement.content[:100] + "...",
            data={
                "screen": "Announcement",
                "id": announcement_id,
            },
            institution_id=announcement.institution_id,
        )
        
        return result
```

## Celery Tasks Integration

For asynchronous notification sending:

```python
# src/tasks/notification_tasks.py
from celery import shared_task
from src.services.notification_service import NotificationService
from src.database import SessionLocal

@shared_task
def send_notification(notification_id: int):
    db = SessionLocal()
    try:
        service = NotificationService(db)
        asyncio.run(service.send_notification(notification_id))
    finally:
        db.close()

@shared_task
def send_bulk_notifications(user_ids: list, title: str, message: str, **kwargs):
    db = SessionLocal()
    try:
        service = NotificationService(db)
        for user_id in user_ids:
            notification = service.create_notification(
                user_id=user_id,
                title=title,
                message=message,
                **kwargs
            )
            asyncio.run(service.send_notification(notification.id))
    finally:
        db.close()
```

## Error Handling

The system automatically handles:
- Invalid device tokens (marked as inactive)
- Network errors (logged and retried)
- Rate limiting (handled by Expo)

Example error handling:

```python
try:
    result = await service.send_notification(notification_id)
    if not result:
        logger.error(f"Failed to send notification {notification_id}")
except Exception as e:
    logger.error(f"Error sending notification: {str(e)}")
    # Notification status is automatically updated to FAILED
```

## Best Practices

1. **Always use async sending** for multiple notifications:
```python
# Good - async with Celery
send_notification.delay(notification.id)

# Bad - synchronous
await service.send_notification(notification.id)
```

2. **Include deep linking data**:
```python
data = {
    "screen": "Assignment",
    "id": assignment_id,
    "params": {
        "courseId": course_id,
        "highlightSection": "details"
    }
}
```

3. **Use appropriate priorities**:
- `urgent`: Critical alerts (security, emergencies)
- `high`: Important but not critical (grades, assignments)
- `medium`: Regular updates (attendance, general notifications)
- `low`: Informational (reminders, tips)

4. **Respect user preferences**:
The NotificationService automatically checks:
- User's notification preferences
- Quiet hours settings
- Channel preferences
- Topic subscriptions

5. **Batch notifications**:
```python
# For bulk operations, use topic-based sending
service.send_push_notification_to_topic(
    topic="assignments",
    title="Multiple assignments due soon",
    message="Check your assignments page",
)
```

## Testing

### Unit Tests
```python
# tests/test_expo_push_service.py
def test_send_push_notification(db_session):
    service = ExpoPushService()
    result = service.send_push_notification(
        tokens=["ExponentPushToken[test]"],
        title="Test",
        body="Test notification",
        data={"test": True}
    )
    assert result["success"] == True
```

### Integration Tests
```python
# tests/integration/test_notification_flow.py
def test_assignment_notification_flow(client, db_session, test_user):
    # Create assignment
    response = client.post("/api/v1/assignments/", json={
        "title": "Test Assignment",
        "due_date": "2024-12-31",
        "course_id": 1
    })
    
    # Verify notification was created
    notifications = db_session.query(Notification).filter(
        Notification.user_id == test_user.id,
        Notification.notification_type == "assignment_created"
    ).all()
    
    assert len(notifications) == 1
```

## Monitoring

Track notification metrics:
```python
# Get notification statistics
stats = notification_service.get_analytics(
    institution_id=institution_id,
    request=NotificationAnalyticsRequest(
        start_date=start_date,
        end_date=end_date,
        channel="push"
    )
)

print(f"Delivery rate: {stats.delivery_rate}%")
print(f"Read rate: {stats.read_rate}%")
```

## Migration

To add push notifications to existing code:

1. Run the database migration
2. Update service classes to import NotificationService
3. Add notification creation after relevant operations
4. Test with a small user group first
5. Monitor delivery rates and adjust as needed
