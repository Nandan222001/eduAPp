from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum, JSON, ARRAY, Float
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class TutorStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class SessionStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class SessionType(str, Enum):
    ONE_ON_ONE = "one_on_one"
    GROUP = "group"
    WORKSHOP = "workshop"


class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    FLAGGED = "flagged"
    REMOVED = "removed"


class EndorsementType(str, Enum):
    SUBJECT_EXPERTISE = "subject_expertise"
    TEACHING_QUALITY = "teaching_quality"
    COMMUNICATION = "communication"
    RELIABILITY = "reliability"
    PATIENCE = "patience"


class IncentiveType(str, Enum):
    SERVICE_HOURS = "service_hours"
    CERTIFICATE = "certificate"
    PRIORITY_REGISTRATION = "priority_registration"
    SCHOLARSHIP = "scholarship"
    RECOGNITION = "recognition"


class BadgeCategory(str, Enum):
    SESSION_COUNT = "session_count"
    RATING = "rating"
    SUBJECT_MASTERY = "subject_mastery"
    STREAK = "streak"
    STUDENT_IMPACT = "student_impact"
    SPECIAL = "special"


class ModerationActionType(str, Enum):
    WARNING = "warning"
    SESSION_REVIEW = "session_review"
    TEMPORARY_SUSPENSION = "temporary_suspension"
    PERMANENT_SUSPENSION = "permanent_suspension"
    CLEARED = "cleared"


class TutorProfile(Base):
    __tablename__ = "tutor_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=True, index=True)
    bio = Column(Text, nullable=True)
    status = Column(SQLEnum(TutorStatus), default=TutorStatus.PENDING, nullable=False, index=True)
    subjects = Column(JSON, nullable=False)
    availability = Column(JSON, nullable=False)
    hourly_rate = Column(Numeric(10, 2), default=0, nullable=False)
    total_sessions = Column(Integer, default=0, nullable=False)
    completed_sessions = Column(Integer, default=0, nullable=False)
    average_rating = Column(Numeric(3, 2), default=0, nullable=False, index=True)
    total_reviews = Column(Integer, default=0, nullable=False)
    total_hours_tutored = Column(Numeric(10, 2), default=0, nullable=False)
    total_points = Column(Integer, default=0, nullable=False, index=True)
    level = Column(Integer, default=1, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    profile_photo_url = Column(String(500), nullable=True)
    video_intro_url = Column(String(500), nullable=True)
    languages = Column(JSON, nullable=True)
    teaching_style = Column(Text, nullable=True)
    max_students_per_session = Column(Integer, default=1, nullable=False)
    accepts_group_sessions = Column(Boolean, default=False, nullable=False)
    verification_status = Column(Boolean, default=False, nullable=False)
    background_check_completed = Column(Boolean, default=False, nullable=False)
    last_active_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    student = relationship("Student")
    sessions = relationship("TutoringSession", foreign_keys="TutoringSession.tutor_id", back_populates="tutor", cascade="all, delete-orphan")
    received_reviews = relationship("TutorReview", back_populates="tutor", cascade="all, delete-orphan")
    badges = relationship("TutorBadge", back_populates="tutor", cascade="all, delete-orphan")
    endorsements = relationship("TutorEndorsement", back_populates="tutor", cascade="all, delete-orphan")
    incentives = relationship("TutorIncentive", back_populates="tutor", cascade="all, delete-orphan")
    point_history = relationship("TutorPointHistory", back_populates="tutor", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'user_id', name='uq_institution_tutor_user'),
        Index('idx_tutor_profile_institution', 'institution_id'),
        Index('idx_tutor_profile_user', 'user_id'),
        Index('idx_tutor_profile_student', 'student_id'),
        Index('idx_tutor_profile_status', 'status'),
        Index('idx_tutor_profile_rating', 'average_rating'),
        Index('idx_tutor_profile_points', 'total_points'),
        Index('idx_tutor_profile_active', 'last_active_at'),
    )


class TutoringSession(Base):
    __tablename__ = "tutoring_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    tutor_id = Column(Integer, ForeignKey('tutor_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    session_type = Column(SQLEnum(SessionType), default=SessionType.ONE_ON_ONE, nullable=False)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.SCHEDULED, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    topic = Column(String(255), nullable=True)
    scheduled_start = Column(DateTime, nullable=False, index=True)
    scheduled_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    meeting_url = Column(String(500), nullable=True)
    meeting_id = Column(String(255), nullable=True)
    meeting_password = Column(String(100), nullable=True)
    video_platform = Column(String(50), nullable=True)
    recording_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    tutor_notes = Column(Text, nullable=True)
    student_notes = Column(Text, nullable=True)
    materials_shared = Column(JSON, nullable=True)
    points_awarded = Column(Integer, default=0, nullable=False)
    is_recorded = Column(Boolean, default=False, nullable=False)
    is_flagged = Column(Boolean, default=False, nullable=False)
    flagged_reason = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    tutor = relationship("TutorProfile", foreign_keys=[tutor_id], back_populates="sessions")
    student = relationship("Student")
    subject = relationship("Subject")
    cancelled_by_user = relationship("User", foreign_keys=[cancelled_by])
    participants = relationship("SessionParticipant", back_populates="session", cascade="all, delete-orphan")
    reviews = relationship("TutorReview", back_populates="session", cascade="all, delete-orphan")
    moderation_logs = relationship("SessionModerationLog", back_populates="session", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_tutoring_session_institution', 'institution_id'),
        Index('idx_tutoring_session_tutor', 'tutor_id'),
        Index('idx_tutoring_session_student', 'student_id'),
        Index('idx_tutoring_session_subject', 'subject_id'),
        Index('idx_tutoring_session_status', 'status'),
        Index('idx_tutoring_session_start', 'scheduled_start'),
        Index('idx_tutoring_session_flagged', 'is_flagged'),
    )


class SessionParticipant(Base):
    __tablename__ = "session_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey('tutoring_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    joined_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    was_present = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    session = relationship("TutoringSession", back_populates="participants")
    student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('session_id', 'student_id', name='uq_session_participant'),
        Index('idx_session_participant_institution', 'institution_id'),
        Index('idx_session_participant_session', 'session_id'),
        Index('idx_session_participant_student', 'student_id'),
    )


class TutorReview(Base):
    __tablename__ = "tutor_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    tutor_id = Column(Integer, ForeignKey('tutor_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey('tutoring_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    rating = Column(Integer, nullable=False, index=True)
    review_text = Column(Text, nullable=True)
    knowledge_rating = Column(Integer, nullable=True)
    communication_rating = Column(Integer, nullable=True)
    patience_rating = Column(Integer, nullable=True)
    helpfulness_rating = Column(Integer, nullable=True)
    punctuality_rating = Column(Integer, nullable=True)
    status = Column(SQLEnum(ReviewStatus), default=ReviewStatus.PENDING, nullable=False, index=True)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    helpful_count = Column(Integer, default=0, nullable=False)
    flagged_count = Column(Integer, default=0, nullable=False)
    moderated_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    moderation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    tutor = relationship("TutorProfile", back_populates="received_reviews")
    session = relationship("TutoringSession", back_populates="reviews")
    student = relationship("Student")
    moderator = relationship("User", foreign_keys=[moderated_by])
    
    __table_args__ = (
        UniqueConstraint('session_id', 'student_id', name='uq_session_student_review'),
        Index('idx_tutor_review_institution', 'institution_id'),
        Index('idx_tutor_review_tutor', 'tutor_id'),
        Index('idx_tutor_review_session', 'session_id'),
        Index('idx_tutor_review_student', 'student_id'),
        Index('idx_tutor_review_rating', 'rating'),
        Index('idx_tutor_review_status', 'status'),
        Index('idx_tutor_review_featured', 'is_featured'),
    )


class TutorEndorsement(Base):
    __tablename__ = "tutor_endorsements"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    tutor_id = Column(Integer, ForeignKey('tutor_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    endorser_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    endorsement_type = Column(SQLEnum(EndorsementType), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    comments = Column(Text, nullable=True)
    weight = Column(Integer, default=1, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    tutor = relationship("TutorProfile", back_populates="endorsements")
    endorser = relationship("User")
    subject = relationship("Subject")
    
    __table_args__ = (
        Index('idx_tutor_endorsement_institution', 'institution_id'),
        Index('idx_tutor_endorsement_tutor', 'tutor_id'),
        Index('idx_tutor_endorsement_endorser', 'endorser_id'),
        Index('idx_tutor_endorsement_type', 'endorsement_type'),
        Index('idx_tutor_endorsement_subject', 'subject_id'),
        Index('idx_tutor_endorsement_verified', 'is_verified'),
    )


class TutorBadge(Base):
    __tablename__ = "tutor_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    tutor_id = Column(Integer, ForeignKey('tutor_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(BadgeCategory), nullable=False, index=True)
    icon_url = Column(String(500), nullable=True)
    points_value = Column(Integer, default=0, nullable=False)
    rarity = Column(String(50), nullable=True)
    criteria_met = Column(JSON, nullable=True)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_displayed = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    
    institution = relationship("Institution")
    tutor = relationship("TutorProfile", back_populates="badges")
    
    __table_args__ = (
        Index('idx_tutor_badge_institution', 'institution_id'),
        Index('idx_tutor_badge_tutor', 'tutor_id'),
        Index('idx_tutor_badge_category', 'category'),
        Index('idx_tutor_badge_earned', 'earned_at'),
    )


class TutorIncentive(Base):
    __tablename__ = "tutor_incentives"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    tutor_id = Column(Integer, ForeignKey('tutor_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    incentive_type = Column(SQLEnum(IncentiveType), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    value = Column(Numeric(10, 2), nullable=True)
    service_hours = Column(Numeric(10, 2), nullable=True)
    certificate_url = Column(String(500), nullable=True)
    certificate_number = Column(String(100), nullable=True)
    valid_from = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    is_redeemed = Column(Boolean, default=False, nullable=False)
    redeemed_at = Column(DateTime, nullable=True)
    requirements_met = Column(JSON, nullable=True)
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    tutor = relationship("TutorProfile", back_populates="incentives")
    
    __table_args__ = (
        Index('idx_tutor_incentive_institution', 'institution_id'),
        Index('idx_tutor_incentive_tutor', 'tutor_id'),
        Index('idx_tutor_incentive_type', 'incentive_type'),
        Index('idx_tutor_incentive_redeemed', 'is_redeemed'),
    )


class TutorPointHistory(Base):
    __tablename__ = "tutor_point_history"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    tutor_id = Column(Integer, ForeignKey('tutor_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey('tutoring_sessions.id', ondelete='SET NULL'), nullable=True, index=True)
    points = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    tutor = relationship("TutorProfile", back_populates="point_history")
    session = relationship("TutoringSession")
    
    __table_args__ = (
        Index('idx_tutor_point_history_institution', 'institution_id'),
        Index('idx_tutor_point_history_tutor', 'tutor_id'),
        Index('idx_tutor_point_history_session', 'session_id'),
        Index('idx_tutor_point_history_created', 'created_at'),
    )


class SessionModerationLog(Base):
    __tablename__ = "session_moderation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey('tutoring_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    moderator_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    action_type = Column(SQLEnum(ModerationActionType), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    details = Column(Text, nullable=True)
    quality_score = Column(Integer, nullable=True)
    safety_score = Column(Integer, nullable=True)
    auto_flagged = Column(Boolean, default=False, nullable=False)
    flag_reasons = Column(JSON, nullable=True)
    resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    session = relationship("TutoringSession", back_populates="moderation_logs")
    moderator = relationship("User")
    
    __table_args__ = (
        Index('idx_session_moderation_institution', 'institution_id'),
        Index('idx_session_moderation_session', 'session_id'),
        Index('idx_session_moderation_moderator', 'moderator_id'),
        Index('idx_session_moderation_action', 'action_type'),
        Index('idx_session_moderation_resolved', 'resolved'),
        Index('idx_session_moderation_created', 'created_at'),
    )


class TutorLeaderboard(Base):
    __tablename__ = "tutor_leaderboards"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    tutor_id = Column(Integer, ForeignKey('tutor_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    rank = Column(Integer, nullable=False, index=True)
    previous_rank = Column(Integer, nullable=True)
    score = Column(Integer, nullable=False, index=True)
    period = Column(String(50), nullable=False, index=True)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    sessions_count = Column(Integer, default=0, nullable=False)
    total_hours = Column(Numeric(10, 2), default=0, nullable=False)
    average_rating = Column(Numeric(3, 2), default=0, nullable=False)
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    tutor = relationship("TutorProfile")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'tutor_id', 'period', name='uq_tutor_leaderboard_period'),
        Index('idx_tutor_leaderboard_institution', 'institution_id'),
        Index('idx_tutor_leaderboard_tutor', 'tutor_id'),
        Index('idx_tutor_leaderboard_rank', 'rank'),
        Index('idx_tutor_leaderboard_score', 'score'),
        Index('idx_tutor_leaderboard_period', 'period'),
    )


class MatchingPreference(Base):
    __tablename__ = "matching_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    preferred_subjects = Column(JSON, nullable=True)
    preferred_tutors = Column(JSON, nullable=True)
    blocked_tutors = Column(JSON, nullable=True)
    learning_style = Column(String(50), nullable=True)
    preferred_session_duration = Column(Integer, nullable=True)
    preferred_times = Column(JSON, nullable=True)
    language_preference = Column(String(50), nullable=True)
    special_requirements = Column(Text, nullable=True)
    auto_match = Column(Boolean, default=True, nullable=False)
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'student_id', name='uq_student_matching_preference'),
        Index('idx_matching_preference_institution', 'institution_id'),
        Index('idx_matching_preference_student', 'student_id'),
    )
