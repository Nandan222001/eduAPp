from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class StudyPlanStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    RESCHEDULED = "rescheduled"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class StudyPlan(Base):
    __tablename__ = "study_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_exam_id = Column(Integer, ForeignKey('exams.id', ondelete='SET NULL'), nullable=True, index=True)
    target_exam_date = Column(Date, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(SQLEnum(StudyPlanStatus), default=StudyPlanStatus.DRAFT, nullable=False, index=True)
    total_study_hours = Column(Numeric(10, 2), nullable=True)
    hours_per_day = Column(Numeric(5, 2), nullable=True)
    calendar_sync_enabled = Column(Boolean, default=False, nullable=False)
    calendar_sync_url = Column(String(500), nullable=True)
    adaptive_rescheduling_enabled = Column(Boolean, default=True, nullable=False)
    last_rescheduled_at = Column(DateTime, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student", back_populates="study_plans")
    target_exam = relationship("Exam")
    daily_tasks = relationship("DailyStudyTask", back_populates="study_plan", cascade="all, delete-orphan")
    topic_assignments = relationship("TopicAssignment", back_populates="study_plan", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_study_plan_institution', 'institution_id'),
        Index('idx_study_plan_student', 'student_id'),
        Index('idx_study_plan_status', 'status'),
        Index('idx_study_plan_target_exam', 'target_exam_id'),
        Index('idx_study_plan_dates', 'start_date', 'end_date'),
    )


class WeakArea(Base):
    __tablename__ = "weak_areas"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='SET NULL'), nullable=True, index=True)
    weakness_score = Column(Numeric(5, 2), nullable=False)
    average_score = Column(Numeric(5, 2), nullable=True)
    attempts_count = Column(Integer, default=0, nullable=False)
    last_attempted_at = Column(DateTime, nullable=True)
    identified_from = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student", back_populates="weak_areas")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    topic = relationship("Topic")
    
    __table_args__ = (
        Index('idx_weak_area_institution', 'institution_id'),
        Index('idx_weak_area_student', 'student_id'),
        Index('idx_weak_area_subject', 'subject_id'),
        Index('idx_weak_area_chapter', 'chapter_id'),
        Index('idx_weak_area_topic', 'topic_id'),
        Index('idx_weak_area_resolved', 'is_resolved'),
        Index('idx_weak_area_weakness_score', 'weakness_score'),
    )


class DailyStudyTask(Base):
    __tablename__ = "daily_study_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    study_plan_id = Column(Integer, ForeignKey('study_plans.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    task_date = Column(Date, nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='SET NULL'), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False, index=True)
    priority_score = Column(Numeric(10, 4), nullable=True)
    estimated_duration_minutes = Column(Integer, nullable=False)
    actual_duration_minutes = Column(Integer, nullable=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, nullable=False, index=True)
    completion_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    skipped_reason = Column(Text, nullable=True)
    rescheduled_from_date = Column(Date, nullable=True)
    rescheduled_to_date = Column(Date, nullable=True)
    rescheduled_reason = Column(Text, nullable=True)
    calendar_event_id = Column(String(200), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    study_plan = relationship("StudyPlan", back_populates="daily_tasks")
    student = relationship("Student")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    topic = relationship("Topic")
    
    __table_args__ = (
        Index('idx_daily_task_institution', 'institution_id'),
        Index('idx_daily_task_study_plan', 'study_plan_id'),
        Index('idx_daily_task_student', 'student_id'),
        Index('idx_daily_task_date', 'task_date'),
        Index('idx_daily_task_subject', 'subject_id'),
        Index('idx_daily_task_status', 'status'),
        Index('idx_daily_task_priority', 'priority'),
        Index('idx_daily_task_student_date', 'student_id', 'task_date'),
    )


class TopicAssignment(Base):
    __tablename__ = "topic_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    study_plan_id = Column(Integer, ForeignKey('study_plans.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='SET NULL'), nullable=True, index=True)
    priority_score = Column(Numeric(10, 4), nullable=False)
    importance_probability = Column(Numeric(5, 4), nullable=True)
    weakness_score = Column(Numeric(5, 2), nullable=True)
    subject_weightage = Column(Numeric(5, 2), nullable=True)
    allocated_hours = Column(Numeric(5, 2), nullable=False)
    completed_hours = Column(Numeric(5, 2), default=0, nullable=False)
    target_completion_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    study_plan = relationship("StudyPlan", back_populates="topic_assignments")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    topic = relationship("Topic")
    
    __table_args__ = (
        UniqueConstraint('study_plan_id', 'topic_id', name='uq_study_plan_topic'),
        Index('idx_topic_assignment_institution', 'institution_id'),
        Index('idx_topic_assignment_study_plan', 'study_plan_id'),
        Index('idx_topic_assignment_subject', 'subject_id'),
        Index('idx_topic_assignment_priority', 'priority_score'),
        Index('idx_topic_assignment_completed', 'is_completed'),
    )


class StudyProgress(Base):
    __tablename__ = "study_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    study_plan_id = Column(Integer, ForeignKey('study_plans.id', ondelete='CASCADE'), nullable=False, index=True)
    progress_date = Column(Date, nullable=False, index=True)
    total_tasks = Column(Integer, nullable=False)
    completed_tasks = Column(Integer, nullable=False)
    skipped_tasks = Column(Integer, nullable=False)
    total_study_hours = Column(Numeric(5, 2), nullable=False)
    actual_study_hours = Column(Numeric(5, 2), nullable=False)
    completion_rate = Column(Numeric(5, 2), nullable=False)
    adherence_score = Column(Numeric(5, 2), nullable=True)
    productivity_score = Column(Numeric(5, 2), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    study_plan = relationship("StudyPlan")
    
    __table_args__ = (
        UniqueConstraint('study_plan_id', 'progress_date', name='uq_study_plan_progress_date'),
        Index('idx_study_progress_institution', 'institution_id'),
        Index('idx_study_progress_student', 'student_id'),
        Index('idx_study_progress_study_plan', 'study_plan_id'),
        Index('idx_study_progress_date', 'progress_date'),
    )


class ChapterPerformance(Base):
    __tablename__ = "chapter_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='CASCADE'), nullable=False, index=True)
    average_score = Column(Numeric(5, 2), nullable=False)
    total_attempts = Column(Integer, default=0, nullable=False)
    successful_attempts = Column(Integer, default=0, nullable=False)
    failed_attempts = Column(Integer, default=0, nullable=False)
    success_rate = Column(Numeric(5, 2), nullable=False)
    time_spent_minutes = Column(Integer, default=0, nullable=False)
    last_practiced_at = Column(DateTime, nullable=True)
    proficiency_level = Column(String(50), nullable=True)
    trend = Column(String(50), nullable=True)
    improvement_rate = Column(Numeric(5, 2), nullable=True)
    difficulty_rating = Column(Numeric(5, 2), nullable=True)
    mastery_score = Column(Numeric(5, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    
    __table_args__ = (
        UniqueConstraint('student_id', 'chapter_id', name='uq_student_chapter_performance'),
        Index('idx_chapter_perf_institution', 'institution_id'),
        Index('idx_chapter_perf_student', 'student_id'),
        Index('idx_chapter_perf_subject', 'subject_id'),
        Index('idx_chapter_perf_chapter', 'chapter_id'),
        Index('idx_chapter_perf_mastery', 'mastery_score'),
        Index('idx_chapter_perf_proficiency', 'proficiency_level'),
    )


class QuestionRecommendation(Base):
    __tablename__ = "question_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey('questions_bank.id', ondelete='CASCADE'), nullable=False, index=True)
    recommendation_score = Column(Numeric(10, 4), nullable=False)
    relevance_score = Column(Numeric(5, 2), nullable=False)
    difficulty_match_score = Column(Numeric(5, 2), nullable=False)
    weakness_alignment_score = Column(Numeric(5, 2), nullable=False)
    spaced_repetition_score = Column(Numeric(5, 2), nullable=False)
    priority_rank = Column(Integer, nullable=True)
    next_review_date = Column(Date, nullable=True, index=True)
    repetition_number = Column(Integer, default=0, nullable=False)
    ease_factor = Column(Numeric(3, 2), default=2.5, nullable=False)
    interval_days = Column(Integer, default=0, nullable=False)
    last_reviewed_at = Column(DateTime, nullable=True)
    last_performance = Column(Numeric(5, 2), nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    question = relationship("QuestionBank")
    
    __table_args__ = (
        Index('idx_question_rec_institution', 'institution_id'),
        Index('idx_question_rec_student', 'student_id'),
        Index('idx_question_rec_question', 'question_id'),
        Index('idx_question_rec_score', 'recommendation_score'),
        Index('idx_question_rec_rank', 'priority_rank'),
        Index('idx_question_rec_review_date', 'next_review_date'),
        Index('idx_question_rec_completed', 'is_completed'),
    )


class FocusArea(Base):
    __tablename__ = "focus_areas"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='SET NULL'), nullable=True, index=True)
    focus_type = Column(String(50), nullable=False, index=True)
    urgency_score = Column(Numeric(5, 2), nullable=False)
    importance_score = Column(Numeric(5, 2), nullable=False)
    impact_score = Column(Numeric(5, 2), nullable=False)
    combined_priority = Column(Numeric(10, 4), nullable=False)
    current_performance = Column(Numeric(5, 2), nullable=True)
    target_performance = Column(Numeric(5, 2), nullable=True)
    performance_gap = Column(Numeric(5, 2), nullable=True)
    recommended_hours = Column(Numeric(5, 2), nullable=False)
    estimated_improvement = Column(Numeric(5, 2), nullable=True)
    confidence_level = Column(String(50), nullable=True)
    reasoning = Column(Text, nullable=True)
    ai_insights = Column(JSON, nullable=True)
    status = Column(String(50), default='active', nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    topic = relationship("Topic")
    
    __table_args__ = (
        Index('idx_focus_area_institution', 'institution_id'),
        Index('idx_focus_area_student', 'student_id'),
        Index('idx_focus_area_subject', 'subject_id'),
        Index('idx_focus_area_chapter', 'chapter_id'),
        Index('idx_focus_area_type', 'focus_type'),
        Index('idx_focus_area_priority', 'combined_priority'),
        Index('idx_focus_area_status', 'status'),
    )


class PersonalizedInsight(Base):
    __tablename__ = "personalized_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    insight_type = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False, index=True)
    priority = Column(Integer, nullable=False, index=True)
    is_actionable = Column(Boolean, default=True, nullable=False)
    actionable_items = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    supporting_data = Column(JSON, nullable=True)
    affected_subjects = Column(JSON, nullable=True)
    affected_chapters = Column(JSON, nullable=True)
    ai_generated = Column(Boolean, default=False, nullable=False)
    confidence_score = Column(Numeric(5, 2), nullable=True)
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
    is_resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_insight_institution', 'institution_id'),
        Index('idx_insight_student', 'student_id'),
        Index('idx_insight_type', 'insight_type'),
        Index('idx_insight_category', 'category'),
        Index('idx_insight_severity', 'severity'),
        Index('idx_insight_priority', 'priority'),
        Index('idx_insight_resolved', 'is_resolved'),
    )
