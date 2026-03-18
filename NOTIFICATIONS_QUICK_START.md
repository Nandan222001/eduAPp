# Push Notifications Quick Start Guide

This guide will help you quickly set up and test push notifications in the application.

## Prerequisites

- Physical mobile device (iOS or Android) - Push notifications don't work on simulators
- Expo Go app installed OR custom development build
- Backend server running
- PostgreSQL database

## Step 1: Backend Setup (5 minutes)

### Install Python Package
```bash
poetry add exponent-server-sdk
poetry install
```

### Run Database Migration
```bash
alembic upgrade head
```

This creates the `push_devices` and `push_device_topics` tables.

### Verify Backend is Running
```bash
uvicorn src.main:app --reload
```

Test the endpoint:
```bash
curl http://localhost:8000/api/v1/notifications/devices -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 2: Mobile App Setup (5 minutes)

### Install Dependencies
```bash
cd mobile
npm install
```

Key packages installed:
- `expo-notifications@~0.27.6`
- `expo-device@~5.9.3`
- `@react-native-community/datetimepicker@^7.6.2`

### Start the App
```bash
npm start
```

Press `i` for iOS or `a` for Android to launch on your physical device.

## Step 3: Test Push Notifications (10 minutes)

### 1. Login to the App
Use your test credentials to login. The app will automatically:
- Request notification permissions
- Register your device with the backend
- Subscribe to default topics

### 2. Get Your Expo Push Token
Add this to any screen temporarily to see your token:

```typescript
import { getExpoPushToken } from '../services/notificationService';

// In your component
useEffect(() => {
  getExpoPushToken().then(token => {
    console.log('Expo Push Token:', token);
    // Copy this token for testing
  });
}, []);
```

### 3. Send a Test Notification

#### Option A: Using Expo's Push Notification Tool
1. Go to https://expo.dev/notifications
2. Paste your Expo Push Token
3. Add title and message
4. Click "Send a Notification"

#### Option B: Using Backend API
```python
# In Python shell or script
from src.services.expo_push_service import ExpoPushService
from src.database import SessionLocal

db = SessionLocal()
service = ExpoPushService()

result = service.send_push_notification(
    tokens=["ExponentPushToken[YOUR_TOKEN_HERE]"],
    title="Test Notification",
    body="This is a test notification from the backend",
    data={"screen": "Home"}
)

print(result)
db.close()
```

#### Option C: Using the Notification Service
```python
from src.services.notification_service import NotificationService
from src.database import SessionLocal
import asyncio

db = SessionLocal()
service = NotificationService(db)

notification = service.create_notification(
    institution_id=1,
    user_id=YOUR_USER_ID,
    title="Test Assignment",
    message="You have a new assignment in Mathematics",
    notification_type="assignment_created",
    channel="push",
    priority="high",
    notification_group="assignments",
    data={
        "screen": "Assignment",
        "id": 123
    }
)

asyncio.run(service.send_notification(notification.id))
db.close()
```

### 4. Test Deep Linking
Tap the notification on your device. It should navigate to the specified screen.

### 5. Test Notification Preferences
1. Navigate to Settings → Notification Preferences
2. Toggle different notification types
3. Send another test notification
4. Verify it respects your preferences

## Step 4: Integration with Your Features (15 minutes)

### Example: Add Notifications to Assignments

In your assignment creation code:

```python
# src/api/v1/assignments.py
from src.services.notification_service import NotificationService

@router.post("/assignments/")
def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create assignment
    assignment = Assignment(**assignment_data.dict())
    db.add(assignment)
    db.commit()
    
    # Send notifications
    notification_service = NotificationService(db)
    
    # Get students in the course
    students = db.query(Student).join(Enrollment).filter(
        Enrollment.course_id == assignment.course_id
    ).all()
    
    for student in students:
        notification = notification_service.create_notification(
            institution_id=current_user.institution_id,
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
            }
        )
        # Send asynchronously
        asyncio.create_task(notification_service.send_notification(notification.id))
    
    return assignment
```

## Common Issues and Solutions

### Issue: "Permission Denied"
**Solution**: Make sure you granted notification permissions in device settings.

### Issue: Token is null
**Solution**: 
1. Use a physical device (not simulator)
2. Check you're logged in
3. Verify notification permissions are granted

### Issue: Notification received but tap doesn't work
**Solution**: 
1. Check the `screen` field in notification data matches your navigation
2. Verify navigation structure is properly set up
3. Check console logs for navigation errors

### Issue: Backend returns 400 "Invalid token"
**Solution**: The token format might be incorrect. Expo tokens start with `ExponentPushToken[`.

### Issue: Notifications work in Expo Go but not in standalone build
**Solution**: 
1. Rebuild your app with `eas build`
2. Ensure `google-services.json` (Android) or push certificates (iOS) are configured

## Testing Checklist

- [ ] Notifications permissions requested and granted
- [ ] Device successfully registered with backend
- [ ] Test notification received on device
- [ ] Notification tap opens correct screen
- [ ] Preferences screen loads successfully
- [ ] Toggling preferences affects notification delivery
- [ ] Quiet hours configuration works
- [ ] Badge count updates correctly
- [ ] Multiple notifications display correctly
- [ ] Notifications work in foreground and background

## Next Steps

Once basic notifications are working:

1. **Add to more features**: Integrate with grades, attendance, announcements
2. **Customize channels**: Create different notification channels for different types
3. **Schedule notifications**: Add reminder functionality
4. **Analytics**: Monitor delivery rates and user engagement
5. **Rich notifications**: Add images, actions, and custom layouts

## Documentation

- [Full Implementation Guide](./mobile/NOTIFICATIONS_IMPLEMENTATION.md)
- [Backend Integration Guide](./NOTIFICATIONS_BACKEND_INTEGRATION.md)
- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Service](https://docs.expo.dev/push-notifications/overview/)

## Support

If you encounter issues:
1. Check the console logs on both mobile and backend
2. Review the troubleshooting section in the implementation guide
3. Verify your Expo token is valid using the Expo notification tool
4. Check backend logs for device registration and notification sending

## Production Checklist

Before going to production:

- [ ] Configure APNs (iOS) and FCM (Android) credentials in Expo
- [ ] Set up proper error monitoring (Sentry)
- [ ] Implement notification analytics
- [ ] Add rate limiting for notification sending
- [ ] Set up notification batching for bulk operations
- [ ] Configure proper CORS and API security
- [ ] Test with different device types and OS versions
- [ ] Set up monitoring for notification delivery rates
- [ ] Document notification types and data schemas
- [ ] Train staff on notification best practices

Congratulations! You now have push notifications set up in your application. 🎉
