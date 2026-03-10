from typing import List, Optional, Dict, Any
from datetime import datetime, time
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
import logging

from src.models.notification import (
    Notification,
    NotificationPreference,
    NotificationChannel,
    NotificationStatus,
    NotificationTemplate
)
from src.models.user import User
from src.schemas.notification import (
    NotificationCreate,
    NotificationPreferenceCreate,
    NotificationPreferenceUpdate
)
from src.services.notification_providers import NotificationProviderFactory

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(
        self,
        institution_id: int,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        channel: str,
        priority: str = "medium",
        data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        notification = Notification(
            institution_id=institution_id,
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            channel=channel,
            priority=priority,
            status=NotificationStatus.PENDING.value,
            data=data
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_notifications(
        self,
        user_id: int,
        status: Optional[str] = None,
        channel: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Notification]:
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        if status:
            query = query.filter(Notification.status == status)
        if channel:
            query = query.filter(Notification.channel == channel)
        
        return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    def get_notification_by_id(self, notification_id: int, user_id: int) -> Optional[Notification]:
        return self.db.query(Notification).filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        ).first()

    def mark_as_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        notification = self.get_notification_by_id(notification_id, user_id)
        if notification:
            notification.status = NotificationStatus.READ.value
            notification.read_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(notification)
        return notification

    def mark_all_as_read(self, user_id: int) -> int:
        count = self.db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.status != NotificationStatus.READ.value
            )
        ).update({
            "status": NotificationStatus.READ.value,
            "read_at": datetime.utcnow()
        })
        self.db.commit()
        return count

    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        notification = self.get_notification_by_id(notification_id, user_id)
        if notification:
            self.db.delete(notification)
            self.db.commit()
            return True
        return False

    def get_notification_stats(self, user_id: int) -> Dict[str, Any]:
        total = self.db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id
        ).scalar()
        
        unread = self.db.query(func.count(Notification.id)).filter(
            and_(
                Notification.user_id == user_id,
                Notification.status != NotificationStatus.READ.value
            )
        ).scalar()
        
        by_channel = dict(
            self.db.query(Notification.channel, func.count(Notification.id))
            .filter(Notification.user_id == user_id)
            .group_by(Notification.channel)
            .all()
        )
        
        by_priority = dict(
            self.db.query(Notification.priority, func.count(Notification.id))
            .filter(Notification.user_id == user_id)
            .group_by(Notification.priority)
            .all()
        )
        
        return {
            "total": total or 0,
            "unread": unread or 0,
            "by_channel": by_channel,
            "by_priority": by_priority
        }

    def get_or_create_preferences(self, user_id: int) -> NotificationPreference:
        preference = self.db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()
        
        if not preference:
            preference = NotificationPreference(
                user_id=user_id,
                email_enabled=True,
                sms_enabled=False,
                push_enabled=True,
                in_app_enabled=True
            )
            self.db.add(preference)
            self.db.commit()
            self.db.refresh(preference)
        
        return preference

    def update_preferences(
        self,
        user_id: int,
        preference_update: NotificationPreferenceUpdate
    ) -> NotificationPreference:
        preference = self.get_or_create_preferences(user_id)
        
        update_data = preference_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(preference, field, value)
        
        self.db.commit()
        self.db.refresh(preference)
        return preference

    def check_quiet_hours(self, user_id: int) -> bool:
        preference = self.get_or_create_preferences(user_id)
        
        if not preference.quiet_hours_start or not preference.quiet_hours_end:
            return False
        
        now = datetime.utcnow().time()
        start = datetime.strptime(preference.quiet_hours_start, "%H:%M").time()
        end = datetime.strptime(preference.quiet_hours_end, "%H:%M").time()
        
        if start <= end:
            return start <= now <= end
        else:
            return now >= start or now <= end

    def should_send_notification(
        self,
        user_id: int,
        channel: str,
        notification_type: str
    ) -> bool:
        preference = self.get_or_create_preferences(user_id)
        
        channel_enabled = {
            "email": preference.email_enabled,
            "sms": preference.sms_enabled,
            "push": preference.push_enabled,
            "in_app": preference.in_app_enabled
        }.get(channel, True)
        
        if not channel_enabled:
            return False
        
        if preference.notification_types and isinstance(preference.notification_types, dict):
            type_enabled = preference.notification_types.get(notification_type, True)
            if not type_enabled:
                return False
        
        if channel in ["push", "sms"] and self.check_quiet_hours(user_id):
            return False
        
        return True

    async def send_notification(self, notification_id: int) -> bool:
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id
        ).first()
        
        if not notification:
            return False
        
        if notification.status != NotificationStatus.PENDING.value:
            return False
        
        if not self.should_send_notification(
            notification.user_id,
            notification.channel,
            notification.notification_type
        ):
            notification.status = NotificationStatus.FAILED.value
            notification.error_message = "User preferences prevent notification delivery"
            self.db.commit()
            return False
        
        user = self.db.query(User).filter(User.id == notification.user_id).first()
        if not user:
            notification.status = NotificationStatus.FAILED.value
            notification.error_message = "User not found"
            self.db.commit()
            return False
        
        try:
            provider = NotificationProviderFactory.get_provider(notification.channel)
            
            recipient = self._get_recipient(user, notification.channel)
            if not recipient:
                notification.status = NotificationStatus.FAILED.value
                notification.error_message = f"No {notification.channel} contact information"
                self.db.commit()
                return False
            
            success = await provider.send(
                recipient=recipient,
                subject=notification.title,
                content=notification.message,
                data=notification.data
            )
            
            if success:
                notification.status = NotificationStatus.SENT.value
                notification.sent_at = datetime.utcnow()
                if notification.channel == "in_app":
                    notification.status = NotificationStatus.SENT.value
            else:
                notification.status = NotificationStatus.FAILED.value
                notification.failed_at = datetime.utcnow()
                notification.error_message = "Provider send failed"
            
            self.db.commit()
            return success
            
        except Exception as e:
            logger.error(f"Error sending notification {notification_id}: {str(e)}")
            notification.status = NotificationStatus.FAILED.value
            notification.failed_at = datetime.utcnow()
            notification.error_message = str(e)
            self.db.commit()
            return False

    def _get_recipient(self, user: User, channel: str) -> Optional[str]:
        if channel == "email":
            return user.email
        elif channel == "sms":
            return user.phone
        elif channel == "push":
            return None
        elif channel == "in_app":
            return str(user.id)
        return None

    def get_template(
        self,
        institution_id: Optional[int],
        notification_type: str,
        channel: str
    ) -> Optional[NotificationTemplate]:
        query = self.db.query(NotificationTemplate).filter(
            and_(
                NotificationTemplate.notification_type == notification_type,
                NotificationTemplate.channel == channel,
                NotificationTemplate.is_active == True
            )
        )
        
        if institution_id:
            template = query.filter(
                NotificationTemplate.institution_id == institution_id
            ).first()
            if template:
                return template
        
        return query.filter(NotificationTemplate.institution_id.is_(None)).first()

    def render_template(
        self,
        template: NotificationTemplate,
        context: Dict[str, Any]
    ) -> tuple[str, str]:
        subject = template.subject_template or ""
        body = template.body_template or ""
        
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            subject = subject.replace(placeholder, str(value))
            body = body.replace(placeholder, str(value))
        
        return subject, body
