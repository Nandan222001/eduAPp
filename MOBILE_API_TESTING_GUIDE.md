# Mobile API Testing Guide

This guide covers testing the mobile API endpoints for the educational platform.

## Overview

The mobile API integration tests cover the following major areas:

1. **Device Registration & Push Notifications** (`/api/v1/notifications/register-device`)
2. **Study Buddy** (`/api/v1/study-buddy`)
3. **Homework Scanner** (`/api/v1/homework-scanner`)
4. **Authentication Flow** (`/api/v1/auth`)
5. **Student Dashboard** (`/api/v1/students/{id}/dashboard`)
6. **Parent Multi-Child Support** (`/api/v1/parents`)

## Running Tests

### Run All Mobile API Tests

```bash
poetry run pytest tests/test_mobile_api_integration.py -v
```

### Run Specific Test Classes

```bash
# Test device registration
poetry run pytest tests/test_mobile_api_integration.py::TestNotificationDeviceRegistrationAPI -v

# Test study buddy
poetry run pytest tests/test_mobile_api_integration.py::TestStudyBuddyAPI -v

# Test homework scanner
poetry run pytest tests/test_mobile_api_integration.py::TestHomeworkScannerAPI -v

# Test authentication
poetry run pytest tests/test_mobile_api_integration.py::TestAuthenticationFlowAPI -v

# Test student dashboard
poetry run pytest tests/test_mobile_api_integration.py::TestStudentDashboardAPI -v

# Test parent multi-child
poetry run pytest tests/test_mobile_api_integration.py::TestParentMultiChildAPI -v
```

### Run with Coverage

```bash
poetry run pytest tests/test_mobile_api_integration.py --cov=src/api/v1 --cov-report=html
```

## API Endpoint Testing

### 1. Device Registration & Push Notifications

#### Endpoints Tested:
- `POST /api/v1/notifications/register-device` - Register a mobile device
- `DELETE /api/v1/notifications/register-device/{token}` - Unregister a device
- `POST /api/v1/notifications/subscribe` - Subscribe to notification topic
- `POST /api/v1/notifications/unsubscribe` - Unsubscribe from topic
- `GET /api/v1/notifications/devices` - Get all user devices

#### Test Cases:
- ✅ Register device successfully
- ✅ Handle duplicate token (update existing device)
- ✅ Unregister device
- ✅ Subscribe to notification topics
- ✅ Unsubscribe from topics
- ✅ Retrieve all registered devices

#### Example Request (Register Device):

```bash
curl -X POST "http://localhost:8000/api/v1/notifications/register-device" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "ios",
    "device_name": "iPhone 14 Pro",
    "os_version": "16.5",
    "app_version": "1.0.0",
    "topics": ["assignments", "grades"]
  }'
```

#### Example Response:

```json
{
  "id": 1,
  "user_id": 123,
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "device_name": "iPhone 14 Pro",
  "os_version": "16.5",
  "app_version": "1.0.0",
  "is_active": true,
  "last_used_at": "2024-01-15T10:30:00",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

### 2. Study Buddy API

#### Endpoints Tested:
- `POST /api/v1/study-buddy/sessions` - Create study session
- `GET /api/v1/study-buddy/sessions` - Get study sessions
- `GET /api/v1/study-buddy/sessions/{id}` - Get session details
- `POST /api/v1/study-buddy/sessions/{id}/end` - End session
- `GET /api/v1/study-buddy/sessions/{id}/messages` - Get session messages
- `POST /api/v1/study-buddy/chat` - Chat with study buddy
- `GET /api/v1/study-buddy/analyze-patterns/{student_id}` - Analyze study patterns
- `GET /api/v1/study-buddy/daily-plan/{student_id}` - Get daily study plan
- `GET /api/v1/study-buddy/motivational-message/{student_id}` - Get motivational message

#### Test Cases:
- ✅ Create study buddy session
- ✅ Retrieve study sessions
- ✅ Chat with study buddy AI
- ✅ End study session
- ✅ Analyze study patterns
- ✅ Generate daily study plan

#### Example Request (Chat):

```bash
curl -X POST "http://localhost:8000/api/v1/study-buddy/chat" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me understand quadratic equations",
    "context": {
      "subject": "mathematics",
      "topic": "algebra"
    }
  }'
```

#### Example Response:

```json
{
  "response": "Let me help you understand quadratic equations...",
  "student_id": 45,
  "session_id": 12,
  "timestamp": "2024-01-15T10:30:00"
}
```

### 3. Homework Scanner API

#### Endpoints Tested:
- `POST /api/v1/homework-scanner/scans` - Upload homework image
- `GET /api/v1/homework-scanner/scans` - Get student's scans
- `GET /api/v1/homework-scanner/scans/{id}` - Get scan details
- `GET /api/v1/homework-scanner/scans/{id}/analyze` - Analyze homework scan
- `DELETE /api/v1/homework-scanner/scans/{id}` - Delete scan

#### Test Cases:
- ✅ Upload homework image
- ✅ Retrieve homework scans
- ✅ Reject non-image files
- ✅ Get scan analysis

#### Example Request (Upload):

```bash
curl -X POST "http://localhost:8000/api/v1/homework-scanner/scans" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@homework.jpg" \
  -F "student_id=45" \
  -F "subject_id=12" \
  -F "scan_title=Math Homework Chapter 5"
```

#### Example Response:

```json
{
  "id": 789,
  "student_id": 45,
  "subject_id": 12,
  "scan_title": "Math Homework Chapter 5",
  "image_url": "https://s3.amazonaws.com/bucket/scans/789.jpg",
  "status": "processed",
  "created_at": "2024-01-15T10:30:00"
}
```

### 4. Authentication Flow

#### Endpoints Tested:
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user info

#### Test Cases:
- ✅ Successful login
- ✅ Wrong password handling
- ✅ Nonexistent user handling
- ✅ Token refresh
- ✅ Get current user info

#### Example Request (Login):

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@testschool.com",
    "password": "password123",
    "institution_id": 1
  }'
```

#### Example Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### 5. Student Dashboard

#### Endpoints Tested:
- `GET /api/v1/students/{id}/dashboard` - Get student dashboard data
- `GET /api/v1/students/{id}/profile` - Get student profile

#### Test Cases:
- ✅ Retrieve dashboard data
- ✅ Retrieve student profile
- ✅ Verify data structure

#### Example Request:

```bash
curl -X GET "http://localhost:8000/api/v1/students/45/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Example Response:

```json
{
  "student": {
    "id": 45,
    "name": "Jane Student",
    "grade": "Grade 10",
    "section": "Section A"
  },
  "assignments": {
    "pending": 5,
    "completed": 23,
    "overdue": 1
  },
  "attendance": {
    "percentage": 92.5,
    "present_days": 148,
    "total_days": 160
  },
  "grades": {
    "average": 85.6,
    "highest": 98,
    "lowest": 72
  }
}
```

### 6. Parent Multi-Child Support

#### Endpoints Tested:
- `GET /api/v1/parents/dashboard` - Get parent dashboard
- `GET /api/v1/parents/children` - Get list of children
- `GET /api/v1/parents/children/{id}/overview` - Get child overview
- `GET /api/v1/parents/children/{id}/attendance/today` - Today's attendance
- `GET /api/v1/parents/children/{id}/grades/recent` - Recent grades
- `GET /api/v1/parents/children/{id}/assignments/pending` - Pending assignments
- `GET /api/v1/parents/children/{id}/progress/weekly` - Weekly progress
- `GET /api/v1/parents/children/{id}/performance/comparison` - Performance comparison

#### Test Cases:
- ✅ Get parent dashboard
- ✅ List all children
- ✅ Get child-specific data
- ✅ Verify multi-child support

#### Example Request (Get Children):

```bash
curl -X GET "http://localhost:8000/api/v1/parents/children" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Example Response:

```json
[
  {
    "id": 45,
    "first_name": "Jane",
    "last_name": "Doe",
    "admission_number": "ADM001",
    "grade_name": "Grade 10",
    "section_name": "Section A",
    "attendance_percentage": 92.5,
    "average_score": 85.6
  },
  {
    "id": 67,
    "first_name": "John",
    "last_name": "Doe",
    "admission_number": "ADM002",
    "grade_name": "Grade 8",
    "section_name": "Section B",
    "attendance_percentage": 88.3,
    "average_score": 78.9
  }
]
```

## Manual Testing with Postman/curl

### Setup

1. **Get Access Token:**
   ```bash
   curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "student@testschool.com",
       "password": "password123",
       "institution_id": 1
     }'
   ```

2. **Save the token** from the response

3. **Use the token** in subsequent requests:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/notifications/devices" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

### Postman Collection

Import the following endpoints into Postman:

1. **Authentication**
   - POST `/api/v1/auth/login`
   - POST `/api/v1/auth/refresh`
   - GET `/api/v1/auth/me`

2. **Notifications**
   - POST `/api/v1/notifications/register-device`
   - DELETE `/api/v1/notifications/register-device/{token}`
   - POST `/api/v1/notifications/subscribe`
   - GET `/api/v1/notifications/devices`

3. **Study Buddy**
   - POST `/api/v1/study-buddy/sessions`
   - POST `/api/v1/study-buddy/chat`
   - GET `/api/v1/study-buddy/sessions`

4. **Homework Scanner**
   - POST `/api/v1/homework-scanner/scans` (with file upload)
   - GET `/api/v1/homework-scanner/scans`

5. **Student Dashboard**
   - GET `/api/v1/students/{id}/dashboard`
   - GET `/api/v1/students/{id}/profile`

6. **Parent Dashboard**
   - GET `/api/v1/parents/dashboard`
   - GET `/api/v1/parents/children`
   - GET `/api/v1/parents/children/{id}/overview`

## Test Data Setup

The test fixtures automatically create:
- Institution
- Academic year, grades, sections
- Admin, teacher, student, and parent roles
- Sample users for each role
- Student profiles with sections
- Parent profiles with user accounts

## Common Issues & Troubleshooting

### 1. Authentication Errors

**Problem:** 401 Unauthorized
**Solution:** Ensure you're including the `Authorization: Bearer TOKEN` header

### 2. File Upload Errors

**Problem:** 400 Bad Request on homework scanner
**Solution:** Ensure you're sending `multipart/form-data` with proper file format

### 3. Parent-Child Relationship

**Problem:** No children returned for parent
**Solution:** Ensure StudentParent relationships are created in the database

### 4. Missing Student Profile

**Problem:** 403 Forbidden on study buddy chat
**Solution:** Ensure the user has a linked student profile

## Database Schema Reference

### Key Tables

- `users` - User accounts
- `students` - Student profiles
- `parents` - Parent profiles
- `student_parents` - Student-parent relationships
- `push_devices` - Mobile device registrations
- `push_device_topics` - Device notification subscriptions
- `study_buddy_sessions` - Study buddy sessions
- `study_buddy_messages` - Chat messages
- `homework_scans` - Homework scanner uploads

## Integration Test Coverage

- ✅ Device registration and management
- ✅ Push notification subscriptions
- ✅ Study buddy interactions
- ✅ Homework scanning
- ✅ Authentication flow
- ✅ Student dashboard access
- ✅ Parent multi-child support
- ✅ Error handling and validation

## Next Steps

1. Run the full test suite: `poetry run pytest`
2. Check test coverage: `poetry run pytest --cov=src`
3. Test individual endpoints manually with Postman or curl
4. Verify mobile app integration with actual devices
5. Test push notifications end-to-end
6. Validate data synchronization between mobile and web

## Additional Resources

- [FastAPI Testing Documentation](https://fastapi.tiangolo.com/tutorial/testing/)
- [Pytest Documentation](https://docs.pytest.org/)
- [API Documentation](http://localhost:8000/docs) (when server is running)
