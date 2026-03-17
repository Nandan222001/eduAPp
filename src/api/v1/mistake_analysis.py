from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.mistake_analysis import RemediationStatus, EarnedVia
from src.schemas.mistake_analysis import (
    MistakePatternResponse, MistakePatternUpdate,
    MistakeInsuranceTokenResponse, MistakeInsuranceTokenCreate,
    InsuranceReviewResponse,
    MistakeAnalysisRequest, CorrectionPlanResponse,
    InsuranceClaimRequest, InsuranceClaimValidationResponse, InsuranceClaimResponse,
    StudentMistakeSummary, SubjectMistakeAnalysis
)
from src.services.mistake_analysis_service import MistakeAnalysisService

router = APIRouter(prefix="/mistake-analysis", tags=["Mistake Analysis"])


@router.post("/detect", response_model=List[MistakePatternResponse])
def detect_mistake_patterns(
    request: MistakeAnalysisRequest,
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    patterns = service.detect_patterns(request)
    return patterns


@router.get("/students/{student_id}/summary", response_model=StudentMistakeSummary)
def get_student_mistake_summary(
    student_id: int,
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    summary = service.get_student_summary(student_id)
    return summary


@router.get("/students/{student_id}/patterns", response_model=List[MistakePatternResponse])
def get_student_patterns(
    student_id: int,
    subject_id: Optional[int] = Query(None),
    remediation_status: Optional[RemediationStatus] = Query(None),
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    patterns = service.pattern_repo.get_student_patterns(
        student_id=student_id,
        subject_id=subject_id,
        remediation_status=remediation_status
    )
    return [MistakePatternResponse.model_validate(p) for p in patterns]


@router.get("/students/{student_id}/subjects/{subject_id}/analysis", response_model=SubjectMistakeAnalysis)
def get_subject_analysis(
    student_id: int,
    subject_id: int,
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    analysis = service.get_subject_analysis(student_id, subject_id)
    return analysis


@router.get("/students/{student_id}/marks-impact")
def calculate_marks_impact(
    student_id: int,
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    impact = service.calculate_marks_impact(student_id, subject_id)
    return impact


@router.get("/students/{student_id}/correction-plan", response_model=CorrectionPlanResponse)
def generate_correction_plan(
    student_id: int,
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    plan = service.generate_correction_plan(student_id, subject_id)
    return plan


@router.patch("/patterns/{pattern_id}/status", response_model=MistakePatternResponse)
def update_pattern_remediation_status(
    pattern_id: int,
    status: RemediationStatus,
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    pattern = service.update_pattern_status(pattern_id, status)
    if not pattern:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pattern not found"
        )
    return pattern


@router.post("/insurance/tokens", response_model=MistakeInsuranceTokenResponse, status_code=status.HTTP_201_CREATED)
def create_insurance_token(
    token_data: MistakeInsuranceTokenCreate,
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    token = service.create_insurance_token(
        student_id=token_data.student_id,
        earned_via=token_data.earned_via
    )
    return token


@router.get("/insurance/students/{student_id}/tokens", response_model=List[MistakeInsuranceTokenResponse])
def get_student_insurance_tokens(
    student_id: int,
    include_used: bool = Query(True),
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    tokens = service.get_student_tokens(student_id, include_used)
    return tokens


@router.post("/insurance/validate-claim", response_model=InsuranceClaimValidationResponse)
def validate_insurance_claim(
    request: InsuranceClaimRequest,
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    validation = service.validate_insurance_claim(request)
    return validation


@router.post("/insurance/process-claim", response_model=InsuranceClaimResponse)
def process_insurance_claim(
    request: InsuranceClaimRequest,
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    result = service.process_insurance_claim(request)
    return result


@router.get("/insurance/reviews/{review_id}", response_model=InsuranceReviewResponse)
def get_insurance_review(
    review_id: int,
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    review = service.review_repo.get_review_by_id(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return InsuranceReviewResponse.model_validate(review)


@router.get("/insurance/exams/{exam_id}/reviews", response_model=List[InsuranceReviewResponse])
def get_exam_insurance_reviews(
    exam_id: int,
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    reviews = service.review_repo.get_reviews_by_exam(exam_id)
    return [InsuranceReviewResponse.model_validate(r) for r in reviews]


@router.get("/insurance/students/{student_id}/reviews", response_model=List[InsuranceReviewResponse])
def get_student_insurance_reviews(
    student_id: int,
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    reviews = service.review_repo.get_student_reviews(student_id)
    return [InsuranceReviewResponse.model_validate(r) for r in reviews]
