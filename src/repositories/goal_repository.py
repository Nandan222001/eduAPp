from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from src.models.goal import (
    Goal, GoalMilestone, GoalProgressLog, GoalAnalytics, GoalTemplate,
    GoalStatus, GoalType
)


class GoalRepository:
    
    @staticmethod
    def create_goal_template(db: Session, template: GoalTemplate) -> GoalTemplate:
        db.add(template)
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def get_goal_template_by_id(db: Session, template_id: int) -> Optional[GoalTemplate]:
        return db.query(GoalTemplate).filter(GoalTemplate.id == template_id).first()
    
    @staticmethod
    def get_goal_templates_by_institution(
        db: Session, 
        institution_id: int,
        is_active: bool = True,
        skip: int = 0, 
        limit: int = 100
    ) -> List[GoalTemplate]:
        query = db.query(GoalTemplate).filter(GoalTemplate.institution_id == institution_id)
        if is_active is not None:
            query = query.filter(GoalTemplate.is_active == is_active)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_goal_template(db: Session, template: GoalTemplate) -> GoalTemplate:
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def create_goal(db: Session, goal: Goal) -> Goal:
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def get_goal_by_id(db: Session, goal_id: int) -> Optional[Goal]:
        return db.query(Goal).filter(Goal.id == goal_id).first()
    
    @staticmethod
    def get_goals(
        db: Session,
        institution_id: int,
        user_id: Optional[int] = None,
        status: Optional[GoalStatus] = None,
        goal_type: Optional[GoalType] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Goal]:
        query = db.query(Goal).filter(Goal.institution_id == institution_id)
        
        if user_id is not None:
            query = query.filter(Goal.user_id == user_id)
        if status is not None:
            query = query.filter(Goal.status == status)
        if goal_type is not None:
            query = query.filter(Goal.goal_type == goal_type)
        
        return query.order_by(desc(Goal.created_at)).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_goal(db: Session, goal: Goal) -> Goal:
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def delete_goal(db: Session, goal: Goal) -> None:
        db.delete(goal)
        db.commit()
    
    @staticmethod
    def create_milestone(db: Session, milestone: GoalMilestone) -> GoalMilestone:
        db.add(milestone)
        db.commit()
        db.refresh(milestone)
        return milestone
    
    @staticmethod
    def get_milestone_by_id(db: Session, milestone_id: int) -> Optional[GoalMilestone]:
        return db.query(GoalMilestone).filter(GoalMilestone.id == milestone_id).first()
    
    @staticmethod
    def get_milestones_by_goal(db: Session, goal_id: int) -> List[GoalMilestone]:
        return db.query(GoalMilestone).filter(
            GoalMilestone.goal_id == goal_id
        ).order_by(GoalMilestone.order).all()
    
    @staticmethod
    def update_milestone(db: Session, milestone: GoalMilestone) -> GoalMilestone:
        db.commit()
        db.refresh(milestone)
        return milestone
    
    @staticmethod
    def create_progress_log(db: Session, progress_log: GoalProgressLog) -> GoalProgressLog:
        db.add(progress_log)
        db.commit()
        db.refresh(progress_log)
        return progress_log
    
    @staticmethod
    def get_progress_logs_by_goal(
        db: Session, 
        goal_id: int, 
        limit: int = 50
    ) -> List[GoalProgressLog]:
        return db.query(GoalProgressLog).filter(
            GoalProgressLog.goal_id == goal_id
        ).order_by(desc(GoalProgressLog.recorded_at)).limit(limit).all()
    
    @staticmethod
    def get_analytics(db: Session, user_id: int, institution_id: int) -> Optional[GoalAnalytics]:
        return db.query(GoalAnalytics).filter(
            GoalAnalytics.user_id == user_id,
            GoalAnalytics.institution_id == institution_id
        ).first()
    
    @staticmethod
    def create_analytics(db: Session, analytics: GoalAnalytics) -> GoalAnalytics:
        db.add(analytics)
        db.commit()
        db.refresh(analytics)
        return analytics
    
    @staticmethod
    def update_analytics(db: Session, analytics: GoalAnalytics) -> GoalAnalytics:
        db.commit()
        db.refresh(analytics)
        return analytics
