from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class ExamType(str, Enum):
    UNIT = "unit"
    MID_TERM = "mid_term"
    FINAL = "final"
    MOCK = "mock"


class ExamStatus(str, Enum):
    SCHEDULED = "scheduled"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class GradeScale(str, Enum):
    A_PLUS = "A+"
    A = "A"
    B_PLUS = "B+"
    B = "B"
    C_PLUS = "C+"
    C = "C"
    D = "D"
    F = "F"


class Exam(Base):
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    exam_type = Column(SQLEnum(ExamType), nullable=False, index=True)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(SQLEnum(ExamStatus), default=ExamStatus.SCHEDULED, nullable=False, index=True)
    total_marks = Column(Numeric(10, 2), nullable=True)
    passing_marks = Column(Numeric(10, 2), nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="exams")
    academic_year = relationship("AcademicYear")
    grade = relationship("Grade")
    exam_subjects = relationship("ExamSubject", back_populates="exam", cascade="all, delete-orphan")
    exam_schedules = relationship("ExamSchedule", back_populates="exam", cascade="all, delete-orphan")
    exam_results = relationship("ExamResult", back_populates="exam", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'academic_year_id', 'grade_id', 'name', name='uq_institution_year_grade_exam_name'),
        Index('idx_exam_institution', 'institution_id'),
        Index('idx_exam_academic_year', 'academic_year_id'),
        Index('idx_exam_grade', 'grade_id'),
        Index('idx_exam_type', 'exam_type'),
        Index('idx_exam_status', 'status'),
        Index('idx_exam_dates', 'start_date', 'end_date'),
    )


class ExamSubject(Base):
    __tablename__ = "exam_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    exam_id = Column(Integer, ForeignKey('exams.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    theory_max_marks = Column(Numeric(10, 2), nullable=False, default=0)
    practical_max_marks = Column(Numeric(10, 2), nullable=False, default=0)
    theory_passing_marks = Column(Numeric(10, 2), nullable=True)
    practical_passing_marks = Column(Numeric(10, 2), nullable=True)
    weightage = Column(Numeric(5, 2), nullable=True)
    question_paper_path = Column(String(500), nullable=True)
    question_paper_uploaded_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    exam = relationship("Exam", back_populates="exam_subjects")
    subject = relationship("Subject")
    exam_marks = relationship("ExamMarks", back_populates="exam_subject", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('exam_id', 'subject_id', name='uq_exam_subject'),
        Index('idx_exam_subject_institution', 'institution_id'),
        Index('idx_exam_subject_exam', 'exam_id'),
        Index('idx_exam_subject_subject', 'subject_id'),
    )


class ExamSchedule(Base):
    __tablename__ = "exam_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    exam_id = Column(Integer, ForeignKey('exams.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey('sections.id', ondelete='CASCADE'), nullable=True, index=True)
    exam_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room_number = Column(String(100), nullable=True)
    invigilator_id = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    exam = relationship("Exam", back_populates="exam_schedules")
    subject = relationship("Subject")
    section = relationship("Section")
    invigilator = relationship("Teacher")
    
    __table_args__ = (
        Index('idx_exam_schedule_institution', 'institution_id'),
        Index('idx_exam_schedule_exam', 'exam_id'),
        Index('idx_exam_schedule_subject', 'subject_id'),
        Index('idx_exam_schedule_section', 'section_id'),
        Index('idx_exam_schedule_date_time', 'exam_date', 'start_time', 'end_time'),
        Index('idx_exam_schedule_invigilator', 'invigilator_id'),
    )


class ExamMarks(Base):
    __tablename__ = "exam_marks"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    exam_subject_id = Column(Integer, ForeignKey('exam_subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    theory_marks_obtained = Column(Numeric(10, 2), nullable=True)
    practical_marks_obtained = Column(Numeric(10, 2), nullable=True)
    is_absent = Column(Boolean, default=False, nullable=False)
    remarks = Column(Text, nullable=True)
    entered_by = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    entered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    exam_subject = relationship("ExamSubject", back_populates="exam_marks")
    student = relationship("Student")
    teacher = relationship("Teacher")
    
    __table_args__ = (
        UniqueConstraint('exam_subject_id', 'student_id', name='uq_exam_subject_student_marks'),
        Index('idx_exam_marks_institution', 'institution_id'),
        Index('idx_exam_marks_exam_subject', 'exam_subject_id'),
        Index('idx_exam_marks_student', 'student_id'),
        Index('idx_exam_marks_entered_by', 'entered_by'),
    )


class ExamResult(Base):
    __tablename__ = "exam_results"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    exam_id = Column(Integer, ForeignKey('exams.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey('sections.id', ondelete='CASCADE'), nullable=True, index=True)
    total_marks_obtained = Column(Numeric(10, 2), nullable=False)
    total_max_marks = Column(Numeric(10, 2), nullable=False)
    percentage = Column(Numeric(5, 2), nullable=False)
    grade = Column(String(10), nullable=True)
    grade_point = Column(Numeric(3, 2), nullable=True)
    is_pass = Column(Boolean, nullable=False)
    rank_in_section = Column(Integer, nullable=True)
    rank_in_grade = Column(Integer, nullable=True)
    subjects_passed = Column(Integer, nullable=False, default=0)
    subjects_failed = Column(Integer, nullable=False, default=0)
    remarks = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    exam = relationship("Exam", back_populates="exam_results")
    student = relationship("Student")
    section = relationship("Section")
    
    __table_args__ = (
        UniqueConstraint('exam_id', 'student_id', name='uq_exam_student_result'),
        Index('idx_exam_result_institution', 'institution_id'),
        Index('idx_exam_result_exam', 'exam_id'),
        Index('idx_exam_result_student', 'student_id'),
        Index('idx_exam_result_section', 'section_id'),
        Index('idx_exam_result_percentage', 'percentage'),
        Index('idx_exam_result_rank_section', 'section_id', 'rank_in_section'),
        Index('idx_exam_result_rank_grade', 'rank_in_grade'),
    )


class GradeConfiguration(Base):
    __tablename__ = "grade_configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    grade = Column(String(10), nullable=False)
    min_percentage = Column(Numeric(5, 2), nullable=False)
    max_percentage = Column(Numeric(5, 2), nullable=False)
    grade_point = Column(Numeric(3, 2), nullable=False)
    description = Column(Text, nullable=True)
    is_passing = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    
    __table_args__ = (
        Index('idx_grade_config_institution', 'institution_id'),
        Index('idx_grade_config_percentage', 'min_percentage', 'max_percentage'),
        Index('idx_grade_config_active', 'is_active'),
    )


class ExamPerformanceAnalytics(Base):
    __tablename__ = "exam_performance_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    exam_id = Column(Integer, ForeignKey('exams.id', ondelete='CASCADE'), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey('sections.id', ondelete='CASCADE'), nullable=True, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=True, index=True)
    total_students = Column(Integer, nullable=False)
    students_appeared = Column(Integer, nullable=False)
    students_passed = Column(Integer, nullable=False)
    students_failed = Column(Integer, nullable=False)
    pass_percentage = Column(Numeric(5, 2), nullable=False)
    average_marks = Column(Numeric(10, 2), nullable=False)
    highest_marks = Column(Numeric(10, 2), nullable=False)
    lowest_marks = Column(Numeric(10, 2), nullable=False)
    median_marks = Column(Numeric(10, 2), nullable=True)
    standard_deviation = Column(Numeric(10, 2), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    exam = relationship("Exam")
    section = relationship("Section")
    subject = relationship("Subject")
    
    __table_args__ = (
        Index('idx_exam_analytics_institution', 'institution_id'),
        Index('idx_exam_analytics_exam', 'exam_id'),
        Index('idx_exam_analytics_section', 'section_id'),
        Index('idx_exam_analytics_subject', 'subject_id'),
    )
