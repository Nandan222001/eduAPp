from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from datetime import datetime, date, time, timedelta
from src.models.conferences import (
    ConferenceSlot, ConferenceBooking, ConferenceSurvey, ConferenceReminder,
    AvailabilityStatus, BookingStatus
)


class ConferenceSlotRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ConferenceSlot:
        slot = ConferenceSlot(**kwargs)
        self.db.add(slot)
        self.db.flush()
        return slot

    def get_by_id(self, slot_id: int) -> Optional[ConferenceSlot]:
        return self.db.query(ConferenceSlot).filter(ConferenceSlot.id == slot_id).first()

    def get_with_bookings(self, slot_id: int) -> Optional[ConferenceSlot]:
        return self.db.query(ConferenceSlot).options(
            joinedload(ConferenceSlot.bookings)
        ).filter(ConferenceSlot.id == slot_id).first()

    def list_by_teacher(
        self,
        teacher_id: int,
        skip: int = 0,
        limit: int = 100,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        availability_status: Optional[AvailabilityStatus] = None,
        is_active: Optional[bool] = None
    ) -> List[ConferenceSlot]:
        query = self.db.query(ConferenceSlot).filter(
            ConferenceSlot.teacher_id == teacher_id
        )

        if date_from:
            query = query.filter(ConferenceSlot.date >= date_from)

        if date_to:
            query = query.filter(ConferenceSlot.date <= date_to)

        if availability_status:
            query = query.filter(ConferenceSlot.availability_status == availability_status)

        if is_active is not None:
            query = query.filter(ConferenceSlot.is_active == is_active)

        return query.order_by(ConferenceSlot.date, ConferenceSlot.time_slot).offset(skip).limit(limit).all()

    def list_by_institution(
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
    ) -> List[ConferenceSlot]:
        query = self.db.query(ConferenceSlot).filter(
            ConferenceSlot.institution_id == institution_id
        )

        if teacher_id:
            query = query.filter(ConferenceSlot.teacher_id == teacher_id)

        if date_from:
            query = query.filter(ConferenceSlot.date >= date_from)

        if date_to:
            query = query.filter(ConferenceSlot.date <= date_to)

        if location:
            query = query.filter(ConferenceSlot.location == location)

        if availability_status:
            query = query.filter(ConferenceSlot.availability_status == availability_status)

        if is_active is not None:
            query = query.filter(ConferenceSlot.is_active == is_active)

        return query.order_by(ConferenceSlot.date, ConferenceSlot.time_slot).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        teacher_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        location: Optional[str] = None,
        availability_status: Optional[AvailabilityStatus] = None,
        is_active: Optional[bool] = None
    ) -> int:
        query = self.db.query(ConferenceSlot).filter(
            ConferenceSlot.institution_id == institution_id
        )

        if teacher_id:
            query = query.filter(ConferenceSlot.teacher_id == teacher_id)

        if date_from:
            query = query.filter(ConferenceSlot.date >= date_from)

        if date_to:
            query = query.filter(ConferenceSlot.date <= date_to)

        if location:
            query = query.filter(ConferenceSlot.location == location)

        if availability_status:
            query = query.filter(ConferenceSlot.availability_status == availability_status)

        if is_active is not None:
            query = query.filter(ConferenceSlot.is_active == is_active)

        return query.count()

    def update(self, slot: ConferenceSlot, **kwargs) -> ConferenceSlot:
        for key, value in kwargs.items():
            if value is not None:
                setattr(slot, key, value)
        self.db.flush()
        return slot

    def delete(self, slot: ConferenceSlot) -> None:
        self.db.delete(slot)
        self.db.flush()

    def get_available_slots(
        self,
        institution_id: int,
        date_from: date,
        date_to: date,
        teacher_id: Optional[int] = None,
        min_duration: Optional[int] = None
    ) -> List[ConferenceSlot]:
        query = self.db.query(ConferenceSlot).filter(
            ConferenceSlot.institution_id == institution_id,
            ConferenceSlot.date >= date_from,
            ConferenceSlot.date <= date_to,
            ConferenceSlot.availability_status == AvailabilityStatus.AVAILABLE.value,
            ConferenceSlot.current_bookings < ConferenceSlot.max_bookings,
            ConferenceSlot.is_active == True
        )

        if teacher_id:
            query = query.filter(ConferenceSlot.teacher_id == teacher_id)

        if min_duration:
            query = query.filter(ConferenceSlot.duration_minutes >= min_duration)

        return query.order_by(ConferenceSlot.date, ConferenceSlot.time_slot).all()


class ConferenceBookingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ConferenceBooking:
        booking = ConferenceBooking(**kwargs)
        self.db.add(booking)
        self.db.flush()
        return booking

    def get_by_id(self, booking_id: int) -> Optional[ConferenceBooking]:
        return self.db.query(ConferenceBooking).filter(ConferenceBooking.id == booking_id).first()

    def get_with_slot(self, booking_id: int) -> Optional[ConferenceBooking]:
        return self.db.query(ConferenceBooking).options(
            joinedload(ConferenceBooking.slot)
        ).filter(ConferenceBooking.id == booking_id).first()

    def list_by_parent(
        self,
        parent_id: int,
        skip: int = 0,
        limit: int = 100,
        booking_status: Optional[BookingStatus] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> List[ConferenceBooking]:
        query = self.db.query(ConferenceBooking).join(ConferenceSlot).filter(
            ConferenceBooking.parent_id == parent_id
        )

        if booking_status:
            query = query.filter(ConferenceBooking.booking_status == booking_status)

        if date_from:
            query = query.filter(ConferenceSlot.date >= date_from)

        if date_to:
            query = query.filter(ConferenceSlot.date <= date_to)

        return query.order_by(ConferenceSlot.date.desc(), ConferenceSlot.time_slot.desc()).offset(skip).limit(limit).all()

    def list_by_slot(self, slot_id: int) -> List[ConferenceBooking]:
        return self.db.query(ConferenceBooking).filter(
            ConferenceBooking.slot_id == slot_id
        ).all()

    def list_by_institution(
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
    ) -> List[ConferenceBooking]:
        query = self.db.query(ConferenceBooking).join(ConferenceSlot).filter(
            ConferenceBooking.institution_id == institution_id
        )

        if booking_status:
            query = query.filter(ConferenceBooking.booking_status == booking_status)

        if teacher_id:
            query = query.filter(ConferenceSlot.teacher_id == teacher_id)

        if parent_id:
            query = query.filter(ConferenceBooking.parent_id == parent_id)

        if student_id:
            query = query.filter(ConferenceBooking.student_id == student_id)

        if date_from:
            query = query.filter(ConferenceSlot.date >= date_from)

        if date_to:
            query = query.filter(ConferenceSlot.date <= date_to)

        return query.order_by(ConferenceSlot.date.desc(), ConferenceSlot.time_slot.desc()).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        booking_status: Optional[BookingStatus] = None,
        teacher_id: Optional[int] = None,
        parent_id: Optional[int] = None,
        student_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> int:
        query = self.db.query(ConferenceBooking).join(ConferenceSlot).filter(
            ConferenceBooking.institution_id == institution_id
        )

        if booking_status:
            query = query.filter(ConferenceBooking.booking_status == booking_status)

        if teacher_id:
            query = query.filter(ConferenceSlot.teacher_id == teacher_id)

        if parent_id:
            query = query.filter(ConferenceBooking.parent_id == parent_id)

        if student_id:
            query = query.filter(ConferenceBooking.student_id == student_id)

        if date_from:
            query = query.filter(ConferenceSlot.date >= date_from)

        if date_to:
            query = query.filter(ConferenceSlot.date <= date_to)

        return query.count()

    def update(self, booking: ConferenceBooking, **kwargs) -> ConferenceBooking:
        for key, value in kwargs.items():
            if value is not None:
                setattr(booking, key, value)
        self.db.flush()
        return booking

    def delete(self, booking: ConferenceBooking) -> None:
        self.db.delete(booking)
        self.db.flush()

    def get_pending_reminders(self, scheduled_before: datetime) -> List[ConferenceBooking]:
        return self.db.query(ConferenceBooking).join(ConferenceSlot).filter(
            ConferenceBooking.booking_status == BookingStatus.CONFIRMED.value,
            or_(
                and_(
                    ConferenceBooking.reminder_24h_sent == False,
                    func.datetime(ConferenceSlot.date, ConferenceSlot.time_slot) <= scheduled_before + timedelta(hours=24),
                    func.datetime(ConferenceSlot.date, ConferenceSlot.time_slot) > datetime.utcnow()
                ),
                and_(
                    ConferenceBooking.reminder_1h_sent == False,
                    func.datetime(ConferenceSlot.date, ConferenceSlot.time_slot) <= scheduled_before + timedelta(hours=1),
                    func.datetime(ConferenceSlot.date, ConferenceSlot.time_slot) > datetime.utcnow()
                )
            )
        ).all()


class ConferenceSurveyRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ConferenceSurvey:
        survey = ConferenceSurvey(**kwargs)
        self.db.add(survey)
        self.db.flush()
        return survey

    def get_by_id(self, survey_id: int) -> Optional[ConferenceSurvey]:
        return self.db.query(ConferenceSurvey).filter(ConferenceSurvey.id == survey_id).first()

    def get_by_booking(self, booking_id: int) -> Optional[ConferenceSurvey]:
        return self.db.query(ConferenceSurvey).filter(ConferenceSurvey.booking_id == booking_id).first()

    def update(self, survey: ConferenceSurvey, **kwargs) -> ConferenceSurvey:
        for key, value in kwargs.items():
            if value is not None:
                setattr(survey, key, value)
        self.db.flush()
        return survey

    def get_average_rating_by_teacher(self, teacher_id: int) -> Optional[float]:
        result = self.db.query(func.avg(ConferenceSurvey.rating)).join(
            ConferenceBooking
        ).join(
            ConferenceSlot
        ).filter(
            ConferenceSlot.teacher_id == teacher_id,
            ConferenceSurvey.rating.isnot(None)
        ).scalar()
        return float(result) if result else None


class ConferenceReminderRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ConferenceReminder:
        reminder = ConferenceReminder(**kwargs)
        self.db.add(reminder)
        self.db.flush()
        return reminder

    def get_by_id(self, reminder_id: int) -> Optional[ConferenceReminder]:
        return self.db.query(ConferenceReminder).filter(ConferenceReminder.id == reminder_id).first()

    def list_by_booking(self, booking_id: int) -> List[ConferenceReminder]:
        return self.db.query(ConferenceReminder).filter(
            ConferenceReminder.booking_id == booking_id
        ).all()

    def get_pending_reminders(self, scheduled_before: datetime) -> List[ConferenceReminder]:
        return self.db.query(ConferenceReminder).filter(
            ConferenceReminder.status == 'pending',
            ConferenceReminder.scheduled_for <= scheduled_before
        ).all()

    def update(self, reminder: ConferenceReminder, **kwargs) -> ConferenceReminder:
        for key, value in kwargs.items():
            if value is not None:
                setattr(reminder, key, value)
        self.db.flush()
        return reminder
