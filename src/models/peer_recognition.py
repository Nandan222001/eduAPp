from datetime import datetime, date
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from src.database import Base


class RecognitionType(str, Enum):
    KINDNESS = "kindness"
    ACADEMIC_HELP = "academic_help"
    TEAMWORK = "teamwork"
    LEADERSHIP = "leadership"
    CREATIVITY = "creativity"
    PERSEVERANCE = "perseverance"
    SPORTSMANSHIP = "sportsmanship"


class PeerRecognition(Base):
    __tablename__ = "peer_recognitions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    from_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    to_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    recognition_type = Column(SQLEnum(RecognitionType), nullable=False, index=True)
    message = Column(Text, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    likes_count = Column(Integer, default=0, nullable=False)
    created_date = Column(Date, default=date.today, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    from_student = relationship("Student", foreign_keys=[from_student_id])
    to_student = relationship("Student", foreign_keys=[to_student_id])
    likes = relationship("RecognitionLike", back_populates="recognition", cascade="all, delete-orphan")
    notification = relationship("RecognitionNotification", back_populates="recognition", cascade="all, delete-orphan", uselist=False)
    
    __table_args__ = (
        Index('idx_peer_recognition_institution', 'institution_id'),
        Index('idx_peer_recognition_from_student', 'from_student_id'),
        Index('idx_peer_recognition_to_student', 'to_student_id'),
        Index('idx_peer_recognition_type', 'recognition_type'),
        Index('idx_peer_recognition_public', 'is_public'),
        Index('idx_peer_recognition_created_date', 'created_date'),
        Index('idx_peer_recognition_likes', 'likes_count'),
        Index('idx_peer_recognition_institution_date', 'institution_id', 'created_date'),
        Index('idx_peer_recognition_public_institution', 'is_public', 'institution_id', 'created_date'),
    )


class RecognitionLike(Base):
    __tablename__ = "recognition_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    recognition_id = Column(Integer, ForeignKey('peer_recognitions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    recognition = relationship("PeerRecognition", back_populates="likes")
    student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('recognition_id', 'student_id', name='uq_recognition_like'),
        Index('idx_recognition_like_recognition', 'recognition_id'),
        Index('idx_recognition_like_student', 'student_id'),
    )


class RecognitionNotification(Base):
    __tablename__ = "recognition_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    recognition_id = Column(Integer, ForeignKey('peer_recognitions.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    notification_id = Column(Integer, ForeignKey('notifications.id', ondelete='CASCADE'), nullable=True, index=True)
    is_sent = Column(Boolean, default=False, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    recognition = relationship("PeerRecognition", back_populates="notification")
    notification_obj = relationship("Notification")
    
    __table_args__ = (
        Index('idx_recognition_notification_recognition', 'recognition_id'),
        Index('idx_recognition_notification_sent', 'is_sent'),
    )


class RecognitionBadge(Base):
    __tablename__ = "recognition_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    recognition_type = Column(SQLEnum(RecognitionType), nullable=False, index=True)
    badge_level = Column(String(20), nullable=False)
    recognitions_count = Column(Integer, default=0, nullable=False)
    points_awarded = Column(Integer, default=0, nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'student_id', 'recognition_type', 'badge_level', name='uq_recognition_badge'),
        Index('idx_recognition_badge_institution', 'institution_id'),
        Index('idx_recognition_badge_student', 'student_id'),
        Index('idx_recognition_badge_type', 'recognition_type'),
        Index('idx_recognition_badge_student_type', 'student_id', 'recognition_type'),
    )


class DailyRecognitionLimit(Base):
    __tablename__ = "daily_recognition_limits"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    limit_date = Column(Date, default=date.today, nullable=False, index=True)
    recognitions_sent = Column(Integer, default=0, nullable=False)
    max_daily_limit = Column(Integer, default=10, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'student_id', 'limit_date', name='uq_daily_recognition_limit'),
        Index('idx_daily_recognition_limit_institution', 'institution_id'),
        Index('idx_daily_recognition_limit_student', 'student_id'),
        Index('idx_daily_recognition_limit_date', 'limit_date'),
        Index('idx_daily_recognition_limit_student_date', 'student_id', 'limit_date'),
    )


class RecognitionAnalytics(Base):
    __tablename__ = "recognition_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    analytics_date = Column(Date, nullable=False, index=True)
    total_recognitions = Column(Integer, default=0, nullable=False)
    unique_givers = Column(Integer, default=0, nullable=False)
    unique_receivers = Column(Integer, default=0, nullable=False)
    total_likes = Column(Integer, default=0, nullable=False)
    positivity_index = Column(Integer, default=0, nullable=False)
    most_recognized_student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True)
    most_recognized_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    most_recognized_student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'analytics_date', name='uq_recognition_analytics'),
        Index('idx_recognition_analytics_institution', 'institution_id'),
        Index('idx_recognition_analytics_date', 'analytics_date'),
        Index('idx_recognition_analytics_institution_date', 'institution_id', 'analytics_date'),
    )
