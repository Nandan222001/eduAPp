from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Index, UniqueConstraint, Enum as SQLEnum, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from enum import Enum
from src.database import Base


class MistakeType(str, Enum):
    SILLY_CALCULATION = "silly_calculation"
    SIGN_ERROR = "sign_error"
    UNIT_MISSING = "unit_missing"
    CONCEPT_WRONG = "concept_wrong"
    MISREAD_QUESTION = "misread_question"
    INCOMPLETE_STEPS = "incomplete_steps"
    PRESENTATION = "presentation"


class RemediationStatus(str, Enum):
    UNRESOLVED = "unresolved"
    IN_PROGRESS = "in_progress"
    MASTERED = "mastered"


class EarnedVia(str, Enum):
    STUDY_STREAK = "study_streak"
    HOMEWORK_COMPLETE = "homework_complete"
    HELP_CLASSMATES = "help_classmates"
    ATTENDANCE = "attendance"
    PERFECT_SCORE = "perfect_score"


class MistakePattern(Base):
    __tablename__ = "mistake_patterns"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    mistake_type = Column(SQLEnum(MistakeType), nullable=False, index=True)
    frequency_count = Column(Integer, default=1, nullable=False)
    total_marks_lost = Column(Numeric(10, 2), default=0, nullable=False)
    first_detected_at = Column(DateTime, nullable=False)
    last_detected_at = Column(DateTime, nullable=False)
    remediation_status = Column(SQLEnum(RemediationStatus), default=RemediationStatus.UNRESOLVED, nullable=False, index=True)
    examples = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    student = relationship("Student")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    
    __table_args__ = (
        Index('idx_mistake_pattern_student', 'student_id'),
        Index('idx_mistake_pattern_subject', 'subject_id'),
        Index('idx_mistake_pattern_chapter', 'chapter_id'),
        Index('idx_mistake_pattern_type', 'mistake_type'),
        Index('idx_mistake_pattern_status', 'remediation_status'),
        Index('idx_mistake_pattern_student_subject', 'student_id', 'subject_id'),
        Index('idx_mistake_pattern_student_type', 'student_id', 'mistake_type'),
    )


class MistakeInsuranceToken(Base):
    __tablename__ = "mistake_insurance_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    earned_via = Column(SQLEnum(EarnedVia), nullable=False, index=True)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    used_at = Column(DateTime, nullable=True, index=True)
    used_for_exam_id = Column(Integer, ForeignKey('exams.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    student = relationship("Student")
    exam = relationship("Exam")
    insurance_review = relationship("InsuranceReview", back_populates="token", uselist=False, cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_insurance_token_student', 'student_id'),
        Index('idx_insurance_token_earned_via', 'earned_via'),
        Index('idx_insurance_token_used_at', 'used_at'),
        Index('idx_insurance_token_exam', 'used_for_exam_id'),
        Index('idx_insurance_token_student_unused', 'student_id', 'used_at'),
    )


class InsuranceReview(Base):
    __tablename__ = "insurance_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey('mistake_insurance_tokens.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    exam_id = Column(Integer, ForeignKey('exams.id', ondelete='CASCADE'), nullable=False, index=True)
    original_score = Column(Numeric(10, 2), nullable=False)
    revised_score = Column(Numeric(10, 2), nullable=False)
    mistakes_corrected = Column(JSON, nullable=False)
    student_explanation = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    token = relationship("MistakeInsuranceToken", back_populates="insurance_review")
    exam = relationship("Exam")
    
    __table_args__ = (
        Index('idx_insurance_review_token', 'token_id'),
        Index('idx_insurance_review_exam', 'exam_id'),
        Index('idx_insurance_review_reviewed_at', 'reviewed_at'),
    )
