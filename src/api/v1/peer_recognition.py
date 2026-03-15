from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.services.peer_recognition_service import PeerRecognitionService
from src.schemas.peer_recognition import (
    PeerRecognitionCreate, PeerRecognitionResponse,
    PeerRecognitionWithStudents, RecognitionBadgeResponse,
    DailyRecognitionLimitResponse, AppreciationWallResponse,
    TrendingRecognitionResponse, RecognitionAnalyticsResponse,
    PositivityIndexResponse, MostRecognizedStudentsResponse,
    RecognitionStatsResponse
)
from src.models.peer_recognition import RecognitionType

router = APIRouter()


@router.post("/recognitions", response_model=PeerRecognitionResponse, status_code=status.HTTP_201_CREATED)
def send_recognition(
    recognition_data: PeerRecognitionCreate,
    institution_id: int = Query(...),
    from_student_id: int = Query(...),
    db: Session = Depends(get_db)
):
    recognition = PeerRecognitionService.create_recognition(
        db=db,
        institution_id=institution_id,
        from_student_id=from_student_id,
        recognition_data=recognition_data
    )
    
    response_dict = {
        **recognition.__dict__,
        'from_student_name': f"{recognition.from_student.first_name} {recognition.from_student.last_name}",
        'to_student_name': f"{recognition.to_student.first_name} {recognition.to_student.last_name}",
        'is_liked_by_current_user': False
    }
    
    return PeerRecognitionResponse(**response_dict)


@router.get("/recognitions/received", response_model=List[PeerRecognitionResponse])
def get_received_recognitions(
    institution_id: int = Query(...),
    student_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    recognitions = PeerRecognitionService.get_received_recognitions(
        db=db,
        institution_id=institution_id,
        student_id=student_id,
        skip=skip,
        limit=limit
    )
    
    responses = []
    for recognition in recognitions:
        response_dict = {
            **recognition.__dict__,
            'from_student_name': f"{recognition.from_student.first_name} {recognition.from_student.last_name}",
            'to_student_name': f"{recognition.to_student.first_name} {recognition.to_student.last_name}",
            'is_liked_by_current_user': False
        }
        responses.append(PeerRecognitionResponse(**response_dict))
    
    return responses


@router.get("/appreciation-wall", response_model=AppreciationWallResponse)
def get_appreciation_wall(
    institution_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_student_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return PeerRecognitionService.get_appreciation_wall(
        db=db,
        institution_id=institution_id,
        page=page,
        page_size=page_size,
        current_student_id=current_student_id
    )


@router.post("/recognitions/{recognition_id}/like")
def toggle_like(
    recognition_id: int,
    student_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return PeerRecognitionService.toggle_like(
        db=db,
        recognition_id=recognition_id,
        student_id=student_id
    )


@router.get("/trending", response_model=List[TrendingRecognitionResponse])
def get_trending_recognitions(
    institution_id: int = Query(...),
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    return PeerRecognitionService.get_trending_recognitions(
        db=db,
        institution_id=institution_id,
        limit=limit,
        days=days
    )


@router.get("/analytics/positivity-index", response_model=PositivityIndexResponse)
def get_positivity_index(
    institution_id: int = Query(...),
    period: str = Query("week", regex="^(day|week|month)$"),
    db: Session = Depends(get_db)
):
    return PeerRecognitionService.calculate_positivity_index(
        db=db,
        institution_id=institution_id,
        period=period
    )


@router.get("/analytics/most-recognized", response_model=List[MostRecognizedStudentsResponse])
def get_most_recognized_students(
    institution_id: int = Query(...),
    limit: int = Query(10, ge=1, le=50),
    days: Optional[int] = Query(None, ge=1, le=365),
    db: Session = Depends(get_db)
):
    return PeerRecognitionService.get_most_recognized_students(
        db=db,
        institution_id=institution_id,
        limit=limit,
        days=days
    )


@router.get("/students/{student_id}/stats", response_model=RecognitionStatsResponse)
def get_student_recognition_stats(
    student_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return PeerRecognitionService.get_recognition_stats(
        db=db,
        institution_id=institution_id,
        student_id=student_id
    )


@router.get("/students/{student_id}/badges", response_model=List[RecognitionBadgeResponse])
def get_student_badges(
    student_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    from src.models.peer_recognition import RecognitionBadge
    
    badges = db.query(RecognitionBadge).filter(
        RecognitionBadge.student_id == student_id,
        RecognitionBadge.institution_id == institution_id
    ).all()
    
    return [RecognitionBadgeResponse.model_validate(badge) for badge in badges]


@router.get("/students/{student_id}/daily-limit", response_model=DailyRecognitionLimitResponse)
def get_daily_limit_status(
    student_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    can_send, remaining = PeerRecognitionService.check_daily_limit(
        db=db,
        institution_id=institution_id,
        student_id=student_id
    )
    
    from src.models.peer_recognition import DailyRecognitionLimit
    today = date.today()
    
    limit_record = db.query(DailyRecognitionLimit).filter(
        DailyRecognitionLimit.institution_id == institution_id,
        DailyRecognitionLimit.student_id == student_id,
        DailyRecognitionLimit.limit_date == today
    ).first()
    
    if not limit_record:
        return DailyRecognitionLimitResponse(
            id=0,
            institution_id=institution_id,
            student_id=student_id,
            limit_date=today,
            recognitions_sent=0,
            max_daily_limit=10,
            remaining=10
        )
    
    response_dict = {
        **limit_record.__dict__,
        'remaining': remaining
    }
    
    return DailyRecognitionLimitResponse(**response_dict)


@router.post("/analytics/update")
def update_analytics(
    institution_id: int = Query(...),
    analytics_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    if not analytics_date:
        analytics_date = date.today()
    
    analytics = PeerRecognitionService.update_analytics(
        db=db,
        institution_id=institution_id,
        analytics_date=analytics_date
    )
    
    return {
        "message": "Analytics updated successfully",
        "analytics": RecognitionAnalyticsResponse.model_validate(analytics)
    }


@router.get("/analytics/daily", response_model=RecognitionAnalyticsResponse)
def get_daily_analytics(
    institution_id: int = Query(...),
    analytics_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    from src.models.peer_recognition import RecognitionAnalytics
    from src.models.student import Student
    
    if not analytics_date:
        analytics_date = date.today()
    
    analytics = db.query(RecognitionAnalytics).filter(
        RecognitionAnalytics.institution_id == institution_id,
        RecognitionAnalytics.analytics_date == analytics_date
    ).first()
    
    if not analytics:
        analytics = PeerRecognitionService.update_analytics(
            db=db,
            institution_id=institution_id,
            analytics_date=analytics_date
        )
    
    response_dict = {**analytics.__dict__}
    
    if analytics.most_recognized_student_id:
        student = db.query(Student).filter(Student.id == analytics.most_recognized_student_id).first()
        if student:
            response_dict['most_recognized_student_name'] = f"{student.first_name} {student.last_name}"
    
    return RecognitionAnalyticsResponse(**response_dict)


@router.get("/recognition-types", response_model=List[dict])
def get_recognition_types():
    return [
        {
            "value": rec_type.value,
            "label": rec_type.value.replace('_', ' ').title(),
            "points": PeerRecognitionService.RECOGNITION_POINTS.get(rec_type, 10)
        }
        for rec_type in RecognitionType
    ]
