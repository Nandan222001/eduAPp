from datetime import datetime, date
from typing import List
from celery import shared_task
from src.database import SessionLocal
from src.models.goal import Goal, GoalStatus, GoalType
from src.services.goal_service import GoalService


@shared_task
def update_all_active_goals_progress():
    db = SessionLocal()
    try:
        active_goals = db.query(Goal).filter(
            Goal.status == GoalStatus.ACTIVE,
            Goal.goal_type.in_([
                GoalType.ATTENDANCE,
                GoalType.EXAM,
                GoalType.ASSIGNMENT,
                GoalType.GRADE
            ])
        ).all()
        
        updated_count = 0
        for goal in active_goals:
            try:
                GoalService.calculate_goal_progress_from_data(db, goal.id)
                updated_count += 1
            except Exception as e:
                print(f"Error updating goal {goal.id}: {str(e)}")
                continue
        
        return {
            "status": "success",
            "updated_count": updated_count,
            "total_goals": len(active_goals)
        }
    finally:
        db.close()


@shared_task
def check_expired_goals():
    db = SessionLocal()
    try:
        today = date.today()
        expired_goals = db.query(Goal).filter(
            Goal.status == GoalStatus.ACTIVE,
            Goal.end_date < today
        ).all()
        
        failed_count = 0
        for goal in expired_goals:
            try:
                GoalService.check_and_update_goal_status(db, goal)
                failed_count += 1
            except Exception as e:
                print(f"Error checking goal {goal.id}: {str(e)}")
                continue
        
        db.commit()
        
        return {
            "status": "success",
            "failed_count": failed_count,
            "total_checked": len(expired_goals)
        }
    finally:
        db.close()


@shared_task
def calculate_user_goal_analytics(user_id: int, institution_id: int):
    db = SessionLocal()
    try:
        analytics = GoalService.calculate_analytics(db, user_id, institution_id)
        return {
            "status": "success",
            "user_id": user_id,
            "analytics": {
                "total_goals": analytics.total_goals,
                "completion_rate": float(analytics.completion_rate)
            }
        }
    finally:
        db.close()


@shared_task
def recalculate_all_analytics():
    db = SessionLocal()
    try:
        from src.models.goal import GoalAnalytics
        
        analytics_records = db.query(GoalAnalytics).all()
        
        updated_count = 0
        for analytics in analytics_records:
            try:
                GoalService.calculate_analytics(db, analytics.user_id, analytics.institution_id)
                updated_count += 1
            except Exception as e:
                print(f"Error calculating analytics for user {analytics.user_id}: {str(e)}")
                continue
        
        return {
            "status": "success",
            "updated_count": updated_count,
            "total_users": len(analytics_records)
        }
    finally:
        db.close()
