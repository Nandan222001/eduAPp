from datetime import datetime, date
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from src.models.goal import GoalType, GoalStatus, MilestoneStatus


class GoalTemplateBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    goal_type: GoalType
    category: Optional[str] = Field(None, max_length=100)
    default_target_value: Optional[Decimal] = None
    default_duration_days: Optional[int] = None
    smart_criteria: Optional[Dict[str, Any]] = None
    suggested_milestones: Optional[List[Dict[str, Any]]] = None
    points_reward: int = 0
    is_active: bool = True


class GoalTemplateCreate(GoalTemplateBase):
    pass


class GoalTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    goal_type: Optional[GoalType] = None
    category: Optional[str] = Field(None, max_length=100)
    default_target_value: Optional[Decimal] = None
    default_duration_days: Optional[int] = None
    smart_criteria: Optional[Dict[str, Any]] = None
    suggested_milestones: Optional[List[Dict[str, Any]]] = None
    points_reward: Optional[int] = None
    is_active: Optional[bool] = None


class GoalTemplateResponse(GoalTemplateBase):
    id: int
    institution_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoalMilestoneBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    target_value: Decimal
    order: int
    target_date: Optional[date] = None
    points_reward: int = 0


class GoalMilestoneCreate(GoalMilestoneBase):
    pass


class GoalMilestoneUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    target_value: Optional[Decimal] = None
    order: Optional[int] = None
    target_date: Optional[date] = None
    points_reward: Optional[int] = None


class GoalMilestoneResponse(GoalMilestoneBase):
    id: int
    institution_id: int
    goal_id: int
    current_value: Decimal
    status: MilestoneStatus
    progress_percentage: Decimal
    points_earned: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoalBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    goal_type: GoalType
    category: Optional[str] = Field(None, max_length=100)
    specific: Optional[str] = None
    measurable: Optional[str] = None
    achievable: Optional[str] = None
    relevant: Optional[str] = None
    time_bound: Optional[str] = None
    target_value: Decimal
    unit: Optional[str] = Field(None, max_length=50)
    start_date: date
    end_date: date
    points_reward: int = 0
    subject_id: Optional[int] = None
    grade_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class GoalCreate(GoalBase):
    template_id: Optional[int] = None
    milestones: Optional[List[GoalMilestoneCreate]] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    goal_type: Optional[GoalType] = None
    category: Optional[str] = Field(None, max_length=100)
    specific: Optional[str] = None
    measurable: Optional[str] = None
    achievable: Optional[str] = None
    relevant: Optional[str] = None
    time_bound: Optional[str] = None
    target_value: Optional[Decimal] = None
    unit: Optional[str] = Field(None, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[GoalStatus] = None
    points_reward: Optional[int] = None
    subject_id: Optional[int] = None
    grade_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class GoalResponse(GoalBase):
    id: int
    institution_id: int
    user_id: int
    template_id: Optional[int] = None
    current_value: Decimal
    status: GoalStatus
    progress_percentage: Decimal
    points_earned: int
    completed_at: Optional[datetime] = None
    last_calculated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoalWithMilestonesResponse(GoalResponse):
    milestones: List[GoalMilestoneResponse] = []


class GoalProgressLogResponse(BaseModel):
    id: int
    institution_id: int
    goal_id: int
    previous_value: Decimal
    new_value: Decimal
    change: Decimal
    previous_percentage: Decimal
    new_percentage: Decimal
    notes: Optional[str] = None
    data_source: Optional[str] = None
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    recorded_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoalAnalyticsResponse(BaseModel):
    id: int
    institution_id: int
    user_id: int
    total_goals: int
    active_goals: int
    completed_goals: int
    failed_goals: int
    completion_rate: Decimal
    average_progress: Decimal
    total_points_earned: int
    goals_this_month: int
    goals_this_quarter: int
    goals_this_year: int
    completed_this_month: int
    completed_this_quarter: int
    completed_this_year: int
    last_calculated_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UpdateGoalProgressRequest(BaseModel):
    current_value: Decimal
    notes: Optional[str] = None
    data_source: Optional[str] = None
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None


class GoalStatusUpdateRequest(BaseModel):
    status: GoalStatus


class GoalProgressReport(BaseModel):
    goal: GoalWithMilestonesResponse
    progress_logs: List[GoalProgressLogResponse]
    milestones_completed: int
    milestones_total: int
    days_remaining: int
    on_track: bool
    projected_completion_date: Optional[date] = None


class GoalSummary(BaseModel):
    total_goals: int
    active_goals: int
    completed_goals: int
    failed_goals: int
    completion_rate: Decimal
    average_progress: Decimal
    goals_by_type: Dict[str, int]
    goals_by_status: Dict[str, int]


class BulkGoalStatusUpdate(BaseModel):
    goal_ids: List[int]
    status: GoalStatus
