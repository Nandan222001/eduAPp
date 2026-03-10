from datetime import datetime, date, time
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, field_validator
from src.models.examination import ExamType, ExamStatus


class ExamBase(BaseModel):
    name: str = Field(..., max_length=200)
    exam_type: ExamType
    description: Optional[str] = None
    start_date: date
    end_date: date
    total_marks: Optional[Decimal] = None
    passing_marks: Optional[Decimal] = None
    
    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class ExamCreate(ExamBase):
    institution_id: int
    academic_year_id: int
    grade_id: int


class ExamUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    exam_type: Optional[ExamType] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[ExamStatus] = None
    total_marks: Optional[Decimal] = None
    passing_marks: Optional[Decimal] = None
    is_published: Optional[bool] = None


class ExamResponse(ExamBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    academic_year_id: int
    grade_id: int
    status: ExamStatus
    is_published: bool
    created_at: datetime
    updated_at: datetime


class ExamSubjectBase(BaseModel):
    subject_id: int
    theory_max_marks: Decimal = Field(..., ge=0)
    practical_max_marks: Decimal = Field(default=0, ge=0)
    theory_passing_marks: Optional[Decimal] = Field(None, ge=0)
    practical_passing_marks: Optional[Decimal] = Field(None, ge=0)
    weightage: Optional[Decimal] = Field(None, ge=0, le=100)


class ExamSubjectCreate(ExamSubjectBase):
    institution_id: int
    exam_id: int


class ExamSubjectUpdate(BaseModel):
    theory_max_marks: Optional[Decimal] = Field(None, ge=0)
    practical_max_marks: Optional[Decimal] = Field(None, ge=0)
    theory_passing_marks: Optional[Decimal] = Field(None, ge=0)
    practical_passing_marks: Optional[Decimal] = Field(None, ge=0)
    weightage: Optional[Decimal] = Field(None, ge=0, le=100)
    question_paper_path: Optional[str] = None


class ExamSubjectResponse(ExamSubjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    exam_id: int
    question_paper_path: Optional[str] = None
    question_paper_uploaded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class QuestionPaperUpload(BaseModel):
    file_path: str


class ExamScheduleBase(BaseModel):
    subject_id: int
    section_id: Optional[int] = None
    exam_date: date
    start_time: time
    end_time: time
    room_number: Optional[str] = Field(None, max_length=100)
    invigilator_id: Optional[int] = None
    instructions: Optional[str] = None
    
    @field_validator('end_time')
    @classmethod
    def validate_times(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


class ExamScheduleCreate(ExamScheduleBase):
    institution_id: int
    exam_id: int


class ExamScheduleUpdate(BaseModel):
    subject_id: Optional[int] = None
    section_id: Optional[int] = None
    exam_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room_number: Optional[str] = Field(None, max_length=100)
    invigilator_id: Optional[int] = None
    instructions: Optional[str] = None


class ExamScheduleResponse(ExamScheduleBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    exam_id: int
    created_at: datetime
    updated_at: datetime


class TimetableConflict(BaseModel):
    schedule_id: int
    conflict_type: str
    conflicting_schedule_id: Optional[int] = None
    message: str


class ExamMarksBase(BaseModel):
    theory_marks_obtained: Optional[Decimal] = Field(None, ge=0)
    practical_marks_obtained: Optional[Decimal] = Field(None, ge=0)
    is_absent: bool = False
    remarks: Optional[str] = None


class ExamMarksCreate(ExamMarksBase):
    institution_id: int
    exam_subject_id: int
    student_id: int


class ExamMarksUpdate(ExamMarksBase):
    pass


class ExamMarksEntry(BaseModel):
    student_id: int
    theory_marks_obtained: Optional[Decimal] = Field(None, ge=0)
    practical_marks_obtained: Optional[Decimal] = Field(None, ge=0)
    is_absent: bool = False
    remarks: Optional[str] = None


class ExamMarksBulkEntry(BaseModel):
    exam_subject_id: int
    marks_entries: List[ExamMarksEntry]


class ExamMarksResponse(ExamMarksBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    exam_subject_id: int
    student_id: int
    entered_by: Optional[int] = None
    entered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ExamResultBase(BaseModel):
    total_marks_obtained: Decimal
    total_max_marks: Decimal
    percentage: Decimal
    grade: Optional[str] = None
    grade_point: Optional[Decimal] = None
    is_pass: bool
    subjects_passed: int = 0
    subjects_failed: int = 0
    remarks: Optional[str] = None


class ExamResultResponse(ExamResultBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    exam_id: int
    student_id: int
    section_id: Optional[int] = None
    rank_in_section: Optional[int] = None
    rank_in_grade: Optional[int] = None
    generated_at: datetime
    created_at: datetime
    updated_at: datetime


class StudentExamResult(BaseModel):
    student_id: int
    student_name: str
    roll_number: Optional[str] = None
    section_name: Optional[str] = None
    subject_results: List[dict]
    total_marks_obtained: Decimal
    total_max_marks: Decimal
    percentage: Decimal
    grade: Optional[str] = None
    grade_point: Optional[Decimal] = None
    is_pass: bool
    rank_in_section: Optional[int] = None
    rank_in_grade: Optional[int] = None


class GradeConfigurationBase(BaseModel):
    name: str = Field(..., max_length=100)
    grade: str = Field(..., max_length=10)
    min_percentage: Decimal = Field(..., ge=0, le=100)
    max_percentage: Decimal = Field(..., ge=0, le=100)
    grade_point: Decimal = Field(..., ge=0)
    description: Optional[str] = None
    is_passing: bool = True
    
    @field_validator('max_percentage')
    @classmethod
    def validate_percentages(cls, v, info):
        if 'min_percentage' in info.data and v < info.data['min_percentage']:
            raise ValueError('max_percentage must be greater than min_percentage')
        return v


class GradeConfigurationCreate(GradeConfigurationBase):
    institution_id: int


class GradeConfigurationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    grade: Optional[str] = Field(None, max_length=10)
    min_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    max_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    grade_point: Optional[Decimal] = Field(None, ge=0)
    description: Optional[str] = None
    is_passing: Optional[bool] = None
    is_active: Optional[bool] = None


class GradeConfigurationResponse(GradeConfigurationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ExamPerformanceAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    exam_id: int
    section_id: Optional[int] = None
    subject_id: Optional[int] = None
    total_students: int
    students_appeared: int
    students_passed: int
    students_failed: int
    pass_percentage: Decimal
    average_marks: Decimal
    highest_marks: Decimal
    lowest_marks: Decimal
    median_marks: Optional[Decimal] = None
    standard_deviation: Optional[Decimal] = None
    generated_at: datetime
    created_at: datetime
    updated_at: datetime


class PerformanceComparisonRequest(BaseModel):
    exam_ids: List[int]
    section_id: Optional[int] = None
    subject_id: Optional[int] = None


class PerformanceComparison(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: str
    analytics: ExamPerformanceAnalyticsResponse


class PerformanceComparisonResponse(BaseModel):
    comparisons: List[PerformanceComparison]
    trend_analysis: Optional[dict] = None


class ExamWithSubjectsResponse(ExamResponse):
    exam_subjects: List[ExamSubjectResponse] = []


class ExamWithSchedulesResponse(ExamResponse):
    exam_schedules: List[ExamScheduleResponse] = []


class ExamDetailResponse(ExamResponse):
    exam_subjects: List[ExamSubjectResponse] = []
    exam_schedules: List[ExamScheduleResponse] = []
