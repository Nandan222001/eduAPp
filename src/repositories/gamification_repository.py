from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from src.models.gamification import Badge, UserBadge, UserPoints, PointHistory


class GamificationRepository:
    
    @staticmethod
    def create_badge(db: Session, badge: Badge) -> Badge:
        db.add(badge)
        db.commit()
        db.refresh(badge)
        return badge
    
    @staticmethod
    def get_badge_by_id(db: Session, badge_id: int) -> Optional[Badge]:
        return db.query(Badge).filter(Badge.id == badge_id).first()
    
    @staticmethod
    def get_badges_by_institution(
        db: Session, 
        institution_id: int, 
        is_active: bool = True,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Badge]:
        query = db.query(Badge).filter(Badge.institution_id == institution_id)
        if is_active is not None:
            query = query.filter(Badge.is_active == is_active)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_badge(db: Session, badge: Badge) -> Badge:
        db.commit()
        db.refresh(badge)
        return badge
    
    @staticmethod
    def award_user_badge(db: Session, user_badge: UserBadge) -> UserBadge:
        db.add(user_badge)
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
    def get_user_points(db: Session, user_id: int, institution_id: int) -> Optional[UserPoints]:
        return db.query(UserPoints).filter(
            UserPoints.user_id == user_id,
            UserPoints.institution_id == institution_id
        ).first()
    
    @staticmethod
    def create_user_points(db: Session, user_points: UserPoints) -> UserPoints:
        db.add(user_points)
        db.commit()
        db.refresh(user_points)
        return user_points
    
    @staticmethod
    def update_user_points(db: Session, user_points: UserPoints) -> UserPoints:
        db.commit()
        db.refresh(user_points)
        return user_points
    
    @staticmethod
    def add_point_history(db: Session, point_history: PointHistory) -> PointHistory:
        db.add(point_history)
        db.commit()
        db.refresh(point_history)
        return point_history
    
    @staticmethod
    def get_point_history(
        db: Session, 
        user_points_id: int, 
        limit: int = 50
    ) -> List[PointHistory]:
        return db.query(PointHistory).filter(
            PointHistory.user_points_id == user_points_id
        ).order_by(desc(PointHistory.created_at)).limit(limit).all()
