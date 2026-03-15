from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class ActivityType(str, Enum):
    CLASSROOM_HELP = "classroom_help"
    EVENT_SUPPORT = "event_support"
    FUNDRAISING = "fundraising"
    FIELD_TRIP_CHAPERONE = "field_trip_chaperone"
    COMMITTEE_WORK = "committee_work"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class BadgeTier(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


class VolunteerHourLog(Base):
    __tablename__ = "volunteer_hour_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False, index=True)
    activity_name = Column(String(255), nullable=False)
    activity_type = Column(SQLEnum(ActivityType), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    hours_logged = Column(Numeric(5, 2), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    supervisor_teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False, index=True)
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    attachments = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    parent = relationship("Parent")
    academic_year = relationship("AcademicYear")
    supervisor_teacher = relationship("Teacher", foreign_keys=[supervisor_teacher_id])
    verifier = relationship("Teacher", foreign_keys=[verified_by])
    
    __table_args__ = (
        Index('idx_volunteer_hour_institution', 'institution_id'),
        Index('idx_volunteer_hour_parent', 'parent_id'),
        Index('idx_volunteer_hour_academic_year', 'academic_year_id'),
        Index('idx_volunteer_hour_activity_type', 'activity_type'),
        Index('idx_volunteer_hour_date', 'date'),
        Index('idx_volunteer_hour_status', 'verification_status'),
        Index('idx_volunteer_hour_supervisor', 'supervisor_teacher_id'),
        Index('idx_volunteer_hour_verifier', 'verified_by'),
    )


class VolunteerHourSummary(Base):
    __tablename__ = "volunteer_hour_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False, index=True)
    total_hours = Column(Numeric(8, 2), default=0, nullable=False)
    approved_hours = Column(Numeric(8, 2), default=0, nullable=False)
    pending_hours = Column(Numeric(8, 2), default=0, nullable=False)
    rejected_hours = Column(Numeric(8, 2), default=0, nullable=False)
    classroom_help_hours = Column(Numeric(8, 2), default=0, nullable=False)
    event_support_hours = Column(Numeric(8, 2), default=0, nullable=False)
    fundraising_hours = Column(Numeric(8, 2), default=0, nullable=False)
    field_trip_hours = Column(Numeric(8, 2), default=0, nullable=False)
    committee_work_hours = Column(Numeric(8, 2), default=0, nullable=False)
    current_rank = Column(Integer, nullable=True)
    last_activity_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    parent = relationship("Parent")
    academic_year = relationship("AcademicYear")
    
    __table_args__ = (
        UniqueConstraint('parent_id', 'academic_year_id', name='uq_parent_academic_year_summary'),
        Index('idx_volunteer_summary_institution', 'institution_id'),
        Index('idx_volunteer_summary_parent', 'parent_id'),
        Index('idx_volunteer_summary_academic_year', 'academic_year_id'),
        Index('idx_volunteer_summary_approved_hours', 'approved_hours'),
        Index('idx_volunteer_summary_rank', 'current_rank'),
    )


class VolunteerBadge(Base):
    __tablename__ = "volunteer_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    badge_tier = Column(SQLEnum(BadgeTier), nullable=False, index=True)
    hours_required = Column(Numeric(8, 2), nullable=False)
    icon_url = Column(String(500), nullable=True)
    color_code = Column(String(7), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    parent_badges = relationship("ParentVolunteerBadge", back_populates="badge", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'hours_required', name='uq_institution_badge_hours'),
        Index('idx_volunteer_badge_institution', 'institution_id'),
        Index('idx_volunteer_badge_tier', 'badge_tier'),
        Index('idx_volunteer_badge_hours', 'hours_required'),
        Index('idx_volunteer_badge_active', 'is_active'),
    )


class ParentVolunteerBadge(Base):
    __tablename__ = "parent_volunteer_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    badge_id = Column(Integer, ForeignKey('volunteer_badges.id', ondelete='CASCADE'), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False, index=True)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    hours_at_earning = Column(Numeric(8, 2), nullable=False)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    parent = relationship("Parent")
    badge = relationship("VolunteerBadge", back_populates="parent_badges")
    academic_year = relationship("AcademicYear")
    
    __table_args__ = (
        Index('idx_parent_volunteer_badge_institution', 'institution_id'),
        Index('idx_parent_volunteer_badge_parent', 'parent_id'),
        Index('idx_parent_volunteer_badge_badge', 'badge_id'),
        Index('idx_parent_volunteer_badge_academic_year', 'academic_year_id'),
        Index('idx_parent_volunteer_badge_earned', 'earned_at'),
    )


class VolunteerLeaderboard(Base):
    __tablename__ = "volunteer_leaderboards"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=True, index=True)
    rank = Column(Integer, nullable=False)
    total_hours = Column(Numeric(8, 2), nullable=False)
    previous_rank = Column(Integer, nullable=True)
    rank_change = Column(Integer, nullable=True)
    percentile = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    academic_year = relationship("AcademicYear")
    parent = relationship("Parent")
    grade = relationship("Grade")
    
    __table_args__ = (
        UniqueConstraint('academic_year_id', 'parent_id', name='uq_academic_year_parent_leaderboard'),
        Index('idx_volunteer_leaderboard_institution', 'institution_id'),
        Index('idx_volunteer_leaderboard_academic_year', 'academic_year_id'),
        Index('idx_volunteer_leaderboard_parent', 'parent_id'),
        Index('idx_volunteer_leaderboard_grade', 'grade_id'),
        Index('idx_volunteer_leaderboard_rank', 'rank'),
        Index('idx_volunteer_leaderboard_hours', 'total_hours'),
    )


class VolunteerCertificate(Base):
    __tablename__ = "volunteer_certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False, index=True)
    certificate_number = Column(String(100), nullable=False, unique=True, index=True)
    total_hours = Column(Numeric(8, 2), nullable=False)
    issue_date = Column(Date, nullable=False, index=True)
    certificate_url = Column(String(500), nullable=True)
    pdf_path = Column(String(500), nullable=True)
    signed_by = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    is_tax_deductible = Column(Boolean, default=False, nullable=False)
    tax_year = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    parent = relationship("Parent")
    academic_year = relationship("AcademicYear")
    signer = relationship("Teacher")
    
    __table_args__ = (
        UniqueConstraint('parent_id', 'academic_year_id', name='uq_parent_academic_year_certificate'),
        Index('idx_volunteer_cert_institution', 'institution_id'),
        Index('idx_volunteer_cert_parent', 'parent_id'),
        Index('idx_volunteer_cert_academic_year', 'academic_year_id'),
        Index('idx_volunteer_cert_number', 'certificate_number'),
        Index('idx_volunteer_cert_issue_date', 'issue_date'),
        Index('idx_volunteer_cert_signed_by', 'signed_by'),
        Index('idx_volunteer_cert_tax_deductible', 'is_tax_deductible'),
    )
