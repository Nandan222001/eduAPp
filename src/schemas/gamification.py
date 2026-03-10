from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from src.models.gamification import BadgeType, BadgeRarity, PointEventType


class BadgeBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    badge_type: BadgeType
    rarity: BadgeRarity = BadgeRarity.COMMON
    icon_url: Optional[str] = Field(None, max_length=500)
    points_required: Optional[int] = None
    criteria: Optional[str] = None
    is_active: bool = True


class BadgeCreate(BadgeBase):
    pass


class BadgeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    badge_type: Optional[BadgeType] = None
    rarity: Optional[BadgeRarity] = None
    icon_url: Optional[str] = Field(None, max_length=500)
    points_required: Optional[int] = None
    criteria: Optional[str] = None
    is_active: Optional[bool] = None


class BadgeResponse(BadgeBase):
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserBadgeResponse(BaseModel):
    id: int
    institution_id: int
    user_id: int
    badge_id: int
    earned_at: datetime
    points_awarded: int
    badge: BadgeResponse
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AwardBadgeRequest(BaseModel):
    user_id: int
    badge_id: int
    points_awarded: int = 0


class UserPointsResponse(BaseModel):
    id: int
    institution_id: int
    user_id: int
    total_points: int
    level: int
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PointHistoryResponse(BaseModel):
    id: int
    institution_id: int
    user_points_id: int
    event_type: PointEventType
    points: int
    description: Optional[str] = None
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AddPointsRequest(BaseModel):
    user_id: int
    points: int
    event_type: PointEventType
    description: Optional[str] = None
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None


class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    total_points: int
    level: int
    rank: int
    badges_count: int


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    total_users: int
    current_user_rank: Optional[int] = None


class UserGamificationStats(BaseModel):
    user_id: int
    total_points: int
    level: int
    current_streak: int
    longest_streak: int
    total_badges: int
    badges_by_type: dict
    recent_achievements: List[UserBadgeResponse]
    point_history: List[PointHistoryResponse]
