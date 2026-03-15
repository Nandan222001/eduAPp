from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.services.learning_styles_service import LearningStylesService
from src.services.learning_content_recommendation_service import LearningContentRecommendationService
from src.services.adaptive_learning_service import AdaptiveLearningService
from src.schemas.learning_styles import (
    LearningStyleProfileCreate, LearningStyleProfileUpdate, LearningStyleProfileResponse,
    LearningStyleAssessmentCreate, LearningStyleAssessmentResponse,
    AssessmentResponseSubmit, ContentTagCreate, ContentTagUpdate, ContentTagResponse,
    AdaptiveContentRecommendationResponse, PersonalizedContentFeedResponse,
    GenerateRecommendationsRequest, GenerateFeedRequest,
    AdaptiveLearningSessionCreate, AdaptiveLearningSessionResponse,
    PerformanceMetricsUpdate, EngagementMetricsUpdate,
    LearningStyleEffectivenessCreate, LearningStyleEffectivenessResponse,
    EffectivenessAnalyticsResponse, StudentPerformanceTrendResponse,
    ContentDeliveryFormat
)

router = APIRouter(prefix="/learning-styles", tags=["Learning Styles"])


@router.post("/profiles", response_model=LearningStyleProfileResponse)
def create_learning_style_profile(
    profile_data: LearningStyleProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    profile = service.create_profile(profile_data, current_user.institution_id)
    return profile


@router.get("/profiles/{student_id}", response_model=LearningStyleProfileResponse)
def get_learning_style_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    profile = service.get_profile(student_id, current_user.institution_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning style profile not found"
        )
    
    return profile


@router.put("/profiles/{student_id}", response_model=LearningStyleProfileResponse)
def update_learning_style_profile(
    student_id: int,
    profile_data: LearningStyleProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    profile = service.update_profile(student_id, current_user.institution_id, profile_data)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning style profile not found"
        )
    
    return profile


@router.post("/assessments", response_model=LearningStyleAssessmentResponse)
def create_assessment(
    assessment_data: LearningStyleAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    assessment = service.create_assessment(assessment_data, current_user.institution_id)
    return assessment


@router.post("/assessments/{assessment_id}/start", response_model=LearningStyleAssessmentResponse)
def start_assessment(
    assessment_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    assessment = service.start_assessment(assessment_id, student_id)
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    return assessment


@router.post("/assessments/submit", response_model=LearningStyleAssessmentResponse)
def submit_assessment(
    submission: AssessmentResponseSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    student_id = current_user.student_profile.id if current_user.student_profile else None
    
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )
    
    assessment = service.submit_assessment(submission, student_id)
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    return assessment


@router.get("/assessments/student/{student_id}", response_model=List[LearningStyleAssessmentResponse])
def get_student_assessments(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    assessments = service.get_student_assessments(student_id, current_user.institution_id)
    return assessments


@router.post("/content-tags", response_model=ContentTagResponse)
def create_content_tag(
    tag_data: ContentTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    tag = service.create_content_tag(tag_data, current_user.institution_id, current_user.id)
    return tag


@router.put("/content-tags/{content_type}/{content_id}", response_model=ContentTagResponse)
def update_content_tag(
    content_type: str,
    content_id: int,
    tag_data: ContentTagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    tag = service.update_content_tag(content_type, content_id, tag_data)
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content tag not found"
        )
    
    return tag


@router.get("/content-tags/{content_type}/{content_id}", response_model=ContentTagResponse)
def get_content_tag(
    content_type: str,
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    tag = service.get_content_tag(content_type, content_id)
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content tag not found"
        )
    
    return tag


@router.post("/content-tags/{content_type}/{content_id}/auto-tag", response_model=ContentTagResponse)
def auto_tag_content(
    content_type: str,
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    tag = service.auto_tag_content(content_type, content_id, current_user.institution_id)
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to auto-tag content"
        )
    
    return tag


@router.post("/recommendations/generate", response_model=List[AdaptiveContentRecommendationResponse])
def generate_recommendations(
    request: GenerateRecommendationsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningContentRecommendationService(db)
    recommendations = service.generate_recommendations(
        student_id=request.student_id,
        institution_id=current_user.institution_id,
        subject_id=request.subject_id,
        chapter_id=request.chapter_id,
        topic_id=request.topic_id,
        limit=request.limit
    )
    return recommendations


@router.post("/feed/generate", response_model=List[PersonalizedContentFeedResponse])
def generate_personalized_feed(
    request: GenerateFeedRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningContentRecommendationService(db)
    feed = service.generate_personalized_feed(
        student_id=request.student_id,
        institution_id=current_user.institution_id,
        subject_id=request.subject_id,
        limit=request.limit
    )
    return feed


@router.get("/feed/{student_id}", response_model=List[PersonalizedContentFeedResponse])
def get_personalized_feed(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningContentRecommendationService(db)
    feed = service.get_active_feed(student_id, current_user.institution_id)
    return feed


@router.post("/feed/{feed_id}/interact")
def record_feed_interaction(
    feed_id: int,
    time_spent_seconds: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.student_profile.id if current_user.student_profile else None
    
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )
    
    service = LearningContentRecommendationService(db)
    service.record_feed_interaction(feed_id, student_id, time_spent_seconds)
    
    return {"message": "Interaction recorded successfully"}


@router.get("/recommendations/effectiveness/{student_id}")
def get_recommendation_effectiveness(
    student_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningContentRecommendationService(db)
    effectiveness = service.get_recommendation_effectiveness(
        student_id, current_user.institution_id, days
    )
    return effectiveness


@router.post("/adaptive-sessions", response_model=AdaptiveLearningSessionResponse)
def create_adaptive_session(
    session_data: AdaptiveLearningSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    session = service.create_learning_session(
        student_id=session_data.student_id,
        institution_id=current_user.institution_id,
        content_type=session_data.content_type,
        content_id=session_data.content_id,
        initial_format=session_data.initial_format,
        initial_difficulty=session_data.initial_difficulty
    )
    return session


@router.post("/adaptive-sessions/{session_id}/adjust-difficulty")
def adjust_session_difficulty(
    session_id: int,
    performance_metrics: PerformanceMetricsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    result = service.adjust_content_difficulty(
        session_id=session_id,
        performance_metrics=performance_metrics.model_dump()
    )
    return result


@router.post("/adaptive-sessions/{session_id}/adjust-format")
def adjust_session_format(
    session_id: int,
    engagement_metrics: EngagementMetricsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    result = service.adjust_content_format(
        session_id=session_id,
        engagement_metrics=engagement_metrics.model_dump()
    )
    return result


@router.post("/adaptive-sessions/{session_id}/real-time-adjust")
def get_real_time_adjustments(
    session_id: int,
    performance_metrics: PerformanceMetricsUpdate,
    engagement_metrics: EngagementMetricsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    adjustments = service.get_real_time_adjustments(
        session_id=session_id,
        performance_metrics=performance_metrics.model_dump(),
        engagement_metrics=engagement_metrics.model_dump()
    )
    return adjustments


@router.post("/adaptive-sessions/{session_id}/update-performance")
def update_session_performance(
    session_id: int,
    performance_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    service.update_session_performance(session_id, performance_data)
    return {"message": "Performance data updated successfully"}


@router.post("/adaptive-sessions/{session_id}/end", response_model=AdaptiveLearningSessionResponse)
def end_adaptive_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    session = service.end_learning_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return session


@router.get("/adaptive-sessions/performance-trend/{student_id}", response_model=StudentPerformanceTrendResponse)
def get_performance_trend(
    student_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    trend = service.get_student_performance_trend(
        student_id, current_user.institution_id, days
    )
    return trend


@router.post("/effectiveness", response_model=LearningStyleEffectivenessResponse)
def record_effectiveness(
    effectiveness_data: LearningStyleEffectivenessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    effectiveness = service.record_effectiveness(
        student_id=effectiveness_data.student_id,
        institution_id=current_user.institution_id,
        content_type=effectiveness_data.content_type,
        content_id=effectiveness_data.content_id,
        delivery_format=effectiveness_data.delivery_format,
        metrics=effectiveness_data.model_dump()
    )
    return effectiveness


@router.get("/effectiveness/analysis/{student_id}")
def get_format_effectiveness_analysis(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    analysis = service.get_format_effectiveness_analysis(
        student_id, current_user.institution_id
    )
    return analysis


@router.get("/analytics/effectiveness/{student_id}", response_model=EffectivenessAnalyticsResponse)
def get_effectiveness_analytics(
    student_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from src.models.learning_styles import LearningStyleEffectiveness
    from datetime import timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    effectiveness_records = db.query(LearningStyleEffectiveness).filter(
        and_(
            LearningStyleEffectiveness.student_id == student_id,
            LearningStyleEffectiveness.institution_id == current_user.institution_id,
            LearningStyleEffectiveness.created_at >= cutoff_date
        )
    ).all()
    
    by_format = {}
    by_learning_style = {}
    
    for record in effectiveness_records:
        fmt = record.delivery_format.value
        if fmt not in by_format:
            by_format[fmt] = {
                "count": 0,
                "avg_engagement": 0,
                "avg_improvement": 0,
                "total_time": 0
            }
        
        by_format[fmt]["count"] += 1
        by_format[fmt]["avg_engagement"] += float(record.engagement_score or 0)
        by_format[fmt]["avg_improvement"] += float(record.improvement or 0)
        by_format[fmt]["total_time"] += record.time_spent_seconds
    
    for fmt in by_format:
        count = by_format[fmt]["count"]
        by_format[fmt]["avg_engagement"] = round(by_format[fmt]["avg_engagement"] / count, 2)
        by_format[fmt]["avg_improvement"] = round(by_format[fmt]["avg_improvement"] / count, 2)
        by_format[fmt]["avg_time"] = round(by_format[fmt]["total_time"] / count, 2)
    
    total_records = len(effectiveness_records)
    overall_engagement = sum(float(r.engagement_score or 0) for r in effectiveness_records)
    overall_improvement = sum(float(r.improvement or 0) for r in effectiveness_records if r.improvement)
    
    overall_metrics = {
        "total_records": total_records,
        "avg_engagement": round(overall_engagement / total_records, 2) if total_records > 0 else 0,
        "avg_improvement": round(overall_improvement / len([r for r in effectiveness_records if r.improvement]), 2) if any(r.improvement for r in effectiveness_records) else 0
    }
    
    recommendations = []
    if by_format:
        best_format = max(by_format.items(), key=lambda x: x[1]["avg_engagement"])[0]
        recommendations.append(f"Focus on {best_format} format for better engagement")
    
    return EffectivenessAnalyticsResponse(
        total_records=total_records,
        by_format=by_format,
        by_learning_style=by_learning_style,
        overall_metrics=overall_metrics,
        recommendations=recommendations
    )


@router.get("/default-assessment-questions")
def get_default_assessment_questions():
    questions = [
        {
            "id": 1,
            "question_text": "When learning something new, I prefer to:",
            "question_type": "multiple_choice",
            "options": [
                {"id": "a", "text": "Watch a video or demonstration"},
                {"id": "b", "text": "Listen to someone explain it"},
                {"id": "c", "text": "Try it out hands-on"},
                {"id": "d", "text": "Read about it"}
            ],
            "style_weights": {
                "a": {"visual": 1.0},
                "b": {"auditory": 1.0},
                "c": {"kinesthetic": 1.0},
                "d": {"reading_writing": 1.0}
            }
        },
        {
            "id": 2,
            "question_text": "I remember things best when I:",
            "question_type": "multiple_choice",
            "options": [
                {"id": "a", "text": "See pictures or diagrams"},
                {"id": "b", "text": "Hear them explained"},
                {"id": "c", "text": "Do them myself"},
                {"id": "d", "text": "Write them down"}
            ],
            "style_weights": {
                "a": {"visual": 1.0},
                "b": {"auditory": 1.0},
                "c": {"kinesthetic": 1.0},
                "d": {"reading_writing": 1.0}
            }
        },
        {
            "id": 3,
            "question_text": "When studying, I prefer to:",
            "question_type": "multiple_choice",
            "options": [
                {"id": "a", "text": "Study alone"},
                {"id": "b", "text": "Study with others"}
            ],
            "style_weights": {
                "a": {"social": 0.0},
                "b": {"social": 1.0}
            }
        },
        {
            "id": 4,
            "question_text": "I learn best when information is presented:",
            "question_type": "multiple_choice",
            "options": [
                {"id": "a", "text": "Step by step in order"},
                {"id": "b", "text": "As a big picture overview"}
            ],
            "style_weights": {
                "a": {"sequential": 1.0},
                "b": {"sequential": 0.0}
            }
        },
        {
            "id": 5,
            "question_text": "When given directions, I prefer:",
            "question_type": "multiple_choice",
            "options": [
                {"id": "a", "text": "A map or diagram"},
                {"id": "b", "text": "Verbal instructions"},
                {"id": "c", "text": "To follow someone"},
                {"id": "d", "text": "Written directions"}
            ],
            "style_weights": {
                "a": {"visual": 1.0},
                "b": {"auditory": 1.0},
                "c": {"kinesthetic": 1.0},
                "d": {"reading_writing": 1.0}
            }
        }
    ]
    
    return {"questions": questions}
