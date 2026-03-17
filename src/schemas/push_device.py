from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class DeviceRegistrationRequest(BaseModel):
    token: str = Field(..., max_length=500)
    platform: str = Field(..., max_length=20)
    device_name: Optional[str] = Field(None, max_length=255)
    os_version: Optional[str] = Field(None, max_length=50)
    app_version: Optional[str] = Field(None, max_length=50)
    topics: Optional[List[str]] = None


class DeviceSubscriptionRequest(BaseModel):
    token: str = Field(..., max_length=500)
    topic: str = Field(..., max_length=100)


class PushDeviceResponse(BaseModel):
    id: int
    user_id: int
    token: str
    platform: str
    device_name: Optional[str]
    os_version: Optional[str]
    app_version: Optional[str]
    is_active: bool
    last_used_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PushDeviceTopicResponse(BaseModel):
    id: int
    device_id: int
    topic: str
    subscribed_at: datetime

    class Config:
        from_attributes = True
