from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, validator
from src.models.peer_recognition import RecognitionType


class PeerRecognitionBase(BaseModel):
    to_student_id: int
    recognition_type: RecognitionType
    message: str = Field(..., min_length=1, max_length=500)
    is_public: bool = True


class PeerRecognitionCreate(PeerRecognitionBase):
    @validator('message')
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()


class PeerRecognitionResponse(BaseModel):
    id: int
    institution_id: int
    from_student_id: int
    to_student_id: int
    recognition_type: RecognitionType
    message: str
    is_public: bool
    likes_count: int
    created_date: date
    created_at: datetime
    updated_at: datetime
    from_student_name: Optional[str] = None
    to_student_name: Optional[str] = None
    is_liked_by_current_user: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class PeerRecognitionWithStudents(PeerRecognitionResponse):
    from_student: Optional[Dict[str, Any]] = None
    to_student: Optional[Dict[str, Any]] = None


class RecognitionLikeResponse(BaseModel):
    id: int
    recognition_id: int
    student_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecognitionBadgeResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    recognition_type: RecognitionType
    badge_level: str
    recognitions_count: int
    points_awarded: int
    earned_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyRecognitionLimitResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    limit_date: date
    recognitions_sent: int
    max_daily_limit: int
    remaining: int

    model_config = ConfigDict(from_attributes=True)


class AppreciationWallResponse(BaseModel):
    recognitions: List[PeerRecognitionWithStudents]
    total_count: int
    page: int
    page_size: int
    has_more: bool


class TrendingRecognitionResponse(BaseModel):
    recognition: PeerRecognitionWithStudents
    trending_score: float


class RecognitionAnalyticsResponse(BaseModel):
    institution_id: int
    analytics_date: date
    total_recognitions: int
    unique_givers: int
    unique_receivers: int
    total_likes: int
    positivity_index: int
    most_recognized_student_id: Optional[int] = None
    most_recognized_count: int
    most_recognized_student_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PositivityIndexResponse(BaseModel):
    institution_id: int
    period: str
    current_index: int
    previous_index: Optional[int] = None
    change_percentage: Optional[float] = None
    trend: str
    total_recognitions: int
    unique_participants: int
    average_daily_recognitions: float


class MostRecognizedStudentsResponse(BaseModel):
    student_id: int
    student_name: str
    total_recognitions: int
    recognitions_by_type: Dict[str, int]
    badges_earned: List[RecognitionBadgeResponse]


class RecognitionStatsResponse(BaseModel):
    received_count: int
    sent_count: int
    likes_received: int
    badges_earned: List[RecognitionBadgeResponse]
    received_by_type: Dict[str, int]
    sent_by_type: Dict[str, int]


class RecognitionNotificationResponse(BaseModel):
    id: int
    recognition_id: int
    notification_id: Optional[int] = None
    is_sent: bool
    sent_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
