from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Index, UniqueConstraint, Enum as SQLEnum, Numeric
from sqlalchemy.orm import relationship
from src.database import Base
import enum


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    HALF_DAY = "half_day"


class CorrectionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Attendance(Base):
    __tablename__ = "attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey('sections.id', ondelete='SET NULL'), nullable=True, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(SQLEnum(AttendanceStatus), nullable=False, default=AttendanceStatus.PRESENT)
    marked_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")
    section = relationship("Section", back_populates="attendances")
    subject = relationship("Subject", back_populates="attendances")
    marked_by = relationship("User", foreign_keys=[marked_by_id])
    corrections = relationship("AttendanceCorrection", back_populates="attendance", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('student_id', 'date', 'subject_id', name='uq_student_date_subject_attendance'),
        Index('idx_attendance_institution', 'institution_id'),
        Index('idx_attendance_student', 'student_id'),
        Index('idx_attendance_section', 'section_id'),
        Index('idx_attendance_subject', 'subject_id'),
        Index('idx_attendance_date', 'date'),
        Index('idx_attendance_status', 'status'),
        Index('idx_attendance_marked_by', 'marked_by_id'),
        Index('idx_attendance_student_date', 'student_id', 'date'),
        Index('idx_attendance_section_date', 'section_id', 'date'),
    )


class AttendanceCorrection(Base):
    __tablename__ = "attendance_corrections"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    attendance_id = Column(Integer, ForeignKey('attendances.id', ondelete='CASCADE'), nullable=False, index=True)
    requested_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    old_status = Column(SQLEnum(AttendanceStatus), nullable=False)
    new_status = Column(SQLEnum(AttendanceStatus), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(SQLEnum(CorrectionStatus), nullable=False, default=CorrectionStatus.PENDING)
    reviewed_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    review_remarks = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="attendance_corrections")
    attendance = relationship("Attendance", back_populates="corrections")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    
    __table_args__ = (
        Index('idx_correction_institution', 'institution_id'),
        Index('idx_correction_attendance', 'attendance_id'),
        Index('idx_correction_requested_by', 'requested_by_id'),
        Index('idx_correction_reviewed_by', 'reviewed_by_id'),
        Index('idx_correction_status', 'status'),
        Index('idx_correction_created', 'created_at'),
    )


class AttendanceSummary(Base):
    __tablename__ = "attendance_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    total_days = Column(Integer, nullable=False, default=0)
    present_days = Column(Integer, nullable=False, default=0)
    absent_days = Column(Integer, nullable=False, default=0)
    late_days = Column(Integer, nullable=False, default=0)
    half_days = Column(Integer, nullable=False, default=0)
    attendance_percentage = Column(Numeric(5, 2), nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="attendance_summaries")
    student = relationship("Student", back_populates="attendance_summaries")
    subject = relationship("Subject", back_populates="attendance_summaries")
    
    __table_args__ = (
        UniqueConstraint('student_id', 'year', 'month', 'subject_id', name='uq_student_year_month_subject_summary'),
        Index('idx_summary_institution', 'institution_id'),
        Index('idx_summary_student', 'student_id'),
        Index('idx_summary_subject', 'subject_id'),
        Index('idx_summary_year_month', 'year', 'month'),
        Index('idx_summary_percentage', 'attendance_percentage'),
    )
