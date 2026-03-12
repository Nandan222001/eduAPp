from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class WidgetType(str, Enum):
    UPCOMING_DEADLINES = "upcoming_deadlines"
    PENDING_GRADING = "pending_grading"
    ATTENDANCE_ALERTS = "attendance_alerts"
    RECENT_GRADES = "recent_grades"
    QUICK_STATS = "quick_stats"
    UPCOMING_EXAMS = "upcoming_exams"
    RECENT_ANNOUNCEMENTS = "recent_announcements"
    PROGRESS_TRACKER = "progress_tracker"
    GOAL_TRACKER = "goal_tracker"
    LEADERBOARD = "leaderboard"
    STUDY_STREAK = "study_streak"
    BADGES = "badges"
    PENDING_ASSIGNMENTS = "pending_assignments"
    CLASS_PERFORMANCE = "class_performance"
    ATTENDANCE_SUMMARY = "attendance_summary"
    RECENT_ACTIVITY = "recent_activity"
    CALENDAR = "calendar"
    TIMETABLE = "timetable"
    NOTIFICATIONS = "notifications"
    QUICK_ACTIONS = "quick_actions"


class WidgetSize(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    FULL = "full"


class WidgetConfigBase(BaseModel):
    refresh_interval: Optional[int] = 300
    max_items: Optional[int] = 10
    show_icons: Optional[bool] = True
    compact_view: Optional[bool] = False


class DashboardWidgetBase(BaseModel):
    widget_type: WidgetType
    title: str
    position: int = 0
    size: WidgetSize = WidgetSize.MEDIUM
    is_visible: bool = True
    config: Optional[Dict[str, Any]] = None


class DashboardWidgetCreate(DashboardWidgetBase):
    pass


class DashboardWidgetUpdate(BaseModel):
    title: Optional[str] = None
    position: Optional[int] = None
    size: Optional[WidgetSize] = None
    is_visible: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class DashboardWidgetResponse(DashboardWidgetBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WidgetPositionUpdate(BaseModel):
    widget_id: int
    position: int


class BulkWidgetPositionUpdate(BaseModel):
    updates: List[WidgetPositionUpdate]


class WidgetPresetBase(BaseModel):
    role_slug: str
    widget_type: WidgetType
    default_title: str
    default_position: int
    default_size: WidgetSize = WidgetSize.MEDIUM
    default_visible: bool = True
    default_config: Optional[Dict[str, Any]] = None
    description: Optional[str] = None


class WidgetPresetResponse(WidgetPresetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WidgetDataResponse(BaseModel):
    widget_id: int
    widget_type: WidgetType
    data: Dict[str, Any]
    last_updated: datetime


class DeadlineItem(BaseModel):
    id: int
    title: str
    type: str
    due_date: datetime
    subject: Optional[str] = None
    priority: Optional[str] = "normal"
    status: Optional[str] = None


class GradingItem(BaseModel):
    id: int
    title: str
    type: str
    submitted_count: int
    total_count: int
    subject: str
    deadline: Optional[datetime] = None
    pending_count: int


class AttendanceAlertItem(BaseModel):
    id: int
    student_name: str
    student_id: int
    attendance_percentage: float
    absent_days: int
    alert_type: str
    grade: Optional[str] = None
    section: Optional[str] = None


class RecentGradeItem(BaseModel):
    id: int
    subject: str
    exam_name: str
    marks_obtained: float
    total_marks: float
    percentage: float
    grade: Optional[str] = None
    date: datetime


class QuickStatItem(BaseModel):
    label: str
    value: str
    icon: str
    color: str
    trend: Optional[str] = None
    change: Optional[str] = None


class UpcomingDeadlinesData(BaseModel):
    deadlines: List[DeadlineItem]
    total_count: int


class PendingGradingData(BaseModel):
    items: List[GradingItem]
    total_count: int


class AttendanceAlertsData(BaseModel):
    alerts: List[AttendanceAlertItem]
    total_count: int


class RecentGradesData(BaseModel):
    grades: List[RecentGradeItem]
    average_percentage: float


class QuickStatsData(BaseModel):
    stats: List[QuickStatItem]


class InitializeDefaultWidgetsRequest(BaseModel):
    role_slug: Optional[str] = None
