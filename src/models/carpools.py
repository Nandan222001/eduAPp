from datetime import datetime, date, time
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time, Text, Numeric, JSON, Index
from sqlalchemy.orm import relationship
from src.database import Base


class CarpoolRequestType(str, Enum):
    SEEKING = "seeking"
    OFFERING = "offering"


class CarpoolRequestStatus(str, Enum):
    ACTIVE = "active"
    MATCHED = "matched"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class CarpoolGroupStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class RideStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class EmergencyType(str, Enum):
    BREAKDOWN = "breakdown"
    ACCIDENT = "accident"
    DELAY = "delay"
    CANCELLATION = "cancellation"
    OTHER = "other"


class CarpoolGroup(Base):
    __tablename__ = "carpool_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    organizer_parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    group_name = Column(String(200), nullable=False)
    members = Column(JSON, nullable=False)
    pickup_points = Column(JSON, nullable=False)
    rotation_schedule = Column(JSON, nullable=False)
    active_driver_parent_id = Column(Integer, ForeignKey('parents.id', ondelete='SET NULL'), nullable=True, index=True)
    current_week_start = Column(Date, nullable=True)
    group_chat_id = Column(String(100), nullable=True, index=True)
    status = Column(String(20), default=CarpoolGroupStatus.ACTIVE.value, nullable=False, index=True)
    max_members = Column(Integer, default=8, nullable=False)
    description = Column(Text, nullable=True)
    rules = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    organizer = relationship("Parent", foreign_keys=[organizer_parent_id])
    active_driver = relationship("Parent", foreign_keys=[active_driver_parent_id])
    rides = relationship("CarpoolRide", back_populates="group", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_carpool_group_institution', 'institution_id'),
        Index('idx_carpool_group_organizer', 'organizer_parent_id'),
        Index('idx_carpool_group_active_driver', 'active_driver_parent_id'),
        Index('idx_carpool_group_status', 'status'),
        Index('idx_carpool_group_chat', 'group_chat_id'),
    )


class CarpoolRequest(Base):
    __tablename__ = "carpool_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    request_type = Column(String(20), nullable=False, index=True)
    student_ids = Column(JSON, nullable=False)
    route = Column(JSON, nullable=False)
    schedule_days = Column(JSON, nullable=False)
    departure_time = Column(Time, nullable=False)
    return_time = Column(Time, nullable=True)
    available_seats = Column(Integer, nullable=True)
    matching_criteria = Column(JSON, nullable=False)
    status = Column(String(20), default=CarpoolRequestStatus.ACTIVE.value, nullable=False, index=True)
    matched_group_id = Column(Integer, ForeignKey('carpool_groups.id', ondelete='SET NULL'), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    institution = relationship("Institution")
    parent = relationship("Parent")
    matched_group = relationship("CarpoolGroup")
    
    __table_args__ = (
        Index('idx_carpool_request_institution', 'institution_id'),
        Index('idx_carpool_request_parent', 'parent_id'),
        Index('idx_carpool_request_type', 'request_type'),
        Index('idx_carpool_request_status', 'status'),
        Index('idx_carpool_request_matched_group', 'matched_group_id'),
        Index('idx_carpool_request_departure_time', 'departure_time'),
    )


class CarpoolRide(Base):
    __tablename__ = "carpool_rides"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey('carpool_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    driver_parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    ride_date = Column(Date, nullable=False, index=True)
    ride_type = Column(String(20), nullable=False)
    passengers = Column(JSON, nullable=False)
    pickup_sequence = Column(JSON, nullable=False)
    pickup_time = Column(Time, nullable=False)
    drop_time = Column(Time, nullable=True)
    actual_pickup_time = Column(Time, nullable=True)
    actual_drop_time = Column(Time, nullable=True)
    confirmation_status = Column(String(20), default=RideStatus.SCHEDULED.value, nullable=False, index=True)
    confirmations = Column(JSON, nullable=True)
    vehicle_info = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    group = relationship("CarpoolGroup", back_populates="rides")
    driver = relationship("Parent")
    emergencies = relationship("EmergencyNotification", back_populates="ride", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_carpool_ride_institution', 'institution_id'),
        Index('idx_carpool_ride_group', 'group_id'),
        Index('idx_carpool_ride_driver', 'driver_parent_id'),
        Index('idx_carpool_ride_date', 'ride_date'),
        Index('idx_carpool_ride_status', 'confirmation_status'),
        Index('idx_carpool_ride_group_date', 'group_id', 'ride_date'),
    )


class EmergencyNotification(Base):
    __tablename__ = "emergency_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    ride_id = Column(Integer, ForeignKey('carpool_rides.id', ondelete='CASCADE'), nullable=False, index=True)
    reporter_parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    emergency_type = Column(String(20), nullable=False, index=True)
    severity = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(JSON, nullable=True)
    estimated_delay = Column(Integer, nullable=True)
    notified_parents = Column(JSON, nullable=False)
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    ride = relationship("CarpoolRide", back_populates="emergencies")
    reporter = relationship("Parent")
    
    __table_args__ = (
        Index('idx_emergency_notification_institution', 'institution_id'),
        Index('idx_emergency_notification_ride', 'ride_id'),
        Index('idx_emergency_notification_reporter', 'reporter_parent_id'),
        Index('idx_emergency_notification_type', 'emergency_type'),
        Index('idx_emergency_notification_created', 'created_at'),
    )


class CarpoolMatch(Base):
    __tablename__ = "carpool_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    request_id = Column(Integer, ForeignKey('carpool_requests.id', ondelete='CASCADE'), nullable=False, index=True)
    matched_request_id = Column(Integer, ForeignKey('carpool_requests.id', ondelete='CASCADE'), nullable=True, index=True)
    matched_group_id = Column(Integer, ForeignKey('carpool_groups.id', ondelete='CASCADE'), nullable=True, index=True)
    compatibility_score = Column(Numeric(5, 2), nullable=False)
    match_details = Column(JSON, nullable=False)
    status = Column(String(20), default='pending', nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    request = relationship("CarpoolRequest", foreign_keys=[request_id])
    matched_request = relationship("CarpoolRequest", foreign_keys=[matched_request_id])
    matched_group = relationship("CarpoolGroup")
    
    __table_args__ = (
        Index('idx_carpool_match_institution', 'institution_id'),
        Index('idx_carpool_match_request', 'request_id'),
        Index('idx_carpool_match_matched_request', 'matched_request_id'),
        Index('idx_carpool_match_matched_group', 'matched_group_id'),
        Index('idx_carpool_match_status', 'status'),
        Index('idx_carpool_match_score', 'compatibility_score'),
    )
