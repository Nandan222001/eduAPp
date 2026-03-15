from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from src.database import Base


class ElectionPosition(str, Enum):
    PRESIDENT = "president"
    VICE_PRESIDENT = "vice_president"
    SECRETARY = "secretary"
    TREASURER = "treasurer"
    CLASS_REPRESENTATIVE = "class_representative"


class EligibleVoters(str, Enum):
    GRADE_9 = "grade_9"
    GRADE_10 = "grade_10"
    GRADE_11 = "grade_11"
    GRADE_12 = "grade_12"
    WHOLE_SCHOOL = "whole_school"


class ElectionStatus(str, Enum):
    DRAFT = "draft"
    NOMINATION_OPEN = "nomination_open"
    NOMINATION_CLOSED = "nomination_closed"
    CAMPAIGN_PERIOD = "campaign_period"
    VOTING_OPEN = "voting_open"
    VOTING_CLOSED = "voting_closed"
    RESULTS_ANNOUNCED = "results_announced"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CandidateStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class VoteStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    COUNTED = "counted"
    INVALID = "invalid"


class Election(Base):
    __tablename__ = "elections"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    election_title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    position = Column(String(50), nullable=False, index=True)
    eligible_voters = Column(String(50), nullable=False)
    grade_level = Column(String(50), nullable=True)
    nomination_start = Column(DateTime, nullable=False)
    nomination_end = Column(DateTime, nullable=False)
    campaign_period_start = Column(DateTime, nullable=False)
    campaign_period_end = Column(DateTime, nullable=False)
    voting_start = Column(DateTime, nullable=False)
    voting_end = Column(DateTime, nullable=False)
    election_status = Column(String(50), default=ElectionStatus.DRAFT.value, nullable=False, index=True)
    enable_ranked_choice = Column(Boolean, default=False, nullable=False)
    max_ranking_choices = Column(Integer, default=3, nullable=True)
    require_campaign_materials = Column(Boolean, default=False, nullable=False)
    allow_write_ins = Column(Boolean, default=False, nullable=False)
    voting_instructions = Column(Text, nullable=True)
    results_published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    creator = relationship("User", foreign_keys=[created_by])
    candidates = relationship("Candidate", back_populates="election", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="election", cascade="all, delete-orphan")
    election_results = relationship("ElectionResult", back_populates="election", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_election_institution', 'institution_id'),
        Index('idx_election_status', 'election_status'),
        Index('idx_election_position', 'position'),
        Index('idx_election_dates', 'voting_start', 'voting_end'),
    )


class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey('elections.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    nominated_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    position = Column(String(50), nullable=False)
    campaign_statement = Column(Text, nullable=True)
    campaign_platform_points = Column(JSON, nullable=True)
    campaign_poster_url = Column(String(500), nullable=True)
    speech_video_url = Column(String(500), nullable=True)
    endorsements = Column(JSON, nullable=True)
    nomination_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    approval_date = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    candidate_status = Column(String(50), default=CandidateStatus.PENDING.value, nullable=False, index=True)
    rejection_reason = Column(Text, nullable=True)
    withdrawal_reason = Column(Text, nullable=True)
    withdrawal_date = Column(DateTime, nullable=True)
    campaign_budget = Column(Integer, nullable=True)
    campaign_spending = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    election = relationship("Election", back_populates="candidates")
    student = relationship("Student")
    nominator = relationship("User", foreign_keys=[nominated_by])
    approver = relationship("User", foreign_keys=[approved_by])
    votes_received = relationship("Vote", back_populates="candidate", cascade="all, delete-orphan")
    campaign_activities = relationship("CampaignActivity", back_populates="candidate", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('election_id', 'student_id', name='uq_election_student_candidate'),
        Index('idx_candidate_election', 'election_id'),
        Index('idx_candidate_student', 'student_id'),
        Index('idx_candidate_status', 'candidate_status'),
    )


class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey('elections.id', ondelete='CASCADE'), nullable=False, index=True)
    voter_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id', ondelete='CASCADE'), nullable=False, index=True)
    encrypted_vote = Column(String(1000), nullable=False)
    vote_hash = Column(String(255), nullable=False, index=True)
    voter_hash = Column(String(255), nullable=False, index=True)
    rank_position = Column(Integer, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    vote_status = Column(String(50), default=VoteStatus.PENDING.value, nullable=False, index=True)
    verification_code = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    election = relationship("Election", back_populates="votes")
    voter = relationship("Student", foreign_keys=[voter_student_id])
    candidate = relationship("Candidate", back_populates="votes_received")
    
    __table_args__ = (
        Index('idx_vote_election', 'election_id'),
        Index('idx_vote_voter', 'voter_student_id'),
        Index('idx_vote_candidate', 'candidate_id'),
        Index('idx_vote_hash', 'vote_hash'),
        Index('idx_vote_timestamp', 'timestamp'),
        Index('idx_vote_status', 'vote_status'),
    )


class VoterRegistry(Base):
    __tablename__ = "voter_registry"
    
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey('elections.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    voter_token = Column(String(255), nullable=False, unique=True, index=True)
    has_voted = Column(Boolean, default=False, nullable=False, index=True)
    voted_at = Column(DateTime, nullable=True)
    is_eligible = Column(Boolean, default=True, nullable=False)
    verification_sent = Column(Boolean, default=False, nullable=False)
    registered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    election = relationship("Election")
    student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('election_id', 'student_id', name='uq_election_voter'),
        Index('idx_voter_registry_election', 'election_id'),
        Index('idx_voter_registry_student', 'student_id'),
        Index('idx_voter_registry_token', 'voter_token'),
        Index('idx_voter_registry_voted', 'has_voted'),
    )


class ElectionResult(Base):
    __tablename__ = "election_results"
    
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey('elections.id', ondelete='CASCADE'), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id', ondelete='CASCADE'), nullable=False, index=True)
    total_votes = Column(Integer, default=0, nullable=False)
    first_choice_votes = Column(Integer, default=0, nullable=True)
    second_choice_votes = Column(Integer, default=0, nullable=True)
    third_choice_votes = Column(Integer, default=0, nullable=True)
    total_points = Column(Integer, default=0, nullable=True)
    vote_percentage = Column(String(10), nullable=True)
    rank_position = Column(Integer, nullable=True)
    is_winner = Column(Boolean, default=False, nullable=False)
    rounds_data = Column(JSON, nullable=True)
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    election = relationship("Election", back_populates="election_results")
    candidate = relationship("Candidate")
    
    __table_args__ = (
        UniqueConstraint('election_id', 'candidate_id', name='uq_election_candidate_result'),
        Index('idx_election_result_election', 'election_id'),
        Index('idx_election_result_candidate', 'candidate_id'),
        Index('idx_election_result_winner', 'is_winner'),
    )


class CampaignActivity(Base):
    __tablename__ = "campaign_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id', ondelete='CASCADE'), nullable=False, index=True)
    activity_type = Column(String(100), nullable=False)
    activity_title = Column(String(255), nullable=False)
    activity_description = Column(Text, nullable=True)
    activity_date = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=True)
    attendees_count = Column(Integer, nullable=True)
    media_urls = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    candidate = relationship("Candidate", back_populates="campaign_activities")
    
    __table_args__ = (
        Index('idx_campaign_activity_candidate', 'candidate_id'),
        Index('idx_campaign_activity_date', 'activity_date'),
    )


class ElectionAnalytics(Base):
    __tablename__ = "election_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey('elections.id', ondelete='CASCADE'), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(String(255), nullable=False)
    metric_data = Column(JSON, nullable=True)
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    election = relationship("Election")
    
    __table_args__ = (
        Index('idx_election_analytics_election', 'election_id'),
        Index('idx_election_analytics_metric', 'metric_name'),
    )
