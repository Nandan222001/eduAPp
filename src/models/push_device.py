from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from src.database import Base


class PushDevice(Base):
    __tablename__ = "push_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    token = Column(String(500), nullable=False, unique=True, index=True)
    platform = Column(String(20), nullable=False)
    device_name = Column(String(255), nullable=True)
    os_version = Column(String(50), nullable=True)
    app_version = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="push_devices")

    __table_args__ = (
        Index('idx_push_device_user', 'user_id'),
        Index('idx_push_device_token', 'token'),
        Index('idx_push_device_active', 'is_active'),
    )


class PushDeviceTopic(Base):
    __tablename__ = "push_device_topics"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey('push_devices.id', ondelete='CASCADE'), nullable=False, index=True)
    topic = Column(String(100), nullable=False)
    subscribed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    device = relationship("PushDevice")

    __table_args__ = (
        Index('idx_push_device_topic', 'device_id', 'topic'),
    )
