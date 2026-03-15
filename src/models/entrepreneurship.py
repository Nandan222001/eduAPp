from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum, JSON, ARRAY
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class VentureStatus(str, Enum):
    IDEA = "idea"
    DEVELOPMENT = "development"
    LAUNCHED = "launched"
    FUNDED = "funded"
    CLOSED = "closed"


class CompetitionStatus(str, Enum):
    UPCOMING = "upcoming"
    OPEN = "open"
    JUDGING = "judging"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MentorshipStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class FundingStatus(str, Enum):
    REQUESTED = "requested"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    DISBURSED = "disbursed"
    REJECTED = "rejected"


class StudentVenture(Base):
    __tablename__ = "student_ventures"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    venture_name = Column(String(200), nullable=False, index=True)
    tagline = Column(String(300), nullable=True)
    
    founder_students = Column(ARRAY(Integer), nullable=False)
    primary_founder_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    business_idea = Column(Text, nullable=False)
    problem_statement = Column(Text, nullable=False)
    solution = Column(Text, nullable=False)
    target_market = Column(Text, nullable=False)
    revenue_model = Column(Text, nullable=True)
    
    pitch_deck_url = Column(String(500), nullable=True)
    business_plan_url = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)
    
    mentor_id = Column(Integer, ForeignKey('entrepreneurship_mentors.id', ondelete='SET NULL'), nullable=True, index=True)
    
    funding_requested = Column(Numeric(12, 2), nullable=True)
    funding_received = Column(Numeric(12, 2), default=0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    
    venture_status = Column(SQLEnum(VentureStatus), default=VentureStatus.IDEA, nullable=False, index=True)
    
    metrics = Column(JSON, nullable=True)
    
    customers = Column(Integer, default=0, nullable=False)
    revenue = Column(Numeric(12, 2), default=0, nullable=False)
    social_impact = Column(Text, nullable=True)
    
    milestones = Column(JSON, nullable=True)
    team_roles = Column(JSON, nullable=True)
    achievements = Column(JSON, nullable=True)
    
    pitch_competition_participations = Column(ARRAY(Integer), nullable=True)
    awards = Column(JSON, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    primary_founder = relationship("Student", foreign_keys=[primary_founder_id])
    mentor = relationship("EntrepreneurshipMentor", back_populates="ventures")
    funding_requests = relationship("VentureFundingRequest", back_populates="venture", cascade="all, delete-orphan")
    pitch_submissions = relationship("PitchSubmission", back_populates="venture", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_student_venture_institution', 'institution_id'),
        Index('idx_student_venture_founder', 'primary_founder_id'),
        Index('idx_student_venture_status', 'venture_status'),
        Index('idx_student_venture_mentor', 'mentor_id'),
        Index('idx_student_venture_active', 'is_active'),
        Index('idx_student_venture_featured', 'is_featured'),
    )


class PitchCompetition(Base):
    __tablename__ = "pitch_competitions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    competition_name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    theme = Column(String(200), nullable=True)
    
    judges = Column(ARRAY(Integer), nullable=True)
    judge_details = Column(JSON, nullable=True)
    
    prize_pool = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    prizes = Column(JSON, nullable=True)
    
    submission_deadline = Column(DateTime, nullable=False, index=True)
    competition_date = Column(DateTime, nullable=True)
    
    eligibility_criteria = Column(JSON, nullable=True)
    evaluation_criteria = Column(JSON, nullable=True)
    
    max_participants = Column(Integer, nullable=True)
    current_participants = Column(Integer, default=0, nullable=False)
    
    status = Column(SQLEnum(CompetitionStatus), default=CompetitionStatus.UPCOMING, nullable=False, index=True)
    
    winner_venture_id = Column(Integer, ForeignKey('student_ventures.id', ondelete='SET NULL'), nullable=True, index=True)
    runners_up = Column(ARRAY(Integer), nullable=True)
    
    leaderboard = Column(JSON, nullable=True)
    final_results = Column(JSON, nullable=True)
    
    recording_url = Column(String(500), nullable=True)
    highlights_url = Column(String(500), nullable=True)
    
    is_public = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    winner_venture = relationship("StudentVenture", foreign_keys=[winner_venture_id])
    submissions = relationship("PitchSubmission", back_populates="competition", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_pitch_competition_institution', 'institution_id'),
        Index('idx_pitch_competition_status', 'status'),
        Index('idx_pitch_competition_deadline', 'submission_deadline'),
        Index('idx_pitch_competition_winner', 'winner_venture_id'),
        Index('idx_pitch_competition_active', 'is_active'),
    )


class PitchSubmission(Base):
    __tablename__ = "pitch_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    competition_id = Column(Integer, ForeignKey('pitch_competitions.id', ondelete='CASCADE'), nullable=False, index=True)
    venture_id = Column(Integer, ForeignKey('student_ventures.id', ondelete='CASCADE'), nullable=False, index=True)
    
    pitch_video_url = Column(String(500), nullable=True)
    presentation_url = Column(String(500), nullable=True)
    supporting_documents = Column(JSON, nullable=True)
    
    submission_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    judge_scores = Column(JSON, nullable=True)
    total_score = Column(Numeric(5, 2), nullable=True)
    rank = Column(Integer, nullable=True)
    
    feedback = Column(JSON, nullable=True)
    audience_votes = Column(Integer, default=0, nullable=False)
    
    is_finalist = Column(Boolean, default=False, nullable=False)
    is_winner = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    competition = relationship("PitchCompetition", back_populates="submissions")
    venture = relationship("StudentVenture", back_populates="pitch_submissions")
    
    __table_args__ = (
        UniqueConstraint('competition_id', 'venture_id', name='uq_competition_venture_submission'),
        Index('idx_pitch_submission_institution', 'institution_id'),
        Index('idx_pitch_submission_competition', 'competition_id'),
        Index('idx_pitch_submission_venture', 'venture_id'),
        Index('idx_pitch_submission_score', 'total_score'),
        Index('idx_pitch_submission_winner', 'is_winner'),
    )


class EntrepreneurshipMentor(Base):
    __tablename__ = "entrepreneurship_mentors"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    
    expertise_areas = Column(JSON, nullable=False)
    industry_experience = Column(JSON, nullable=True)
    
    current_position = Column(String(200), nullable=True)
    company = Column(String(200), nullable=True)
    
    bio = Column(Text, nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    photo_url = Column(String(500), nullable=True)
    
    years_of_experience = Column(Integer, nullable=True)
    successful_ventures = Column(JSON, nullable=True)
    
    mentoring_capacity = Column(Integer, default=5, nullable=False)
    current_mentees = Column(Integer, default=0, nullable=False)
    
    available_for_mentoring = Column(Boolean, default=True, nullable=False)
    preferred_communication = Column(JSON, nullable=True)
    availability_schedule = Column(JSON, nullable=True)
    
    total_mentorships = Column(Integer, default=0, nullable=False)
    average_rating = Column(Numeric(3, 2), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    ventures = relationship("StudentVenture", back_populates="mentor")
    mentorships = relationship("MentorshipRelationship", back_populates="mentor", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_entrepreneurship_mentor_institution', 'institution_id'),
        Index('idx_entrepreneurship_mentor_user', 'user_id'),
        Index('idx_entrepreneurship_mentor_active', 'is_active'),
        Index('idx_entrepreneurship_mentor_available', 'available_for_mentoring'),
    )


class MentorshipRelationship(Base):
    __tablename__ = "mentorship_relationships"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    mentor_id = Column(Integer, ForeignKey('entrepreneurship_mentors.id', ondelete='CASCADE'), nullable=False, index=True)
    venture_id = Column(Integer, ForeignKey('student_ventures.id', ondelete='CASCADE'), nullable=False, index=True)
    
    match_score = Column(Numeric(5, 2), nullable=True)
    matching_criteria = Column(JSON, nullable=True)
    
    status = Column(SQLEnum(MentorshipStatus), default=MentorshipStatus.PENDING, nullable=False, index=True)
    
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    duration_weeks = Column(Integer, nullable=True)
    
    goals = Column(JSON, nullable=True)
    meeting_frequency = Column(String(50), nullable=True)
    total_meetings = Column(Integer, default=0, nullable=False)
    
    progress_notes = Column(JSON, nullable=True)
    student_feedback = Column(Text, nullable=True)
    mentor_feedback = Column(Text, nullable=True)
    
    student_rating = Column(Integer, nullable=True)
    mentor_rating = Column(Integer, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    mentor = relationship("EntrepreneurshipMentor", back_populates="mentorships")
    venture = relationship("StudentVenture")
    
    __table_args__ = (
        Index('idx_mentorship_institution', 'institution_id'),
        Index('idx_mentorship_mentor', 'mentor_id'),
        Index('idx_mentorship_venture', 'venture_id'),
        Index('idx_mentorship_status', 'status'),
    )


class VentureFundingRequest(Base):
    __tablename__ = "venture_funding_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    venture_id = Column(Integer, ForeignKey('student_ventures.id', ondelete='CASCADE'), nullable=False, index=True)
    
    amount_requested = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    
    funding_purpose = Column(Text, nullable=False)
    use_of_funds_breakdown = Column(JSON, nullable=True)
    
    justification = Column(Text, nullable=False)
    expected_outcomes = Column(Text, nullable=True)
    
    supporting_documents = Column(JSON, nullable=True)
    financial_projections = Column(JSON, nullable=True)
    
    status = Column(SQLEnum(FundingStatus), default=FundingStatus.REQUESTED, nullable=False, index=True)
    
    reviewed_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    review_date = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    
    approved_amount = Column(Numeric(12, 2), nullable=True)
    disbursed_amount = Column(Numeric(12, 2), nullable=True)
    disbursement_date = Column(Date, nullable=True)
    
    terms_and_conditions = Column(JSON, nullable=True)
    reporting_requirements = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    venture = relationship("StudentVenture", back_populates="funding_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    
    __table_args__ = (
        Index('idx_funding_request_institution', 'institution_id'),
        Index('idx_funding_request_venture', 'venture_id'),
        Index('idx_funding_request_status', 'status'),
        Index('idx_funding_request_reviewer', 'reviewed_by'),
    )
