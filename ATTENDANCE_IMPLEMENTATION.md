# Attendance Management System Implementation

## Overview
This document describes the comprehensive attendance management system implementation with support for multiple statuses, subject-wise tracking, bulk operations, correction workflows, and detailed reporting.

## Database Schema

### Tables

#### 1. `attendances`
Main table for storing attendance records.

**Columns:**
- `id` (INTEGER, PK): Primary key
- `institution_id` (INTEGER, FK): Reference to institution
- `student_id` (INTEGER, FK): Reference to student
- `section_id` (INTEGER, FK, nullable): Reference to section
- `subject_id` (INTEGER, FK, nullable): Reference to subject (for subject-wise attendance)
- `date` (DATE): Date of attendance
- `status` (ENUM): Attendance status - `present`, `absent`, `late`, `half_day`
- `marked_by_id` (INTEGER, FK, nullable): User who marked the attendance
- `remarks` (TEXT, nullable): Additional notes
- `created_at` (DATETIME): Creation timestamp
- `updated_at` (DATETIME): Last update timestamp

**Constraints:**
- Unique constraint: `(student_id, date, subject_id)` - prevents duplicate attendance records
- Foreign keys with CASCADE/SET NULL delete rules

**Indexes:**
- `idx_attendance_institution` on `institution_id`
- `idx_attendance_student` on `student_id`
- `idx_attendance_section` on `section_id`
- `idx_attendance_subject` on `subject_id`
- `idx_attendance_date` on `date`
- `idx_attendance_status` on `status`
- `idx_attendance_student_date` on `(student_id, date)`
- `idx_attendance_section_date` on `(section_id, date)`

#### 2. `attendance_corrections`
Table for managing attendance correction requests and approvals.

**Columns:**
- `id` (INTEGER, PK): Primary key
- `institution_id` (INTEGER, FK): Reference to institution
- `attendance_id` (INTEGER, FK): Reference to attendance record
- `requested_by_id` (INTEGER, FK, nullable): User who requested correction
- `old_status` (ENUM): Original attendance status
- `new_status` (ENUM): Requested new status
- `reason` (TEXT): Reason for correction request
- `status` (ENUM): Correction status - `pending`, `approved`, `rejected`
- `reviewed_by_id` (INTEGER, FK, nullable): User who reviewed the correction
- `review_remarks` (TEXT, nullable): Reviewer's remarks
- `reviewed_at` (DATETIME, nullable): Review timestamp
- `created_at` (DATETIME): Creation timestamp
- `updated_at` (DATETIME): Last update timestamp

**Indexes:**
- `idx_correction_institution` on `institution_id`
- `idx_correction_attendance` on `attendance_id`
- `idx_correction_status` on `status`
- `idx_correction_created` on `created_at`

#### 3. `attendance_summaries`
Pre-calculated monthly summaries for performance optimization.

**Columns:**
- `id` (INTEGER, PK): Primary key
- `institution_id` (INTEGER, FK): Reference to institution
- `student_id` (INTEGER, FK): Reference to student
- `subject_id` (INTEGER, FK, nullable): Reference to subject
- `month` (INTEGER): Month (1-12)
- `year` (INTEGER): Year
- `total_days` (INTEGER): Total attendance days
- `present_days` (INTEGER): Number of present days
- `absent_days` (INTEGER): Number of absent days
- `late_days` (INTEGER): Number of late days
- `half_days` (INTEGER): Number of half days
- `attendance_percentage` (NUMERIC(5,2)): Calculated percentage
- `created_at` (DATETIME): Creation timestamp
- `updated_at` (DATETIME): Last update timestamp

**Constraints:**
- Unique constraint: `(student_id, year, month, subject_id)`

**Indexes:**
- `idx_summary_institution` on `institution_id`
- `idx_summary_student` on `student_id`
- `idx_summary_subject` on `subject_id`
- `idx_summary_year_month` on `(year, month)`
- `idx_summary_percentage` on `attendance_percentage`

## API Endpoints

### Attendance Management

#### Create Attendance
```
POST /api/v1/attendance/
```
Create a single attendance record.

**Request Body:**
```json
{
  "institution_id": 1,
  "student_id": 1,
  "date": "2024-01-15",
  "status": "present",
  "section_id": 1,
  "subject_id": 1,
  "remarks": "On time",
  "marked_by_id": 1
}
```

#### Bulk Mark Attendance
```
POST /api/v1/attendance/bulk
```
Mark attendance for multiple students at once.

**Request Body:**
```json
{
  "date": "2024-01-15",
  "section_id": 1,
  "subject_id": 1,
  "attendances": [
    {
      "student_id": 1,
      "status": "present",
      "remarks": null
    },
    {
      "student_id": 2,
      "status": "absent",
      "remarks": "Medical leave"
    }
  ]
}
```

**Response:**
```json
{
  "total": 2,
  "success": 2,
  "failed": 0,
  "errors": []
}
```

#### List Attendances
```
GET /api/v1/attendance/?start_date=2024-01-01&end_date=2024-01-31&section_id=1&subject_id=1
```
List attendance records with filters.

**Query Parameters:**
- `start_date` (optional): Filter by start date
- `end_date` (optional): Filter by end date
- `section_id` (optional): Filter by section
- `subject_id` (optional): Filter by subject
- `student_id` (optional): Filter by student
- `status` (optional): Filter by status
- `skip` (default: 0): Pagination offset
- `limit` (default: 100): Pagination limit

#### Get Attendance
```
GET /api/v1/attendance/{attendance_id}
```
Get a specific attendance record.

#### Update Attendance
```
PUT /api/v1/attendance/{attendance_id}
```
Update an attendance record.

**Request Body:**
```json
{
  "status": "late",
  "remarks": "Updated status"
}
```

#### Delete Attendance
```
DELETE /api/v1/attendance/{attendance_id}
```
Delete an attendance record.

### Correction Workflow

#### Request Correction
```
POST /api/v1/attendance/corrections
```
Request a correction for an attendance record.

**Request Body:**
```json
{
  "institution_id": 1,
  "attendance_id": 1,
  "new_status": "present",
  "reason": "Student was present but marked absent by mistake",
  "requested_by_id": 1
}
```

#### List Corrections
```
GET /api/v1/attendance/corrections?status=pending
```
List correction requests.

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)
- `skip` (default: 0): Pagination offset
- `limit` (default: 100): Pagination limit

#### Review Correction
```
PUT /api/v1/attendance/corrections/{correction_id}
```
Approve or reject a correction request.

**Request Body:**
```json
{
  "status": "approved",
  "review_remarks": "Correction approved"
}
```

### Reporting Endpoints

#### Get Section Report
```
GET /api/v1/attendance/reports/section/{section_id}?start_date=2024-01-01&end_date=2024-01-31
```
Get attendance report for all students in a section.

**Response:**
```json
[
  {
    "student_id": 1,
    "student_name": "John Doe",
    "admission_number": "2024001",
    "total_days": 20,
    "present_days": 18,
    "absent_days": 2,
    "late_days": 0,
    "half_days": 0,
    "attendance_percentage": 90.0
  }
]
```

#### Get Student Detailed Report
```
GET /api/v1/attendance/reports/student/{student_id}?start_date=2024-01-01&end_date=2024-01-31
```
Get detailed attendance report for a student with date-wise breakdown.

**Response:**
```json
{
  "student_id": 1,
  "student_name": "John Doe",
  "admission_number": "2024001",
  "attendances": [
    {
      "date": "2024-01-15",
      "status": "present",
      "subject_id": 1,
      "subject_name": "Mathematics",
      "marked_by_id": 1,
      "remarks": null
    }
  ],
  "total_days": 20,
  "present_days": 18,
  "absent_days": 2,
  "late_days": 0,
  "half_days": 0,
  "attendance_percentage": 90.0
}
```

#### Get Student Stats
```
GET /api/v1/attendance/reports/student/{student_id}/stats?start_date=2024-01-01&end_date=2024-01-31
```
Get attendance statistics for a student.

**Response:**
```json
{
  "total_days": 20,
  "present_days": 18,
  "absent_days": 2,
  "late_days": 0,
  "half_days": 0,
  "attendance_percentage": 90.0
}
```

#### Get Defaulters
```
GET /api/v1/attendance/reports/defaulters?start_date=2024-01-01&end_date=2024-01-31&threshold_percentage=75
```
Get list of students with attendance below threshold.

**Query Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date
- `threshold_percentage` (default: 75.0): Percentage threshold
- `section_id` (optional): Filter by section
- `subject_id` (optional): Filter by subject

**Response:**
```json
[
  {
    "student_id": 5,
    "student_name": "Jane Smith",
    "admission_number": "2024005",
    "section_name": "Class 10-A",
    "total_days": 20,
    "present_days": 12,
    "absent_days": 8,
    "attendance_percentage": 60.0
  }
]
```

#### Get Subject-wise Report
```
GET /api/v1/attendance/reports/subjects?start_date=2024-01-01&end_date=2024-01-31
```
Get attendance statistics by subject.

**Response:**
```json
[
  {
    "subject_id": 1,
    "subject_name": "Mathematics",
    "total_days": 400,
    "present_days": 360,
    "absent_days": 40,
    "late_days": 0,
    "half_days": 0,
    "attendance_percentage": 90.0
  }
]
```

#### Get Student Summaries
```
GET /api/v1/attendance/summaries/student/{student_id}?year=2024&subject_id=1
```
Get pre-calculated monthly summaries for a student.

**Query Parameters:**
- `year` (optional): Filter by year
- `subject_id` (optional): Filter by subject

## Features

### 1. Multiple Attendance Statuses
- **Present**: Student was present for the full period
- **Absent**: Student was absent
- **Late**: Student arrived late
- **Half Day**: Student was present for half the period

### 2. Subject-wise Tracking
- Track attendance separately for each subject
- Support for both general and subject-specific attendance
- Subject-wise reports and analytics

### 3. Bulk Operations
- Mark attendance for entire sections at once
- Efficient batch processing
- Error handling with detailed feedback

### 4. Correction Workflow
- Request corrections for mistakenly marked attendance
- Approval workflow with review comments
- Track correction history and audit trail

### 5. Attendance Percentage Calculation
- Automatic calculation considering:
  - Present = 1 full day
  - Late = 0.5 days
  - Half Day = 0.5 days
  - Absent = 0 days
- Formula: `(present + late*0.5 + half_day*0.5) / total * 100`

### 6. Defaulter Identification
- Configurable threshold percentage
- Automatic identification of students below threshold
- Filter by section or subject
- Sorted by attendance percentage (lowest first)

### 7. Comprehensive Reporting
- Section-wise reports
- Student-wise detailed reports
- Subject-wise analytics
- Date range filtering
- Monthly summaries

### 8. Performance Optimization
- Pre-calculated monthly summaries
- Efficient database indexes
- Batch operations support
- Optimized queries with proper joins

## Repository Layer

### AttendanceRepository
- `create()`: Create single attendance record
- `create_bulk()`: Create multiple records
- `get_by_id()`: Get attendance by ID
- `get_by_student_date_subject()`: Check existing attendance
- `list_by_institution()`: List with filters
- `count_by_institution()`: Count with filters
- `update()`: Update attendance
- `delete()`: Delete attendance
- `get_student_attendance_stats()`: Calculate statistics
- `get_section_attendance_report()`: Section report
- `get_defaulters()`: Identify defaulters
- `get_subject_wise_stats()`: Subject analytics

### AttendanceCorrectionRepository
- `create()`: Create correction request
- `get_by_id()`: Get correction by ID
- `list_by_institution()`: List corrections
- `count_by_institution()`: Count corrections
- `update()`: Update correction status

### AttendanceSummaryRepository
- `create()`: Create summary
- `get_by_student_month_subject()`: Get specific summary
- `list_by_student()`: List student summaries
- `update()`: Update summary
- `upsert_summary()`: Create or update summary

## Service Layer

### AttendanceService
- `create_attendance()`: Create with validation
- `bulk_mark_attendance()`: Bulk operations
- `update_attendance()`: Update with summary refresh
- `delete_attendance()`: Delete with summary recalculation
- `request_correction()`: Create correction request
- `review_correction()`: Approve/reject correction
- `list_corrections()`: List with filters
- `get_student_attendance_stats()`: Statistics calculation
- `get_section_report()`: Section analytics
- `get_defaulters()`: Defaulter identification
- `get_subject_wise_report()`: Subject analytics
- `get_student_detailed_report()`: Detailed student report
- `get_student_summaries()`: Get monthly summaries
- `_update_summary()`: Internal summary update
- `_recalculate_summary()`: Internal summary recalculation

## Migration

The migration file `007_create_attendance_tables.py` creates:
- `attendances` table with all indexes and constraints
- `attendance_corrections` table
- `attendance_summaries` table
- Required ENUM types: `attendancestatus`, `correctionstatus`

To apply the migration:
```bash
alembic upgrade head
```

To rollback:
```bash
alembic downgrade -1
```

## Usage Examples

### Mark Attendance for a Class
```python
# Bulk mark attendance for section
bulk_data = BulkAttendanceCreate(
    date=date(2024, 1, 15),
    section_id=1,
    subject_id=1,
    attendances=[
        BulkAttendanceItem(student_id=1, status=AttendanceStatus.PRESENT),
        BulkAttendanceItem(student_id=2, status=AttendanceStatus.ABSENT, remarks="Sick"),
        BulkAttendanceItem(student_id=3, status=AttendanceStatus.LATE),
    ]
)
result = service.bulk_mark_attendance(institution_id=1, data=bulk_data)
```

### Request and Approve Correction
```python
# Request correction
correction_data = AttendanceCorrectionCreate(
    institution_id=1,
    attendance_id=1,
    new_status=AttendanceStatus.PRESENT,
    reason="Student was actually present",
    requested_by_id=2
)
correction = service.request_correction(correction_data)

# Approve correction
review_data = AttendanceCorrectionReview(
    status=CorrectionStatus.APPROVED,
    review_remarks="Verified and approved"
)
service.review_correction(correction.id, review_data, reviewed_by_id=1)
```

### Get Defaulters Report
```python
defaulters = service.get_defaulters(
    institution_id=1,
    start_date=date(2024, 1, 1),
    end_date=date(2024, 1, 31),
    threshold_percentage=75.0,
    section_id=1
)
```

## Security and Authorization
- All endpoints require authentication
- Institution-level isolation enforced
- Users can only access attendance for their institution
- Correction workflow supports role-based access control

## Performance Considerations
- Monthly summaries reduce query complexity
- Composite indexes optimize common queries
- Batch operations for bulk marking
- Efficient date range queries
- Proper use of database constraints

## Best Practices
1. Always mark attendance consistently (daily or per subject)
2. Use bulk operations for marking entire sections
3. Review correction requests promptly
4. Monitor defaulters regularly
5. Generate reports at regular intervals
6. Archive old attendance data periodically
