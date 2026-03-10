from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class BadgeType(str, Enum):
    ATTENDANCE = "attendance"
    ASSIGNMENT = "assignment"
    EXAM = "exam"
    GOAL = "goal"
    STREAK = "streak"
    MILESTONE = "milestone"
    SPECIAL = "special"


class BadgeRarity(str, Enum):
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class PointEventType(str, Enum):
    ATTENDANCE = "attendance"
    ASSIGNMENT_SUBMIT = "assignment_submit"
    ASSIGNMENT_GRADE = "assignment_grade"
    EXAM_PASS = "exam_pass"
    EXAM_EXCELLENT = "exam_excellent"
    GOAL_COMPLETE = "goal_complete"
    MILESTONE_ACHIEVE = "milestone_achieve"
    DAILY_LOGIN = "daily_login"
    STREAK = "streak"
    BADGE_EARN = "badge_earn"


class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    badge_type = Column(SQLEnum(BadgeType), nullable=False, index=True)
    rarity = Column(SQLEnum(BadgeRarity), default=BadgeRarity.COMMON, nullable=False)
    icon_url = Column(String(500), nullable=True)
    points_required = Column(Integer, nullable=True)
    criteria = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'name', name='uq_institution_badge_name'),
        Index('idx_badge_institution', 'institution_id'),
        Index('idx_badge_type', 'badge_type'),
        Index('idx_badge_active', 'is_active'),
    )


class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    badge_id = Column(Integer, ForeignKey('badges.id', ondelete='CASCADE'), nullable=False, index=True)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    points_awarded = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    badge = relationship("Badge", back_populates="user_badges")
    
    __table_args__ = (
        Index('idx_user_badge_institution', 'institution_id'),
        Index('idx_user_badge_user', 'user_id'),
        Index('idx_user_badge_badge', 'badge_id'),
        Index('idx_user_badge_earned', 'earned_at'),
    )


class UserPoints(Base):
    __tablename__ = "user_points"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    total_points = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_activity_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    point_history = relationship("PointHistory", back_populates="user_points", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'user_id', name='uq_institution_user_points'),
        Index('idx_user_points_institution', 'institution_id'),
        Index('idx_user_points_user', 'user_id'),
        Index('idx_user_points_total', 'total_points'),
        Index('idx_user_points_level', 'level'),
    )


class PointHistory(Base):
    __tablename__ = "point_history"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_points_id = Column(Integer, ForeignKey('user_points.id', ondelete='CASCADE'), nullable=False, index=True)
    event_type = Column(SQLEnum(PointEventType), nullable=False, index=True)
    points = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    reference_id = Column(Integer, nullable=True)
    reference_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user_points = relationship("UserPoints", back_populates="point_history")
    
    __table_args__ = (
        Index('idx_point_history_institution', 'institution_id'),
        Index('idx_point_history_user_points', 'user_points_id'),
        Index('idx_point_history_event_type', 'event_type'),
        Index('idx_point_history_reference', 'reference_type', 'reference_id'),
        Index('idx_point_history_created', 'created_at'),
    )
