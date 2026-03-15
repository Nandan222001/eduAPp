from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, or_, and_
from datetime import datetime, timedelta

from src.models.content_marketplace import (
    StudentContent, ContentReview, ContentPurchase, ContentModerationReview,
    ContentPlagiarismCheck, StudentCreditsBalance, CreditTransaction,
    ContentStatus, ModerationStatus, PlagiarismStatus, TransactionType
)
from src.models.student import Student
from src.models.teacher import Teacher


class StudentContentRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, content_data: Dict[str, Any]) -> StudentContent:
        content = StudentContent(**content_data)
        self.db.add(content)
        self.db.commit()
        self.db.refresh(content)
        return content
    
    def get_by_id(self, content_id: int) -> Optional[StudentContent]:
        return self.db.query(StudentContent).filter(StudentContent.id == content_id).first()
    
    def update(self, content_id: int, update_data: Dict[str, Any]) -> Optional[StudentContent]:
        content = self.get_by_id(content_id)
        if content:
            for key, value in update_data.items():
                if value is not None:
                    setattr(content, key, value)
            content.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(content)
        return content
    
    def delete(self, content_id: int) -> bool:
        content = self.get_by_id(content_id)
        if content:
            self.db.delete(content)
            self.db.commit()
            return True
        return False
    
    def search(
        self,
        institution_id: int,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: int = 20
    ) -> List[StudentContent]:
        query = self.db.query(StudentContent).filter(
            StudentContent.institution_id == institution_id,
            StudentContent.status == ContentStatus.APPROVED,
            StudentContent.is_active == True
        )
        
        if filters.get('content_type'):
            query = query.filter(StudentContent.content_type == filters['content_type'])
        
        if filters.get('subject'):
            query = query.filter(StudentContent.subject == filters['subject'])
        
        if filters.get('grade_level'):
            query = query.filter(StudentContent.grade_level == filters['grade_level'])
        
        if filters.get('min_rating'):
            query = query.filter(StudentContent.rating >= filters['min_rating'])
        
        if filters.get('max_price') is not None:
            query = query.filter(StudentContent.price_credits <= filters['max_price'])
        
        if filters.get('is_free'):
            query = query.filter(StudentContent.price_credits == 0)
        
        if filters.get('tags'):
            for tag in filters['tags']:
                query = query.filter(StudentContent.tags.contains([tag]))
        
        if filters.get('search_query'):
            search = f"%{filters['search_query']}%"
            query = query.filter(
                or_(
                    StudentContent.title.ilike(search),
                    StudentContent.description.ilike(search),
                    StudentContent.topic.ilike(search)
                )
            )
        
        sort_by = filters.get('sort_by', 'created_at')
        sort_order = filters.get('sort_order', 'desc')
        
        order_column = getattr(StudentContent, sort_by)
        if sort_order == 'desc':
            query = query.order_by(desc(order_column))
        else:
            query = query.order_by(asc(order_column))
        
        return query.offset(skip).limit(limit).all()
    
    def list_by_creator(
        self,
        creator_student_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> List[StudentContent]:
        return self.db.query(StudentContent).filter(
            StudentContent.creator_student_id == creator_student_id
        ).order_by(desc(StudentContent.created_at)).offset(skip).limit(limit).all()
    
    def get_featured_contents(
        self,
        institution_id: int,
        limit: int = 10
    ) -> List[StudentContent]:
        return self.db.query(StudentContent).filter(
            StudentContent.institution_id == institution_id,
            StudentContent.is_featured == True,
            StudentContent.status == ContentStatus.APPROVED,
            StudentContent.is_active == True
        ).order_by(desc(StudentContent.rating)).limit(limit).all()
    
    def increment_views(self, content_id: int) -> None:
        content = self.get_by_id(content_id)
        if content:
            content.views_count += 1
            self.db.commit()
    
    def increment_downloads(self, content_id: int) -> None:
        content = self.get_by_id(content_id)
        if content:
            content.downloads_count += 1
            self.db.commit()
    
    def update_rating(self, content_id: int) -> None:
        content = self.get_by_id(content_id)
        if content:
            avg_rating = self.db.query(func.avg(ContentReview.rating)).filter(
                ContentReview.content_id == content_id
            ).scalar()
            
            rating_count = self.db.query(func.count(ContentReview.id)).filter(
                ContentReview.content_id == content_id
            ).scalar()
            
            content.rating = round(avg_rating or 0.0, 2)
            content.rating_count = rating_count or 0
            content.reviews_count = rating_count or 0
            self.db.commit()


class ContentReviewRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, review_data: Dict[str, Any]) -> ContentReview:
        review = ContentReview(**review_data)
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review
    
    def get_by_id(self, review_id: int) -> Optional[ContentReview]:
        return self.db.query(ContentReview).filter(ContentReview.id == review_id).first()
    
    def update(self, review_id: int, update_data: Dict[str, Any]) -> Optional[ContentReview]:
        review = self.get_by_id(review_id)
        if review:
            for key, value in update_data.items():
                if value is not None:
                    setattr(review, key, value)
            review.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(review)
        return review
    
    def list_by_content(
        self,
        content_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> List[ContentReview]:
        return self.db.query(ContentReview).filter(
            ContentReview.content_id == content_id
        ).order_by(desc(ContentReview.created_at)).offset(skip).limit(limit).all()
    
    def get_by_content_and_reviewer(
        self,
        content_id: int,
        reviewer_student_id: int
    ) -> Optional[ContentReview]:
        return self.db.query(ContentReview).filter(
            ContentReview.content_id == content_id,
            ContentReview.reviewer_student_id == reviewer_student_id
        ).first()
    
    def delete(self, review_id: int) -> bool:
        review = self.get_by_id(review_id)
        if review:
            self.db.delete(review)
            self.db.commit()
            return True
        return False


class ContentPurchaseRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, purchase_data: Dict[str, Any]) -> ContentPurchase:
        purchase = ContentPurchase(**purchase_data)
        self.db.add(purchase)
        self.db.commit()
        self.db.refresh(purchase)
        return purchase
    
    def get_by_id(self, purchase_id: int) -> Optional[ContentPurchase]:
        return self.db.query(ContentPurchase).filter(ContentPurchase.id == purchase_id).first()
    
    def get_by_content_and_buyer(
        self,
        content_id: int,
        buyer_student_id: int
    ) -> Optional[ContentPurchase]:
        return self.db.query(ContentPurchase).filter(
            ContentPurchase.content_id == content_id,
            ContentPurchase.buyer_student_id == buyer_student_id
        ).first()
    
    def list_by_buyer(
        self,
        buyer_student_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> List[ContentPurchase]:
        return self.db.query(ContentPurchase).filter(
            ContentPurchase.buyer_student_id == buyer_student_id
        ).order_by(desc(ContentPurchase.created_at)).offset(skip).limit(limit).all()
    
    def list_by_content(
        self,
        content_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> List[ContentPurchase]:
        return self.db.query(ContentPurchase).filter(
            ContentPurchase.content_id == content_id
        ).order_by(desc(ContentPurchase.created_at)).offset(skip).limit(limit).all()


class ContentModerationRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, review_data: Dict[str, Any]) -> ContentModerationReview:
        review = ContentModerationReview(**review_data)
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review
    
    def get_by_id(self, review_id: int) -> Optional[ContentModerationReview]:
        return self.db.query(ContentModerationReview).filter(
            ContentModerationReview.id == review_id
        ).first()
    
    def list_by_content(
        self,
        content_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> List[ContentModerationReview]:
        return self.db.query(ContentModerationReview).filter(
            ContentModerationReview.content_id == content_id
        ).order_by(desc(ContentModerationReview.reviewed_at)).offset(skip).limit(limit).all()
    
    def get_moderation_queue(
        self,
        institution_id: int,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: int = 20
    ) -> List[StudentContent]:
        query = self.db.query(StudentContent).filter(
            StudentContent.institution_id == institution_id,
            StudentContent.status == ContentStatus.PENDING_REVIEW
        )
        
        if filters.get('moderation_status'):
            query = query.filter(StudentContent.moderation_status == filters['moderation_status'])
        
        if filters.get('content_type'):
            query = query.filter(StudentContent.content_type == filters['content_type'])
        
        if filters.get('subject'):
            query = query.filter(StudentContent.subject == filters['subject'])
        
        if filters.get('plagiarism_status'):
            query = query.filter(StudentContent.plagiarism_status == filters['plagiarism_status'])
        
        sort_by = filters.get('sort_by', 'created_at')
        sort_order = filters.get('sort_order', 'asc')
        
        order_column = getattr(StudentContent, sort_by)
        if sort_order == 'desc':
            query = query.order_by(desc(order_column))
        else:
            query = query.order_by(asc(order_column))
        
        return query.offset(skip).limit(limit).all()


class ContentPlagiarismRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, check_data: Dict[str, Any]) -> ContentPlagiarismCheck:
        check = ContentPlagiarismCheck(**check_data)
        self.db.add(check)
        self.db.commit()
        self.db.refresh(check)
        return check
    
    def get_by_id(self, check_id: int) -> Optional[ContentPlagiarismCheck]:
        return self.db.query(ContentPlagiarismCheck).filter(
            ContentPlagiarismCheck.id == check_id
        ).first()
    
    def get_latest_by_content(self, content_id: int) -> Optional[ContentPlagiarismCheck]:
        return self.db.query(ContentPlagiarismCheck).filter(
            ContentPlagiarismCheck.content_id == content_id
        ).order_by(desc(ContentPlagiarismCheck.checked_at)).first()
    
    def list_by_content(
        self,
        content_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> List[ContentPlagiarismCheck]:
        return self.db.query(ContentPlagiarismCheck).filter(
            ContentPlagiarismCheck.content_id == content_id
        ).order_by(desc(ContentPlagiarismCheck.checked_at)).offset(skip).limit(limit).all()


class StudentCreditsRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_or_create_balance(
        self,
        institution_id: int,
        student_id: int
    ) -> StudentCreditsBalance:
        balance = self.db.query(StudentCreditsBalance).filter(
            StudentCreditsBalance.institution_id == institution_id,
            StudentCreditsBalance.student_id == student_id
        ).first()
        
        if not balance:
            balance = StudentCreditsBalance(
                institution_id=institution_id,
                student_id=student_id
            )
            self.db.add(balance)
            self.db.commit()
            self.db.refresh(balance)
        
        return balance
    
    def add_transaction(
        self,
        student_balance_id: int,
        transaction_data: Dict[str, Any]
    ) -> CreditTransaction:
        transaction = CreditTransaction(
            student_balance_id=student_balance_id,
            **transaction_data
        )
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction
    
    def update_balance(
        self,
        balance_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[StudentCreditsBalance]:
        balance = self.db.query(StudentCreditsBalance).filter(
            StudentCreditsBalance.id == balance_id
        ).first()
        
        if balance:
            for key, value in update_data.items():
                setattr(balance, key, value)
            balance.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(balance)
        
        return balance
    
    def list_transactions(
        self,
        student_balance_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[CreditTransaction]:
        return self.db.query(CreditTransaction).filter(
            CreditTransaction.student_balance_id == student_balance_id
        ).order_by(desc(CreditTransaction.created_at)).offset(skip).limit(limit).all()
