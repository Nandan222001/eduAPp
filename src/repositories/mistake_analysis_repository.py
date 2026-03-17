from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from src.models.mistake_analysis import (
    MistakePattern, MistakeInsuranceToken, InsuranceReview,
    MistakeType, RemediationStatus, EarnedVia
)
from src.schemas.mistake_analysis import (
    MistakePatternCreate, MistakePatternUpdate,
    MistakeInsuranceTokenCreate, MistakeInsuranceTokenUpdate,
    InsuranceReviewCreate
)


class MistakePatternRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_pattern(self, pattern_data: MistakePatternCreate) -> MistakePattern:
        pattern = MistakePattern(**pattern_data.model_dump())
        self.db.add(pattern)
        self.db.commit()
        self.db.refresh(pattern)
        return pattern
    
    def get_pattern_by_id(self, pattern_id: int) -> Optional[MistakePattern]:
        return self.db.query(MistakePattern).filter(
            MistakePattern.id == pattern_id
        ).first()
    
    def get_student_patterns(
        self,
        student_id: int,
        subject_id: Optional[int] = None,
        chapter_id: Optional[int] = None,
        mistake_type: Optional[MistakeType] = None,
        remediation_status: Optional[RemediationStatus] = None
    ) -> List[MistakePattern]:
        query = self.db.query(MistakePattern).filter(
            MistakePattern.student_id == student_id
        )
        
        if subject_id:
            query = query.filter(MistakePattern.subject_id == subject_id)
        if chapter_id:
            query = query.filter(MistakePattern.chapter_id == chapter_id)
        if mistake_type:
            query = query.filter(MistakePattern.mistake_type == mistake_type)
        if remediation_status:
            query = query.filter(MistakePattern.remediation_status == remediation_status)
        
        return query.order_by(desc(MistakePattern.frequency_count)).all()
    
    def find_existing_pattern(
        self,
        student_id: int,
        subject_id: int,
        chapter_id: Optional[int],
        mistake_type: MistakeType
    ) -> Optional[MistakePattern]:
        query = self.db.query(MistakePattern).filter(
            and_(
                MistakePattern.student_id == student_id,
                MistakePattern.subject_id == subject_id,
                MistakePattern.mistake_type == mistake_type
            )
        )
        
        if chapter_id:
            query = query.filter(MistakePattern.chapter_id == chapter_id)
        else:
            query = query.filter(MistakePattern.chapter_id.is_(None))
        
        return query.first()
    
    def update_pattern(
        self,
        pattern_id: int,
        pattern_data: MistakePatternUpdate
    ) -> Optional[MistakePattern]:
        pattern = self.get_pattern_by_id(pattern_id)
        if not pattern:
            return None
        
        update_data = pattern_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(pattern, field, value)
        
        self.db.commit()
        self.db.refresh(pattern)
        return pattern
    
    def get_patterns_by_subject(
        self,
        student_id: int,
        subject_id: int
    ) -> List[MistakePattern]:
        return self.db.query(MistakePattern).filter(
            and_(
                MistakePattern.student_id == student_id,
                MistakePattern.subject_id == subject_id
            )
        ).order_by(desc(MistakePattern.total_marks_lost)).all()
    
    def get_statistics(self, student_id: int) -> dict:
        patterns = self.db.query(MistakePattern).filter(
            MistakePattern.student_id == student_id
        ).all()
        
        stats = {
            'total_patterns': len(patterns),
            'patterns_by_type': {},
            'total_marks_lost': 0,
            'unresolved_count': 0,
            'in_progress_count': 0,
            'mastered_count': 0
        }
        
        for pattern in patterns:
            stats['total_marks_lost'] += float(pattern.total_marks_lost)
            stats['patterns_by_type'][pattern.mistake_type.value] = \
                stats['patterns_by_type'].get(pattern.mistake_type.value, 0) + 1
            
            if pattern.remediation_status == RemediationStatus.UNRESOLVED:
                stats['unresolved_count'] += 1
            elif pattern.remediation_status == RemediationStatus.IN_PROGRESS:
                stats['in_progress_count'] += 1
            elif pattern.remediation_status == RemediationStatus.MASTERED:
                stats['mastered_count'] += 1
        
        return stats


class MistakeInsuranceTokenRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_token(self, token_data: MistakeInsuranceTokenCreate) -> MistakeInsuranceToken:
        token = MistakeInsuranceToken(**token_data.model_dump())
        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)
        return token
    
    def get_token_by_id(self, token_id: int) -> Optional[MistakeInsuranceToken]:
        return self.db.query(MistakeInsuranceToken).filter(
            MistakeInsuranceToken.id == token_id
        ).first()
    
    def get_student_tokens(
        self,
        student_id: int,
        include_used: bool = True
    ) -> List[MistakeInsuranceToken]:
        query = self.db.query(MistakeInsuranceToken).filter(
            MistakeInsuranceToken.student_id == student_id
        )
        
        if not include_used:
            query = query.filter(MistakeInsuranceToken.used_at.is_(None))
        
        return query.order_by(desc(MistakeInsuranceToken.earned_at)).all()
    
    def get_available_tokens_count(self, student_id: int) -> int:
        return self.db.query(func.count(MistakeInsuranceToken.id)).filter(
            and_(
                MistakeInsuranceToken.student_id == student_id,
                MistakeInsuranceToken.used_at.is_(None)
            )
        ).scalar()
    
    def get_used_tokens_count(self, student_id: int) -> int:
        return self.db.query(func.count(MistakeInsuranceToken.id)).filter(
            and_(
                MistakeInsuranceToken.student_id == student_id,
                MistakeInsuranceToken.used_at.isnot(None)
            )
        ).scalar()
    
    def update_token(
        self,
        token_id: int,
        token_data: MistakeInsuranceTokenUpdate
    ) -> Optional[MistakeInsuranceToken]:
        token = self.get_token_by_id(token_id)
        if not token:
            return None
        
        update_data = token_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(token, field, value)
        
        self.db.commit()
        self.db.refresh(token)
        return token
    
    def mark_token_as_used(
        self,
        token_id: int,
        exam_id: int
    ) -> Optional[MistakeInsuranceToken]:
        token = self.get_token_by_id(token_id)
        if not token or token.used_at is not None:
            return None
        
        token.used_at = datetime.utcnow()
        token.used_for_exam_id = exam_id
        self.db.commit()
        self.db.refresh(token)
        return token


class InsuranceReviewRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_review(self, review_data: InsuranceReviewCreate) -> InsuranceReview:
        review = InsuranceReview(**review_data.model_dump())
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review
    
    def get_review_by_id(self, review_id: int) -> Optional[InsuranceReview]:
        return self.db.query(InsuranceReview).filter(
            InsuranceReview.id == review_id
        ).first()
    
    def get_review_by_token(self, token_id: int) -> Optional[InsuranceReview]:
        return self.db.query(InsuranceReview).filter(
            InsuranceReview.token_id == token_id
        ).first()
    
    def get_reviews_by_exam(self, exam_id: int) -> List[InsuranceReview]:
        return self.db.query(InsuranceReview).filter(
            InsuranceReview.exam_id == exam_id
        ).order_by(desc(InsuranceReview.reviewed_at)).all()
    
    def get_student_reviews(self, student_id: int) -> List[InsuranceReview]:
        return self.db.query(InsuranceReview).join(
            MistakeInsuranceToken,
            InsuranceReview.token_id == MistakeInsuranceToken.id
        ).filter(
            MistakeInsuranceToken.student_id == student_id
        ).order_by(desc(InsuranceReview.reviewed_at)).all()
