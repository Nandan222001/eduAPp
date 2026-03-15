from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from src.repositories.content_marketplace_repository import (
    ContentModerationRepository, StudentContentRepository
)
from src.models.content_marketplace import ContentStatus, ModerationStatus
from src.schemas.content_marketplace import ModerationReviewCreate


class ContentModerationService:
    def __init__(self, db: Session):
        self.db = db
        self.moderation_repo = ContentModerationRepository(db)
        self.content_repo = StudentContentRepository(db)
    
    def get_moderation_queue(
        self,
        institution_id: int,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: int = 20
    ):
        return self.moderation_repo.get_moderation_queue(
            institution_id, filters, skip, limit
        )
    
    def approve_content(
        self,
        content_id: int,
        reviewer_teacher_id: int,
        institution_id: int,
        quality_score: Optional[int] = None,
        accuracy_score: Optional[int] = None,
        feedback: Optional[str] = None
    ):
        review_data = {
            'institution_id': institution_id,
            'content_id': content_id,
            'reviewer_teacher_id': reviewer_teacher_id,
            'moderation_status': ModerationStatus.APPROVED,
            'quality_score': quality_score,
            'accuracy_score': accuracy_score,
            'feedback': feedback,
            'quality_checks': self._perform_quality_checks(content_id)
        }
        
        review = self.moderation_repo.create(review_data)
        
        self.content_repo.update(content_id, {
            'status': ContentStatus.APPROVED,
            'moderation_status': ModerationStatus.APPROVED,
            'published_at': datetime.utcnow()
        })
        
        return review
    
    def reject_content(
        self,
        content_id: int,
        reviewer_teacher_id: int,
        institution_id: int,
        rejection_reason: str,
        quality_score: Optional[int] = None,
        accuracy_score: Optional[int] = None
    ):
        review_data = {
            'institution_id': institution_id,
            'content_id': content_id,
            'reviewer_teacher_id': reviewer_teacher_id,
            'moderation_status': ModerationStatus.REJECTED,
            'quality_score': quality_score,
            'accuracy_score': accuracy_score,
            'rejection_reason': rejection_reason,
            'quality_checks': self._perform_quality_checks(content_id)
        }
        
        review = self.moderation_repo.create(review_data)
        
        self.content_repo.update(content_id, {
            'status': ContentStatus.REJECTED,
            'moderation_status': ModerationStatus.REJECTED
        })
        
        return review
    
    def request_revision(
        self,
        content_id: int,
        reviewer_teacher_id: int,
        institution_id: int,
        revision_notes: str,
        quality_score: Optional[int] = None,
        accuracy_score: Optional[int] = None
    ):
        review_data = {
            'institution_id': institution_id,
            'content_id': content_id,
            'reviewer_teacher_id': reviewer_teacher_id,
            'moderation_status': ModerationStatus.NEEDS_REVISION,
            'quality_score': quality_score,
            'accuracy_score': accuracy_score,
            'revision_notes': revision_notes,
            'quality_checks': self._perform_quality_checks(content_id)
        }
        
        review = self.moderation_repo.create(review_data)
        
        self.content_repo.update(content_id, {
            'status': ContentStatus.DRAFT,
            'moderation_status': ModerationStatus.NEEDS_REVISION
        })
        
        return review
    
    def _perform_quality_checks(self, content_id: int) -> Dict[str, Any]:
        content = self.content_repo.get_by_id(content_id)
        if not content:
            return {}
        
        checks = {
            'has_title': len(content.title) >= 5,
            'has_description': len(content.description) >= 20,
            'has_preview': content.preview_content is not None,
            'has_content': content.full_content_url is not None or content.s3_key is not None,
            'has_thumbnail': content.thumbnail_url is not None,
            'valid_price': content.price_credits >= 0,
            'plagiarism_checked': content.plagiarism_status != 'not_checked'
        }
        
        checks['passed_all'] = all(checks.values())
        checks['passed_count'] = sum(1 for v in checks.values() if v)
        checks['total_checks'] = len(checks) - 2
        
        return checks
    
    def get_content_moderation_history(self, content_id: int):
        return self.moderation_repo.list_by_content(content_id)
