from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, extract
from src.models.goal import (
    Goal, GoalMilestone, GoalProgressLog, GoalAnalytics, GoalTemplate,
    GoalStatus, MilestoneStatus, GoalType
)
from src.models.attendance import AttendanceSummary
from src.models.examination import ExamMarks, ExamResult
from src.models.assignment import Submission
from src.schemas.goal import (
    GoalCreate, GoalUpdate, GoalTemplateCreate, GoalTemplateUpdate,
    GoalMilestoneCreate, GoalMilestoneUpdate, UpdateGoalProgressRequest,
    GoalProgressReport, GoalSummary, GoalStatusUpdateRequest
)
from src.services.gamification_service import GamificationService
from src.schemas.gamification import AddPointsRequest
from src.models.gamification import PointEventType


class GoalService:
    
    @staticmethod
    def create_goal_template(
        db: Session, 
        institution_id: int, 
        user_id: int,
        template_data: GoalTemplateCreate
    ) -> GoalTemplate:
        template = GoalTemplate(
            institution_id=institution_id,
            created_by=user_id,
            **template_data.model_dump()
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def update_goal_template(
        db: Session, 
        template_id: int, 
        template_data: GoalTemplateUpdate
    ) -> Optional[GoalTemplate]:
        template = db.query(GoalTemplate).filter(GoalTemplate.id == template_id).first()
        if not template:
            return None
        
        update_data = template_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def get_goal_templates(
        db: Session, 
        institution_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[GoalTemplate]:
        return db.query(GoalTemplate).filter(
            GoalTemplate.institution_id == institution_id,
            GoalTemplate.is_active == True
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_goal(
        db: Session, 
        institution_id: int, 
        user_id: int, 
        goal_data: GoalCreate
    ) -> Goal:
        goal_dict = goal_data.model_dump(exclude={'milestones'})
        
        goal = Goal(
            institution_id=institution_id,
            user_id=user_id,
            status=GoalStatus.ACTIVE,
            **goal_dict
        )
        db.add(goal)
        db.flush()
        
        if goal_data.milestones:
            for milestone_data in goal_data.milestones:
                milestone = GoalMilestone(
                    institution_id=institution_id,
                    goal_id=goal.id,
                    **milestone_data.model_dump()
                )
                db.add(milestone)
        
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def update_goal(db: Session, goal_id: int, goal_data: GoalUpdate) -> Optional[Goal]:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return None
        
        update_data = goal_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(goal, field, value)
        
        db.commit()
        db.refresh(goal)
        return goal
    
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
        
        if user_id:
            query = query.filter(Goal.user_id == user_id)
        if status:
            query = query.filter(Goal.status == status)
        if goal_type:
            query = query.filter(Goal.goal_type == goal_type)
        
        return query.order_by(desc(Goal.created_at)).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_goal(db: Session, goal_id: int) -> Optional[Goal]:
        return db.query(Goal).filter(Goal.id == goal_id).first()
    
    @staticmethod
    def delete_goal(db: Session, goal_id: int) -> bool:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return False
        
        db.delete(goal)
        db.commit()
        return True
    
    @staticmethod
    def update_goal_progress(
        db: Session, 
        goal_id: int, 
        progress_data: UpdateGoalProgressRequest
    ) -> Optional[Goal]:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return None
        
        previous_value = goal.current_value
        previous_percentage = goal.progress_percentage
        
        goal.current_value = progress_data.current_value
        goal.progress_percentage = min(
            Decimal('100.00'),
            (progress_data.current_value / goal.target_value) * Decimal('100')
        )
        goal.last_calculated_at = datetime.utcnow()
        
        progress_log = GoalProgressLog(
            institution_id=goal.institution_id,
            goal_id=goal.id,
            previous_value=previous_value,
            new_value=progress_data.current_value,
            change=progress_data.current_value - previous_value,
            previous_percentage=previous_percentage,
            new_percentage=goal.progress_percentage,
            notes=progress_data.notes,
            data_source=progress_data.data_source,
            reference_id=progress_data.reference_id,
            reference_type=progress_data.reference_type
        )
        db.add(progress_log)
        
        GoalService.update_milestones_progress(db, goal)
        GoalService.check_and_update_goal_status(db, goal)
        
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def update_milestones_progress(db: Session, goal: Goal) -> None:
        milestones = db.query(GoalMilestone).filter(
            GoalMilestone.goal_id == goal.id
        ).order_by(GoalMilestone.order).all()
        
        for milestone in milestones:
            milestone.current_value = min(goal.current_value, milestone.target_value)
            milestone.progress_percentage = min(
                Decimal('100.00'),
                (milestone.current_value / milestone.target_value) * Decimal('100')
            )
            
            if milestone.current_value >= milestone.target_value:
                if milestone.status != MilestoneStatus.COMPLETED:
                    milestone.status = MilestoneStatus.COMPLETED
                    milestone.completed_at = datetime.utcnow()
                    milestone.points_earned = milestone.points_reward
                    
                    if milestone.points_reward > 0:
                        GamificationService.add_points(
                            db,
                            goal.institution_id,
                            AddPointsRequest(
                                user_id=goal.user_id,
                                points=milestone.points_reward,
                                event_type=PointEventType.MILESTONE_ACHIEVE,
                                description=f"Completed milestone: {milestone.title}",
                                reference_id=milestone.id,
                                reference_type="goal_milestone"
                            )
                        )
            elif milestone.current_value > 0:
                if milestone.status == MilestoneStatus.PENDING:
                    milestone.status = MilestoneStatus.IN_PROGRESS
    
    @staticmethod
    def check_and_update_goal_status(db: Session, goal: Goal) -> None:
        if goal.progress_percentage >= Decimal('100.00'):
            if goal.status != GoalStatus.COMPLETED:
                goal.status = GoalStatus.COMPLETED
                goal.completed_at = datetime.utcnow()
                goal.points_earned = goal.points_reward
                
                if goal.points_reward > 0:
                    GamificationService.add_points(
                        db,
                        goal.institution_id,
                        AddPointsRequest(
                            user_id=goal.user_id,
                            points=goal.points_reward,
                            event_type=PointEventType.GOAL_COMPLETE,
                            description=f"Completed goal: {goal.title}",
                            reference_id=goal.id,
                            reference_type="goal"
                        )
                    )
        elif goal.end_date < date.today() and goal.status == GoalStatus.ACTIVE:
            if goal.progress_percentage < Decimal('100.00'):
                goal.status = GoalStatus.FAILED
    
    @staticmethod
    def calculate_goal_progress_from_data(
        db: Session, 
        goal_id: int
    ) -> Optional[Goal]:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return None
        
        current_value = Decimal('0')
        
        if goal.goal_type == GoalType.ATTENDANCE:
            current_value = GoalService._calculate_attendance_progress(db, goal)
        elif goal.goal_type == GoalType.EXAM:
            current_value = GoalService._calculate_exam_progress(db, goal)
        elif goal.goal_type == GoalType.ASSIGNMENT:
            current_value = GoalService._calculate_assignment_progress(db, goal)
        elif goal.goal_type == GoalType.GRADE:
            current_value = GoalService._calculate_grade_progress(db, goal)
        
        if current_value != goal.current_value:
            progress_data = UpdateGoalProgressRequest(
                current_value=current_value,
                data_source="auto_calculation",
                notes="Automatically calculated from system data"
            )
            goal = GoalService.update_goal_progress(db, goal.id, progress_data)
        
        return goal
    
    @staticmethod
    def _calculate_attendance_progress(db: Session, goal: Goal) -> Decimal:
        summary = db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == goal.user_id,
            AttendanceSummary.subject_id == goal.subject_id if goal.subject_id else True
        ).order_by(desc(AttendanceSummary.last_updated)).first()
        
        if summary:
            return Decimal(str(summary.attendance_percentage))
        return Decimal('0')
    
    @staticmethod
    def _calculate_exam_progress(db: Session, goal: Goal) -> Decimal:
        results = db.query(ExamResult).join(
            ExamResult.exam
        ).filter(
            ExamResult.student_id == goal.user_id,
            ExamResult.exam.start_date >= goal.start_date,
            ExamResult.exam.end_date <= goal.end_date
        ).all()
        
        if results:
            avg_percentage = sum(float(r.percentage) for r in results) / len(results)
            return Decimal(str(avg_percentage))
        return Decimal('0')
    
    @staticmethod
    def _calculate_assignment_progress(db: Session, goal: Goal) -> Decimal:
        submissions = db.query(Submission).join(
            Submission.assignment
        ).filter(
            Submission.student_id == goal.user_id,
            Submission.assignment.subject_id == goal.subject_id if goal.subject_id else True,
            Submission.assignment.due_date >= goal.start_date,
            Submission.assignment.due_date <= goal.end_date,
            Submission.marks_obtained.isnot(None)
        ).all()
        
        if submissions:
            total_obtained = sum(float(s.marks_obtained or 0) for s in submissions)
            total_max = sum(float(s.assignment.max_marks) for s in submissions)
            if total_max > 0:
                percentage = (total_obtained / total_max) * 100
                return Decimal(str(percentage))
        return Decimal('0')
    
    @staticmethod
    def _calculate_grade_progress(db: Session, goal: Goal) -> Decimal:
        return GoalService._calculate_exam_progress(db, goal)
    
    @staticmethod
    def update_goal_status(
        db: Session, 
        goal_id: int, 
        status_data: GoalStatusUpdateRequest
    ) -> Optional[Goal]:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return None
        
        goal.status = status_data.status
        
        if status_data.status == GoalStatus.COMPLETED and not goal.completed_at:
            goal.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def get_goal_progress_report(db: Session, goal_id: int) -> Optional[GoalProgressReport]:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return None
        
        progress_logs = db.query(GoalProgressLog).filter(
            GoalProgressLog.goal_id == goal_id
        ).order_by(desc(GoalProgressLog.recorded_at)).limit(20).all()
        
        milestones = db.query(GoalMilestone).filter(
            GoalMilestone.goal_id == goal_id
        ).all()
        
        milestones_completed = sum(
            1 for m in milestones if m.status == MilestoneStatus.COMPLETED
        )
        
        days_remaining = (goal.end_date - date.today()).days
        
        if len(progress_logs) >= 2:
            recent_rate = float(progress_logs[0].new_percentage - progress_logs[-1].new_percentage) / len(progress_logs)
            remaining_percentage = float(100 - goal.progress_percentage)
            days_needed = remaining_percentage / recent_rate if recent_rate > 0 else 999
            projected_completion_date = date.today() + timedelta(days=int(days_needed))
        else:
            projected_completion_date = None
        
        on_track = (
            goal.status == GoalStatus.ACTIVE and
            days_remaining > 0 and
            (projected_completion_date is None or projected_completion_date <= goal.end_date)
        )
        
        return GoalProgressReport(
            goal=goal,
            progress_logs=progress_logs,
            milestones_completed=milestones_completed,
            milestones_total=len(milestones),
            days_remaining=max(0, days_remaining),
            on_track=on_track,
            projected_completion_date=projected_completion_date
        )
    
    @staticmethod
    def get_or_create_analytics(db: Session, user_id: int, institution_id: int) -> GoalAnalytics:
        analytics = db.query(GoalAnalytics).filter(
            GoalAnalytics.user_id == user_id,
            GoalAnalytics.institution_id == institution_id
        ).first()
        
        if not analytics:
            analytics = GoalAnalytics(
                institution_id=institution_id,
                user_id=user_id
            )
            db.add(analytics)
            db.commit()
            db.refresh(analytics)
        
        return analytics
    
    @staticmethod
    def calculate_analytics(db: Session, user_id: int, institution_id: int) -> GoalAnalytics:
        analytics = GoalService.get_or_create_analytics(db, user_id, institution_id)
        
        goals = db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.institution_id == institution_id
        ).all()
        
        analytics.total_goals = len(goals)
        analytics.active_goals = sum(1 for g in goals if g.status == GoalStatus.ACTIVE)
        analytics.completed_goals = sum(1 for g in goals if g.status == GoalStatus.COMPLETED)
        analytics.failed_goals = sum(1 for g in goals if g.status == GoalStatus.FAILED)
        
        if analytics.total_goals > 0:
            analytics.completion_rate = (
                Decimal(analytics.completed_goals) / Decimal(analytics.total_goals)
            ) * Decimal('100')
            analytics.average_progress = sum(
                g.progress_percentage for g in goals
            ) / len(goals)
        else:
            analytics.completion_rate = Decimal('0')
            analytics.average_progress = Decimal('0')
        
        analytics.total_points_earned = sum(g.points_earned for g in goals)
        
        today = date.today()
        month_start = today.replace(day=1)
        quarter_start = today.replace(month=((today.month - 1) // 3) * 3 + 1, day=1)
        year_start = today.replace(month=1, day=1)
        
        analytics.goals_this_month = sum(
            1 for g in goals if g.created_at.date() >= month_start
        )
        analytics.goals_this_quarter = sum(
            1 for g in goals if g.created_at.date() >= quarter_start
        )
        analytics.goals_this_year = sum(
            1 for g in goals if g.created_at.date() >= year_start
        )
        
        analytics.completed_this_month = sum(
            1 for g in goals 
            if g.status == GoalStatus.COMPLETED and g.completed_at and g.completed_at.date() >= month_start
        )
        analytics.completed_this_quarter = sum(
            1 for g in goals 
            if g.status == GoalStatus.COMPLETED and g.completed_at and g.completed_at.date() >= quarter_start
        )
        analytics.completed_this_year = sum(
            1 for g in goals 
            if g.status == GoalStatus.COMPLETED and g.completed_at and g.completed_at.date() >= year_start
        )
        
        analytics.last_calculated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(analytics)
        return analytics
    
    @staticmethod
    def get_goal_summary(db: Session, institution_id: int, user_id: Optional[int] = None) -> GoalSummary:
        query = db.query(Goal).filter(Goal.institution_id == institution_id)
        if user_id:
            query = query.filter(Goal.user_id == user_id)
        
        goals = query.all()
        
        total_goals = len(goals)
        active_goals = sum(1 for g in goals if g.status == GoalStatus.ACTIVE)
        completed_goals = sum(1 for g in goals if g.status == GoalStatus.COMPLETED)
        failed_goals = sum(1 for g in goals if g.status == GoalStatus.FAILED)
        
        completion_rate = Decimal('0')
        average_progress = Decimal('0')
        
        if total_goals > 0:
            completion_rate = (Decimal(completed_goals) / Decimal(total_goals)) * Decimal('100')
            average_progress = sum(g.progress_percentage for g in goals) / len(goals)
        
        goals_by_type = {}
        for goal_type in GoalType:
            goals_by_type[goal_type.value] = sum(1 for g in goals if g.goal_type == goal_type)
        
        goals_by_status = {}
        for status in GoalStatus:
            goals_by_status[status.value] = sum(1 for g in goals if g.status == status)
        
        return GoalSummary(
            total_goals=total_goals,
            active_goals=active_goals,
            completed_goals=completed_goals,
            failed_goals=failed_goals,
            completion_rate=completion_rate,
            average_progress=average_progress,
            goals_by_type=goals_by_type,
            goals_by_status=goals_by_status
        )
    
    @staticmethod
    def create_milestone(
        db: Session, 
        goal_id: int, 
        institution_id: int,
        milestone_data: GoalMilestoneCreate
    ) -> GoalMilestone:
        milestone = GoalMilestone(
            institution_id=institution_id,
            goal_id=goal_id,
            **milestone_data.model_dump()
        )
        db.add(milestone)
        db.commit()
        db.refresh(milestone)
        return milestone
    
    @staticmethod
    def update_milestone(
        db: Session, 
        milestone_id: int, 
        milestone_data: GoalMilestoneUpdate
    ) -> Optional[GoalMilestone]:
        milestone = db.query(GoalMilestone).filter(GoalMilestone.id == milestone_id).first()
        if not milestone:
            return None
        
        update_data = milestone_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(milestone, field, value)
        
        db.commit()
        db.refresh(milestone)
        return milestone
