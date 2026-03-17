from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Float, JSON, Text, Index
from sqlalchemy.orm import relationship
import enum
from src.database import Base


class ExplanationType(str, enum.Enum):
    TEXT = "text"
    VOICE = "voice"
    VIDEO = "video"


class DifficultyLevel(str, enum.Enum):
    EXPLAIN_TO_5YO = "explain_to_5yo"
    EXPLAIN_TO_10YO = "explain_to_10yo"
    EXPLAIN_TO_COLLEGE = "explain_to_college"
    EXPLAIN_IN_30S = "explain_in_30s"


class TeachingSession(Base):
    __tablename__ = "teaching_sessions"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    
    explanation_type = Column(SQLEnum(ExplanationType), nullable=False, index=True)
    explanation_content = Column(Text, nullable=False)
    
    # AI Analysis JSON fields
    ai_analysis = Column(JSON, nullable=True)  # Full analysis object
    correctly_explained = Column(JSON, nullable=True)  # Array of correctly explained concepts
    missing_concepts = Column(JSON, nullable=True)  # Array of missing concepts
    confused_concepts = Column(JSON, nullable=True)  # Array of confused concepts
    understanding_level_percent = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    
    # Metadata
    duration_seconds = Column(Integer, nullable=True)  # For voice/video
    word_count = Column(Integer, nullable=True)
    is_analyzed = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    institution = relationship("Institution")
    student = relationship("Student")
    topic = relationship("Topic")
    challenges = relationship("TeachingChallenge", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_teaching_session_institution", "institution_id"),
        Index("idx_teaching_session_student", "student_id"),
        Index("idx_teaching_session_topic", "topic_id"),
        Index("idx_teaching_session_type", "explanation_type"),
        Index("idx_teaching_session_analyzed", "is_analyzed"),
        Index("idx_teaching_session_created", "created_at"),
    )


class TeachingChallenge(Base):
    __tablename__ = "teaching_challenges"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("teaching_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    difficulty = Column(SQLEnum(DifficultyLevel), nullable=False, index=True)
    challenge_prompt = Column(Text, nullable=False)
    student_response = Column(Text, nullable=True)
    
    completed = Column(Boolean, default=False, nullable=False)
    score = Column(Float, nullable=True)
    
    # AI Feedback
    ai_feedback = Column(JSON, nullable=True)
    strengths = Column(JSON, nullable=True)  # Array of strengths
    areas_for_improvement = Column(JSON, nullable=True)  # Array of areas to improve
    
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    institution = relationship("Institution")
    session = relationship("TeachingSession", back_populates="challenges")
    student = relationship("Student")

    __table_args__ = (
        Index("idx_teaching_challenge_institution", "institution_id"),
        Index("idx_teaching_challenge_session", "session_id"),
        Index("idx_teaching_challenge_student", "student_id"),
        Index("idx_teaching_challenge_difficulty", "difficulty"),
        Index("idx_teaching_challenge_completed", "completed"),
        Index("idx_teaching_challenge_created", "created_at"),
    )
