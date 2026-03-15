from datetime import datetime, date, time
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from src.models.carpools import (
    CarpoolRequestType, 
    CarpoolRequestStatus, 
    CarpoolGroupStatus, 
    RideStatus,
    EmergencyType
)


class PickupPoint(BaseModel):
    address: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    pickup_time: time
    drop_time: Optional[time] = None


class GroupMember(BaseModel):
    parent_id: int
    parent_name: str
    phone: str
    students: List[Dict[str, Any]]


class MatchingCriteria(BaseModel):
    max_distance_km: Optional[Decimal] = Field(None, ge=0)
    preferred_departure_time_window: Optional[int] = Field(None, ge=5)
    same_grade_only: bool = False
    same_section_only: bool = False
    max_detour_minutes: Optional[int] = Field(None, ge=0)


class RouteInfo(BaseModel):
    start_address: str
    start_latitude: Optional[Decimal] = None
    start_longitude: Optional[Decimal] = None
    end_address: str
    end_latitude: Optional[Decimal] = None
    end_longitude: Optional[Decimal] = None
    waypoints: Optional[List[Dict[str, Any]]] = None


class CarpoolGroupBase(BaseModel):
    group_name: str = Field(..., max_length=200)
    members: List[Dict[str, Any]]
    pickup_points: List[Dict[str, Any]]
    rotation_schedule: Dict[str, Any]
    description: Optional[str] = None
    rules: Optional[str] = None
    max_members: int = Field(default=8, ge=2, le=20)


class CarpoolGroupCreate(CarpoolGroupBase):
    institution_id: int
    organizer_parent_id: int
    group_chat_id: Optional[str] = None


class CarpoolGroupUpdate(BaseModel):
    group_name: Optional[str] = Field(None, max_length=200)
    members: Optional[List[Dict[str, Any]]] = None
    pickup_points: Optional[List[Dict[str, Any]]] = None
    rotation_schedule: Optional[Dict[str, Any]] = None
    active_driver_parent_id: Optional[int] = None
    current_week_start: Optional[date] = None
    group_chat_id: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[str] = None
    max_members: Optional[int] = Field(None, ge=2, le=20)


class CarpoolGroupResponse(CarpoolGroupBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    organizer_parent_id: int
    active_driver_parent_id: Optional[int] = None
    current_week_start: Optional[date] = None
    group_chat_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


class CarpoolRequestBase(BaseModel):
    request_type: str
    student_ids: List[int]
    route: Dict[str, Any]
    schedule_days: List[str]
    departure_time: time
    return_time: Optional[time] = None
    available_seats: Optional[int] = Field(None, ge=1, le=10)
    matching_criteria: Dict[str, Any]
    notes: Optional[str] = None


class CarpoolRequestCreate(CarpoolRequestBase):
    institution_id: int
    parent_id: int
    expires_at: Optional[datetime] = None


class CarpoolRequestUpdate(BaseModel):
    request_type: Optional[str] = None
    student_ids: Optional[List[int]] = None
    route: Optional[Dict[str, Any]] = None
    schedule_days: Optional[List[str]] = None
    departure_time: Optional[time] = None
    return_time: Optional[time] = None
    available_seats: Optional[int] = Field(None, ge=1, le=10)
    matching_criteria: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    matched_group_id: Optional[int] = None
    notes: Optional[str] = None
    expires_at: Optional[datetime] = None


class CarpoolRequestResponse(CarpoolRequestBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    parent_id: int
    status: str
    matched_group_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None


class CarpoolRideBase(BaseModel):
    ride_date: date
    ride_type: str
    passengers: List[Dict[str, Any]]
    pickup_sequence: List[Dict[str, Any]]
    pickup_time: time
    drop_time: Optional[time] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class CarpoolRideCreate(CarpoolRideBase):
    institution_id: int
    group_id: int
    driver_parent_id: int


class CarpoolRideUpdate(BaseModel):
    ride_date: Optional[date] = None
    ride_type: Optional[str] = None
    passengers: Optional[List[Dict[str, Any]]] = None
    pickup_sequence: Optional[List[Dict[str, Any]]] = None
    pickup_time: Optional[time] = None
    drop_time: Optional[time] = None
    actual_pickup_time: Optional[time] = None
    actual_drop_time: Optional[time] = None
    confirmation_status: Optional[str] = None
    confirmations: Optional[Dict[str, Any]] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class CarpoolRideResponse(CarpoolRideBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    group_id: int
    driver_parent_id: int
    actual_pickup_time: Optional[time] = None
    actual_drop_time: Optional[time] = None
    confirmation_status: str
    confirmations: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class EmergencyNotificationBase(BaseModel):
    emergency_type: str
    severity: str
    description: str
    location: Optional[Dict[str, Any]] = None
    estimated_delay: Optional[int] = Field(None, ge=0)


class EmergencyNotificationCreate(EmergencyNotificationBase):
    institution_id: int
    ride_id: int
    reporter_parent_id: int
    notified_parents: List[int]


class EmergencyNotificationUpdate(BaseModel):
    description: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    estimated_delay: Optional[int] = Field(None, ge=0)
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None


class EmergencyNotificationResponse(EmergencyNotificationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    ride_id: int
    reporter_parent_id: int
    notified_parents: List[int]
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CarpoolMatchBase(BaseModel):
    compatibility_score: Decimal
    match_details: Dict[str, Any]
    status: str = "pending"


class CarpoolMatchCreate(CarpoolMatchBase):
    institution_id: int
    request_id: int
    matched_request_id: Optional[int] = None
    matched_group_id: Optional[int] = None


class CarpoolMatchUpdate(BaseModel):
    status: str


class CarpoolMatchResponse(CarpoolMatchBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    request_id: int
    matched_request_id: Optional[int] = None
    matched_group_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class RideConfirmationRequest(BaseModel):
    parent_id: int
    confirmation: bool
    notes: Optional[str] = None


class DriverRotationUpdate(BaseModel):
    new_driver_parent_id: int
    week_start_date: date
    notification_message: Optional[str] = None


class RouteMatchRequest(BaseModel):
    max_results: int = Field(default=10, ge=1, le=50)
    include_groups: bool = True
    include_requests: bool = True


class RouteMatchResponse(BaseModel):
    matches: List[CarpoolMatchResponse]
    total_matches: int
