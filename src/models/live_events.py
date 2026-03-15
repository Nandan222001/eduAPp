from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Index, BigInteger
from sqlalchemy.orm import relationship
from src.database import Base


class LiveEventType(str, Enum):
    SPORTS_GAME = "sports_game"
    CONCERT = "concert"
    PLAY = "play"
    GRADUATION = "graduation"
    ASSEMBLY = "assembly"
    PARENT_MEETING = "parent_meeting"


class LiveEventStatus(str, Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    ENDED = "ended"
    CANCELLED = "cancelled"


class RestrictedAccessType(str, Enum):
    PUBLIC = "public"
    PARENTS_ONLY = "parents_only"
    SPECIFIC_GRADES = "specific_grades"


class StreamPlatform(str, Enum):
    YOUTUBE = "youtube"
    VIMEO = "vimeo"
    AGORA = "agora"


class LiveEvent(Base):
    __tablename__ = "live_events"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    event_name = Column(String(255), nullable=False)
    event_type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    scheduled_start_time = Column(DateTime, nullable=False, index=True)
    scheduled_end_time = Column(DateTime, nullable=True)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default=LiveEventStatus.SCHEDULED.value, nullable=False, index=True)
    
    # Streaming configuration
    stream_platform = Column(String(20), default=StreamPlatform.YOUTUBE.value, nullable=False)
    stream_url = Column(String(500), nullable=True)
    stream_key = Column(String(500), nullable=True)
    stream_embed_url = Column(String(500), nullable=True)
    recording_url = Column(String(500), nullable=True)
    recording_s3_key = Column(String(500), nullable=True)
    
    # Analytics
    viewer_count = Column(Integer, default=0, nullable=False)
    peak_viewer_count = Column(Integer, default=0, nullable=False)
    total_views = Column(Integer, default=0, nullable=False)
    
    # Features
    chat_enabled = Column(Boolean, default=True, nullable=False)
    chat_moderated = Column(Boolean, default=True, nullable=False)
    
    # Access control
    restricted_access = Column(String(20), default=RestrictedAccessType.PUBLIC.value, nullable=False, index=True)
    allowed_grade_ids = Column(JSON, nullable=True)  # List of grade IDs for specific_grades
    allowed_section_ids = Column(JSON, nullable=True)  # List of section IDs for specific_grades
    
    # Monetization
    monetization_enabled = Column(Boolean, default=False, nullable=False)
    ticket_price = Column(Integer, nullable=True)  # Price in smallest currency unit (paise/cents)
    ticket_currency = Column(String(3), default="INR", nullable=False)
    
    # Recording settings
    auto_record = Column(Boolean, default=True, nullable=False)
    recording_retention_days = Column(Integer, default=90, nullable=True)
    recording_archived = Column(Boolean, default=False, nullable=False)
    recording_archived_at = Column(DateTime, nullable=True)
    
    # Metadata
    thumbnail_url = Column(String(500), nullable=True)
    tags = Column(JSON, nullable=True)
    external_stream_id = Column(String(255), nullable=True)  # YouTube/Vimeo stream ID
    stream_metadata = Column(JSON, nullable=True)  # Platform-specific metadata
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    creator = relationship("User", foreign_keys=[created_by])
    viewers = relationship("EventViewer", back_populates="live_event", cascade="all, delete-orphan")
    chat_messages = relationship("EventChatMessage", back_populates="live_event", cascade="all, delete-orphan")
    tickets = relationship("EventTicket", back_populates="live_event", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_live_event_institution', 'institution_id'),
        Index('idx_live_event_created_by', 'created_by'),
        Index('idx_live_event_type', 'event_type'),
        Index('idx_live_event_scheduled_start', 'scheduled_start_time'),
        Index('idx_live_event_status', 'status'),
        Index('idx_live_event_restricted_access', 'restricted_access'),
    )


class EventViewer(Base):
    __tablename__ = "event_viewers"
    
    id = Column(Integer, primary_key=True, index=True)
    live_event_id = Column(Integer, ForeignKey('live_events.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)
    
    # Viewing session
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)
    watch_duration = Column(Integer, default=0, nullable=False)  # Duration in seconds
    is_currently_watching = Column(Boolean, default=True, nullable=False)
    
    # Analytics
    device_type = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)
    location = Column(String(255), nullable=True)
    
    # Engagement metrics
    messages_sent = Column(Integer, default=0, nullable=False)
    reactions_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    live_event = relationship("LiveEvent", back_populates="viewers")
    user = relationship("User")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_event_viewer_live_event', 'live_event_id'),
        Index('idx_event_viewer_user', 'user_id'),
        Index('idx_event_viewer_student', 'student_id'),
        Index('idx_event_viewer_currently_watching', 'is_currently_watching'),
        Index('idx_event_viewer_joined', 'joined_at'),
    )


class EventChatMessage(Base):
    __tablename__ = "event_chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    live_event_id = Column(Integer, ForeignKey('live_events.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    message = Column(Text, nullable=False)
    message_type = Column(String(20), default="text", nullable=False)  # text, emoji, gif, system
    
    # Moderation
    is_deleted = Column(Boolean, default=False, nullable=False)
    is_flagged = Column(Boolean, default=False, nullable=False)
    moderated_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    moderated_at = Column(DateTime, nullable=True)
    moderation_reason = Column(Text, nullable=True)
    
    # Metadata
    parent_message_id = Column(Integer, ForeignKey('event_chat_messages.id', ondelete='SET NULL'), nullable=True)
    reactions = Column(JSON, nullable=True)  # {emoji: count}
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    live_event = relationship("LiveEvent", back_populates="chat_messages")
    user = relationship("User", foreign_keys=[user_id])
    moderator = relationship("User", foreign_keys=[moderated_by])
    parent_message = relationship("EventChatMessage", remote_side=[id], backref="replies")
    
    __table_args__ = (
        Index('idx_event_chat_live_event', 'live_event_id'),
        Index('idx_event_chat_user', 'user_id'),
        Index('idx_event_chat_created', 'created_at'),
        Index('idx_event_chat_moderated', 'moderated_by'),
        Index('idx_event_chat_flagged', 'is_flagged'),
    )


class EventTicket(Base):
    __tablename__ = "event_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    live_event_id = Column(Integer, ForeignKey('live_events.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    ticket_code = Column(String(100), unique=True, nullable=False, index=True)
    
    # Payment
    amount_paid = Column(Integer, nullable=False)  # In smallest currency unit
    currency = Column(String(3), default="INR", nullable=False)
    payment_id = Column(String(255), nullable=True, index=True)
    payment_status = Column(String(20), default="pending", nullable=False, index=True)  # pending, completed, failed, refunded
    payment_gateway = Column(String(50), nullable=True)
    
    # Usage
    is_redeemed = Column(Boolean, default=False, nullable=False)
    redeemed_at = Column(DateTime, nullable=True)
    is_refunded = Column(Boolean, default=False, nullable=False)
    refunded_at = Column(DateTime, nullable=True)
    refund_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    live_event = relationship("LiveEvent", back_populates="tickets")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_event_ticket_live_event', 'live_event_id'),
        Index('idx_event_ticket_user', 'user_id'),
        Index('idx_event_ticket_code', 'ticket_code'),
        Index('idx_event_ticket_payment_id', 'payment_id'),
        Index('idx_event_ticket_payment_status', 'payment_status'),
    )


class ChatModerationRule(Base):
    __tablename__ = "chat_moderation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    rule_type = Column(String(50), nullable=False)  # banned_word, regex_pattern, spam_detection
    rule_value = Column(Text, nullable=False)
    action = Column(String(20), default="flag", nullable=False)  # flag, delete, block_user
    severity = Column(String(20), default="medium", nullable=False)  # low, medium, high
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_chat_moderation_institution', 'institution_id'),
        Index('idx_chat_moderation_active', 'is_active'),
    )


class StreamAnalytics(Base):
    __tablename__ = "stream_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    live_event_id = Column(Integer, ForeignKey('live_events.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Time-series data (snapshot every minute)
    timestamp = Column(DateTime, nullable=False, index=True)
    viewer_count = Column(Integer, default=0, nullable=False)
    chat_messages_count = Column(Integer, default=0, nullable=False)
    
    # Quality metrics
    average_bitrate = Column(Integer, nullable=True)
    buffering_events = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    live_event = relationship("LiveEvent")
    
    __table_args__ = (
        Index('idx_stream_analytics_live_event', 'live_event_id'),
        Index('idx_stream_analytics_timestamp', 'timestamp'),
    )
