from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.schemas.study_buddy import (
    ChatRequest,
    ChatResponse,
    StudyBuddySessionResponse,
    StudyBuddyInsightResponse,
    StudyBuddyPreferenceCreate,
    StudyBuddyPreferenceUpdate,
    StudyBuddyPreferenceResponse,
    DailyBriefingResponse,
    WeeklyReviewResponse,
    MoodTrackingRequest,
    MarkInsightReadRequest
)
from src.services.study_buddy_service import StudyBuddyService
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.config import settings

router = APIRouter()


def get_study_buddy_service(db: Session = Depends(get_db)) -> StudyBuddyService:
    openai_api_key = getattr(settings, 'openai_api_key', None)
    return StudyBuddyService(db, openai_api_key)


@router.post("/chat", response_model=ChatResponse)
async def chat_with_study_buddy(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    try:
        response = service.chat(
            student_id=student_id,
            institution_id=current_user.institution_id,
            chat_request=chat_request
        )
        
        service.update_streak(student_id, current_user.institution_id)
        
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )


@router.get("/session", response_model=StudyBuddySessionResponse)
async def get_study_buddy_session(
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    session = service.get_or_create_session(
        student_id=student_id,
        institution_id=current_user.institution_id
    )
    
    return session


@router.get("/daily-briefing", response_model=DailyBriefingResponse)
async def get_daily_briefing(
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    preferences = service.get_preferences(student_id, current_user.institution_id)
    
    if preferences and not preferences.daily_briefing_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Daily briefing is disabled in preferences"
        )
    
    try:
        briefing = service.generate_daily_plan(
            student_id=student_id,
            institution_id=current_user.institution_id
        )
        return briefing
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating daily briefing: {str(e)}"
        )


@router.get("/weekly-review", response_model=WeeklyReviewResponse)
async def get_weekly_review(
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    preferences = service.get_preferences(student_id, current_user.institution_id)
    
    if preferences and not preferences.weekly_review_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Weekly review is disabled in preferences"
        )
    
    try:
        review = service.generate_weekly_review(
            student_id=student_id,
            institution_id=current_user.institution_id
        )
        return review
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating weekly review: {str(e)}"
        )


@router.get("/insights", response_model=List[StudyBuddyInsightResponse])
async def get_insights(
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    insights = service.get_insights(
        student_id=student_id,
        institution_id=current_user.institution_id,
        unread_only=unread_only
    )
    
    return insights


@router.post("/insights/mark-read", status_code=status.HTTP_200_OK)
async def mark_insight_read(
    request: MarkInsightReadRequest,
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    insight = service.mark_insight_read(request.insight_id)
    
    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found"
        )
    
    if insight.student_id != current_user.student_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this insight"
        )
    
    return {"message": "Insight marked as read"}


@router.get("/preferences", response_model=StudyBuddyPreferenceResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    preferences = service.get_preferences(student_id, current_user.institution_id)
    
    if not preferences:
        preferences = service.create_preferences(
            student_id=student_id,
            institution_id=current_user.institution_id,
            preferences_data=StudyBuddyPreferenceCreate()
        )
    
    return preferences


@router.post("/preferences", response_model=StudyBuddyPreferenceResponse, status_code=status.HTTP_201_CREATED)
async def create_preferences(
    preferences_data: StudyBuddyPreferenceCreate,
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    existing = service.get_preferences(student_id, current_user.institution_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preferences already exist. Use PUT to update."
        )
    
    preferences = service.create_preferences(
        student_id=student_id,
        institution_id=current_user.institution_id,
        preferences_data=preferences_data
    )
    
    return preferences


@router.put("/preferences", response_model=StudyBuddyPreferenceResponse)
async def update_preferences(
    preferences_data: StudyBuddyPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    preferences = service.update_preferences(
        student_id=student_id,
        institution_id=current_user.institution_id,
        preferences_data=preferences_data
    )
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    return preferences


@router.post("/mood", response_model=StudyBuddySessionResponse)
async def track_mood(
    mood_request: MoodTrackingRequest,
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    session = service.track_mood(
        student_id=student_id,
        institution_id=current_user.institution_id,
        mood=mood_request.mood,
        energy_level=mood_request.energy_level,
        stress_level=mood_request.stress_level,
        notes=mood_request.notes
    )
    
    return session


@router.get("/study-patterns")
async def analyze_study_patterns(
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    patterns = service.analyze_study_patterns(
        student_id=student_id,
        institution_id=current_user.institution_id
    )
    
    return patterns


@router.get("/optimal-study-times")
async def get_optimal_study_times(
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    optimal_times = service.detect_optimal_study_times(
        student_id=student_id,
        institution_id=current_user.institution_id
    )
    
    return optimal_times


@router.get("/motivational-message")
async def get_motivational_message(
    current_user: User = Depends(get_current_user),
    service: StudyBuddyService = Depends(get_study_buddy_service),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access the study buddy"
        )
    
    student_id = current_user.student_profile.id
    
    message = service.generate_motivational_message(
        student_id=student_id,
        institution_id=current_user.institution_id
    )
    
    return {"message": message}
