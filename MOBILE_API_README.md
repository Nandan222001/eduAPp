# Mobile API Documentation

Complete documentation for the mobile API endpoints of the educational platform.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [API Endpoints](#api-endpoints)
4. [Testing](#testing)
5. [Authentication](#authentication)
6. [Documentation Files](#documentation-files)
7. [Support](#support)

## Overview

The mobile API provides comprehensive endpoints for:

- 📱 **Device Management** - Push notification device registration and management
- 🎓 **Study Buddy** - AI-powered study assistance and tutoring
- 📚 **Homework Scanner** - Image upload and homework analysis
- 👨‍🎓 **Student Dashboard** - Comprehensive student performance data
- 👪 **Parent Portal** - Multi-child support for parents
- 🔐 **Authentication** - Secure JWT-based authentication

## Quick Start

### 1. Installation

```bash
# Install dependencies
poetry install

# Set up environment
cp .env.example .env
```

### 2. Run Tests

```bash
# Quick test (Linux/Mac)
./tests/run_mobile_tests.sh all

# Quick test (Windows)
.\tests\run_mobile_tests.ps1 all

# Or use pytest directly
poetry run pytest tests/test_mobile_api_integration.py -v
```

### 3. Start Server

```bash
# Development server
uvicorn src.main:app --reload

# View API documentation
# Open browser to http://localhost:8000/docs
```

### 4. Test an Endpoint

```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password",
    "institution_id": 1
  }'

# Use the access_token in subsequent requests
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## API Endpoints

### Device Management

**Register Device**
```http
POST /api/v1/notifications/register-device
Authorization: Bearer {token}
Content-Type: application/json

{
  "token": "ExponentPushToken[...]",
  "platform": "ios",
  "device_name": "iPhone 14 Pro",
  "os_version": "16.5",
  "app_version": "1.0.0",
  "topics": ["assignments", "grades"]
}
```

**Get User Devices**
```http
GET /api/v1/notifications/devices
Authorization: Bearer {token}
```

**Subscribe to Topic**
```http
POST /api/v1/notifications/subscribe
Authorization: Bearer {token}
Content-Type: application/json

{
  "token": "ExponentPushToken[...]",
  "topic": "exams"
}
```

### Study Buddy

**Create Session**
```http
POST /api/v1/study-buddy/sessions
Authorization: Bearer {token}
Content-Type: application/json

{
  "student_id": 123,
  "session_title": "Math Study",
  "context": {
    "subject": "mathematics",
    "topic": "algebra"
  }
}
```

**Chat with AI**
```http
POST /api/v1/study-buddy/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Explain quadratic equations",
  "context": {"subject": "mathematics"}
}
```

**Get Study Patterns**
```http
GET /api/v1/study-buddy/analyze-patterns/{student_id}
Authorization: Bearer {token}
```

### Homework Scanner

**Upload Homework**
```http
POST /api/v1/homework-scanner/scans
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [image file]
student_id: 123
subject_id: 45
scan_title: "Math Homework Chapter 5"
```

**Get Scans**
```http
GET /api/v1/homework-scanner/scans?student_id=123
Authorization: Bearer {token}
```

### Student Dashboard

**Get Dashboard**
```http
GET /api/v1/students/{student_id}/dashboard
Authorization: Bearer {token}
```

**Get Profile**
```http
GET /api/v1/students/{student_id}/profile
Authorization: Bearer {token}
```

### Parent Portal

**Get Children**
```http
GET /api/v1/parents/children
Authorization: Bearer {token}
```

**Get Child Overview**
```http
GET /api/v1/parents/children/{child_id}/overview
Authorization: Bearer {token}
```

**Get Today's Attendance**
```http
GET /api/v1/parents/children/{child_id}/attendance/today
Authorization: Bearer {token}
```

**Get Recent Grades**
```http
GET /api/v1/parents/children/{child_id}/grades/recent
Authorization: Bearer {token}
```

**Get Pending Assignments**
```http
GET /api/v1/parents/children/{child_id}/assignments/pending
Authorization: Bearer {token}
```

### Authentication

**Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "institution_id": 1
}
```

**Refresh Token**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

**Get Current User**
```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

**Logout**
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

## Testing

### Test Suites

The mobile API includes comprehensive integration tests covering:

- ✅ **Device Registration** (6 tests)
- ✅ **Study Buddy** (6 tests)
- ✅ **Homework Scanner** (3 tests)
- ✅ **Authentication** (2 tests)
- ✅ **Student Dashboard** (2 tests)
- ✅ **Parent Multi-Child** (6 tests)
- ✅ **Complete Workflows** (3 tests)

**Total: 28+ integration tests**

### Running Tests

```bash
# All tests
poetry run pytest tests/test_mobile_api_integration.py -v

# Specific test suite
poetry run pytest tests/test_mobile_api_integration.py::TestStudyBuddyAPI -v

# With coverage
poetry run pytest tests/test_mobile_api_integration.py --cov=src/api/v1 --cov-report=html

# Using helper scripts
./tests/run_mobile_tests.sh all
./tests/run_mobile_tests.sh coverage
```

### Test Files

- `tests/test_mobile_api_integration.py` - Main integration tests
- `tests/test_parent_multi_child.py` - Parent multi-child functionality
- `tests/test_mobile_api_complete_flow.py` - End-to-end workflows
- `tests/conftest.py` - Test fixtures and setup

## Authentication

### JWT Tokens

The API uses JWT (JSON Web Tokens) for authentication:

1. **Login** to get access and refresh tokens
2. **Include** access token in `Authorization: Bearer {token}` header
3. **Refresh** expired access tokens using refresh token
4. **Logout** to invalidate tokens

### Token Payload

```json
{
  "sub": 123,                    // User ID
  "institution_id": 1,           // Institution ID
  "role_id": 5,                  // Role ID
  "email": "user@example.com",   // User email
  "exp": 1234567890              // Expiration timestamp
}
```

### Roles

- **Student** - Access to study buddy, homework scanner, own dashboard
- **Parent** - Access to children's data, parent dashboard
- **Teacher** - Access to assigned students' data
- **Admin** - Broad access within institution

## Documentation Files

### Quick Reference

- **[MOBILE_API_QUICK_START.md](MOBILE_API_QUICK_START.md)** - Get started in 5 minutes
- **[MOBILE_API_README.md](MOBILE_API_README.md)** - This file, complete overview

### Detailed Guides

- **[MOBILE_API_TESTING_GUIDE.md](MOBILE_API_TESTING_GUIDE.md)** - Complete testing guide with examples
- **[MOBILE_API_IMPLEMENTATION_SUMMARY.md](MOBILE_API_IMPLEMENTATION_SUMMARY.md)** - Implementation details

### Test Scripts

- `tests/run_mobile_tests.sh` - Bash test runner (Linux/Mac)
- `tests/run_mobile_tests.ps1` - PowerShell test runner (Windows)
- `scripts/test_mobile_api.py` - Python test runner

## Support

### Troubleshooting

**Problem: 401 Unauthorized**
- Ensure you're including the Authorization header
- Check if token is expired
- Verify token format: `Bearer {access_token}`

**Problem: 403 Forbidden**
- User doesn't have required role/permissions
- Parent trying to access unlinked child's data
- Check user-resource relationship

**Problem: 404 Not Found**
- Resource doesn't exist
- Wrong ID in URL
- User doesn't have access to resource

**Problem: File Upload Failed**
- Ensure Content-Type is `multipart/form-data`
- Check file size limits
- Verify file type (images only for homework)

### Getting Help

1. **API Documentation**: http://localhost:8000/docs (Interactive Swagger UI)
2. **ReDoc**: http://localhost:8000/redoc (Alternative documentation)
3. **Test Examples**: Check test files for usage examples
4. **Error Messages**: Read error response `detail` field for specifics

### Useful Commands

```bash
# View API routes
uvicorn src.main:app --reload

# Run linter
poetry run ruff check src/

# Format code
poetry run black src/

# Type checking
poetry run mypy src/

# Database migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"
```

## API Response Formats

### Success Response

```json
{
  "id": 123,
  "field1": "value1",
  "field2": "value2",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

### Error Response

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Paginated Response

```json
{
  "items": [...],
  "total": 100,
  "skip": 0,
  "limit": 50
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default**: 100 requests per minute per user
- **Header**: `X-RateLimit-Remaining` shows remaining requests
- **Exceeded**: Returns 429 Too Many Requests

## Versioning

Current API version: **v1**

Base URL: `/api/v1/`

## Security

### Best Practices

- ✅ Always use HTTPS in production
- ✅ Store tokens securely (encrypted storage, not localStorage)
- ✅ Implement token refresh before expiration
- ✅ Handle 401 responses by redirecting to login
- ✅ Validate file uploads on client side
- ✅ Never log or expose access tokens

### Token Expiration

- **Access Token**: 30 minutes
- **Refresh Token**: 7 days

## Performance

### Optimization Tips

- Use pagination for list endpoints
- Cache frequently accessed data
- Implement offline support in mobile app
- Use WebSocket for real-time updates
- Compress images before upload

## Contributing

When adding new endpoints:

1. Create endpoint in `src/api/v1/`
2. Add schemas in `src/schemas/`
3. Implement service in `src/services/`
4. Add tests in `tests/`
5. Update documentation
6. Run linter and tests

## License

See main project LICENSE file.

---

**Quick Links:**

- 📖 [Testing Guide](MOBILE_API_TESTING_GUIDE.md)
- 🚀 [Quick Start](MOBILE_API_QUICK_START.md)
- 📝 [Implementation Summary](MOBILE_API_IMPLEMENTATION_SUMMARY.md)
- 🔧 [API Docs](http://localhost:8000/docs) (when server running)
