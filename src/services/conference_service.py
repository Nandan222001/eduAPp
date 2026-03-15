from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, date, time, timedelta
import hashlib
import hmac
import base64
import json
import requests
from src.models.conferences import (
    ConferenceSlot, ConferenceBooking, ConferenceSurvey, ConferenceReminder,
    AvailabilityStatus, BookingStatus, LocationType
)
from src.schemas.conference import (
    ConferenceSlotCreate,
    ConferenceSlotUpdate,
    ConferenceBookingCreate,
    ConferenceBookingUpdate,
    ConferenceSurveyCreate,
    ConferenceSurveyUpdate,
    BulkSlotCreate,
    ConferenceStatistics,
    TeacherConferenceStats
)
from src.repositories.conference_repository import (
    ConferenceSlotRepository,
    ConferenceBookingRepository,
    ConferenceSurveyRepository,
    ConferenceReminderRepository
)
from src.config import settings


class VideoConferencingService:
    def __init__(self):
        self.zoom_api_key = getattr(settings, 'zoom_api_key', '')
        self.zoom_api_secret = getattr(settings, 'zoom_api_secret', '')
        self.google_meet_credentials = getattr(settings, 'google_meet_credentials', '')

    def create_zoom_meeting(
        self,
        topic: str,
        start_time: datetime,
        duration: int,
        timezone: str = "UTC"
    ) -> Dict[str, Any]:
        if not self.zoom_api_key or not self.zoom_api_secret:
            return self._create_fallback_meeting(topic, start_time, duration)

        try:
            headers = {
                'Authorization': f'Bearer {self._generate_zoom_jwt()}',
                'Content-Type': 'application/json'
            }

            payload = {
                'topic': topic,
                'type': 2,
                'start_time': start_time.strftime('%Y-%m-%dT%H:%M:%S'),
                'duration': duration,
                'timezone': timezone,
                'settings': {
                    'host_video': True,
                    'participant_video': True,
                    'join_before_host': False,
                    'mute_upon_entry': True,
                    'waiting_room': True,
                    'auto_recording': 'cloud',
                    'approval_type': 2
                }
            }

            response = requests.post(
                f'https://api.zoom.us/v2/users/me/meetings',
                headers=headers,
                json=payload,
                timeout=10
            )

            if response.status_code == 201:
                data = response.json()
                return {
                    'meeting_link': data.get('join_url'),
                    'meeting_id': str(data.get('id')),
                    'meeting_password': data.get('password'),
                    'provider': 'zoom'
                }
            else:
                return self._create_fallback_meeting(topic, start_time, duration)

        except Exception as e:
            return self._create_fallback_meeting(topic, start_time, duration)

    def create_google_meet_meeting(
        self,
        topic: str,
        start_time: datetime,
        duration: int
    ) -> Dict[str, Any]:
        if not self.google_meet_credentials:
            return self._create_fallback_meeting(topic, start_time, duration)

        return self._create_fallback_meeting(topic, start_time, duration)

    def _create_fallback_meeting(
        self,
        topic: str,
        start_time: datetime,
        duration: int
    ) -> Dict[str, Any]:
        meeting_id = hashlib.md5(
            f"{topic}{start_time.isoformat()}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:12]

        return {
            'meeting_link': f"https://meet.example.com/{meeting_id}",
            'meeting_id': meeting_id,
            'meeting_password': None,
            'provider': 'fallback'
        }

    def _generate_zoom_jwt(self) -> str:
        header = {'alg': 'HS256', 'typ': 'JWT'}
        payload = {
            'iss': self.zoom_api_key,
            'exp': int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        }

        header_encoded = base64.urlsafe_b64encode(
            json.dumps(header).encode()
        ).decode().rstrip('=')
        payload_encoded = base64.urlsafe_b64encode(
            json.dumps(payload).encode()
        ).decode().rstrip('=')

        signature_input = f"{header_encoded}.{payload_encoded}"
        signature = base64.urlsafe_b64encode(
            hmac.new(
                self.zoom_api_secret.encode(),
                signature_input.encode(),
                hashlib.sha256
            ).digest()
        ).decode().rstrip('=')

        return f"{signature_input}.{signature}"


class ConferenceSlotService:
    def __init__(self, db: Session):
        self.db = db
        self.slot_repo = ConferenceSlotRepository(db)

    def create_slot(self, data: ConferenceSlotCreate) -> ConferenceSlot:
        slot = self.slot_repo.create(**data.model_dump())
        self.db.commit()
        self.db.refresh(slot)
        return slot

    def create_bulk_slots(self, data: BulkSlotCreate) -> List[ConferenceSlot]:
        slots = []
        current_date = data.date_from

        while current_date <= data.date_to:
            if data.skip_weekends and current_date.weekday() >= 5:
                current_date += timedelta(days=1)
                continue

            for time_slot in data.time_slots:
                slot_data = ConferenceSlotCreate(
                    institution_id=data.institution_id,
                    teacher_id=data.teacher_id,
                    date=current_date,
                    time_slot=time_slot,
                    duration_minutes=data.duration_minutes,
                    location=data.location,
                    physical_location=data.physical_location,
                    max_bookings=data.max_bookings,
                    notes=data.notes
                )
                slot = self.slot_repo.create(**slot_data.model_dump())
                slots.append(slot)

            current_date += timedelta(days=1)

        self.db.commit()
        for slot in slots:
            self.db.refresh(slot)
        return slots

    def get_slot(self, slot_id: int) -> Optional[ConferenceSlot]:
        return self.slot_repo.get_by_id(slot_id)

    def get_slot_with_bookings(self, slot_id: int) -> Optional[ConferenceSlot]:
        return self.slot_repo.get_with_bookings(slot_id)

    def list_slots(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        teacher_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        location: Optional[str] = None,
        availability_status: Optional[AvailabilityStatus] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[ConferenceSlot], int]:
        slots = self.slot_repo.list_by_institution(
            institution_id=institution_id,
            skip=skip,
            limit=limit,
            teacher_id=teacher_id,
            date_from=date_from,
            date_to=date_to,
            location=location,
            availability_status=availability_status,
            is_active=is_active
        )
        total = self.slot_repo.count_by_institution(
            institution_id=institution_id,
            teacher_id=teacher_id,
            date_from=date_from,
            date_to=date_to,
            location=location,
            availability_status=availability_status,
            is_active=is_active
        )
        return slots, total

    def list_teacher_slots(
        self,
        teacher_id: int,
        skip: int = 0,
        limit: int = 100,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        availability_status: Optional[AvailabilityStatus] = None
    ) -> List[ConferenceSlot]:
        return self.slot_repo.list_by_teacher(
            teacher_id=teacher_id,
            skip=skip,
            limit=limit,
            date_from=date_from,
            date_to=date_to,
            availability_status=availability_status
        )

    def get_available_slots(
        self,
        institution_id: int,
        date_from: date,
        date_to: date,
        teacher_id: Optional[int] = None,
        min_duration: Optional[int] = None
    ) -> List[ConferenceSlot]:
        return self.slot_repo.get_available_slots(
            institution_id=institution_id,
            date_from=date_from,
            date_to=date_to,
            teacher_id=teacher_id,
            min_duration=min_duration
        )

    def update_slot(self, slot_id: int, data: ConferenceSlotUpdate) -> ConferenceSlot:
        slot = self.slot_repo.get_by_id(slot_id)
        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conference slot not found"
            )

        update_data = data.model_dump(exclude_unset=True)
        slot = self.slot_repo.update(slot, **update_data)
        self.db.commit()
        self.db.refresh(slot)
        return slot

    def delete_slot(self, slot_id: int) -> None:
        slot = self.slot_repo.get_by_id(slot_id)
        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conference slot not found"
            )

        if slot.current_bookings > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete slot with existing bookings"
            )

        self.slot_repo.delete(slot)
        self.db.commit()

    def update_slot_availability(self, slot: ConferenceSlot) -> None:
        if slot.current_bookings >= slot.max_bookings:
            slot.availability_status = AvailabilityStatus.BOOKED.value
        elif slot.current_bookings == 0:
            slot.availability_status = AvailabilityStatus.AVAILABLE.value
        self.db.flush()


class ConferenceBookingService:
    def __init__(self, db: Session):
        self.db = db
        self.booking_repo = ConferenceBookingRepository(db)
        self.slot_repo = ConferenceSlotRepository(db)
        self.reminder_repo = ConferenceReminderRepository(db)
        self.video_service = VideoConferencingService()
        self.slot_service = ConferenceSlotService(db)

    def create_booking(self, data: ConferenceBookingCreate) -> ConferenceBooking:
        slot = self.slot_repo.get_by_id(data.slot_id)
        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conference slot not found"
            )

        if slot.current_bookings >= slot.max_bookings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Conference slot is fully booked"
            )

        if slot.availability_status == AvailabilityStatus.CANCELLED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Conference slot has been cancelled"
            )

        booking_data = data.model_dump()
        booking_data['booking_status'] = BookingStatus.CONFIRMED.value

        if slot.location in [LocationType.VIRTUAL.value, LocationType.HYBRID.value]:
            meeting_info = self.video_service.create_zoom_meeting(
                topic=f"Parent-Teacher Conference - {data.conference_type}",
                start_time=datetime.combine(slot.date, slot.time_slot),
                duration=slot.duration_minutes
            )
            booking_data['video_meeting_link'] = meeting_info['meeting_link']
            booking_data['video_meeting_id'] = meeting_info['meeting_id']
            booking_data['video_meeting_password'] = meeting_info['meeting_password']

        booking = self.booking_repo.create(**booking_data)

        slot.current_bookings += 1
        self.slot_service.update_slot_availability(slot)

        conference_datetime = datetime.combine(slot.date, slot.time_slot)
        reminder_24h = self.reminder_repo.create(
            booking_id=booking.id,
            reminder_type='24_hour',
            scheduled_for=conference_datetime - timedelta(hours=24),
            status='pending'
        )
        reminder_1h = self.reminder_repo.create(
            booking_id=booking.id,
            reminder_type='1_hour',
            scheduled_for=conference_datetime - timedelta(hours=1),
            status='pending'
        )

        self.db.commit()
        self.db.refresh(booking)
        return booking

    def get_booking(self, booking_id: int) -> Optional[ConferenceBooking]:
        return self.booking_repo.get_by_id(booking_id)

    def get_booking_with_slot(self, booking_id: int) -> Optional[ConferenceBooking]:
        return self.booking_repo.get_with_slot(booking_id)

    def list_bookings(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        booking_status: Optional[BookingStatus] = None,
        teacher_id: Optional[int] = None,
        parent_id: Optional[int] = None,
        student_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> Tuple[List[ConferenceBooking], int]:
        bookings = self.booking_repo.list_by_institution(
            institution_id=institution_id,
            skip=skip,
            limit=limit,
            booking_status=booking_status,
            teacher_id=teacher_id,
            parent_id=parent_id,
            student_id=student_id,
            date_from=date_from,
            date_to=date_to
        )
        total = self.booking_repo.count_by_institution(
            institution_id=institution_id,
            booking_status=booking_status,
            teacher_id=teacher_id,
            parent_id=parent_id,
            student_id=student_id,
            date_from=date_from,
            date_to=date_to
        )
        return bookings, total

    def list_parent_bookings(
        self,
        parent_id: int,
        skip: int = 0,
        limit: int = 100,
        booking_status: Optional[BookingStatus] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> List[ConferenceBooking]:
        return self.booking_repo.list_by_parent(
            parent_id=parent_id,
            skip=skip,
            limit=limit,
            booking_status=booking_status,
            date_from=date_from,
            date_to=date_to
        )

    def update_booking(self, booking_id: int, data: ConferenceBookingUpdate) -> ConferenceBooking:
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conference booking not found"
            )

        update_data = data.model_dump(exclude_unset=True)
        booking = self.booking_repo.update(booking, **update_data)
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def cancel_booking(self, booking_id: int, cancellation_reason: Optional[str] = None) -> ConferenceBooking:
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conference booking not found"
            )

        if booking.booking_status == BookingStatus.CANCELLED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking is already cancelled"
            )

        slot = self.slot_repo.get_by_id(booking.slot_id)
        if slot and slot.current_bookings > 0:
            slot.current_bookings -= 1
            self.slot_service.update_slot_availability(slot)

        booking.booking_status = BookingStatus.CANCELLED.value
        booking.cancelled_at = datetime.utcnow()
        booking.cancellation_reason = cancellation_reason

        self.db.commit()
        self.db.refresh(booking)
        return booking

    def check_in_booking(self, booking_id: int) -> ConferenceBooking:
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conference booking not found"
            )

        booking.checked_in_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def complete_booking(self, booking_id: int) -> ConferenceBooking:
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conference booking not found"
            )

        booking.booking_status = BookingStatus.COMPLETED.value
        booking.completed_at = datetime.utcnow()

        slot = self.slot_repo.get_by_id(booking.slot_id)
        if slot:
            slot.availability_status = AvailabilityStatus.COMPLETED.value

        self.db.commit()
        self.db.refresh(booking)
        return booking

    def upload_recording(self, booking_id: int, recording_url: str, recording_s3_key: Optional[str] = None) -> ConferenceBooking:
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conference booking not found"
            )

        booking.recording_url = recording_url
        booking.recording_s3_key = recording_s3_key
        self.db.commit()
        self.db.refresh(booking)
        return booking


class ConferenceSurveyService:
    def __init__(self, db: Session):
        self.db = db
        self.survey_repo = ConferenceSurveyRepository(db)

    def create_or_update_survey(self, data: ConferenceSurveyCreate) -> ConferenceSurvey:
        existing_survey = self.survey_repo.get_by_booking(data.booking_id)

        if existing_survey:
            update_data = data.model_dump(exclude={'booking_id', 'respondent_type'}, exclude_unset=True)
            update_data['submitted_at'] = datetime.utcnow()
            survey = self.survey_repo.update(existing_survey, **update_data)
        else:
            survey_data = data.model_dump()
            survey_data['submitted_at'] = datetime.utcnow()
            survey = self.survey_repo.create(**survey_data)

        self.db.commit()
        self.db.refresh(survey)
        return survey

    def get_survey(self, survey_id: int) -> Optional[ConferenceSurvey]:
        return self.survey_repo.get_by_id(survey_id)

    def get_survey_by_booking(self, booking_id: int) -> Optional[ConferenceSurvey]:
        return self.survey_repo.get_by_booking(booking_id)


class ConferenceAnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.slot_repo = ConferenceSlotRepository(db)
        self.booking_repo = ConferenceBookingRepository(db)
        self.survey_repo = ConferenceSurveyRepository(db)

    def get_institution_statistics(
        self,
        institution_id: int,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> ConferenceStatistics:
        total_slots = self.slot_repo.count_by_institution(
            institution_id=institution_id,
            date_from=date_from,
            date_to=date_to
        )

        available_slots = self.slot_repo.count_by_institution(
            institution_id=institution_id,
            availability_status=AvailabilityStatus.AVAILABLE,
            date_from=date_from,
            date_to=date_to
        )

        booked_slots = self.slot_repo.count_by_institution(
            institution_id=institution_id,
            availability_status=AvailabilityStatus.BOOKED,
            date_from=date_from,
            date_to=date_to
        )

        total_bookings = self.booking_repo.count_by_institution(
            institution_id=institution_id,
            date_from=date_from,
            date_to=date_to
        )

        completed_conferences = self.booking_repo.count_by_institution(
            institution_id=institution_id,
            booking_status=BookingStatus.COMPLETED,
            date_from=date_from,
            date_to=date_to
        )

        cancelled_conferences = self.booking_repo.count_by_institution(
            institution_id=institution_id,
            booking_status=BookingStatus.CANCELLED,
            date_from=date_from,
            date_to=date_to
        )

        today = datetime.utcnow().date()
        upcoming_conferences = self.booking_repo.count_by_institution(
            institution_id=institution_id,
            booking_status=BookingStatus.CONFIRMED,
            date_from=today
        )

        past_conferences = self.booking_repo.count_by_institution(
            institution_id=institution_id,
            date_to=today
        )

        return ConferenceStatistics(
            total_slots=total_slots,
            available_slots=available_slots,
            booked_slots=booked_slots,
            completed_conferences=completed_conferences,
            cancelled_conferences=cancelled_conferences,
            average_rating=None,
            total_bookings=total_bookings,
            upcoming_conferences=upcoming_conferences,
            past_conferences=past_conferences
        )

    def get_teacher_statistics(self, teacher_id: int) -> TeacherConferenceStats:
        slots = self.slot_repo.list_by_teacher(teacher_id=teacher_id, limit=10000)
        total_slots_created = len(slots)

        total_hours = sum(slot.duration_minutes for slot in slots) / 60

        bookings = []
        for slot in slots:
            bookings.extend(self.booking_repo.list_by_slot(slot.id))

        total_bookings = len(bookings)
        completed_conferences = sum(1 for b in bookings if b.booking_status == BookingStatus.COMPLETED.value)

        average_rating = self.survey_repo.get_average_rating_by_teacher(teacher_id)

        today = datetime.utcnow().date()
        upcoming_conferences = sum(
            1 for slot in slots
            if slot.date >= today
            for b in self.booking_repo.list_by_slot(slot.id)
            if b.booking_status == BookingStatus.CONFIRMED.value
        )

        return TeacherConferenceStats(
            teacher_id=teacher_id,
            total_slots_created=total_slots_created,
            total_bookings=total_bookings,
            completed_conferences=completed_conferences,
            average_rating=average_rating,
            total_hours=total_hours,
            upcoming_conferences=upcoming_conferences
        )
