# Push Notifications Integration

This document describes the push notifications and real-time features integration for the EduTrack mobile app.

## Overview

The mobile app now supports push notifications using Expo Notifications, allowing users to receive real-time updates for assignments, grades, attendance, and announcements.

## Features Implemented

### 1. Notification Service (`mobile/src/utils/notificationService.ts`)

A comprehensive notification service that handles:

- **Permission Requests**: Requests notification permissions from the user
- **Device Registration**: Registers the device's Expo Push Token with the backend
- **Topic Subscriptions**: Allows users to subscribe to specific notification topics:
  - Assignments
  - Grades
  - Attendance
  - Announcements
- **Notification Handlers**: Manages incoming notifications and user interactions
- **Deep Linking**: Routes users to specific screens when tapping notifications
- **Badge Management**: Updates app icon badge counts
- **Local Notifications**: Schedules and manages local notifications

### 2. Notification Preferences Screen (`mobile/src/screens/student/NotificationPreferencesScreen.tsx`)

A settings screen that allows users to:

- Enable/disable push notifications
- Configure notification channels (Push, Email, SMS, In-App)
- Subscribe/unsubscribe from specific topics
- Send test notifications
- Manage notification preferences

### 3. Backend API Endpoints

New endpoints added to `/api/v1/notifications/`:

#### `POST /api/v1/notifications/register-device`
Registers a mobile device for push notifications.

**Request Body:**
```json
{
  "device_token": "ExponentPushToken[...]",
  "device_type": "ios" | "android",
  "device_name": "iPhone 14 Pro",
  "app_version": "1.0.0",
  "topics": {
    "assignments": true,
    "grades": true,
    "attendance": true,
    "announcements": true
  }
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 123,
  "device_token": "ExponentPushToken[...]",
  "device_type": "ios",
  "device_name": "iPhone 14 Pro",
  "app_version": "1.0.0",
  "is_active": true,
  "topics": {...},
  "last_used_at": "2024-01-15T12:00:00Z",
  "created_at": "2024-01-15T12:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

#### `GET /api/v1/notifications/devices`
Retrieves all registered devices for the current user.

#### `DELETE /api/v1/notifications/devices/{device_id}`
Removes a registered device.

### 4. Database Model

New `UserDevice` model added to track registered devices:

```python
class UserDevice(Base):
    __tablename__ = "user_devices"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    device_token = Column(String(500), unique=True)
    device_type = Column(String(20))  # 'ios' or 'android'
    device_name = Column(String(255))
    app_version = Column(String(50))
    is_active = Column(Boolean, default=True)
    topics = Column(JSON)  # Subscribed topics
    last_used_at = Column(DateTime)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
```

### 5. Deep Linking

Notifications support deep linking to specific screens:

- **Assignment notifications**: Navigate to assignment detail or assignments list
- **Grade notifications**: Navigate to courses screen
- **Attendance notifications**: Navigate to home screen
- **Announcement notifications**: Navigate to home screen

### 6. Android Notification Channels

The app creates dedicated Android notification channels:

- **Default**: General notifications
- **Assignments**: Assignment-related notifications (HIGH importance)
- **Grades**: Grade and exam result notifications (HIGH importance)
- **Attendance**: Attendance updates (DEFAULT importance)
- **Announcements**: School announcements (HIGH importance)

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install expo-notifications expo-device
```

### 2. Configure Expo Project ID

Update `mobile/src/utils/notificationService.ts` line 104:

```typescript
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-project-id', // Replace with your Expo project ID
});
```

### 3. Run Database Migration

```bash
alembic upgrade head
```

### 4. Configure Android

For Android, place your `google-services.json` file in the `mobile/` directory.

### 5. Configure iOS

For iOS, additional configuration in Xcode may be required for push notifications.

## Usage

### Initializing Notifications

The app automatically initializes notifications on startup in `App.tsx`:

```typescript
const initializeNotifications = async () => {
  await notificationService.requestPermissions();
  await notificationService.registerExpoPushToken();
  await notificationService.registerDeviceWithBackend(defaultTopics);
};
```

### Accessing Notification Settings

Users can access notification settings from:
- Profile Screen → Notification Settings button (to be added to ProfileScreen)
- Navigate to 'NotificationPreferences' screen

### Sending Notifications from Backend

To send a push notification to a user:

1. Retrieve the user's active device tokens from the `user_devices` table
2. Use the Expo Push Notification API to send notifications:

```python
import requests

def send_push_notification(expo_token: str, title: str, body: str, data: dict):
    response = requests.post(
        'https://exp.host/--/api/v2/push/send',
        headers={
            'Content-Type': 'application/json',
        },
        json={
            'to': expo_token,
            'title': title,
            'body': body,
            'data': data,
            'sound': 'default',
            'priority': 'high',
        }
    )
    return response.json()
```

## Notification Data Structure

When sending notifications, include a `type` field in the data payload:

```json
{
  "to": "ExponentPushToken[...]",
  "title": "New Assignment Posted",
  "body": "Math Assignment 5 is now available",
  "data": {
    "type": "assignment",
    "assignmentId": 123
  }
}
```

Supported types:
- `assignment` - Navigates to assignment detail
- `grade` - Navigates to courses screen
- `attendance` - Navigates to home screen
- `announcement` - Navigates to home screen

## Testing

### Test Notification

Users can send a test notification from the Notification Preferences screen using the "Send Test Notification" button.

### Testing with Expo Push Tool

You can test push notifications using the Expo Push Notification Tool:
https://expo.dev/notifications

## Security Considerations

1. Device tokens are stored securely in the backend database
2. Only authenticated users can register devices
3. Users can only manage their own devices
4. Tokens are validated before sending notifications
5. Inactive devices are filtered out when sending notifications

## Future Enhancements

- [ ] Add notification history/inbox in the app
- [ ] Implement notification sounds and custom vibration patterns
- [ ] Add notification grouping and categorization
- [ ] Support for rich media notifications (images, videos)
- [ ] Implement notification action buttons
- [ ] Add quiet hours/do not disturb functionality
- [ ] Support for notification priority levels
- [ ] Analytics for notification engagement

## Troubleshooting

### Notifications not appearing on device

1. Check device has notifications enabled in system settings
2. Verify device token is registered with backend
3. Check Expo Push Notification service status
4. Verify the notification payload is correct

### Deep linking not working

1. Check the URL scheme is configured in `app.json`
2. Verify navigation structure matches the linking configuration
3. Test deep links using `npx uri-scheme open edutrack://...`

### Permission denied

1. Uninstall and reinstall the app
2. Check device notification settings
3. Request permissions again from settings screen
