from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, Float, JSON, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from src.database import Base


class ContentType(str, PyEnum):
    STUDY_GUIDE = "study_guide"
    FLASHCARD_DECK = "flashcard_deck"
    SUMMARY_NOTES = "summary_notes"
    PRACTICE_QUIZ = "practice_quiz"
    VIDEO_TUTORIAL = "video_tutorial"
    CHEAT_SHEET = "cheat_sheet"


class ContentStatus(str, PyEnum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED = "flagged"
    ARCHIVED = "archived"


class ModerationStatus(str, PyEnum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REVISION = "needs_revision"


class PlagiarismStatus(str, PyEnum):
    NOT_CHECKED = "not_checked"
    CHECKING = "checking"
    PASSED = "passed"
    FAILED = "failed"
    UNDER_REVIEW = "under_review"


class StudentContent(Base):
    __tablename__ = "student_contents"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    creator_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    content_type = Column(Enum(ContentType), nullable=False, index=True)
    subject = Column(String(100), nullable=False, index=True)
    topic = Column(String(200), nullable=False, index=True)
    grade_level = Column(String(50), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    preview_content = Column(Text, nullable=True)
    full_content_url = Column(String(500), nullable=True)
    s3_key = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    price_credits = Column(Integer, default=0, nullable=False, index=True)
    sales_count = Column(Integer, default=0, nullable=False)
    revenue_earned = Column(Integer, default=0, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    downloads_count = Column(Integer, default=0, nullable=False)
    
    rating = Column(Float, default=0.0, nullable=False, index=True)
    rating_count = Column(Integer, default=0, nullable=False)
    reviews_count = Column(Integer, default=0, nullable=False)
    
    status = Column(Enum(ContentStatus), default=ContentStatus.DRAFT, nullable=False, index=True)
    moderation_status = Column(Enum(ModerationStatus), default=ModerationStatus.PENDING, nullable=False, index=True)
    plagiarism_status = Column(Enum(PlagiarismStatus), default=PlagiarismStatus.NOT_CHECKED, nullable=False, index=True)
    plagiarism_score = Column(Float, nullable=True)
    
    metadata_json = Column('metadata', JSON, nullable=True)
    tags = Column(JSON, nullable=True)
    
    is_featured = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)
    
    institution = relationship("Institution")
    creator = relationship("Student", foreign_keys=[creator_student_id], back_populates="created_contents")
    reviews = relationship("ContentReview", back_populates="content", cascade="all, delete-orphan")
    purchases = relationship("ContentPurchase", back_populates="content", cascade="all, delete-orphan")
    moderation_reviews = relationship("ContentModerationReview", back_populates="content", cascade="all, delete-orphan")
    plagiarism_checks = relationship("ContentPlagiarismCheck", back_populates="content", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_student_content_institution', 'institution_id'),
        Index('idx_student_content_creator', 'creator_student_id'),
        Index('idx_student_content_type', 'content_type'),
        Index('idx_student_content_subject', 'subject'),
        Index('idx_student_content_grade', 'grade_level'),
        Index('idx_student_content_status', 'status'),
        Index('idx_student_content_moderation', 'moderation_status'),
        Index('idx_student_content_plagiarism', 'plagiarism_status'),
        Index('idx_student_content_rating', 'rating'),
        Index('idx_student_content_price', 'price_credits'),
        Index('idx_student_content_featured', 'is_featured'),
        Index('idx_student_content_search', 'subject', 'topic', 'grade_level'),
    )


class ContentReview(Base):
    __tablename__ = "content_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey('student_contents.id', ondelete='CASCADE'), nullable=False, index=True)
    reviewer_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    rating = Column(Integer, nullable=False)
    review_text = Column(Text, nullable=True)
    is_helpful = Column(Boolean, default=True, nullable=False)
    helpful_count = Column(Integer, default=0, nullable=False)
    
    is_verified_purchase = Column(Boolean, default=False, nullable=False)
    is_flagged = Column(Boolean, default=False, nullable=False)
    flag_reason = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    content = relationship("StudentContent", back_populates="reviews")
    reviewer = relationship("Student", foreign_keys=[reviewer_student_id], back_populates="content_reviews")
    
    __table_args__ = (
        UniqueConstraint('content_id', 'reviewer_student_id', name='uq_content_reviewer'),
        Index('idx_content_review_institution', 'institution_id'),
        Index('idx_content_review_content', 'content_id'),
        Index('idx_content_review_reviewer', 'reviewer_student_id'),
        Index('idx_content_review_rating', 'rating'),
        Index('idx_content_review_flagged', 'is_flagged'),
    )


class ContentPurchase(Base):
    __tablename__ = "content_purchases"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey('student_contents.id', ondelete='CASCADE'), nullable=False, index=True)
    buyer_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    credits_paid = Column(Integer, nullable=False)
    transaction_id = Column(String(100), nullable=True, unique=True)
    
    is_refunded = Column(Boolean, default=False, nullable=False)
    refund_reason = Column(Text, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    content = relationship("StudentContent", back_populates="purchases")
    buyer = relationship("Student", foreign_keys=[buyer_student_id], back_populates="content_purchases")
    
    __table_args__ = (
        UniqueConstraint('content_id', 'buyer_student_id', name='uq_content_buyer'),
        Index('idx_content_purchase_institution', 'institution_id'),
        Index('idx_content_purchase_content', 'content_id'),
        Index('idx_content_purchase_buyer', 'buyer_student_id'),
        Index('idx_content_purchase_created', 'created_at'),
        Index('idx_content_purchase_refunded', 'is_refunded'),
    )


class ContentModerationReview(Base):
    __tablename__ = "content_moderation_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey('student_contents.id', ondelete='CASCADE'), nullable=False, index=True)
    reviewer_teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    
    moderation_status = Column(Enum(ModerationStatus), nullable=False)
    quality_score = Column(Integer, nullable=True)
    accuracy_score = Column(Integer, nullable=True)
    
    feedback = Column(Text, nullable=True)
    revision_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    quality_checks = Column(JSON, nullable=True)
    
    reviewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    content = relationship("StudentContent", back_populates="moderation_reviews")
    reviewer = relationship("Teacher", foreign_keys=[reviewer_teacher_id])
    
    __table_args__ = (
        Index('idx_moderation_review_institution', 'institution_id'),
        Index('idx_moderation_review_content', 'content_id'),
        Index('idx_moderation_review_reviewer', 'reviewer_teacher_id'),
        Index('idx_moderation_review_status', 'moderation_status'),
        Index('idx_moderation_review_reviewed', 'reviewed_at'),
    )


class ContentPlagiarismCheck(Base):
    __tablename__ = "content_plagiarism_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey('student_contents.id', ondelete='CASCADE'), nullable=False, index=True)
    
    plagiarism_status = Column(Enum(PlagiarismStatus), nullable=False)
    similarity_score = Column(Float, nullable=True)
    
    sources_found = Column(Integer, default=0, nullable=False)
    matched_contents = Column(JSON, nullable=True)
    external_sources = Column(JSON, nullable=True)
    
    check_details = Column(JSON, nullable=True)
    
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    content = relationship("StudentContent", back_populates="plagiarism_checks")
    
    __table_args__ = (
        Index('idx_content_plagiarism_institution', 'institution_id'),
        Index('idx_content_plagiarism_content', 'content_id'),
        Index('idx_content_plagiarism_status', 'plagiarism_status'),
        Index('idx_content_plagiarism_score', 'similarity_score'),
        Index('idx_content_plagiarism_checked', 'checked_at'),
    )


class StudentCreditsBalance(Base):
    __tablename__ = "student_credits_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    total_credits = Column(Integer, default=0, nullable=False)
    earned_credits = Column(Integer, default=0, nullable=False)
    purchased_credits = Column(Integer, default=0, nullable=False)
    spent_credits = Column(Integer, default=0, nullable=False)
    
    total_earnings = Column(Integer, default=0, nullable=False)
    pending_earnings = Column(Integer, default=0, nullable=False)
    withdrawn_earnings = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student", back_populates="credits_balance", uselist=False)
    transactions = relationship("CreditTransaction", back_populates="student_balance", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'student_id', name='uq_student_credits_balance'),
        Index('idx_student_credits_institution', 'institution_id'),
        Index('idx_student_credits_student', 'student_id'),
    )


class TransactionType(str, PyEnum):
    EARN_SALE = "earn_sale"
    SPEND_PURCHASE = "spend_purchase"
    ADMIN_CREDIT = "admin_credit"
    ADMIN_DEBIT = "admin_debit"
    REFUND = "refund"
    WITHDRAWAL = "withdrawal"
    BONUS = "bonus"


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_balance_id = Column(Integer, ForeignKey('student_credits_balances.id', ondelete='CASCADE'), nullable=False, index=True)
    
    transaction_type = Column(Enum(TransactionType), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    
    description = Column(String(255), nullable=True)
    reference_type = Column(String(50), nullable=True)
    reference_id = Column(Integer, nullable=True)
    
    metadata_json = Column('metadata', JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student_balance = relationship("StudentCreditsBalance", back_populates="transactions")
    
    __table_args__ = (
        Index('idx_credit_transaction_institution', 'institution_id'),
        Index('idx_credit_transaction_balance', 'student_balance_id'),
        Index('idx_credit_transaction_type', 'transaction_type'),
        Index('idx_credit_transaction_reference', 'reference_type', 'reference_id'),
        Index('idx_credit_transaction_created', 'created_at'),
    )
