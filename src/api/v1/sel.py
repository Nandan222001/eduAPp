from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from src.database import get_db
from src.schemas.sel import (
    SELCompetencyCreate,
    SELCompetencyUpdate,
    SELCompetencyResponse,
    SELAssessmentCreate,
    SELAssessmentUpdate,
    SELAssessmentResponse,
    SELObservationCreate,
    SELObservationUpdate,
    SELObservationResponse,
    PeerRelationshipCreate,
    PeerRelationshipUpdate,
    PeerRelationshipResponse,
    SELGrowthTrackingResponse,
    SELProgressReportCreate,
    SELProgressReportResponse,
    SELAnalyticsResponse,
    StudentSELDashboard,
    ParentProgressReport,
)
from src.services.sel_service import SELService
from src.dependencies.auth import get_current_user
from src.models.user import User

router = APIRouter()


@router.post("/competencies", response_model=SELCompetencyResponse, status_code=status.HTTP_201_CREATED)
async def create_competency(
    competency_data: SELCompetencyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.create_competency(current_user.institution_id, competency_data)


@router.get("/competencies", response_model=List[SELCompetencyResponse])
async def get_competencies(
    competency_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.get_competencies(current_user.institution_id, competency_type, skip, limit)


@router.get("/competencies/{competency_id}", response_model=SELCompetencyResponse)
async def get_competency(
    competency_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    competency = service.get_competency(competency_id, current_user.institution_id)
    if not competency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Competency not found"
        )
    return competency


@router.put("/competencies/{competency_id}", response_model=SELCompetencyResponse)
async def update_competency(
    competency_id: int,
    update_data: SELCompetencyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    competency = service.update_competency(competency_id, current_user.institution_id, update_data)
    if not competency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Competency not found"
        )
    return competency


@router.post("/assessments", response_model=SELAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    assessment_data: SELAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.create_assessment(current_user.institution_id, current_user.id, assessment_data)


@router.get("/assessments", response_model=List[SELAssessmentResponse])
async def get_assessments(
    student_id: Optional[int] = None,
    competency_id: Optional[int] = None,
    assessment_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.get_assessments(
        current_user.institution_id, student_id, competency_id, assessment_type, skip, limit
    )


@router.get("/assessments/{assessment_id}", response_model=SELAssessmentResponse)
async def get_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    assessment = service.get_assessment(assessment_id, current_user.institution_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found"
        )
    return assessment


@router.put("/assessments/{assessment_id}", response_model=SELAssessmentResponse)
async def update_assessment(
    assessment_id: int,
    update_data: SELAssessmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    assessment = service.update_assessment(assessment_id, current_user.institution_id, update_data)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found"
        )
    return assessment


@router.post("/assessments/{assessment_id}/submit", response_model=SELAssessmentResponse)
async def submit_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    assessment = service.submit_assessment(assessment_id, current_user.institution_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found"
        )
    return assessment


@router.post("/observations", response_model=SELObservationResponse, status_code=status.HTTP_201_CREATED)
async def create_observation(
    observation_data: SELObservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.create_observation(current_user.institution_id, current_user.id, observation_data)


@router.get("/observations", response_model=List[SELObservationResponse])
async def get_observations(
    student_id: Optional[int] = None,
    observer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.get_observations(
        current_user.institution_id, student_id, observer_id, skip, limit
    )


@router.get("/observations/{observation_id}", response_model=SELObservationResponse)
async def get_observation(
    observation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    observation = service.get_observation(observation_id, current_user.institution_id)
    if not observation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Observation not found"
        )
    return observation


@router.put("/observations/{observation_id}", response_model=SELObservationResponse)
async def update_observation(
    observation_id: int,
    update_data: SELObservationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    observation = service.update_observation(observation_id, current_user.institution_id, update_data)
    if not observation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Observation not found"
        )
    return observation


@router.post("/peer-relationships", response_model=PeerRelationshipResponse, status_code=status.HTTP_201_CREATED)
async def create_peer_relationship(
    relationship_data: PeerRelationshipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.create_peer_relationship(
        current_user.institution_id, current_user.id, relationship_data
    )


@router.get("/peer-relationships/{student_id}", response_model=List[PeerRelationshipResponse])
async def get_peer_relationships(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.get_peer_relationships(student_id, current_user.institution_id)


@router.get("/growth-tracking/{student_id}", response_model=List[SELGrowthTrackingResponse])
async def get_growth_tracking(
    student_id: int,
    period_start: date = Query(...),
    period_end: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.get_growth_tracking(
        student_id, current_user.institution_id, period_start, period_end
    )


@router.get("/growth-history/{student_id}", response_model=List[SELGrowthTrackingResponse])
async def get_student_growth_history(
    student_id: int,
    competency_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.get_student_growth_history(
        student_id, current_user.institution_id, competency_type
    )


@router.post("/progress-reports", response_model=SELProgressReportResponse, status_code=status.HTTP_201_CREATED)
async def create_progress_report(
    report_data: SELProgressReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.create_progress_report(
        current_user.institution_id, current_user.id, report_data
    )


@router.get("/progress-reports", response_model=List[SELProgressReportResponse])
async def get_progress_reports(
    student_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.get_progress_reports(student_id, current_user.institution_id, skip, limit)


@router.get("/progress-reports/{report_id}", response_model=SELProgressReportResponse)
async def get_progress_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    report = service.get_progress_report(report_id, current_user.institution_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Progress report not found"
        )
    return report


@router.post("/progress-reports/{report_id}/share", response_model=SELProgressReportResponse)
async def share_report_with_parent(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    report = service.share_report_with_parent(report_id, current_user.institution_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Progress report not found"
        )
    return report


@router.post("/progress-reports/{report_id}/mark-viewed", response_model=SELProgressReportResponse)
async def mark_parent_viewed(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    report = service.mark_parent_viewed(report_id, current_user.institution_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Progress report not found"
        )
    return report


@router.get("/analytics/{student_id}", response_model=SELAnalyticsResponse)
async def get_sel_analytics(
    student_id: int,
    period_start: date = Query(...),
    period_end: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    return service.get_sel_analytics(
        student_id, current_user.institution_id, period_start, period_end
    )


@router.get("/dashboard/{student_id}", response_model=StudentSELDashboard)
async def get_student_dashboard(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    try:
        return service.get_student_dashboard(student_id, current_user.institution_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/parent-report/{report_id}", response_model=ParentProgressReport)
async def get_parent_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SELService(db)
    report = service.get_parent_report(report_id, current_user.institution_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Progress report not found"
        )
    return report
