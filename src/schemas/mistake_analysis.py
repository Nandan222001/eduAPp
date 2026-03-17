from datetime import datetime
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from src.models.mistake_analysis import MistakeType, RemediationStatus, EarnedVia


class MistakePatternBase(BaseModel):
    student_id: int
    subject_id: int
    chapter_id: Optional[int] = None
    mistake_type: MistakeType
    frequency_count: int = Field(default=1, ge=1)
    total_marks_lost: Decimal = Field(default=Decimal("0"), ge=0)
    remediation_status: RemediationStatus = RemediationStatus.UNRESOLVED
    examples: Optional[List[Dict[str, Any]]] = None


class MistakePatternCreate(MistakePatternBase):
    first_detected_at: datetime
    last_detected_at: datetime


class MistakePatternUpdate(BaseModel):
    frequency_count: Optional[int] = Field(None, ge=1)
    total_marks_lost: Optional[Decimal] = Field(None, ge=0)
    last_detected_at: Optional[datetime] = None
    remediation_status: Optional[RemediationStatus] = None
    examples: Optional[List[Dict[str, Any]]] = None


class MistakePatternResponse(MistakePatternBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_detected_at: datetime
    last_detected_at: datetime
    created_at: datetime
    updated_at: datetime


class MistakeInsuranceTokenBase(BaseModel):
    student_id: int
    earned_via: EarnedVia


class MistakeInsuranceTokenCreate(MistakeInsuranceTokenBase):
    pass


class MistakeInsuranceTokenUpdate(BaseModel):
    used_at: Optional[datetime] = None
    used_for_exam_id: Optional[int] = None


class MistakeInsuranceTokenResponse(MistakeInsuranceTokenBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    earned_at: datetime
    used_at: Optional[datetime] = None
    used_for_exam_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class InsuranceReviewBase(BaseModel):
    token_id: int
    exam_id: int
    original_score: Decimal = Field(..., ge=0)
    revised_score: Decimal = Field(..., ge=0)
    mistakes_corrected: List[Dict[str, Any]]
    student_explanation: Optional[str] = None


class InsuranceReviewCreate(InsuranceReviewBase):
    pass


class InsuranceReviewResponse(InsuranceReviewBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    reviewed_at: datetime
    created_at: datetime
    updated_at: datetime


class MistakeAnalysisRequest(BaseModel):
    student_id: int
    exam_id: Optional[int] = None
    assignment_id: Optional[int] = None
    subject_id: Optional[int] = None


class CorrectionPlanItem(BaseModel):
    mistake_type: MistakeType
    frequency: int
    marks_lost: Decimal
    recommended_actions: List[str]
    practice_resources: List[str]


class CorrectionPlanResponse(BaseModel):
    student_id: int
    subject_id: Optional[int] = None
    overall_summary: str
    correction_items: List[CorrectionPlanItem]
    estimated_improvement_potential: Decimal


class InsuranceClaimRequest(BaseModel):
    token_id: int
    exam_id: int
    mistakes_corrected: List[Dict[str, Any]]
    student_explanation: Optional[str] = None


class InsuranceClaimValidationResponse(BaseModel):
    is_valid: bool
    eligible_marks_recovery: Decimal
    max_recovery_cap: Decimal
    validation_errors: List[str]
    correctable_mistakes: List[Dict[str, Any]]


class InsuranceClaimResponse(BaseModel):
    review_id: int
    original_score: Decimal
    revised_score: Decimal
    marks_recovered: Decimal
    success: bool
    message: str


class StudentMistakeSummary(BaseModel):
    student_id: int
    total_patterns: int
    patterns_by_type: Dict[str, int]
    total_marks_lost: Decimal
    unresolved_count: int
    in_progress_count: int
    mastered_count: int
    available_tokens: int
    used_tokens: int


class SubjectMistakeAnalysis(BaseModel):
    subject_id: int
    subject_name: Optional[str] = None
    patterns: List[MistakePatternResponse]
    total_frequency: int
    total_marks_lost: Decimal
    most_common_mistake: Optional[MistakeType] = None
