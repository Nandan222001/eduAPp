# Mobile API Testing Quick Start

This guide helps you quickly run and verify the mobile API endpoints.

## Prerequisites

1. **Python 3.11+** installed
2. **Poetry** installed: `pip install poetry`
3. **Dependencies** installed: `poetry install`

## Quick Test Execution

### Option 1: Using Test Scripts (Recommended)

#### On Linux/Mac:
```bash
# Make the script executable
chmod +x tests/run_mobile_tests.sh

# Run all tests
./tests/run_mobile_tests.sh all

# Run specific test suites
./tests/run_mobile_tests.sh devices
./tests/run_mobile_tests.sh study-buddy
./tests/run_mobile_tests.sh parent

# Run with coverage
./tests/run_mobile_tests.sh coverage
```

#### On Windows (PowerShell):
```powershell
# Run all tests
.\tests\run_mobile_tests.ps1 all

# Run specific test suites
.\tests\run_mobile_tests.ps1 devices
.\tests\run_mobile_tests.ps1 study-buddy
.\tests\run_mobile_tests.ps1 parent

# Run with coverage
.\tests\run_mobile_tests.ps1 coverage
```

### Option 2: Using pytest Directly

```bash
# Run all mobile API tests
poetry run pytest tests/test_mobile_api_integration.py -v

# Run parent multi-child tests
poetry run pytest tests/test_parent_multi_child.py -v

# Run specific test class
poetry run pytest tests/test_mobile_api_integration.py::TestStudyBuddyAPI -v

# Run with coverage
poetry run pytest tests/test_mobile_api_integration.py --cov=src/api/v1 --cov-report=html
```

### Option 3: Using Python Script

```bash
# Run all tests
python scripts/test_mobile_api.py all

# Run specific suites
python scripts/test_mobile_api.py devices --coverage
python scripts/test_mobile_api.py study-buddy
python scripts/test_mobile_api.py parent
```

## Expected Output

When all tests pass, you should see:

```
tests/test_mobile_api_integration.py::TestNotificationDeviceRegistrationAPI::test_register_device_success PASSED
tests/test_mobile_api_integration.py::TestNotificationDeviceRegistrationAPI::test_register_device_duplicate_token PASSED
tests/test_mobile_api_integration.py::TestNotificationDeviceRegistrationAPI::test_unregister_device PASSED
...
===================== XX passed in X.XXs =====================
```

## Test Coverage Summary

The test suite covers:

✅ **Device Registration** (6 tests)
- Register device
- Duplicate token handling
- Unregister device
- Subscribe to topics
- Unsubscribe from topics
- Get user devices

✅ **Study Buddy** (6 tests)
- Create session
- Get sessions
- Chat with AI
- End session
- Analyze patterns
- Generate daily plan

✅ **Homework Scanner** (3 tests)
- Upload homework
- Get scans
- Validate file types

✅ **Authentication** (2 tests)
- Login
- Get current user

✅ **Student Dashboard** (2 tests)
- Get dashboard data
- Get profile

✅ **Parent Multi-Child** (6 tests)
- Multiple children support
- Dashboard filtering
- Child-specific data
- Authorization checks

**Total: 25+ integration tests**

## API Endpoints Verified

### 1. Notifications & Devices
- `POST /api/v1/notifications/register-device`
- `DELETE /api/v1/notifications/register-device/{token}`
- `POST /api/v1/notifications/subscribe`
- `POST /api/v1/notifications/unsubscribe`
- `GET /api/v1/notifications/devices`

### 2. Study Buddy
- `POST /api/v1/study-buddy/sessions`
- `GET /api/v1/study-buddy/sessions`
- `POST /api/v1/study-buddy/chat`
- `GET /api/v1/study-buddy/analyze-patterns/{student_id}`
- `GET /api/v1/study-buddy/daily-plan/{student_id}`

### 3. Homework Scanner
- `POST /api/v1/homework-scanner/scans`
- `GET /api/v1/homework-scanner/scans`
- `GET /api/v1/homework-scanner/scans/{id}`

### 4. Authentication
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### 5. Student Dashboard
- `GET /api/v1/students/{id}/dashboard`
- `GET /api/v1/students/{id}/profile`

### 6. Parent Multi-Child
- `GET /api/v1/parents/dashboard`
- `GET /api/v1/parents/children`
- `GET /api/v1/parents/children/{id}/overview`
- `GET /api/v1/parents/children/{id}/attendance/today`
- `GET /api/v1/parents/children/{id}/grades/recent`
- `GET /api/v1/parents/children/{id}/assignments/pending`

## Manual Testing with curl

### 1. Login and Get Token

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@testschool.com",
    "password": "password123",
    "institution_id": 1
  }'
```

Save the `access_token` from the response.

### 2. Register Device

```bash
curl -X POST "http://localhost:8000/api/v1/notifications/register-device" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
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

### 3. Chat with Study Buddy

```bash
curl -X POST "http://localhost:8000/api/v1/study-buddy/chat" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me understand quadratic equations",
    "context": {"subject": "mathematics"}
  }'
```

### 4. Get Parent's Children

```bash
curl -X GET "http://localhost:8000/api/v1/parents/children" \
  -H "Authorization: Bearer YOUR_PARENT_ACCESS_TOKEN"
```

## Troubleshooting

### Tests Fail with 401 Unauthorized
- **Cause**: Token expired or invalid
- **Solution**: Tests automatically create tokens; check fixture setup

### Tests Fail with 404 Not Found
- **Cause**: Database not properly initialized
- **Solution**: Tests use in-memory SQLite; fixtures auto-create data

### Tests Fail on File Upload
- **Cause**: Missing file processing dependencies
- **Solution**: Some tests may fail without OCR service; this is expected

### Import Errors
- **Cause**: Missing dependencies
- **Solution**: Run `poetry install` to install all dependencies

## Next Steps

1. ✅ **Run Tests**: Execute the test suite to verify all endpoints
2. 📖 **Read Guide**: See `MOBILE_API_TESTING_GUIDE.md` for detailed info
3. 🔍 **Review Code**: Check implementation in `src/api/v1/` directory
4. 🚀 **Start Server**: Run `uvicorn src.main:app --reload` for manual testing
5. 📱 **Integrate**: Connect your mobile app to the tested endpoints

## Additional Resources

- **Full Testing Guide**: `MOBILE_API_TESTING_GUIDE.md`
- **Implementation Summary**: `MOBILE_API_IMPLEMENTATION_SUMMARY.md`
- **API Documentation**: http://localhost:8000/docs (when server running)
- **Test Code**: `tests/test_mobile_api_integration.py`

## Support

For issues or questions:
1. Check test output for detailed error messages
2. Review the testing guide for common issues
3. Verify all prerequisites are installed
4. Ensure database migrations are up to date

---

**Quick Commands Reference:**

```bash
# Run all tests
poetry run pytest tests/test_mobile_api_integration.py -v

# Run with coverage
poetry run pytest tests/test_mobile_api_integration.py --cov=src/api/v1

# Run specific test
poetry run pytest tests/test_mobile_api_integration.py::TestStudyBuddyAPI::test_chat_with_study_buddy -v

# Start dev server
uvicorn src.main:app --reload

# View API docs
# Open browser to http://localhost:8000/docs
```
