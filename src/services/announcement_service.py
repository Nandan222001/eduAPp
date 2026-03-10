from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from src.models.notification import Announcement, AudienceType
from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.schemas.notification import AnnouncementCreate, AnnouncementUpdate
from src.services.notification_service import NotificationService
import logging

logger = logging.getLogger(__name__)


class AnnouncementService:
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)

    def create_announcement(
        self,
        institution_id: int,
        created_by: int,
        announcement_data: AnnouncementCreate
    ) -> Announcement:
        announcement = Announcement(
            institution_id=institution_id,
            created_by=created_by,
            **announcement_data.model_dump()
        )
        self.db.add(announcement)
        self.db.commit()
        self.db.refresh(announcement)
        return announcement

    def get_announcements(
        self,
        institution_id: int,
        is_published: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Announcement]:
        query = self.db.query(Announcement).filter(
            Announcement.institution_id == institution_id
        )
        
        if is_published is not None:
            query = query.filter(Announcement.is_published == is_published)
        
        return query.order_by(Announcement.created_at.desc()).offset(skip).limit(limit).all()

    def get_announcement_by_id(
        self,
        announcement_id: int,
        institution_id: int
    ) -> Optional[Announcement]:
        return self.db.query(Announcement).filter(
            and_(
                Announcement.id == announcement_id,
                Announcement.institution_id == institution_id
            )
        ).first()

    def update_announcement(
        self,
        announcement_id: int,
        institution_id: int,
        announcement_update: AnnouncementUpdate
    ) -> Optional[Announcement]:
        announcement = self.get_announcement_by_id(announcement_id, institution_id)
        if not announcement:
            return None
        
        if announcement.is_published:
            return None
        
        update_data = announcement_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(announcement, field, value)
        
        self.db.commit()
        self.db.refresh(announcement)
        return announcement

    def delete_announcement(
        self,
        announcement_id: int,
        institution_id: int
    ) -> bool:
        announcement = self.get_announcement_by_id(announcement_id, institution_id)
        if not announcement:
            return False
        
        if announcement.is_published:
            return False
        
        self.db.delete(announcement)
        self.db.commit()
        return True

    def publish_announcement(
        self,
        announcement_id: int,
        institution_id: int
    ) -> Optional[Announcement]:
        announcement = self.get_announcement_by_id(announcement_id, institution_id)
        if not announcement:
            return None
        
        if announcement.is_published:
            return announcement
        
        announcement.is_published = True
        announcement.published_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(announcement)
        
        self._broadcast_announcement(announcement)
        
        return announcement

    def _broadcast_announcement(self, announcement: Announcement) -> None:
        target_users = self._get_target_users(announcement)
        
        for user in target_users:
            for channel in announcement.channels:
                try:
                    notification = self.notification_service.create_notification(
                        institution_id=announcement.institution_id,
                        user_id=user.id,
                        title=announcement.title,
                        message=announcement.content,
                        notification_type="announcement",
                        channel=channel,
                        priority=announcement.priority,
                        data={
                            "announcement_id": announcement.id,
                            "attachments": announcement.attachments
                        }
                    )
                except Exception as e:
                    logger.error(f"Error creating notification for user {user.id}: {str(e)}")

    def _get_target_users(self, announcement: Announcement) -> List[User]:
        query = self.db.query(User).filter(
            and_(
                User.institution_id == announcement.institution_id,
                User.is_active == True
            )
        )
        
        if announcement.audience_type == AudienceType.ALL.value:
            return query.all()
        
        elif announcement.audience_type == AudienceType.ROLE.value:
            if announcement.audience_filter and "role_ids" in announcement.audience_filter:
                role_ids = announcement.audience_filter["role_ids"]
                query = query.filter(User.role_id.in_(role_ids))
            return query.all()
        
        elif announcement.audience_type == AudienceType.GRADE.value:
            if announcement.audience_filter and "grade_ids" in announcement.audience_filter:
                grade_ids = announcement.audience_filter["grade_ids"]
                
                student_users = query.join(Student).filter(
                    Student.grade_id.in_(grade_ids)
                ).all()
                
                teacher_users = query.join(Teacher).join(
                    Teacher.subjects
                ).filter(
                    Teacher.subjects.any(
                        lambda x: x.grade_id.in_(grade_ids)
                    )
                ).all()
                
                user_ids = set([u.id for u in student_users] + [u.id for u in teacher_users])
                return [u for u in query.all() if u.id in user_ids]
            return []
        
        elif announcement.audience_type == AudienceType.SECTION.value:
            if announcement.audience_filter and "section_ids" in announcement.audience_filter:
                section_ids = announcement.audience_filter["section_ids"]
                
                student_users = query.join(Student).filter(
                    Student.section_id.in_(section_ids)
                ).all()
                
                return student_users
            return []
        
        elif announcement.audience_type == AudienceType.CUSTOM.value:
            if announcement.audience_filter and "user_ids" in announcement.audience_filter:
                user_ids = announcement.audience_filter["user_ids"]
                query = query.filter(User.id.in_(user_ids))
            return query.all()
        
        return []

    def get_user_announcements(
        self,
        user_id: int,
        institution_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Announcement]:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return []
        
        query = self.db.query(Announcement).filter(
            and_(
                Announcement.institution_id == institution_id,
                Announcement.is_published == True,
                or_(
                    Announcement.expires_at.is_(None),
                    Announcement.expires_at > datetime.utcnow()
                )
            )
        )
        
        all_announcements = query.order_by(Announcement.published_at.desc()).all()
        
        user_announcements = []
        for announcement in all_announcements:
            if self._is_user_in_audience(user, announcement):
                user_announcements.append(announcement)
        
        return user_announcements[skip:skip+limit]

    def _is_user_in_audience(self, user: User, announcement: Announcement) -> bool:
        if announcement.audience_type == AudienceType.ALL.value:
            return True
        
        elif announcement.audience_type == AudienceType.ROLE.value:
            if announcement.audience_filter and "role_ids" in announcement.audience_filter:
                return user.role_id in announcement.audience_filter["role_ids"]
        
        elif announcement.audience_type == AudienceType.GRADE.value:
            if announcement.audience_filter and "grade_ids" in announcement.audience_filter:
                grade_ids = announcement.audience_filter["grade_ids"]
                
                if user.student_profile and user.student_profile.grade_id in grade_ids:
                    return True
                
                if user.teacher_profile:
                    for subject in user.teacher_profile.subjects:
                        if hasattr(subject, 'grade_id') and subject.grade_id in grade_ids:
                            return True
        
        elif announcement.audience_type == AudienceType.SECTION.value:
            if announcement.audience_filter and "section_ids" in announcement.audience_filter:
                if user.student_profile:
                    return user.student_profile.section_id in announcement.audience_filter["section_ids"]
        
        elif announcement.audience_type == AudienceType.CUSTOM.value:
            if announcement.audience_filter and "user_ids" in announcement.audience_filter:
                return user.id in announcement.audience_filter["user_ids"]
        
        return False
