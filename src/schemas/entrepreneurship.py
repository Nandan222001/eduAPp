from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from decimal import Decimal


class StudentVentureBase(BaseModel):
    venture_name: str = Field(..., max_length=200)
    tagline: Optional[str] = Field(None, max_length=300)
    founder_students: List[int]
    business_idea: str
    problem_statement: str
    solution: str
    target_market: str
    revenue_model: Optional[str] = None
    pitch_deck_url: Optional[str] = None
    business_plan_url: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    funding_requested: Optional[Decimal] = None
    currency: str = "USD"
    social_impact: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    milestones: Optional[List[Dict[str, Any]]] = None
    team_roles: Optional[Dict[str, str]] = None


class StudentVentureCreate(StudentVentureBase):
    institution_id: int
    primary_founder_id: int


class StudentVentureUpdate(BaseModel):
    venture_name: Optional[str] = Field(None, max_length=200)
    tagline: Optional[str] = Field(None, max_length=300)
    business_idea: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    target_market: Optional[str] = None
    revenue_model: Optional[str] = None
    pitch_deck_url: Optional[str] = None
    business_plan_url: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    funding_requested: Optional[Decimal] = None
    venture_status: Optional[str] = None
    social_impact: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    milestones: Optional[List[Dict[str, Any]]] = None
    team_roles: Optional[Dict[str, str]] = None
    customers: Optional[int] = None
    revenue: Optional[Decimal] = None


class StudentVentureResponse(StudentVentureBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    primary_founder_id: int
    mentor_id: Optional[int] = None
    funding_received: Decimal
    venture_status: str
    customers: int
    revenue: Decimal
    achievements: Optional[List[Dict[str, Any]]] = None
    pitch_competition_participations: Optional[List[int]] = None
    awards: Optional[List[Dict[str, Any]]] = None
    is_active: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime


class PitchCompetitionBase(BaseModel):
    competition_name: str = Field(..., max_length=200)
    description: str
    theme: Optional[str] = Field(None, max_length=200)
    judges: Optional[List[int]] = None
    judge_details: Optional[List[Dict[str, Any]]] = None
    prize_pool: Optional[Decimal] = None
    currency: str = "USD"
    prizes: Optional[List[Dict[str, Any]]] = None
    submission_deadline: datetime
    competition_date: Optional[datetime] = None
    eligibility_criteria: Optional[Dict[str, Any]] = None
    evaluation_criteria: Optional[List[Dict[str, Any]]] = None
    max_participants: Optional[int] = None


class PitchCompetitionCreate(PitchCompetitionBase):
    institution_id: int


class PitchCompetitionUpdate(BaseModel):
    competition_name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    theme: Optional[str] = Field(None, max_length=200)
    judges: Optional[List[int]] = None
    judge_details: Optional[List[Dict[str, Any]]] = None
    prize_pool: Optional[Decimal] = None
    prizes: Optional[List[Dict[str, Any]]] = None
    submission_deadline: Optional[datetime] = None
    competition_date: Optional[datetime] = None
    eligibility_criteria: Optional[Dict[str, Any]] = None
    evaluation_criteria: Optional[List[Dict[str, Any]]] = None
    max_participants: Optional[int] = None
    status: Optional[str] = None
    winner_venture_id: Optional[int] = None
    runners_up: Optional[List[int]] = None
    leaderboard: Optional[List[Dict[str, Any]]] = None
    final_results: Optional[Dict[str, Any]] = None
    recording_url: Optional[str] = None
    highlights_url: Optional[str] = None
    is_public: Optional[bool] = None


class PitchCompetitionResponse(PitchCompetitionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    current_participants: int
    status: str
    winner_venture_id: Optional[int] = None
    runners_up: Optional[List[int]] = None
    leaderboard: Optional[List[Dict[str, Any]]] = None
    final_results: Optional[Dict[str, Any]] = None
    recording_url: Optional[str] = None
    highlights_url: Optional[str] = None
    is_public: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PitchSubmissionBase(BaseModel):
    pitch_video_url: Optional[str] = None
    presentation_url: Optional[str] = None
    supporting_documents: Optional[List[Dict[str, Any]]] = None


class PitchSubmissionCreate(PitchSubmissionBase):
    institution_id: int
    competition_id: int
    venture_id: int


class PitchSubmissionUpdate(BaseModel):
    pitch_video_url: Optional[str] = None
    presentation_url: Optional[str] = None
    supporting_documents: Optional[List[Dict[str, Any]]] = None


class PitchSubmissionResponse(PitchSubmissionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    competition_id: int
    venture_id: int
    submission_date: datetime
    judge_scores: Optional[Dict[str, Any]] = None
    total_score: Optional[Decimal] = None
    rank: Optional[int] = None
    feedback: Optional[List[Dict[str, Any]]] = None
    audience_votes: int
    is_finalist: bool
    is_winner: bool
    created_at: datetime
    updated_at: datetime


class EntrepreneurshipMentorBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    expertise_areas: List[Dict[str, Any]]
    industry_experience: Optional[List[Dict[str, Any]]] = None
    current_position: Optional[str] = Field(None, max_length=200)
    company: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    photo_url: Optional[str] = None
    years_of_experience: Optional[int] = None
    successful_ventures: Optional[List[Dict[str, Any]]] = None
    mentoring_capacity: int = 5
    preferred_communication: Optional[List[str]] = None
    availability_schedule: Optional[Dict[str, Any]] = None


class EntrepreneurshipMentorCreate(EntrepreneurshipMentorBase):
    institution_id: Optional[int] = None
    user_id: Optional[int] = None


class EntrepreneurshipMentorUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    expertise_areas: Optional[List[Dict[str, Any]]] = None
    industry_experience: Optional[List[Dict[str, Any]]] = None
    current_position: Optional[str] = Field(None, max_length=200)
    company: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    photo_url: Optional[str] = None
    years_of_experience: Optional[int] = None
    successful_ventures: Optional[List[Dict[str, Any]]] = None
    mentoring_capacity: Optional[int] = None
    preferred_communication: Optional[List[str]] = None
    availability_schedule: Optional[Dict[str, Any]] = None
    available_for_mentoring: Optional[bool] = None


class EntrepreneurshipMentorResponse(EntrepreneurshipMentorBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: Optional[int] = None
    user_id: Optional[int] = None
    current_mentees: int
    available_for_mentoring: bool
    total_mentorships: int
    average_rating: Optional[Decimal] = None
    is_active: bool
    is_verified: bool
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class MentorshipRelationshipBase(BaseModel):
    goals: Optional[List[str]] = None
    meeting_frequency: Optional[str] = Field(None, max_length=50)


class MentorshipRelationshipCreate(MentorshipRelationshipBase):
    institution_id: int
    mentor_id: int
    venture_id: int


class MentorshipRelationshipUpdate(BaseModel):
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_weeks: Optional[int] = None
    goals: Optional[List[str]] = None
    meeting_frequency: Optional[str] = None
    total_meetings: Optional[int] = None
    progress_notes: Optional[List[Dict[str, Any]]] = None
    student_feedback: Optional[str] = None
    mentor_feedback: Optional[str] = None
    student_rating: Optional[int] = Field(None, ge=1, le=5)
    mentor_rating: Optional[int] = Field(None, ge=1, le=5)


class MentorshipRelationshipResponse(MentorshipRelationshipBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    mentor_id: int
    venture_id: int
    match_score: Optional[Decimal] = None
    matching_criteria: Optional[Dict[str, Any]] = None
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_weeks: Optional[int] = None
    total_meetings: int
    progress_notes: Optional[List[Dict[str, Any]]] = None
    student_feedback: Optional[str] = None
    mentor_feedback: Optional[str] = None
    student_rating: Optional[int] = None
    mentor_rating: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class VentureFundingRequestBase(BaseModel):
    amount_requested: Decimal
    currency: str = "USD"
    funding_purpose: str
    use_of_funds_breakdown: Optional[Dict[str, Decimal]] = None
    justification: str
    expected_outcomes: Optional[str] = None
    supporting_documents: Optional[List[Dict[str, Any]]] = None
    financial_projections: Optional[Dict[str, Any]] = None


class VentureFundingRequestCreate(VentureFundingRequestBase):
    institution_id: int
    venture_id: int


class VentureFundingRequestUpdate(BaseModel):
    status: Optional[str] = None
    review_notes: Optional[str] = None
    approved_amount: Optional[Decimal] = None
    disbursed_amount: Optional[Decimal] = None
    disbursement_date: Optional[date] = None
    terms_and_conditions: Optional[Dict[str, Any]] = None
    reporting_requirements: Optional[List[str]] = None


class VentureFundingRequestResponse(VentureFundingRequestBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    venture_id: int
    status: str
    reviewed_by: Optional[int] = None
    review_date: Optional[datetime] = None
    review_notes: Optional[str] = None
    approved_amount: Optional[Decimal] = None
    disbursed_amount: Optional[Decimal] = None
    disbursement_date: Optional[date] = None
    terms_and_conditions: Optional[Dict[str, Any]] = None
    reporting_requirements: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime


class MentorMatchRequest(BaseModel):
    venture_id: int
    preferred_expertise: Optional[List[str]] = None
    preferred_industry: Optional[str] = None


class SubmitPitchRequest(BaseModel):
    competition_id: int
    venture_id: int
    pitch_video_url: Optional[str] = None
    presentation_url: Optional[str] = None
    supporting_documents: Optional[List[Dict[str, Any]]] = None


class JudgeScoreRequest(BaseModel):
    submission_id: int
    judge_id: int
    scores: Dict[str, Decimal]
    feedback: Optional[str] = None


class VentureShowcaseFilter(BaseModel):
    status: Optional[str] = None
    has_mentor: Optional[bool] = None
    min_funding: Optional[Decimal] = None
    is_featured: Optional[bool] = None
    search_query: Optional[str] = None
