from datetime import datetime
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from src.models.homework_scanner import MistakeType


class HomeworkFeedbackBase(BaseModel):
    question_number: int
    student_answer: Optional[str] = None
    correct_answer: Optional[str] = None
    is_correct: bool
    mistake_type: Optional[MistakeType] = None
    ai_feedback: Optional[str] = None
    remedial_content_url: Optional[str] = None


class HomeworkFeedbackCreate(HomeworkFeedbackBase):
    scan_id: int


class HomeworkFeedbackResponse(HomeworkFeedbackBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    scan_id: int
    created_at: datetime


class HomeworkScanBase(BaseModel):
    student_id: int
    subject_id: int
    scan_image_urls: List[str]
    ocr_text: Optional[str] = None
    processed_results: Optional[Dict[str, Any]] = None
    total_score: Optional[Decimal] = None


class HomeworkScanCreate(BaseModel):
    student_id: int
    subject_id: int


class HomeworkScanUpdate(BaseModel):
    ocr_text: Optional[str] = None
    processed_results: Optional[Dict[str, Any]] = None
    total_score: Optional[Decimal] = None


class HomeworkScanResponse(HomeworkScanBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    scan_date: datetime
    created_at: datetime
    updated_at: datetime


class HomeworkScanWithFeedbackResponse(HomeworkScanResponse):
    feedbacks: List[HomeworkFeedbackResponse] = []


class ImageUploadResponse(BaseModel):
    image_url: str
    s3_key: str


class ScanProcessRequest(BaseModel):
    scan_id: int
    answer_key: Dict[str, str]


class ScanProcessResponse(BaseModel):
    scan_id: int
    total_score: Decimal
    processed_results: Dict[str, Any]
    feedbacks: List[HomeworkFeedbackResponse]


class MistakePatternResponse(BaseModel):
    mistake_type: MistakeType
    count: int
    percentage: float


class TeacherNotificationRequest(BaseModel):
    scan_id: int
    teacher_id: int
    message: Optional[str] = None
