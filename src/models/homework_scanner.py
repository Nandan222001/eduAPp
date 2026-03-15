from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Index, Numeric, JSON, Enum
from sqlalchemy.orm import relationship
from src.database import Base


class MistakeType(str, PyEnum):
    CALCULATION = "calculation"
    SIGN_ERROR = "sign_error"
    CONCEPT = "concept"
    UNIT = "unit"
    INCOMPLETE = "incomplete"


class HomeworkScan(Base):
    __tablename__ = "homework_scans"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    scan_image_urls = Column(JSON, nullable=False)
    ocr_text = Column(Text, nullable=True)
    processed_results = Column(JSON, nullable=True)
    total_score = Column(Numeric(10, 2), nullable=True)
    scan_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    student = relationship("Student", back_populates="homework_scans")
    subject = relationship("Subject", back_populates="homework_scans")
    feedbacks = relationship("HomeworkFeedback", back_populates="scan", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_homework_scan_student', 'student_id'),
        Index('idx_homework_scan_subject', 'subject_id'),
        Index('idx_homework_scan_date', 'scan_date'),
    )


class HomeworkFeedback(Base):
    __tablename__ = "homework_feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey('homework_scans.id', ondelete='CASCADE'), nullable=False, index=True)
    question_number = Column(Integer, nullable=False)
    student_answer = Column(Text, nullable=True)
    correct_answer = Column(Text, nullable=True)
    is_correct = Column(Integer, nullable=False)
    mistake_type = Column(Enum(MistakeType), nullable=True, index=True)
    ai_feedback = Column(Text, nullable=True)
    remedial_content_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    scan = relationship("HomeworkScan", back_populates="feedbacks")
    
    __table_args__ = (
        Index('idx_homework_feedback_scan', 'scan_id'),
        Index('idx_homework_feedback_mistake_type', 'mistake_type'),
    )
