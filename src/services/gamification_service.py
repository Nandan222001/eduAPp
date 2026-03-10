from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from src.models.gamification import Badge, UserBadge, UserPoints, PointHistory, PointEventType
from src.models.user import User
from src.schemas.gamification import (
    BadgeCreate, BadgeUpdate, AwardBadgeRequest, AddPointsRequest,
    LeaderboardEntry, LeaderboardResponse
)


class GamificationService:
    
    @staticmethod
    def create_badge(db: Session, institution_id: int, badge_data: BadgeCreate) -> Badge:
        badge = Badge(
            institution_id=institution_id,
            **badge_data.model_dump()
        )
        db.add(badge)
        db.commit()
        db.refresh(badge)
        return badge
    
    @staticmethod
    def update_badge(db: Session, badge_id: int, badge_data: BadgeUpdate) -> Optional[Badge]:
        badge = db.query(Badge).filter(Badge.id == badge_id).first()
        if not badge:
            return None
        
        update_data = badge_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(badge, field, value)
        
        db.commit()
        db.refresh(badge)
        return badge
    
    @staticmethod
    def get_badges(db: Session, institution_id: int, skip: int = 0, limit: int = 100) -> List[Badge]:
        return db.query(Badge).filter(
            Badge.institution_id == institution_id,
            Badge.is_active == True
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_badge(db: Session, badge_id: int) -> Optional[Badge]:
        return db.query(Badge).filter(Badge.id == badge_id).first()
    
    @staticmethod
    def award_badge(db: Session, institution_id: int, award_data: AwardBadgeRequest) -> UserBadge:
        user_badge = UserBadge(
            institution_id=institution_id,
            user_id=award_data.user_id,
            badge_id=award_data.badge_id,
            points_awarded=award_data.points_awarded
        )
        db.add(user_badge)
        
        if award_data.points_awarded > 0:
            GamificationService.add_points(
                db,
                institution_id,
                AddPointsRequest(
                    user_id=award_data.user_id,
                    points=award_data.points_awarded,
                    event_type=PointEventType.BADGE_EARN,
                    description=f"Earned badge",
                    reference_id=award_data.badge_id,
                    reference_type="badge"
                )
            )
        
        db.commit()
        db.refresh(user_badge)
        return user_badge
    
    @staticmethod
    def get_user_badges(db: Session, user_id: int, institution_id: int) -> List[UserBadge]:
        return db.query(UserBadge).filter(
            UserBadge.user_id == user_id,
            UserBadge.institution_id == institution_id
        ).order_by(desc(UserBadge.earned_at)).all()
    
    @staticmethod
    def get_or_create_user_points(db: Session, user_id: int, institution_id: int) -> UserPoints:
        user_points = db.query(UserPoints).filter(
            UserPoints.user_id == user_id,
            UserPoints.institution_id == institution_id
        ).first()
        
        if not user_points:
            user_points = UserPoints(
                institution_id=institution_id,
                user_id=user_id,
                total_points=0,
                level=1,
                current_streak=0,
                longest_streak=0
            )
            db.add(user_points)
            db.commit()
            db.refresh(user_points)
        
        return user_points
    
    @staticmethod
    def add_points(db: Session, institution_id: int, points_data: AddPointsRequest) -> UserPoints:
        user_points = GamificationService.get_or_create_user_points(
            db, points_data.user_id, institution_id
        )
        
        user_points.total_points += points_data.points
        user_points.level = GamificationService.calculate_level(user_points.total_points)
        user_points.last_activity_date = datetime.utcnow()
        
        GamificationService.update_streak(db, user_points)
        
        point_history = PointHistory(
            institution_id=institution_id,
            user_points_id=user_points.id,
            event_type=points_data.event_type,
            points=points_data.points,
            description=points_data.description,
            reference_id=points_data.reference_id,
            reference_type=points_data.reference_type
        )
        db.add(point_history)
        
        db.commit()
        db.refresh(user_points)
        return user_points
    
    @staticmethod
    def calculate_level(total_points: int) -> int:
        return int((total_points / 100) ** 0.5) + 1
    
    @staticmethod
    def update_streak(db: Session, user_points: UserPoints) -> None:
        today = datetime.utcnow().date()
        last_activity = user_points.last_activity_date
        
        if last_activity:
            last_activity_date = last_activity.date()
            days_diff = (today - last_activity_date).days
            
            if days_diff == 0:
                pass
            elif days_diff == 1:
                user_points.current_streak += 1
                if user_points.current_streak > user_points.longest_streak:
                    user_points.longest_streak = user_points.current_streak
            else:
                user_points.current_streak = 1
        else:
            user_points.current_streak = 1
    
    @staticmethod
    def get_leaderboard(
        db: Session, 
        institution_id: int, 
        limit: int = 50,
        current_user_id: Optional[int] = None
    ) -> LeaderboardResponse:
        query = db.query(
            UserPoints.user_id,
            User.username,
            User.first_name,
            User.last_name,
            UserPoints.total_points,
            UserPoints.level,
            func.count(UserBadge.id).label('badges_count')
        ).join(
            User, UserPoints.user_id == User.id
        ).outerjoin(
            UserBadge, UserPoints.user_id == UserBadge.user_id
        ).filter(
            UserPoints.institution_id == institution_id
        ).group_by(
            UserPoints.user_id,
            User.username,
            User.first_name,
            User.last_name,
            UserPoints.total_points,
            UserPoints.level
        ).order_by(
            desc(UserPoints.total_points)
        )
        
        results = query.limit(limit).all()
        
        entries = [
            LeaderboardEntry(
                user_id=r.user_id,
                username=r.username,
                first_name=r.first_name,
                last_name=r.last_name,
                total_points=r.total_points,
                level=r.level,
                rank=idx + 1,
                badges_count=r.badges_count
            )
            for idx, r in enumerate(results)
        ]
        
        current_user_rank = None
        if current_user_id:
            all_users = query.all()
            for idx, r in enumerate(all_users):
                if r.user_id == current_user_id:
                    current_user_rank = idx + 1
                    break
        
        total_users = db.query(func.count(UserPoints.id)).filter(
            UserPoints.institution_id == institution_id
        ).scalar()
        
        return LeaderboardResponse(
            entries=entries,
            total_users=total_users,
            current_user_rank=current_user_rank
        )
    
    @staticmethod
    def get_point_history(
        db: Session, 
        user_id: int, 
        institution_id: int,
        limit: int = 50
    ) -> List[PointHistory]:
        user_points = GamificationService.get_or_create_user_points(db, user_id, institution_id)
        
        return db.query(PointHistory).filter(
            PointHistory.user_points_id == user_points.id
        ).order_by(desc(PointHistory.created_at)).limit(limit).all()
