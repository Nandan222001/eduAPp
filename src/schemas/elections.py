from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ElectionBase(BaseModel):
    election_title: str = Field(..., max_length=255)
    description: Optional[str] = None
    position: str
    eligible_voters: str
    grade_level: Optional[str] = None
    nomination_start: datetime
    nomination_end: datetime
    campaign_period_start: datetime
    campaign_period_end: datetime
    voting_start: datetime
    voting_end: datetime
    enable_ranked_choice: bool = False
    max_ranking_choices: Optional[int] = 3
    require_campaign_materials: bool = False
    allow_write_ins: bool = False
    voting_instructions: Optional[str] = None


class ElectionCreate(ElectionBase):
    institution_id: int


class ElectionUpdate(BaseModel):
    election_title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    position: Optional[str] = None
    eligible_voters: Optional[str] = None
    grade_level: Optional[str] = None
    nomination_start: Optional[datetime] = None
    nomination_end: Optional[datetime] = None
    campaign_period_start: Optional[datetime] = None
    campaign_period_end: Optional[datetime] = None
    voting_start: Optional[datetime] = None
    voting_end: Optional[datetime] = None
    election_status: Optional[str] = None
    enable_ranked_choice: Optional[bool] = None
    max_ranking_choices: Optional[int] = None
    require_campaign_materials: Optional[bool] = None
    allow_write_ins: Optional[bool] = None
    voting_instructions: Optional[str] = None


class ElectionResponse(ElectionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_by: int
    election_status: str
    results_published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ElectionWithStats(ElectionResponse):
    total_candidates: int = 0
    total_eligible_voters: int = 0
    total_votes_cast: int = 0
    voter_turnout_percentage: Optional[str] = None


class CandidateBase(BaseModel):
    position: str
    campaign_statement: Optional[str] = None
    campaign_platform_points: Optional[List[str]] = None
    campaign_poster_url: Optional[str] = Field(None, max_length=500)
    speech_video_url: Optional[str] = Field(None, max_length=500)
    endorsements: Optional[List[Dict[str, Any]]] = None
    campaign_budget: Optional[int] = None


class CandidateCreate(CandidateBase):
    election_id: int
    student_id: int


class CandidateUpdate(BaseModel):
    campaign_statement: Optional[str] = None
    campaign_platform_points: Optional[List[str]] = None
    campaign_poster_url: Optional[str] = Field(None, max_length=500)
    speech_video_url: Optional[str] = Field(None, max_length=500)
    endorsements: Optional[List[Dict[str, Any]]] = None
    campaign_budget: Optional[int] = None
    campaign_spending: Optional[int] = None
    candidate_status: Optional[str] = None
    withdrawal_reason: Optional[str] = None


class CandidateResponse(CandidateBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    election_id: int
    student_id: int
    nominated_by: Optional[int] = None
    nomination_date: datetime
    approval_date: Optional[datetime] = None
    approved_by: Optional[int] = None
    candidate_status: str
    rejection_reason: Optional[str] = None
    withdrawal_reason: Optional[str] = None
    withdrawal_date: Optional[datetime] = None
    campaign_spending: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class CandidateWithStudent(CandidateResponse):
    student_name: str
    student_email: Optional[str] = None
    student_photo_url: Optional[str] = None


class CandidateWithVotes(CandidateWithStudent):
    total_votes: int = 0
    first_choice_votes: Optional[int] = None
    second_choice_votes: Optional[int] = None
    third_choice_votes: Optional[int] = None


class VoteCreate(BaseModel):
    election_id: int
    candidate_id: int
    rank_position: Optional[int] = None


class RankedChoiceVote(BaseModel):
    election_id: int
    ranked_candidates: List[int] = Field(..., min_length=1, max_length=10)


class VoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    election_id: int
    vote_hash: str
    verification_code: Optional[str] = None
    vote_status: str
    timestamp: datetime


class VoteCastResponse(BaseModel):
    success: bool
    message: str
    vote_hash: str
    verification_code: str
    timestamp: datetime


class CandidateApprovalRequest(BaseModel):
    candidate_status: str
    rejection_reason: Optional[str] = None


class ElectionResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    election_id: int
    candidate_id: int
    total_votes: int
    first_choice_votes: Optional[int] = None
    second_choice_votes: Optional[int] = None
    third_choice_votes: Optional[int] = None
    total_points: Optional[int] = None
    vote_percentage: Optional[str] = None
    rank_position: Optional[int] = None
    is_winner: bool
    rounds_data: Optional[Dict[str, Any]] = None
    calculated_at: datetime


class ElectionResultWithCandidate(ElectionResultResponse):
    candidate_name: str
    candidate_photo_url: Optional[str] = None
    campaign_statement: Optional[str] = None


class CampaignActivityBase(BaseModel):
    activity_type: str = Field(..., max_length=100)
    activity_title: str = Field(..., max_length=255)
    activity_description: Optional[str] = None
    activity_date: datetime
    location: Optional[str] = Field(None, max_length=255)
    attendees_count: Optional[int] = None
    media_urls: Optional[List[str]] = None


class CampaignActivityCreate(CampaignActivityBase):
    candidate_id: int


class CampaignActivityUpdate(BaseModel):
    activity_type: Optional[str] = Field(None, max_length=100)
    activity_title: Optional[str] = Field(None, max_length=255)
    activity_description: Optional[str] = None
    activity_date: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=255)
    attendees_count: Optional[int] = None
    media_urls: Optional[List[str]] = None


class CampaignActivityResponse(CampaignActivityBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    candidate_id: int
    created_at: datetime
    updated_at: datetime


class ElectionAnalyticsResponse(BaseModel):
    election_id: int
    total_eligible_voters: int
    total_votes_cast: int
    voter_turnout_percentage: float
    votes_by_grade: Dict[str, int]
    votes_by_hour: Dict[str, int]
    campaign_engagement: Dict[str, Any]
    candidate_statistics: List[Dict[str, Any]]


class VoterRegistryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    election_id: int
    student_id: int
    has_voted: bool
    voted_at: Optional[datetime] = None
    is_eligible: bool
    registered_at: datetime
