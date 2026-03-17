from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
from src.models.notification import (
    NotificationChannel,
    NotificationPriority,
    NotificationStatus,
    AudienceType
)


class NotificationBase(BaseModel):
    title: str = Field(..., max_length=255)
    message: str
    notification_type: str = Field(..., max_length=50)
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channel: NotificationChannel
    data: Optional[Dict[str, Any]] = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None
    read_at: Optional[datetime] = None


class NotificationResponse(NotificationBase):
    id: int
    institution_id: int
    user_id: int
    status: NotificationStatus
    read_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationPreferenceBase(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    push_enabled: bool = True
    in_app_enabled: bool = True
    notification_types: Optional[Dict[str, bool]] = None
    quiet_hours_start: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    quiet_hours_end: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')


class NotificationPreferenceCreate(NotificationPreferenceBase):
    pass


class NotificationPreferenceUpdate(NotificationPreferenceBase):
    pass


class NotificationPreferenceResponse(NotificationPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnnouncementBase(BaseModel):
    title: str = Field(..., max_length=255)
    content: str
    audience_type: AudienceType
    audience_filter: Optional[Dict[str, Any]] = None
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channels: List[NotificationChannel]
    scheduled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    attachments: Optional[List[Dict[str, str]]] = None


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    audience_type: Optional[AudienceType] = None
    audience_filter: Optional[Dict[str, Any]] = None
    priority: Optional[NotificationPriority] = None
    channels: Optional[List[NotificationChannel]] = None
    scheduled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    attachments: Optional[List[Dict[str, str]]] = None


class AnnouncementPublish(BaseModel):
    is_published: bool = True


class AnnouncementResponse(AnnouncementBase):
    id: int
    institution_id: int
    created_by: int
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageBase(BaseModel):
    subject: Optional[str] = Field(None, max_length=255)
    content: str
    attachments: Optional[List[Dict[str, str]]] = None


class MessageCreate(MessageBase):
    recipient_id: int
    parent_id: Optional[int] = None


class MessageResponse(MessageBase):
    id: int
    institution_id: int
    sender_id: int
    recipient_id: int
    parent_id: Optional[int] = None
    is_read: bool
    read_at: Optional[datetime] = None
    is_deleted_by_sender: bool
    is_deleted_by_recipient: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageMarkRead(BaseModel):
    is_read: bool = True


class NotificationTemplateBase(BaseModel):
    name: str = Field(..., max_length=100)
    notification_type: str = Field(..., max_length=50)
    channel: NotificationChannel
    subject_template: Optional[str] = Field(None, max_length=255)
    body_template: str
    variables: Optional[List[str]] = None
    is_active: bool = True


class NotificationTemplateCreate(NotificationTemplateBase):
    pass


class NotificationTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    subject_template: Optional[str] = Field(None, max_length=255)
    body_template: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None


class NotificationTemplateResponse(NotificationTemplateBase):
    id: int
    institution_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BulkNotificationRequest(BaseModel):
    user_ids: List[int]
    title: str = Field(..., max_length=255)
    message: str
    notification_type: str = Field(..., max_length=50)
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channel: NotificationChannel
    data: Optional[Dict[str, Any]] = None


class NotificationStats(BaseModel):
    total: int
    unread: int
    by_channel: Dict[str, int]
    by_priority: Dict[str, int]


class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class DeviceRegistrationRequest(BaseModel):
    device_token: str = Field(..., max_length=500)
    device_type: str = Field(..., pattern=r'^(ios|android)$')
    device_name: Optional[str] = Field(None, max_length=255)
    app_version: Optional[str] = Field(None, max_length=50)
    topics: Dict[str, bool]


class DeviceRegistrationResponse(BaseModel):
    id: int
    user_id: int
    device_token: str
    device_type: str
    device_name: Optional[str]
    app_version: Optional[str]
    is_active: bool
    topics: Optional[Dict[str, bool]]
    last_used_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
