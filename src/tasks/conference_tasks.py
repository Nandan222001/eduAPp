from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging
from celery import Task
from sqlalchemy import and_, func

from src.celery_app import celery_app
from src.database import SessionLocal
from src.models.conferences import (
    ConferenceBooking,
    ConferenceSlot,
    ConferenceReminder,
    BookingStatus
)
from src.services.notification_service import NotificationService
from src.models.notification import NotificationPriority, NotificationChannel

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


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="src.tasks.conference_tasks.send_conference_reminders"
)
def send_conference_reminders(self) -> Dict[str, Any]:
    try:
        now = datetime.utcnow()
        notification_service = NotificationService(self.db)

        reminders_sent = 0
        reminders_failed = 0

        bookings = self.db.query(ConferenceBooking).join(ConferenceSlot).filter(
            ConferenceBooking.booking_status == BookingStatus.CONFIRMED.value
        ).all()

        for booking in bookings:
            slot = booking.slot
            conference_datetime = datetime.combine(slot.date, slot.time_slot)

            time_until_conference = conference_datetime - now

            if not booking.reminder_24h_sent and timedelta(hours=23) <= time_until_conference <= timedelta(hours=25):
                try:
                    notification_service.create_notification(
                        institution_id=booking.institution_id,
                        user_id=booking.parent.user_id if booking.parent.user_id else None,
                        title="Conference Reminder - 24 Hours",
                        message=f"You have a parent-teacher conference scheduled for {slot.date.strftime('%Y-%m-%d')} at {slot.time_slot.strftime('%H:%M')}. Please be prepared.",
                        notification_type="conference_reminder",
                        notification_group="academic",
                        channel=NotificationChannel.EMAIL.value,
                        priority=NotificationPriority.HIGH.value,
                        data={
                            'booking_id': booking.id,
                            'conference_date': slot.date.isoformat(),
                            'conference_time': slot.time_slot.isoformat(),
                            'location': slot.location,
                            'meeting_link': booking.video_meeting_link
                        }
                    )
                    
                    booking.reminder_24h_sent = True
                    self.db.commit()
                    reminders_sent += 1
                    logger.info(f"Sent 24-hour reminder for booking {booking.id}")
                except Exception as e:
                    logger.error(f"Failed to send 24-hour reminder for booking {booking.id}: {str(e)}")
                    reminders_failed += 1

            if not booking.reminder_1h_sent and timedelta(minutes=45) <= time_until_conference <= timedelta(hours=1, minutes=15):
                try:
                    notification_service.create_notification(
                        institution_id=booking.institution_id,
                        user_id=booking.parent.user_id if booking.parent.user_id else None,
                        title="Conference Starting Soon - 1 Hour",
                        message=f"Your parent-teacher conference is starting in 1 hour at {slot.time_slot.strftime('%H:%M')}. {f'Join here: {booking.video_meeting_link}' if booking.video_meeting_link else ''}",
                        notification_type="conference_reminder",
                        notification_group="academic",
                        channel=NotificationChannel.PUSH.value,
                        priority=NotificationPriority.URGENT.value,
                        data={
                            'booking_id': booking.id,
                            'conference_date': slot.date.isoformat(),
                            'conference_time': slot.time_slot.isoformat(),
                            'location': slot.location,
                            'meeting_link': booking.video_meeting_link
                        }
                    )
                    
                    booking.reminder_1h_sent = True
                    self.db.commit()
                    reminders_sent += 1
                    logger.info(f"Sent 1-hour reminder for booking {booking.id}")
                except Exception as e:
                    logger.error(f"Failed to send 1-hour reminder for booking {booking.id}: {str(e)}")
                    reminders_failed += 1

        return {
            "reminders_sent": reminders_sent,
            "reminders_failed": reminders_failed,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in send_conference_reminders task: {str(e)}")
        return {
            "reminders_sent": 0,
            "reminders_failed": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="src.tasks.conference_tasks.auto_complete_conferences"
)
def auto_complete_conferences(self) -> Dict[str, Any]:
    try:
        now = datetime.utcnow()
        completed_count = 0

        past_bookings = self.db.query(ConferenceBooking).join(ConferenceSlot).filter(
            ConferenceBooking.booking_status == BookingStatus.CONFIRMED.value,
            ConferenceSlot.date < now.date()
        ).all()

        for booking in past_bookings:
            slot = booking.slot
            conference_datetime = datetime.combine(slot.date, slot.time_slot)
            
            if conference_datetime + timedelta(minutes=slot.duration_minutes) < now:
                booking.booking_status = BookingStatus.COMPLETED.value
                booking.completed_at = conference_datetime + timedelta(minutes=slot.duration_minutes)
                completed_count += 1

        self.db.commit()

        return {
            "completed_count": completed_count,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in auto_complete_conferences task: {str(e)}")
        return {
            "completed_count": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="src.tasks.conference_tasks.send_survey_requests"
)
def send_survey_requests(self) -> Dict[str, Any]:
    try:
        now = datetime.utcnow()
        notification_service = NotificationService(self.db)
        
        surveys_sent = 0
        surveys_failed = 0

        completed_bookings = self.db.query(ConferenceBooking).filter(
            ConferenceBooking.booking_status == BookingStatus.COMPLETED.value,
            ConferenceBooking.completed_at.isnot(None)
        ).all()

        for booking in completed_bookings:
            if booking.survey:
                continue

            time_since_completion = now - booking.completed_at
            
            if timedelta(hours=1) <= time_since_completion <= timedelta(hours=2):
                try:
                    if booking.parent.user_id:
                        notification_service.create_notification(
                            institution_id=booking.institution_id,
                            user_id=booking.parent.user_id,
                            title="Conference Feedback Request",
                            message="Please share your feedback about the recent parent-teacher conference.",
                            notification_type="survey_request",
                            notification_group="academic",
                            channel=NotificationChannel.IN_APP.value,
                            priority=NotificationPriority.MEDIUM.value,
                            data={
                                'booking_id': booking.id,
                                'survey_url': f'/conferences/bookings/{booking.id}/survey'
                            }
                        )
                        surveys_sent += 1
                except Exception as e:
                    logger.error(f"Failed to send survey request for booking {booking.id}: {str(e)}")
                    surveys_failed += 1

        return {
            "surveys_sent": surveys_sent,
            "surveys_failed": surveys_failed,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in send_survey_requests task: {str(e)}")
        return {
            "surveys_sent": 0,
            "surveys_failed": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
