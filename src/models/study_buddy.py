from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from src.database import Base
import enum


class InsightType(str, enum.Enum):
    SCHEDULE_SUGGESTION = "schedule_suggestion"
    WEAKNESS_ALERT = "weakness_alert"
    CELEBRATION = "celebration"
    EXAM_PREP = "exam_prep"
    STRESS_CHECK = "stress_check"


class StudyBuddySession(Base):
    __tablename__ = "study_buddy_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    conversation_history = Column(JSON, nullable=False, default=list)
    study_patterns = Column(JSON, nullable=True)
    optimal_study_times = Column(JSON, nullable=True)
    streak_data = Column(JSON, nullable=True)
    mood_tracking = Column(JSON, nullable=True)
    last_interaction = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    insights = relationship("StudyBuddyInsight", back_populates="session", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_study_buddy_session_institution', 'institution_id'),
        Index('idx_study_buddy_session_student', 'student_id'),
        Index('idx_study_buddy_session_last_interaction', 'last_interaction'),
    )


class StudyBuddyInsight(Base):
    __tablename__ = "study_buddy_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey('study_buddy_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    insight_type = Column(SQLEnum(InsightType), nullable=False, index=True)
    content = Column(Text, nullable=False)
    priority = Column(Integer, nullable=False, default=1)
    delivered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    session = relationship("StudyBuddySession", back_populates="insights")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_study_buddy_insight_institution', 'institution_id'),
        Index('idx_study_buddy_insight_session', 'session_id'),
        Index('idx_study_buddy_insight_student', 'student_id'),
        Index('idx_study_buddy_insight_type', 'insight_type'),
        Index('idx_study_buddy_insight_delivered', 'delivered_at'),
        Index('idx_study_buddy_insight_read', 'is_read'),
    )


class StudyBuddyPreference(Base):
    __tablename__ = "study_buddy_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    preferred_study_times = Column(JSON, nullable=True)
    notification_preferences = Column(JSON, nullable=True)
    learning_style = Column(String(50), nullable=True)
    motivation_style = Column(String(50), nullable=True)
    ai_personality = Column(String(50), nullable=True, default='friendly')
    daily_briefing_enabled = Column(Boolean, default=True, nullable=False)
    weekly_review_enabled = Column(Boolean, default=True, nullable=False)
    celebration_enabled = Column(Boolean, default=True, nullable=False)
    stress_check_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_study_buddy_pref_institution', 'institution_id'),
        Index('idx_study_buddy_pref_student', 'student_id', unique=True),
        Index('idx_study_buddy_pref_daily_briefing', 'daily_briefing_enabled'),
    )
