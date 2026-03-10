from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging
from celery import Task

from src.celery_app import celery_app
from src.database import SessionLocal
from src.models.notification import Notification, Announcement, NotificationStatus
from src.services.notification_service import NotificationService
from src.services.announcement_service import AnnouncementService

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    _db = None

    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.send_notification")
def send_notification(self, notification_id: int) -> Dict[str, Any]:
    try:
        notification_service = NotificationService(self.db)
        
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        success = loop.run_until_complete(
            notification_service.send_notification(notification_id)
        )
        
        return {
            "notification_id": notification_id,
            "success": success,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error sending notification {notification_id}: {str(e)}")
        return {
            "notification_id": notification_id,
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.send_bulk_notifications")
def send_bulk_notifications(
    self,
    institution_id: int,
    user_ids: List[int],
    title: str,
    message: str,
    notification_type: str,
    channel: str,
    priority: str = "medium",
    data: Dict[str, Any] = None
) -> Dict[str, Any]:
    try:
        notification_service = NotificationService(self.db)
        created = 0
        failed = 0
        
        for user_id in user_ids:
            try:
                notification = notification_service.create_notification(
                    institution_id=institution_id,
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    channel=channel,
                    priority=priority,
                    data=data
                )
                
                send_notification.delay(notification.id)
                created += 1
                
            except Exception as e:
                logger.error(f"Error creating notification for user {user_id}: {str(e)}")
                failed += 1
        
        return {
            "created": created,
            "failed": failed,
            "total": len(user_ids),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in bulk notification: {str(e)}")
        return {
            "created": 0,
            "failed": len(user_ids),
            "total": len(user_ids),
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.send_scheduled_announcements")
def send_scheduled_announcements(self) -> Dict[str, Any]:
    try:
        now = datetime.utcnow()
        
        scheduled_announcements = self.db.query(Announcement).filter(
            Announcement.is_published == False,
            Announcement.scheduled_at <= now,
            Announcement.scheduled_at.isnot(None)
        ).all()
        
        processed = 0
        for announcement in scheduled_announcements:
            try:
                announcement_service = AnnouncementService(self.db)
                announcement_service.publish_announcement(
                    announcement.id,
                    announcement.institution_id
                )
                processed += 1
            except Exception as e:
                logger.error(f"Error publishing scheduled announcement {announcement.id}: {str(e)}")
        
        return {
            "processed": processed,
            "total": len(scheduled_announcements),
            "timestamp": now.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error processing scheduled announcements: {str(e)}")
        return {
            "processed": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.cleanup_old_notifications")
def cleanup_old_notifications(self, days: int = 90) -> Dict[str, Any]:
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        deleted = self.db.query(Notification).filter(
            Notification.created_at < cutoff_date,
            Notification.status == NotificationStatus.READ.value
        ).delete()
        
        self.db.commit()
        
        return {
            "deleted": deleted,
            "cutoff_date": cutoff_date.isoformat(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up old notifications: {str(e)}")
        self.db.rollback()
        return {
            "deleted": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.retry_failed_notifications")
def retry_failed_notifications(self, max_retries: int = 3) -> Dict[str, Any]:
    try:
        failed_notifications = self.db.query(Notification).filter(
            Notification.status == NotificationStatus.FAILED.value,
            Notification.failed_at >= datetime.utcnow() - timedelta(hours=24)
        ).all()
        
        retried = 0
        for notification in failed_notifications:
            retry_count = notification.data.get("retry_count", 0) if notification.data else 0
            
            if retry_count < max_retries:
                notification.status = NotificationStatus.PENDING.value
                notification.failed_at = None
                notification.error_message = None
                
                if notification.data:
                    notification.data["retry_count"] = retry_count + 1
                else:
                    notification.data = {"retry_count": retry_count + 1}
                
                self.db.commit()
                send_notification.delay(notification.id)
                retried += 1
        
        return {
            "retried": retried,
            "total_failed": len(failed_notifications),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error retrying failed notifications: {str(e)}")
        self.db.rollback()
        return {
            "retried": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.notification_tasks.send_digest_notifications")
def send_digest_notifications(
    self,
    institution_id: int,
    digest_type: str = "daily"
) -> Dict[str, Any]:
    try:
        from src.models.user import User
        
        if digest_type == "daily":
            since = datetime.utcnow() - timedelta(days=1)
        elif digest_type == "weekly":
            since = datetime.utcnow() - timedelta(weeks=1)
        else:
            since = datetime.utcnow() - timedelta(days=1)
        
        users = self.db.query(User).filter(
            User.institution_id == institution_id,
            User.is_active == True
        ).all()
        
        sent = 0
        for user in users:
            unread_count = self.db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.status != NotificationStatus.READ.value,
                Notification.created_at >= since
            ).count()
            
            if unread_count > 0:
                notification_service = NotificationService(self.db)
                notification = notification_service.create_notification(
                    institution_id=institution_id,
                    user_id=user.id,
                    title=f"You have {unread_count} unread notifications",
                    message=f"You have {unread_count} unread notifications from the past {digest_type}.",
                    notification_type="digest",
                    channel="email",
                    priority="low",
                    data={"unread_count": unread_count, "digest_type": digest_type}
                )
                send_notification.delay(notification.id)
                sent += 1
        
        return {
            "sent": sent,
            "digest_type": digest_type,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error sending digest notifications: {str(e)}")
        return {
            "sent": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
