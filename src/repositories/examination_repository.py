from typing import List, Optional, Dict, Any
from datetime import date, time
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from src.models.examination import (
    Exam, ExamSubject, ExamSchedule, ExamMarks, ExamResult, 
    GradeConfiguration, ExamPerformanceAnalytics, ExamType, ExamStatus
)
from src.models.student import Student
from src.models.academic import Section, Subject, Grade
from src.schemas.examination import (
    ExamCreate, ExamUpdate, ExamSubjectCreate, ExamSubjectUpdate,
    ExamScheduleCreate, ExamScheduleUpdate, ExamMarksCreate, ExamMarksUpdate,
    GradeConfigurationCreate, GradeConfigurationUpdate
)


class ExamRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_exam(self, exam_data: ExamCreate) -> Exam:
        exam = Exam(**exam_data.model_dump())
        self.db.add(exam)
        self.db.commit()
        self.db.refresh(exam)
        return exam
    
    def get_exam_by_id(self, exam_id: int, institution_id: int) -> Optional[Exam]:
        return self.db.query(Exam).filter(
            Exam.id == exam_id,
            Exam.institution_id == institution_id
        ).first()
    
    def get_exam_with_details(self, exam_id: int, institution_id: int) -> Optional[Exam]:
        return self.db.query(Exam).filter(
            Exam.id == exam_id,
            Exam.institution_id == institution_id
        ).options(
            joinedload(Exam.exam_subjects).joinedload(ExamSubject.subject),
            joinedload(Exam.exam_schedules).joinedload(ExamSchedule.subject)
        ).first()
    
    def list_exams(
        self,
        institution_id: int,
        academic_year_id: Optional[int] = None,
        grade_id: Optional[int] = None,
        exam_type: Optional[ExamType] = None,
        status: Optional[ExamStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Exam]:
        query = self.db.query(Exam).filter(Exam.institution_id == institution_id)
        
        if academic_year_id:
            query = query.filter(Exam.academic_year_id == academic_year_id)
        if grade_id:
            query = query.filter(Exam.grade_id == grade_id)
        if exam_type:
            query = query.filter(Exam.exam_type == exam_type)
        if status:
            query = query.filter(Exam.status == status)
        
        return query.order_by(desc(Exam.start_date)).offset(skip).limit(limit).all()
    
    def update_exam(self, exam_id: int, institution_id: int, exam_data: ExamUpdate) -> Optional[Exam]:
        exam = self.get_exam_by_id(exam_id, institution_id)
        if not exam:
            return None
        
        update_data = exam_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(exam, field, value)
        
        self.db.commit()
        self.db.refresh(exam)
        return exam
    
    def delete_exam(self, exam_id: int, institution_id: int) -> bool:
        exam = self.get_exam_by_id(exam_id, institution_id)
        if not exam:
            return False
        
        self.db.delete(exam)
        self.db.commit()
        return True


class ExamSubjectRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_exam_subject(self, exam_subject_data: ExamSubjectCreate) -> ExamSubject:
        exam_subject = ExamSubject(**exam_subject_data.model_dump())
        self.db.add(exam_subject)
        self.db.commit()
        self.db.refresh(exam_subject)
        return exam_subject
    
    def get_exam_subject_by_id(self, exam_subject_id: int, institution_id: int) -> Optional[ExamSubject]:
        return self.db.query(ExamSubject).filter(
            ExamSubject.id == exam_subject_id,
            ExamSubject.institution_id == institution_id
        ).first()
    
    def get_exam_subjects_by_exam(self, exam_id: int, institution_id: int) -> List[ExamSubject]:
        return self.db.query(ExamSubject).filter(
            ExamSubject.exam_id == exam_id,
            ExamSubject.institution_id == institution_id
        ).options(joinedload(ExamSubject.subject)).all()
    
    def update_exam_subject(
        self, 
        exam_subject_id: int, 
        institution_id: int, 
        exam_subject_data: ExamSubjectUpdate
    ) -> Optional[ExamSubject]:
        exam_subject = self.get_exam_subject_by_id(exam_subject_id, institution_id)
        if not exam_subject:
            return None
        
        update_data = exam_subject_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(exam_subject, field, value)
        
        self.db.commit()
        self.db.refresh(exam_subject)
        return exam_subject
    
    def delete_exam_subject(self, exam_subject_id: int, institution_id: int) -> bool:
        exam_subject = self.get_exam_subject_by_id(exam_subject_id, institution_id)
        if not exam_subject:
            return False
        
        self.db.delete(exam_subject)
        self.db.commit()
        return True


class ExamScheduleRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_exam_schedule(self, schedule_data: ExamScheduleCreate) -> ExamSchedule:
        schedule = ExamSchedule(**schedule_data.model_dump())
        self.db.add(schedule)
        self.db.commit()
        self.db.refresh(schedule)
        return schedule
    
    def get_exam_schedule_by_id(self, schedule_id: int, institution_id: int) -> Optional[ExamSchedule]:
        return self.db.query(ExamSchedule).filter(
            ExamSchedule.id == schedule_id,
            ExamSchedule.institution_id == institution_id
        ).first()
    
    def get_exam_schedules_by_exam(self, exam_id: int, institution_id: int) -> List[ExamSchedule]:
        return self.db.query(ExamSchedule).filter(
            ExamSchedule.exam_id == exam_id,
            ExamSchedule.institution_id == institution_id
        ).options(
            joinedload(ExamSchedule.subject),
            joinedload(ExamSchedule.section)
        ).order_by(ExamSchedule.exam_date, ExamSchedule.start_time).all()
    
    def get_schedules_by_date_range(
        self, 
        institution_id: int,
        start_date: date,
        end_date: date,
        section_id: Optional[int] = None
    ) -> List[ExamSchedule]:
        query = self.db.query(ExamSchedule).filter(
            ExamSchedule.institution_id == institution_id,
            ExamSchedule.exam_date >= start_date,
            ExamSchedule.exam_date <= end_date
        )
        
        if section_id:
            query = query.filter(ExamSchedule.section_id == section_id)
        
        return query.options(
            joinedload(ExamSchedule.subject),
            joinedload(ExamSchedule.section)
        ).order_by(ExamSchedule.exam_date, ExamSchedule.start_time).all()
    
    def update_exam_schedule(
        self,
        schedule_id: int,
        institution_id: int,
        schedule_data: ExamScheduleUpdate
    ) -> Optional[ExamSchedule]:
        schedule = self.get_exam_schedule_by_id(schedule_id, institution_id)
        if not schedule:
            return None
        
        update_data = schedule_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(schedule, field, value)
        
        self.db.commit()
        self.db.refresh(schedule)
        return schedule
    
    def delete_exam_schedule(self, schedule_id: int, institution_id: int) -> bool:
        schedule = self.get_exam_schedule_by_id(schedule_id, institution_id)
        if not schedule:
            return False
        
        self.db.delete(schedule)
        self.db.commit()
        return True
    
    def check_timetable_conflicts(
        self,
        institution_id: int,
        exam_date: date,
        start_time: time,
        end_time: time,
        section_id: Optional[int] = None,
        invigilator_id: Optional[int] = None,
        exclude_schedule_id: Optional[int] = None
    ) -> List[ExamSchedule]:
        query = self.db.query(ExamSchedule).filter(
            ExamSchedule.institution_id == institution_id,
            ExamSchedule.exam_date == exam_date
        )
        
        if exclude_schedule_id:
            query = query.filter(ExamSchedule.id != exclude_schedule_id)
        
        query = query.filter(
            or_(
                and_(
                    ExamSchedule.start_time <= start_time,
                    ExamSchedule.end_time > start_time
                ),
                and_(
                    ExamSchedule.start_time < end_time,
                    ExamSchedule.end_time >= end_time
                ),
                and_(
                    ExamSchedule.start_time >= start_time,
                    ExamSchedule.end_time <= end_time
                )
            )
        )
        
        conflicts = []
        if section_id:
            section_conflicts = query.filter(ExamSchedule.section_id == section_id).all()
            conflicts.extend(section_conflicts)
        
        if invigilator_id:
            invigilator_conflicts = query.filter(ExamSchedule.invigilator_id == invigilator_id).all()
            conflicts.extend(invigilator_conflicts)
        
        return list(set(conflicts))


class ExamMarksRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_exam_marks(self, marks_data: ExamMarksCreate, entered_by: int) -> ExamMarks:
        marks = ExamMarks(**marks_data.model_dump())
        marks.entered_by = entered_by
        marks.entered_at = func.now()
        self.db.add(marks)
        self.db.commit()
        self.db.refresh(marks)
        return marks
    
    def get_exam_marks_by_id(self, marks_id: int, institution_id: int) -> Optional[ExamMarks]:
        return self.db.query(ExamMarks).filter(
            ExamMarks.id == marks_id,
            ExamMarks.institution_id == institution_id
        ).first()
    
    def get_student_marks(
        self,
        exam_subject_id: int,
        student_id: int,
        institution_id: int
    ) -> Optional[ExamMarks]:
        return self.db.query(ExamMarks).filter(
            ExamMarks.exam_subject_id == exam_subject_id,
            ExamMarks.student_id == student_id,
            ExamMarks.institution_id == institution_id
        ).first()
    
    def get_marks_by_exam_subject(self, exam_subject_id: int, institution_id: int) -> List[ExamMarks]:
        return self.db.query(ExamMarks).filter(
            ExamMarks.exam_subject_id == exam_subject_id,
            ExamMarks.institution_id == institution_id
        ).options(joinedload(ExamMarks.student)).all()
    
    def get_marks_by_exam(self, exam_id: int, institution_id: int) -> List[ExamMarks]:
        return self.db.query(ExamMarks).join(
            ExamSubject, ExamMarks.exam_subject_id == ExamSubject.id
        ).filter(
            ExamSubject.exam_id == exam_id,
            ExamMarks.institution_id == institution_id
        ).options(
            joinedload(ExamMarks.student),
            joinedload(ExamMarks.exam_subject)
        ).all()
    
    def update_exam_marks(
        self,
        marks_id: int,
        institution_id: int,
        marks_data: ExamMarksUpdate,
        entered_by: int
    ) -> Optional[ExamMarks]:
        marks = self.get_exam_marks_by_id(marks_id, institution_id)
        if not marks:
            return None
        
        update_data = marks_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(marks, field, value)
        
        marks.entered_by = entered_by
        marks.entered_at = func.now()
        
        self.db.commit()
        self.db.refresh(marks)
        return marks
    
    def delete_exam_marks(self, marks_id: int, institution_id: int) -> bool:
        marks = self.get_exam_marks_by_id(marks_id, institution_id)
        if not marks:
            return False
        
        self.db.delete(marks)
        self.db.commit()
        return True


class ExamResultRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_exam_result(self, result_data: Dict[str, Any]) -> ExamResult:
        result = ExamResult(**result_data)
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)
        return result
    
    def get_exam_result_by_id(self, result_id: int, institution_id: int) -> Optional[ExamResult]:
        return self.db.query(ExamResult).filter(
            ExamResult.id == result_id,
            ExamResult.institution_id == institution_id
        ).first()
    
    def get_student_result(
        self,
        exam_id: int,
        student_id: int,
        institution_id: int
    ) -> Optional[ExamResult]:
        return self.db.query(ExamResult).filter(
            ExamResult.exam_id == exam_id,
            ExamResult.student_id == student_id,
            ExamResult.institution_id == institution_id
        ).first()
    
    def get_results_by_exam(
        self,
        exam_id: int,
        institution_id: int,
        section_id: Optional[int] = None
    ) -> List[ExamResult]:
        query = self.db.query(ExamResult).filter(
            ExamResult.exam_id == exam_id,
            ExamResult.institution_id == institution_id
        )
        
        if section_id:
            query = query.filter(ExamResult.section_id == section_id)
        
        return query.options(
            joinedload(ExamResult.student),
            joinedload(ExamResult.section)
        ).order_by(desc(ExamResult.percentage)).all()
    
    def update_exam_result(
        self,
        result_id: int,
        institution_id: int,
        result_data: Dict[str, Any]
    ) -> Optional[ExamResult]:
        result = self.get_exam_result_by_id(result_id, institution_id)
        if not result:
            return None
        
        for field, value in result_data.items():
            setattr(result, field, value)
        
        self.db.commit()
        self.db.refresh(result)
        return result
    
    def delete_exam_result(self, result_id: int, institution_id: int) -> bool:
        result = self.get_exam_result_by_id(result_id, institution_id)
        if not result:
            return False
        
        self.db.delete(result)
        self.db.commit()
        return True
    
    def delete_results_by_exam(self, exam_id: int, institution_id: int) -> int:
        deleted_count = self.db.query(ExamResult).filter(
            ExamResult.exam_id == exam_id,
            ExamResult.institution_id == institution_id
        ).delete()
        self.db.commit()
        return deleted_count


class GradeConfigurationRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_grade_configuration(self, config_data: GradeConfigurationCreate) -> GradeConfiguration:
        config = GradeConfiguration(**config_data.model_dump())
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        return config
    
    def get_grade_configuration_by_id(self, config_id: int, institution_id: int) -> Optional[GradeConfiguration]:
        return self.db.query(GradeConfiguration).filter(
            GradeConfiguration.id == config_id,
            GradeConfiguration.institution_id == institution_id
        ).first()
    
    def list_grade_configurations(self, institution_id: int, active_only: bool = True) -> List[GradeConfiguration]:
        query = self.db.query(GradeConfiguration).filter(
            GradeConfiguration.institution_id == institution_id
        )
        
        if active_only:
            query = query.filter(GradeConfiguration.is_active == True)
        
        return query.order_by(desc(GradeConfiguration.min_percentage)).all()
    
    def update_grade_configuration(
        self,
        config_id: int,
        institution_id: int,
        config_data: GradeConfigurationUpdate
    ) -> Optional[GradeConfiguration]:
        config = self.get_grade_configuration_by_id(config_id, institution_id)
        if not config:
            return None
        
        update_data = config_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        self.db.commit()
        self.db.refresh(config)
        return config
    
    def delete_grade_configuration(self, config_id: int, institution_id: int) -> bool:
        config = self.get_grade_configuration_by_id(config_id, institution_id)
        if not config:
            return False
        
        self.db.delete(config)
        self.db.commit()
        return True


class ExamPerformanceAnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_analytics(self, analytics_data: Dict[str, Any]) -> ExamPerformanceAnalytics:
        analytics = ExamPerformanceAnalytics(**analytics_data)
        self.db.add(analytics)
        self.db.commit()
        self.db.refresh(analytics)
        return analytics
    
    def get_analytics_by_id(self, analytics_id: int, institution_id: int) -> Optional[ExamPerformanceAnalytics]:
        return self.db.query(ExamPerformanceAnalytics).filter(
            ExamPerformanceAnalytics.id == analytics_id,
            ExamPerformanceAnalytics.institution_id == institution_id
        ).first()
    
    def get_analytics_by_exam(
        self,
        exam_id: int,
        institution_id: int,
        section_id: Optional[int] = None,
        subject_id: Optional[int] = None
    ) -> Optional[ExamPerformanceAnalytics]:
        query = self.db.query(ExamPerformanceAnalytics).filter(
            ExamPerformanceAnalytics.exam_id == exam_id,
            ExamPerformanceAnalytics.institution_id == institution_id
        )
        
        if section_id is not None:
            query = query.filter(ExamPerformanceAnalytics.section_id == section_id)
        else:
            query = query.filter(ExamPerformanceAnalytics.section_id.is_(None))
        
        if subject_id is not None:
            query = query.filter(ExamPerformanceAnalytics.subject_id == subject_id)
        else:
            query = query.filter(ExamPerformanceAnalytics.subject_id.is_(None))
        
        return query.first()
    
    def list_analytics_by_exam(
        self,
        exam_id: int,
        institution_id: int
    ) -> List[ExamPerformanceAnalytics]:
        return self.db.query(ExamPerformanceAnalytics).filter(
            ExamPerformanceAnalytics.exam_id == exam_id,
            ExamPerformanceAnalytics.institution_id == institution_id
        ).all()
    
    def update_analytics(
        self,
        analytics_id: int,
        institution_id: int,
        analytics_data: Dict[str, Any]
    ) -> Optional[ExamPerformanceAnalytics]:
        analytics = self.get_analytics_by_id(analytics_id, institution_id)
        if not analytics:
            return None
        
        for field, value in analytics_data.items():
            setattr(analytics, field, value)
        
        self.db.commit()
        self.db.refresh(analytics)
        return analytics
    
    def delete_analytics(self, analytics_id: int, institution_id: int) -> bool:
        analytics = self.get_analytics_by_id(analytics_id, institution_id)
        if not analytics:
            return False
        
        self.db.delete(analytics)
        self.db.commit()
        return True
    
    def delete_analytics_by_exam(self, exam_id: int, institution_id: int) -> int:
        deleted_count = self.db.query(ExamPerformanceAnalytics).filter(
            ExamPerformanceAnalytics.exam_id == exam_id,
            ExamPerformanceAnalytics.institution_id == institution_id
        ).delete()
        self.db.commit()
        return deleted_count
