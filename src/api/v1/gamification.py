from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.gamification_service import GamificationService
from src.schemas.gamification import (
    BadgeCreate, BadgeUpdate, BadgeResponse, UserBadgeResponse,
    AwardBadgeRequest, UserPointsResponse, PointHistoryResponse,
    AddPointsRequest, LeaderboardResponse, UserGamificationStats
)
from src.models.gamification import BadgeType

router = APIRouter()


@router.post("/badges", response_model=BadgeResponse, status_code=status.HTTP_201_CREATED)
def create_badge(
    badge: BadgeCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.create_badge(db, institution_id, badge)


@router.get("/badges", response_model=List[BadgeResponse])
def list_badges(
    institution_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return GamificationService.get_badges(db, institution_id, skip, limit)


@router.get("/badges/{badge_id}", response_model=BadgeResponse)
def get_badge(
    badge_id: int,
    db: Session = Depends(get_db)
):
    badge = GamificationService.get_badge(db, badge_id)
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    return badge


@router.put("/badges/{badge_id}", response_model=BadgeResponse)
def update_badge(
    badge_id: int,
    badge: BadgeUpdate,
    db: Session = Depends(get_db)
):
    updated_badge = GamificationService.update_badge(db, badge_id, badge)
    if not updated_badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    return updated_badge


@router.post("/badges/award", response_model=UserBadgeResponse, status_code=status.HTTP_201_CREATED)
def award_badge(
    award_data: AwardBadgeRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.award_badge(db, institution_id, award_data)


@router.get("/users/{user_id}/badges", response_model=List[UserBadgeResponse])
def get_user_badges(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.get_user_badges(db, user_id, institution_id)


@router.get("/users/{user_id}/points", response_model=UserPointsResponse)
def get_user_points(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.get_or_create_user_points(db, user_id, institution_id)


@router.post("/points/add", response_model=UserPointsResponse)
def add_points(
    points_data: AddPointsRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.add_points(db, institution_id, points_data)


@router.get("/users/{user_id}/point-history", response_model=List[PointHistoryResponse])
def get_point_history(
    user_id: int,
    institution_id: int = Query(...),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    return GamificationService.get_point_history(db, user_id, institution_id, limit)


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    institution_id: int = Query(...),
    limit: int = Query(50, ge=1, le=100),
    current_user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return GamificationService.get_leaderboard(db, institution_id, limit, current_user_id)


@router.get("/users/{user_id}/stats", response_model=UserGamificationStats)
def get_user_stats(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    user_points = GamificationService.get_or_create_user_points(db, user_id, institution_id)
    user_badges = GamificationService.get_user_badges(db, user_id, institution_id)
    point_history = GamificationService.get_point_history(db, user_id, institution_id, 10)
    
    badges_by_type = {}
    for badge_type in BadgeType:
        badges_by_type[badge_type.value] = sum(
            1 for ub in user_badges if ub.badge.badge_type == badge_type
        )
    
    return UserGamificationStats(
        user_id=user_id,
        total_points=user_points.total_points,
        level=user_points.level,
        current_streak=user_points.current_streak,
        longest_streak=user_points.longest_streak,
        total_badges=len(user_badges),
        badges_by_type=badges_by_type,
        recent_achievements=user_badges[:5],
        point_history=point_history
    )
