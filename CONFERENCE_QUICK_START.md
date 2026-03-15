# Parent-Teacher Conference System - Quick Start Guide

## Setup

### 1. Run Database Migration

```bash
alembic upgrade head
```

This creates the necessary conference tables.

### 2. Configure API Keys (Optional)

Add to your `.env` file:

```env
# Zoom Configuration
ZOOM_API_KEY=your_zoom_api_key
ZOOM_API_SECRET=your_zoom_api_secret

# Google Meet Configuration (future)
GOOGLE_MEET_CREDENTIALS=your_credentials_json
```

**Note**: The system works without API keys using a fallback meeting link generator.

### 3. Start Celery Worker & Beat

```bash
# Start worker
celery -A src.celery_app worker --loglevel=info

# Start beat scheduler (in separate terminal)
celery -A beat.celery_app beat --loglevel=info
```

## Basic Workflows

### For Teachers

#### Create Individual Slot
```bash
POST /api/v1/conferences/slots
{
  "institution_id": 1,
  "teacher_id": 10,
  "date": "2024-02-15",
  "time_slot": "14:00:00",
  "duration_minutes": 30,
  "location": "virtual",
  "max_bookings": 1
}
```

#### Create Bulk Slots (Recommended)
```bash
POST /api/v1/conferences/slots/bulk
{
  "institution_id": 1,
  "teacher_id": 10,
  "date_from": "2024-02-15",
  "date_to": "2024-02-20",
  "time_slots": ["09:00:00", "10:00:00", "11:00:00", "14:00:00", "15:00:00"],
  "duration_minutes": 30,
  "location": "virtual",
  "skip_weekends": true
}
```

#### View Your Slots
```bash
GET /api/v1/conferences/slots?teacher_id=10
```

### For Parents

#### Browse Available Slots
```bash
GET /api/v1/conferences/slots/available?date_from=2024-02-15&date_to=2024-02-28&teacher_id=10
```

#### Book a Slot
```bash
POST /api/v1/conferences/bookings
{
  "institution_id": 1,
  "slot_id": 100,
  "parent_id": 5,
  "student_id": 50,
  "conference_type": "routine_update",
  "parent_topics": ["Academic Progress", "Homework Help"],
  "parent_notes": "I'd like to discuss John's math performance"
}
```

#### View My Bookings
```bash
GET /api/v1/conferences/bookings/my
```

### Conference Management

#### Check-in to Conference
```bash
POST /api/v1/conferences/bookings/123/check-in
```

#### Mark Conference Complete
```bash
POST /api/v1/conferences/bookings/123/complete
```

#### Upload Recording
```bash
POST /api/v1/conferences/bookings/123/recording
{
  "booking_id": 123,
  "recording_url": "https://s3.amazonaws.com/recordings/meeting-123.mp4",
  "recording_s3_key": "recordings/meeting-123.mp4"
}
```

### Surveys

#### Submit Survey
```bash
POST /api/v1/conferences/bookings/123/survey
{
  "booking_id": 123,
  "respondent_type": "parent",
  "rating": 5,
  "feedback": "Great meeting, very informative!",
  "communication_rating": 5,
  "helpfulness_rating": 5,
  "would_recommend": true
}
```

## Conference Types

- `routine_update` - Regular parent-teacher check-in
- `concern_discussion` - Specific concerns or issues
- `IEP_meeting` - Individualized Education Program meeting
- `academic_progress` - Academic performance review
- `behavioral_concern` - Behavioral discussion

## Location Types

- `in_person` - Physical meeting at school
- `virtual` - Online video conference
- `hybrid` - Option for both in-person and virtual

## Duration Options

Valid durations (in minutes):
- 15
- 30
- 45
- 60
- 90
- 120

## Automated Features

### Reminders
- **24 hours before**: Email reminder sent automatically
- **1 hour before**: Push notification sent automatically

### Auto-complete
- Conferences automatically marked complete after scheduled time

### Survey Requests
- Sent 1-2 hours after conference completion

## Analytics

### Institution Statistics
```bash
GET /api/v1/conferences/statistics?date_from=2024-01-01&date_to=2024-12-31
```

Returns:
- Total slots created
- Available vs booked slots
- Completed conferences
- Cancellation rates
- Average ratings

### Teacher Statistics
```bash
GET /api/v1/conferences/statistics/teacher/10
```

Returns:
- Total slots created
- Total bookings
- Completion rate
- Average rating
- Total hours of conferences

## Troubleshooting

### Video Meeting Not Created

If `video_meeting_link` is null or shows fallback URL:
1. Check Zoom API credentials in `.env`
2. Verify API key has meeting creation permissions
3. Check celery logs for errors
4. System will use fallback links if API unavailable

### Reminders Not Sending

1. Ensure Celery beat is running
2. Check that bookings are in "confirmed" status
3. Verify notification service is configured
4. Check celery logs for errors

### Cannot Book Slot

Common reasons:
- Slot already fully booked (`current_bookings >= max_bookings`)
- Slot is cancelled
- Slot is in the past
- Permission issues

## Next Steps

1. **Configure Notifications**: Set up SendGrid/MSG91 for email/SMS
2. **Customize Templates**: Create notification templates for reminders
3. **Set Business Rules**: Define booking windows, cancellation policies
4. **Train Users**: Provide guides for teachers and parents
5. **Monitor Usage**: Use analytics to track adoption

## API Documentation

Full API documentation available at:
```
http://localhost:8000/docs
```

Filter by tag "conferences" to see all conference endpoints.
