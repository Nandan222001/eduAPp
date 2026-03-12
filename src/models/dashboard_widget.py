from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from src.database import Base
import enum


class WidgetType(str, enum.Enum):
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


class WidgetSize(str, enum.Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    FULL = "full"


class DashboardWidget(Base):
    __tablename__ = "dashboard_widgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    widget_type = Column(SQLEnum(WidgetType), nullable=False)
    title = Column(String(255), nullable=False)
    position = Column(Integer, nullable=False, default=0)
    size = Column(SQLEnum(WidgetSize), nullable=False, default=WidgetSize.MEDIUM)
    is_visible = Column(Boolean, default=True, nullable=False)
    config = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="dashboard_widgets")

    __table_args__ = (
        Index('idx_dashboard_widget_user', 'user_id'),
        Index('idx_dashboard_widget_position', 'user_id', 'position'),
        Index('idx_dashboard_widget_visible', 'user_id', 'is_visible'),
    )


class WidgetPreset(Base):
    __tablename__ = "widget_presets"

    id = Column(Integer, primary_key=True, index=True)
    role_slug = Column(String(100), nullable=False, index=True)
    widget_type = Column(SQLEnum(WidgetType), nullable=False)
    default_title = Column(String(255), nullable=False)
    default_position = Column(Integer, nullable=False)
    default_size = Column(SQLEnum(WidgetSize), nullable=False, default=WidgetSize.MEDIUM)
    default_visible = Column(Boolean, default=True, nullable=False)
    default_config = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_widget_preset_role', 'role_slug'),
        Index('idx_widget_preset_type', 'widget_type'),
    )
