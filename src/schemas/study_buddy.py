from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class InsightTypeEnum(str, Enum):
    SCHEDULE_SUGGESTION = "schedule_suggestion"
    WEAKNESS_ALERT = "weakness_alert"
    CELEBRATION = "celebration"
    EXAM_PREP = "exam_prep"
    STRESS_CHECK = "stress_check"


class ChatMessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    role: ChatMessageRole
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    message: str
    suggestions: Optional[List[str]] = None
    insights: Optional[List[str]] = None


class StudyPattern(BaseModel):
    most_active_hours: Optional[List[int]] = None
    average_session_duration: Optional[float] = None
    preferred_subjects: Optional[List[str]] = None
    study_frequency: Optional[Dict[str, int]] = None


class OptimalStudyTime(BaseModel):
    day_of_week: str
    time_slot: str
    productivity_score: float


class StreakData(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    total_study_days: int = 0
    last_study_date: Optional[datetime] = None


class MoodEntry(BaseModel):
    timestamp: datetime
    mood: str
    energy_level: int = Field(ge=1, le=5)
    stress_level: int = Field(ge=1, le=5)
    notes: Optional[str] = None


class StudyBuddySessionResponse(BaseModel):
    id: int
    student_id: int
    conversation_history: List[Dict[str, Any]]
    study_patterns: Optional[Dict[str, Any]] = None
    optimal_study_times: Optional[List[Dict[str, Any]]] = None
    streak_data: Optional[Dict[str, Any]] = None
    mood_tracking: Optional[List[Dict[str, Any]]] = None
    last_interaction: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudyBuddyInsightResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    insight_type: InsightTypeEnum
    content: str
    priority: int
    delivered_at: datetime
    is_read: bool

    class Config:
        from_attributes = True


class StudyBuddyPreferenceCreate(BaseModel):
    preferred_study_times: Optional[Dict[str, Any]] = None
    notification_preferences: Optional[Dict[str, Any]] = None
    learning_style: Optional[str] = None
    motivation_style: Optional[str] = None
    ai_personality: Optional[str] = 'friendly'
    daily_briefing_enabled: bool = True
    weekly_review_enabled: bool = True
    celebration_enabled: bool = True
    stress_check_enabled: bool = True


class StudyBuddyPreferenceUpdate(BaseModel):
    preferred_study_times: Optional[Dict[str, Any]] = None
    notification_preferences: Optional[Dict[str, Any]] = None
    learning_style: Optional[str] = None
    motivation_style: Optional[str] = None
    ai_personality: Optional[str] = None
    daily_briefing_enabled: Optional[bool] = None
    weekly_review_enabled: Optional[bool] = None
    celebration_enabled: Optional[bool] = None
    stress_check_enabled: Optional[bool] = None


class StudyBuddyPreferenceResponse(BaseModel):
    id: int
    student_id: int
    preferred_study_times: Optional[Dict[str, Any]] = None
    notification_preferences: Optional[Dict[str, Any]] = None
    learning_style: Optional[str] = None
    motivation_style: Optional[str] = None
    ai_personality: str
    daily_briefing_enabled: bool
    weekly_review_enabled: bool
    celebration_enabled: bool
    stress_check_enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DailyBriefingResponse(BaseModel):
    greeting: str
    upcoming_tasks: List[Dict[str, Any]]
    exam_reminders: List[Dict[str, Any]]
    weak_areas_focus: List[Dict[str, Any]]
    motivational_message: str
    study_suggestions: List[str]
    streak_info: Optional[Dict[str, Any]] = None


class WeeklyReviewResponse(BaseModel):
    summary: str
    achievements: List[str]
    areas_for_improvement: List[str]
    attendance_summary: Optional[Dict[str, Any]] = None
    exam_performance: Optional[Dict[str, Any]] = None
    assignment_completion: Optional[Dict[str, Any]] = None
    study_patterns: Optional[Dict[str, Any]] = None
    next_week_goals: List[str]
    motivational_message: str


class MoodTrackingRequest(BaseModel):
    mood: str
    energy_level: int = Field(ge=1, le=5)
    stress_level: int = Field(ge=1, le=5)
    notes: Optional[str] = None


class MarkInsightReadRequest(BaseModel):
    insight_id: int
