from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.goal_service import GoalService
from src.schemas.goal import (
    GoalTemplateCreate, GoalTemplateUpdate, GoalTemplateResponse,
    GoalMilestoneCreate, GoalMilestoneUpdate, GoalMilestoneResponse,
    GoalCreate, GoalUpdate, GoalResponse, GoalWithMilestonesResponse,
    GoalProgressLogResponse, GoalAnalyticsResponse,
    UpdateGoalProgressRequest, GoalStatusUpdateRequest,
    GoalProgressReport, GoalSummary, BulkGoalStatusUpdate
)
from src.models.goal import GoalStatus, GoalType

router = APIRouter()


@router.post("/templates", response_model=GoalTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_goal_template(
    template: GoalTemplateCreate,
    institution_id: int = Query(...),
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GoalService.create_goal_template(db, institution_id, user_id, template)


@router.get("/templates", response_model=List[GoalTemplateResponse])
def list_goal_templates(
    institution_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return GoalService.get_goal_templates(db, institution_id, skip, limit)


@router.put("/templates/{template_id}", response_model=GoalTemplateResponse)
def update_goal_template(
    template_id: int,
    template: GoalTemplateUpdate,
    db: Session = Depends(get_db)
):
    updated_template = GoalService.update_goal_template(db, template_id, template)
    if not updated_template:
        raise HTTPException(status_code=404, detail="Template not found")
    return updated_template


@router.post("", response_model=GoalWithMilestonesResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal: GoalCreate,
    institution_id: int = Query(...),
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GoalService.create_goal(db, institution_id, user_id, goal)


@router.get("", response_model=List[GoalResponse])
def list_goals(
    institution_id: int = Query(...),
    user_id: Optional[int] = Query(None),
    status: Optional[GoalStatus] = Query(None),
    goal_type: Optional[GoalType] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return GoalService.get_goals(db, institution_id, user_id, status, goal_type, skip, limit)


@router.get("/{goal_id}", response_model=GoalWithMilestonesResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db)
):
    goal = GoalService.get_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal: GoalUpdate,
    db: Session = Depends(get_db)
):
    updated_goal = GoalService.update_goal(db, goal_id, goal)
    if not updated_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return updated_goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db)
):
    if not GoalService.delete_goal(db, goal_id):
        raise HTTPException(status_code=404, detail="Goal not found")


@router.put("/{goal_id}/progress", response_model=GoalResponse)
def update_goal_progress(
    goal_id: int,
    progress: UpdateGoalProgressRequest,
    db: Session = Depends(get_db)
):
    updated_goal = GoalService.update_goal_progress(db, goal_id, progress)
    if not updated_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return updated_goal


@router.put("/{goal_id}/status", response_model=GoalResponse)
def update_goal_status(
    goal_id: int,
    status_data: GoalStatusUpdateRequest,
    db: Session = Depends(get_db)
):
    updated_goal = GoalService.update_goal_status(db, goal_id, status_data)
    if not updated_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return updated_goal


@router.post("/{goal_id}/calculate-progress", response_model=GoalResponse)
def calculate_goal_progress(
    goal_id: int,
    db: Session = Depends(get_db)
):
    goal = GoalService.calculate_goal_progress_from_data(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.get("/{goal_id}/report", response_model=GoalProgressReport)
def get_goal_progress_report(
    goal_id: int,
    db: Session = Depends(get_db)
):
    report = GoalService.get_goal_progress_report(db, goal_id)
    if not report:
        raise HTTPException(status_code=404, detail="Goal not found")
    return report


@router.get("/{goal_id}/progress-logs", response_model=List[GoalProgressLogResponse])
def get_goal_progress_logs(
    goal_id: int,
    db: Session = Depends(get_db)
):
    goal = GoalService.get_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal.progress_logs


@router.post("/{goal_id}/milestones", response_model=GoalMilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(
    goal_id: int,
    milestone: GoalMilestoneCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    goal = GoalService.get_goal(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return GoalService.create_milestone(db, goal_id, institution_id, milestone)


@router.put("/milestones/{milestone_id}", response_model=GoalMilestoneResponse)
def update_milestone(
    milestone_id: int,
    milestone: GoalMilestoneUpdate,
    db: Session = Depends(get_db)
):
    updated_milestone = GoalService.update_milestone(db, milestone_id, milestone)
    if not updated_milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return updated_milestone


@router.get("/analytics/user/{user_id}", response_model=GoalAnalyticsResponse)
def get_user_analytics(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GoalService.calculate_analytics(db, user_id, institution_id)


@router.get("/summary", response_model=GoalSummary)
def get_goals_summary(
    institution_id: int = Query(...),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return GoalService.get_goal_summary(db, institution_id, user_id)


@router.put("/bulk/status", response_model=dict)
def bulk_update_goal_status(
    bulk_update: BulkGoalStatusUpdate,
    db: Session = Depends(get_db)
):
    updated_count = 0
    for goal_id in bulk_update.goal_ids:
        status_data = GoalStatusUpdateRequest(status=bulk_update.status)
        result = GoalService.update_goal_status(db, goal_id, status_data)
        if result:
            updated_count += 1
    
    return {
        "updated_count": updated_count,
        "total_requested": len(bulk_update.goal_ids)
    }
