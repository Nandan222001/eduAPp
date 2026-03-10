from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from src.models.attendance import AttendanceStatus, CorrectionStatus


class AttendanceBase(BaseModel):
    student_id: int
    date: date
    status: AttendanceStatus
    section_id: Optional[int] = None
    subject_id: Optional[int] = None
    remarks: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    institution_id: int
    marked_by_id: Optional[int] = None


class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    remarks: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    marked_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class BulkAttendanceItem(BaseModel):
    student_id: int
    status: AttendanceStatus
    remarks: Optional[str] = None


class BulkAttendanceCreate(BaseModel):
    date: date
    section_id: Optional[int] = None
    subject_id: Optional[int] = None
    attendances: List[BulkAttendanceItem]


class BulkAttendanceResult(BaseModel):
    total: int
    success: int
    failed: int
    errors: List[dict] = []


class AttendanceCorrectionBase(BaseModel):
    attendance_id: int
    new_status: AttendanceStatus
    reason: str


class AttendanceCorrectionCreate(AttendanceCorrectionBase):
    institution_id: int
    requested_by_id: Optional[int] = None


class AttendanceCorrectionReview(BaseModel):
    status: CorrectionStatus
    review_remarks: Optional[str] = None


class AttendanceCorrectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    attendance_id: int
    requested_by_id: Optional[int] = None
    old_status: AttendanceStatus
    new_status: AttendanceStatus
    reason: str
    status: CorrectionStatus
    reviewed_by_id: Optional[int] = None
    review_remarks: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class AttendanceSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    subject_id: Optional[int] = None
    month: int
    year: int
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    half_days: int
    attendance_percentage: float
    created_at: datetime
    updated_at: datetime


class StudentAttendanceReport(BaseModel):
    student_id: int
    student_name: str
    admission_number: Optional[str] = None
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    half_days: int
    attendance_percentage: float


class SubjectAttendanceReport(BaseModel):
    subject_id: int
    subject_name: str
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    half_days: int
    attendance_percentage: float


class AttendanceDefaulter(BaseModel):
    student_id: int
    student_name: str
    admission_number: Optional[str] = None
    section_name: Optional[str] = None
    total_days: int
    present_days: int
    absent_days: int
    attendance_percentage: float


class AttendanceReportFilters(BaseModel):
    start_date: date
    end_date: date
    section_id: Optional[int] = None
    subject_id: Optional[int] = None
    student_id: Optional[int] = None
    status: Optional[AttendanceStatus] = None


class DateRangeAttendance(BaseModel):
    date: date
    status: AttendanceStatus
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    marked_by_id: Optional[int] = None
    remarks: Optional[str] = None


class StudentAttendanceDetail(BaseModel):
    student_id: int
    student_name: str
    admission_number: Optional[str] = None
    attendances: List[DateRangeAttendance]
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    half_days: int
    attendance_percentage: float
