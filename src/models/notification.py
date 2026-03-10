from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import relationship
from src.database import Base


class NotificationChannel(str, Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    READ = "read"


class AudienceType(str, Enum):
    ALL = "all"
    INSTITUTION = "institution"
    GRADE = "grade"
    SECTION = "section"
    ROLE = "role"
    CUSTOM = "custom"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    priority = Column(String(20), default=NotificationPriority.MEDIUM.value, nullable=False)
    channel = Column(String(20), nullable=False)
    status = Column(String(20), default=NotificationStatus.PENDING.value, nullable=False)
    data = Column(JSON, nullable=True)
    read_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    user = relationship("User")

    __table_args__ = (
        Index('idx_notification_user_status', 'user_id', 'status'),
        Index('idx_notification_user_created', 'user_id', 'created_at'),
        Index('idx_notification_institution', 'institution_id'),
        Index('idx_notification_status', 'status'),
        Index('idx_notification_channel', 'channel'),
    )


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    email_enabled = Column(Boolean, default=True, nullable=False)
    sms_enabled = Column(Boolean, default=False, nullable=False)
    push_enabled = Column(Boolean, default=True, nullable=False)
    in_app_enabled = Column(Boolean, default=True, nullable=False)
    notification_types = Column(JSON, nullable=True)
    quiet_hours_start = Column(String(5), nullable=True)
    quiet_hours_end = Column(String(5), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    audience_type = Column(String(20), nullable=False)
    audience_filter = Column(JSON, nullable=True)
    priority = Column(String(20), default=NotificationPriority.MEDIUM.value, nullable=False)
    channels = Column(JSON, nullable=False)
    scheduled_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    published_at = Column(DateTime, nullable=True)
    attachments = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        Index('idx_announcement_institution', 'institution_id'),
        Index('idx_announcement_published', 'is_published', 'published_at'),
        Index('idx_announcement_scheduled', 'scheduled_at'),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recipient_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    parent_id = Column(Integer, ForeignKey('messages.id', ondelete='CASCADE'), nullable=True)
    subject = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    is_deleted_by_sender = Column(Boolean, default=False, nullable=False)
    is_deleted_by_recipient = Column(Boolean, default=False, nullable=False)
    attachments = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    parent = relationship("Message", remote_side=[id], foreign_keys=[parent_id])

    __table_args__ = (
        Index('idx_message_sender', 'sender_id', 'created_at'),
        Index('idx_message_recipient', 'recipient_id', 'is_read', 'created_at'),
        Index('idx_message_institution', 'institution_id'),
    )


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    notification_type = Column(String(50), nullable=False)
    channel = Column(String(20), nullable=False)
    subject_template = Column(String(255), nullable=True)
    body_template = Column(Text, nullable=False)
    variables = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_template_institution_type', 'institution_id', 'notification_type'),
        Index('idx_template_type_channel', 'notification_type', 'channel'),
    )
