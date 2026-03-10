from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date


class PerformanceSummaryRequest(BaseModel):
    institution_id: int
    student_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class BatchPerformanceRequest(BaseModel):
    institution_id: int
    student_ids: List[int]
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class AtRiskStudentsRequest(BaseModel):
    institution_id: int
    attendance_threshold: float = Field(default=75.0, ge=0, le=100)
    assignment_threshold: float = Field(default=60.0, ge=0, le=100)
    exam_threshold: float = Field(default=50.0, ge=0, le=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SubjectDifficultyRequest(BaseModel):
    institution_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class TrainingDataRequest(BaseModel):
    institution_id: int
    target_column: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    test_size: float = Field(default=0.2, ge=0.1, le=0.5)
    val_size: float = Field(default=0.1, ge=0.0, le=0.3)
    normalize: bool = True
    normalization_method: str = Field(default='standard')
    handle_missing: bool = True
    missing_strategy: str = Field(default='mean')
    random_state: int = Field(default=42)


class SubjectWiseAttendance(BaseModel):
    student_id: int
    subject_id: int
    subject_attendance_percentage: float


class SubjectWiseAssignment(BaseModel):
    student_id: int
    subject_id: int
    subject_avg_assignment_score: float


class SubjectWiseExam(BaseModel):
    student_id: int
    subject_id: int
    subject_avg_exam_score: float


class ChapterWisePerformance(BaseModel):
    student_id: int
    subject_id: int
    chapter_id: int
    chapter_avg_score: float


class AssignmentStats(BaseModel):
    avg_assignment_score: float
    assignment_submission_rate: float
    late_submission_rate: float
    assignment_count: int


class ExamStats(BaseModel):
    avg_exam_score: float
    exam_count: int
    exams_passed: int
    exam_pass_rate: float


class ExamTrends(BaseModel):
    exam_trend_slope: float
    recent_exam_avg: float


class PerformanceSummaryResponse(BaseModel):
    student_id: int
    attendance_percentage: Optional[float] = None
    subject_wise_attendance: Optional[List[SubjectWiseAttendance]] = []
    assignment_stats: Optional[AssignmentStats] = None
    subject_wise_assignments: Optional[List[SubjectWiseAssignment]] = []
    chapter_wise_performance: Optional[List[ChapterWisePerformance]] = []
    exam_stats: Optional[ExamStats] = None
    exam_trends: Optional[ExamTrends] = None
    subject_wise_exams: Optional[List[SubjectWiseExam]] = []


class AtRiskStudent(BaseModel):
    student_id: int
    risk_score: int
    risk_factors: List[str]
    attendance_percentage: float
    avg_assignment_score: float
    avg_exam_score: float
    exam_trend_slope: float


class AtRiskStudentsResponse(BaseModel):
    students: List[AtRiskStudent]
    total_count: int


class SubjectDifficulty(BaseModel):
    subject_id: int
    avg_assignment_score: Optional[float] = None
    avg_exam_score: Optional[float] = None
    difficulty_level: str


class SubjectDifficultyResponse(BaseModel):
    subjects: List[SubjectDifficulty]
    total_count: int


class DataQualityReport(BaseModel):
    total_rows: int
    total_columns: int
    missing_values: Dict[str, int]
    missing_percentage: Dict[str, float]
    duplicate_rows: int
    numeric_columns: List[str]
    categorical_columns: List[str]


class TrainingDataResponse(BaseModel):
    train_size: int
    test_size: int
    val_size: Optional[int] = None
    feature_count: int
    feature_names: List[str]
    quality_report: DataQualityReport
    message: str


class FeatureMatrixRequest(BaseModel):
    institution_id: int
    student_ids: Optional[List[int]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class FeatureMatrixResponse(BaseModel):
    features: List[Dict[str, Any]]
    feature_names: List[str]
    student_count: int
