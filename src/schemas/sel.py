from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum
from decimal import Decimal


class CASELCompetencyEnum(str, Enum):
    SELF_AWARENESS = "self_awareness"
    SELF_MANAGEMENT = "self_management"
    SOCIAL_AWARENESS = "social_awareness"
    RELATIONSHIP_SKILLS = "relationship_skills"
    RESPONSIBLE_DECISION_MAKING = "responsible_decision_making"


class AssessmentTypeEnum(str, Enum):
    TEACHER_RATING = "teacher_rating"
    SELF_ASSESSMENT = "self_assessment"
    PEER_ASSESSMENT = "peer_assessment"


class RubricLevelEnum(str, Enum):
    EMERGING = "emerging"
    DEVELOPING = "developing"
    PROFICIENT = "proficient"
    ADVANCED = "advanced"


class ObservationTypeEnum(str, Enum):
    BEHAVIORAL = "behavioral"
    INTERACTION = "interaction"
    CONFLICT_RESOLUTION = "conflict_resolution"
    EMOTIONAL_REGULATION = "emotional_regulation"
    COLLABORATION = "collaboration"
    LEADERSHIP = "leadership"


class SELCompetencyBase(BaseModel):
    competency_type: CASELCompetencyEnum
    name: str
    description: Optional[str] = None
    grade_level: Optional[str] = None
    rubric_emerging: Optional[str] = None
    rubric_developing: Optional[str] = None
    rubric_proficient: Optional[str] = None
    rubric_advanced: Optional[str] = None
    indicators: Optional[List[str]] = None
    weight: Optional[Decimal] = Field(default=Decimal("1.0"))


class SELCompetencyCreate(SELCompetencyBase):
    pass


class SELCompetencyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    grade_level: Optional[str] = None
    rubric_emerging: Optional[str] = None
    rubric_developing: Optional[str] = None
    rubric_proficient: Optional[str] = None
    rubric_advanced: Optional[str] = None
    indicators: Optional[List[str]] = None
    weight: Optional[Decimal] = None
    is_active: Optional[bool] = None


class SELCompetencyResponse(SELCompetencyBase):
    id: int
    institution_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SELAssessmentBase(BaseModel):
    student_id: int
    competency_id: int
    assessment_type: AssessmentTypeEnum
    rubric_level: RubricLevelEnum
    score: Decimal = Field(..., ge=0, le=4)
    max_score: Decimal = Field(default=Decimal("4.0"))
    notes: Optional[str] = None
    evidence: Optional[List[str]] = None
    strengths: Optional[List[str]] = None
    areas_for_growth: Optional[List[str]] = None
    assessment_date: date
    term: Optional[str] = None
    academic_year: Optional[str] = None


class SELAssessmentCreate(SELAssessmentBase):
    pass


class SELAssessmentUpdate(BaseModel):
    rubric_level: Optional[RubricLevelEnum] = None
    score: Optional[Decimal] = Field(None, ge=0, le=4)
    notes: Optional[str] = None
    evidence: Optional[List[str]] = None
    strengths: Optional[List[str]] = None
    areas_for_growth: Optional[List[str]] = None
    is_submitted: Optional[bool] = None


class SELAssessmentResponse(SELAssessmentBase):
    id: int
    institution_id: int
    assessor_id: Optional[int] = None
    is_submitted: bool
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SELObservationBase(BaseModel):
    student_id: int
    observation_type: ObservationTypeEnum
    title: str
    description: str
    context: Optional[str] = None
    competency_id: Optional[int] = None
    behaviors_observed: Optional[List[str]] = None
    impact_rating: Optional[int] = Field(None, ge=1, le=5)
    frequency: Optional[str] = None
    observation_date: date
    location: Optional[str] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[str]] = None
    is_positive: bool = True
    requires_followup: bool = False
    followup_notes: Optional[str] = None
    followup_date: Optional[date] = None


class SELObservationCreate(SELObservationBase):
    pass


class SELObservationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    context: Optional[str] = None
    competency_id: Optional[int] = None
    behaviors_observed: Optional[List[str]] = None
    impact_rating: Optional[int] = Field(None, ge=1, le=5)
    frequency: Optional[str] = None
    location: Optional[str] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[str]] = None
    is_positive: Optional[bool] = None
    requires_followup: Optional[bool] = None
    followup_notes: Optional[str] = None
    followup_date: Optional[date] = None


class SELObservationResponse(SELObservationBase):
    id: int
    institution_id: int
    observer_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PeerRelationshipBase(BaseModel):
    student_id: int
    peer_student_id: int
    relationship_type: str
    strength: Decimal = Field(..., ge=0, le=5)
    interaction_frequency: Optional[str] = None
    collaboration_quality: Optional[int] = Field(None, ge=1, le=5)
    conflict_incidents: int = 0
    positive_interactions: int = 0
    notes: Optional[str] = None
    last_interaction_date: Optional[date] = None
    first_observed_date: date


class PeerRelationshipCreate(PeerRelationshipBase):
    pass


class PeerRelationshipUpdate(BaseModel):
    relationship_type: Optional[str] = None
    strength: Optional[Decimal] = Field(None, ge=0, le=5)
    interaction_frequency: Optional[str] = None
    collaboration_quality: Optional[int] = Field(None, ge=1, le=5)
    conflict_incidents: Optional[int] = None
    positive_interactions: Optional[int] = None
    notes: Optional[str] = None
    last_interaction_date: Optional[date] = None
    is_active: Optional[bool] = None


class PeerRelationshipResponse(PeerRelationshipBase):
    id: int
    institution_id: int
    observed_by: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompetencyScore(BaseModel):
    competency_type: CASELCompetencyEnum
    score: Decimal
    level: Optional[RubricLevelEnum] = None
    assessment_count: int
    trend: Optional[str] = None


class GrowthIndicator(BaseModel):
    period: str
    score: Decimal
    date: date


class SELGrowthTrackingResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    competency_type: CASELCompetencyEnum
    period_start: date
    period_end: date
    baseline_score: Optional[Decimal] = None
    current_score: Decimal
    growth_percentage: Decimal
    assessment_count: int
    teacher_ratings_avg: Optional[Decimal] = None
    self_assessment_avg: Optional[Decimal] = None
    peer_assessment_avg: Optional[Decimal] = None
    trend: Optional[str] = None
    percentile_rank: Optional[int] = None
    strengths: Optional[List[str]] = None
    areas_for_improvement: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    last_calculated_at: datetime

    class Config:
        from_attributes = True


class SELProgressReportCreate(BaseModel):
    student_id: int
    report_type: str
    period_start: date
    period_end: date
    term: Optional[str] = None
    academic_year: Optional[str] = None
    teacher_comments: Optional[str] = None


class SELProgressReportResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    report_type: str
    period_start: date
    period_end: date
    term: Optional[str] = None
    academic_year: Optional[str] = None
    overall_score: Decimal
    overall_level: Optional[RubricLevelEnum] = None
    self_awareness_score: Optional[Decimal] = None
    self_management_score: Optional[Decimal] = None
    social_awareness_score: Optional[Decimal] = None
    relationship_skills_score: Optional[Decimal] = None
    responsible_decision_making_score: Optional[Decimal] = None
    growth_summary: Optional[Dict[str, Any]] = None
    competency_details: Optional[Dict[str, Any]] = None
    observations_summary: Optional[Dict[str, Any]] = None
    peer_relationships_summary: Optional[Dict[str, Any]] = None
    strengths: Optional[List[str]] = None
    areas_for_growth: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    teacher_comments: Optional[str] = None
    generated_by: Optional[int] = None
    generated_at: datetime
    shared_with_parent: bool
    parent_viewed_at: Optional[datetime] = None
    parent_feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SELAnalyticsResponse(BaseModel):
    student_id: int
    period_start: date
    period_end: date
    overall_score: Decimal
    overall_level: RubricLevelEnum
    competency_scores: List[CompetencyScore]
    growth_indicators: List[GrowthIndicator]
    total_assessments: int
    total_observations: int
    peer_connections: int
    positive_observations_percentage: Decimal
    strengths: List[str]
    areas_for_growth: List[str]


class StudentSELDashboard(BaseModel):
    student_id: int
    student_name: str
    current_period_score: Decimal
    previous_period_score: Optional[Decimal] = None
    growth_percentage: Decimal
    competency_breakdown: List[CompetencyScore]
    recent_assessments: List[SELAssessmentResponse]
    recent_observations: List[SELObservationResponse]
    peer_relationship_count: int
    recommendations: List[str]


class ParentProgressReport(BaseModel):
    report_id: int
    student_name: str
    period: str
    overall_score: Decimal
    overall_level: RubricLevelEnum
    competency_scores: Dict[str, Decimal]
    growth_summary: str
    strengths: List[str]
    areas_for_growth: List[str]
    teacher_comments: Optional[str] = None
    visual_progress: List[GrowthIndicator]
    peer_relationships_summary: Optional[Dict[str, Any]] = None
    recommendations: List[str]
