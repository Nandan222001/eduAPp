from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ExplanationType(str, Enum):
    TEXT = "text"
    VOICE = "voice"
    VIDEO = "video"


class DifficultyLevel(str, Enum):
    EXPLAIN_TO_5YO = "explain_to_5yo"
    EXPLAIN_TO_10YO = "explain_to_10yo"
    EXPLAIN_TO_COLLEGE = "explain_to_college"
    EXPLAIN_IN_30S = "explain_in_30s"


# Teaching Session Schemas
class TeachingSessionCreate(BaseModel):
    student_id: int
    topic_id: int
    explanation_type: ExplanationType
    explanation_content: str
    duration_seconds: Optional[int] = None


class TeachingSessionUpdate(BaseModel):
    explanation_content: Optional[str] = None
    duration_seconds: Optional[int] = None


class AIAnalysisResult(BaseModel):
    correctly_explained: List[str]
    missing_concepts: List[str]
    confused_concepts: List[str]
    understanding_level_percent: float
    clarity_score: float
    detailed_feedback: str
    follow_up_questions: List[str]
    suggestions: List[str]


class TeachingSessionResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    topic_id: int
    explanation_type: ExplanationType
    explanation_content: str
    ai_analysis: Optional[Dict[str, Any]] = None
    correctly_explained: Optional[List[str]] = None
    missing_concepts: Optional[List[str]] = None
    confused_concepts: Optional[List[str]] = None
    understanding_level_percent: Optional[float] = None
    clarity_score: Optional[float] = None
    duration_seconds: Optional[int] = None
    word_count: Optional[int] = None
    is_analyzed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeachingSessionDetail(TeachingSessionResponse):
    challenges: List["TeachingChallengeResponse"] = []

    class Config:
        from_attributes = True


# Teaching Challenge Schemas
class TeachingChallengeCreate(BaseModel):
    session_id: int
    difficulty: DifficultyLevel


class TeachingChallengeSubmit(BaseModel):
    student_response: str


class TeachingChallengeResponse(BaseModel):
    id: int
    institution_id: int
    session_id: int
    student_id: int
    difficulty: DifficultyLevel
    challenge_prompt: str
    student_response: Optional[str] = None
    completed: bool
    score: Optional[float] = None
    ai_feedback: Optional[Dict[str, Any]] = None
    strengths: Optional[List[str]] = None
    areas_for_improvement: Optional[List[str]] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Audio transcription request
class AudioTranscriptionRequest(BaseModel):
    audio_url: str
    student_id: int
    topic_id: int


# Progress tracking schemas
class StudentProgress(BaseModel):
    student_id: int
    total_sessions: int
    total_challenges: int
    completed_challenges: int
    average_understanding: float
    average_clarity: float
    topics_covered: List[Dict[str, Any]]
    recent_sessions: List[TeachingSessionResponse]


class TopicProgress(BaseModel):
    topic_id: int
    topic_name: str
    total_sessions: int
    average_understanding: float
    average_clarity: float
    student_count: int
    concept_mastery: Dict[str, float]


# Bulk analysis request
class BulkAnalysisRequest(BaseModel):
    session_ids: List[int]
