from typing import List, Optional, Dict, Any, Tuple
from datetime import date, time, datetime
from decimal import Decimal
import statistics
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from src.models.examination import ExamType, ExamStatus
from src.models.student import Student
from src.models.academic import Section, Subject
from src.repositories.examination_repository import (
    ExamRepository, ExamSubjectRepository, ExamScheduleRepository,
    ExamMarksRepository, ExamResultRepository, GradeConfigurationRepository,
    ExamPerformanceAnalyticsRepository
)
from src.schemas.examination import (
    ExamCreate, ExamUpdate, ExamResponse, ExamSubjectCreate, ExamSubjectUpdate,
    ExamScheduleCreate, ExamScheduleUpdate, ExamMarksCreate, ExamMarksUpdate,
    ExamMarksEntry, ExamMarksBulkEntry, GradeConfigurationCreate, GradeConfigurationUpdate,
    TimetableConflict, StudentExamResult, PerformanceComparisonRequest,
    PerformanceComparison, PerformanceComparisonResponse
)


class ExaminationService:
    def __init__(self, db: Session):
        self.db = db
        self.exam_repo = ExamRepository(db)
        self.exam_subject_repo = ExamSubjectRepository(db)
        self.exam_schedule_repo = ExamScheduleRepository(db)
        self.exam_marks_repo = ExamMarksRepository(db)
        self.exam_result_repo = ExamResultRepository(db)
        self.grade_config_repo = GradeConfigurationRepository(db)
        self.analytics_repo = ExamPerformanceAnalyticsRepository(db)
    
    def create_exam(self, exam_data: ExamCreate):
        return self.exam_repo.create_exam(exam_data)
    
    def get_exam(self, exam_id: int, institution_id: int):
        return self.exam_repo.get_exam_by_id(exam_id, institution_id)
    
    def get_exam_with_details(self, exam_id: int, institution_id: int):
        return self.exam_repo.get_exam_with_details(exam_id, institution_id)
    
    def list_exams(
        self,
        institution_id: int,
        academic_year_id: Optional[int] = None,
        grade_id: Optional[int] = None,
        exam_type: Optional[ExamType] = None,
        status: Optional[ExamStatus] = None,
        skip: int = 0,
        limit: int = 100
    ):
        return self.exam_repo.list_exams(
            institution_id, academic_year_id, grade_id, exam_type, status, skip, limit
        )
    
    def update_exam(self, exam_id: int, institution_id: int, exam_data: ExamUpdate):
        return self.exam_repo.update_exam(exam_id, institution_id, exam_data)
    
    def delete_exam(self, exam_id: int, institution_id: int) -> bool:
        return self.exam_repo.delete_exam(exam_id, institution_id)
    
    def create_exam_subject(self, exam_subject_data: ExamSubjectCreate):
        return self.exam_subject_repo.create_exam_subject(exam_subject_data)
    
    def get_exam_subjects(self, exam_id: int, institution_id: int):
        return self.exam_subject_repo.get_exam_subjects_by_exam(exam_id, institution_id)
    
    def update_exam_subject(
        self, 
        exam_subject_id: int, 
        institution_id: int, 
        exam_subject_data: ExamSubjectUpdate
    ):
        return self.exam_subject_repo.update_exam_subject(
            exam_subject_id, institution_id, exam_subject_data
        )
    
    def upload_question_paper(
        self, 
        exam_subject_id: int, 
        institution_id: int, 
        file_path: str
    ):
        update_data = ExamSubjectUpdate(
            question_paper_path=file_path
        )
        exam_subject = self.exam_subject_repo.update_exam_subject(
            exam_subject_id, institution_id, update_data
        )
        if exam_subject:
            exam_subject.question_paper_uploaded_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(exam_subject)
        return exam_subject
    
    def create_exam_schedule(self, schedule_data: ExamScheduleCreate):
        conflicts = self.check_schedule_conflicts(
            schedule_data.institution_id,
            schedule_data.exam_date,
            schedule_data.start_time,
            schedule_data.end_time,
            schedule_data.section_id,
            schedule_data.invigilator_id
        )
        
        return self.exam_schedule_repo.create_exam_schedule(schedule_data), conflicts
    
    def get_exam_schedules(self, exam_id: int, institution_id: int):
        return self.exam_schedule_repo.get_exam_schedules_by_exam(exam_id, institution_id)
    
    def update_exam_schedule(
        self,
        schedule_id: int,
        institution_id: int,
        schedule_data: ExamScheduleUpdate
    ):
        schedule = self.exam_schedule_repo.get_exam_schedule_by_id(schedule_id, institution_id)
        if not schedule:
            return None, []
        
        exam_date = schedule_data.exam_date if schedule_data.exam_date else schedule.exam_date
        start_time = schedule_data.start_time if schedule_data.start_time else schedule.start_time
        end_time = schedule_data.end_time if schedule_data.end_time else schedule.end_time
        section_id = schedule_data.section_id if schedule_data.section_id is not None else schedule.section_id
        invigilator_id = schedule_data.invigilator_id if schedule_data.invigilator_id is not None else schedule.invigilator_id
        
        conflicts = self.check_schedule_conflicts(
            institution_id,
            exam_date,
            start_time,
            end_time,
            section_id,
            invigilator_id,
            exclude_schedule_id=schedule_id
        )
        
        updated_schedule = self.exam_schedule_repo.update_exam_schedule(
            schedule_id, institution_id, schedule_data
        )
        
        return updated_schedule, conflicts
    
    def delete_exam_schedule(self, schedule_id: int, institution_id: int) -> bool:
        return self.exam_schedule_repo.delete_exam_schedule(schedule_id, institution_id)
    
    def check_schedule_conflicts(
        self,
        institution_id: int,
        exam_date: date,
        start_time: time,
        end_time: time,
        section_id: Optional[int] = None,
        invigilator_id: Optional[int] = None,
        exclude_schedule_id: Optional[int] = None
    ) -> List[TimetableConflict]:
        conflicts_list = []
        
        conflicting_schedules = self.exam_schedule_repo.check_timetable_conflicts(
            institution_id, exam_date, start_time, end_time,
            section_id, invigilator_id, exclude_schedule_id
        )
        
        for conflict_schedule in conflicting_schedules:
            if section_id and conflict_schedule.section_id == section_id:
                conflicts_list.append(TimetableConflict(
                    schedule_id=conflict_schedule.id,
                    conflict_type="section",
                    conflicting_schedule_id=conflict_schedule.id,
                    message=f"Section has another exam scheduled at {conflict_schedule.start_time}-{conflict_schedule.end_time}"
                ))
            
            if invigilator_id and conflict_schedule.invigilator_id == invigilator_id:
                conflicts_list.append(TimetableConflict(
                    schedule_id=conflict_schedule.id,
                    conflict_type="invigilator",
                    conflicting_schedule_id=conflict_schedule.id,
                    message=f"Invigilator is assigned to another exam at {conflict_schedule.start_time}-{conflict_schedule.end_time}"
                ))
        
        return conflicts_list
    
    def enter_marks(
        self,
        institution_id: int,
        exam_subject_id: int,
        student_id: int,
        marks_data: ExamMarksCreate,
        entered_by: int
    ):
        existing_marks = self.exam_marks_repo.get_student_marks(
            exam_subject_id, student_id, institution_id
        )
        
        if existing_marks:
            update_data = ExamMarksUpdate(**marks_data.model_dump(exclude={'institution_id', 'exam_subject_id', 'student_id'}))
            return self.exam_marks_repo.update_exam_marks(
                existing_marks.id, institution_id, update_data, entered_by
            )
        else:
            return self.exam_marks_repo.create_exam_marks(marks_data, entered_by)
    
    def bulk_enter_marks(
        self,
        institution_id: int,
        bulk_data: ExamMarksBulkEntry,
        entered_by: int
    ):
        results = []
        for entry in bulk_data.marks_entries:
            marks_data = ExamMarksCreate(
                institution_id=institution_id,
                exam_subject_id=bulk_data.exam_subject_id,
                student_id=entry.student_id,
                theory_marks_obtained=entry.theory_marks_obtained,
                practical_marks_obtained=entry.practical_marks_obtained,
                is_absent=entry.is_absent,
                remarks=entry.remarks
            )
            
            mark = self.enter_marks(
                institution_id,
                bulk_data.exam_subject_id,
                entry.student_id,
                marks_data,
                entered_by
            )
            results.append(mark)
        
        return results
    
    def get_marks_by_exam_subject(self, exam_subject_id: int, institution_id: int):
        return self.exam_marks_repo.get_marks_by_exam_subject(exam_subject_id, institution_id)
    
    def generate_results(self, exam_id: int, institution_id: int):
        exam = self.exam_repo.get_exam_by_id(exam_id, institution_id)
        if not exam:
            return None
        
        exam_subjects = self.exam_subject_repo.get_exam_subjects_by_exam(exam_id, institution_id)
        all_marks = self.exam_marks_repo.get_marks_by_exam(exam_id, institution_id)
        
        students_marks = {}
        for mark in all_marks:
            if mark.student_id not in students_marks:
                students_marks[mark.student_id] = {
                    'student': mark.student,
                    'marks': [],
                    'total_obtained': Decimal('0'),
                    'total_max': Decimal('0')
                }
            
            exam_subject = mark.exam_subject
            theory_obtained = mark.theory_marks_obtained or Decimal('0')
            practical_obtained = mark.practical_marks_obtained or Decimal('0')
            total_obtained = theory_obtained + practical_obtained
            total_max = exam_subject.theory_max_marks + exam_subject.practical_max_marks
            
            students_marks[mark.student_id]['marks'].append({
                'subject_id': exam_subject.subject_id,
                'mark': mark,
                'exam_subject': exam_subject,
                'total_obtained': total_obtained,
                'total_max': total_max
            })
            
            students_marks[mark.student_id]['total_obtained'] += total_obtained
            students_marks[mark.student_id]['total_max'] += total_max
        
        self.exam_result_repo.delete_results_by_exam(exam_id, institution_id)
        
        results = []
        for student_id, data in students_marks.items():
            student = data['student']
            total_obtained = data['total_obtained']
            total_max = data['total_max']
            
            percentage = (total_obtained / total_max * 100) if total_max > 0 else Decimal('0')
            
            grade_config = self._get_grade_for_percentage(institution_id, percentage)
            grade = grade_config.grade if grade_config else None
            grade_point = grade_config.grade_point if grade_config else None
            is_pass = grade_config.is_passing if grade_config else False
            
            subjects_passed = 0
            subjects_failed = 0
            for mark_data in data['marks']:
                mark = mark_data['mark']
                exam_subject = mark_data['exam_subject']
                
                theory_pass = True
                practical_pass = True
                
                if exam_subject.theory_passing_marks:
                    theory_pass = (mark.theory_marks_obtained or 0) >= exam_subject.theory_passing_marks
                
                if exam_subject.practical_passing_marks:
                    practical_pass = (mark.practical_marks_obtained or 0) >= exam_subject.practical_passing_marks
                
                if theory_pass and practical_pass and not mark.is_absent:
                    subjects_passed += 1
                else:
                    subjects_failed += 1
                    is_pass = False
            
            result_data = {
                'institution_id': institution_id,
                'exam_id': exam_id,
                'student_id': student_id,
                'section_id': student.section_id,
                'total_marks_obtained': total_obtained,
                'total_max_marks': total_max,
                'percentage': percentage,
                'grade': grade,
                'grade_point': grade_point,
                'is_pass': is_pass,
                'subjects_passed': subjects_passed,
                'subjects_failed': subjects_failed
            }
            
            result = self.exam_result_repo.create_exam_result(result_data)
            results.append(result)
        
        self._calculate_ranks(exam_id, institution_id)
        
        return results
    
    def _get_grade_for_percentage(self, institution_id: int, percentage: Decimal):
        configs = self.grade_config_repo.list_grade_configurations(institution_id, active_only=True)
        
        for config in configs:
            if config.min_percentage <= percentage <= config.max_percentage:
                return config
        
        return None
    
    def _calculate_ranks(self, exam_id: int, institution_id: int):
        results = self.exam_result_repo.get_results_by_exam(exam_id, institution_id)
        
        results_sorted = sorted(results, key=lambda r: r.percentage, reverse=True)
        for rank, result in enumerate(results_sorted, start=1):
            result.rank_in_grade = rank
        
        sections = {}
        for result in results:
            if result.section_id:
                if result.section_id not in sections:
                    sections[result.section_id] = []
                sections[result.section_id].append(result)
        
        for section_id, section_results in sections.items():
            section_sorted = sorted(section_results, key=lambda r: r.percentage, reverse=True)
            for rank, result in enumerate(section_sorted, start=1):
                result.rank_in_section = rank
        
        self.db.commit()
    
    def get_exam_results(
        self,
        exam_id: int,
        institution_id: int,
        section_id: Optional[int] = None
    ):
        return self.exam_result_repo.get_results_by_exam(exam_id, institution_id, section_id)
    
    def get_student_result(self, exam_id: int, student_id: int, institution_id: int):
        result = self.exam_result_repo.get_student_result(exam_id, student_id, institution_id)
        if not result:
            return None
        
        exam_subjects = self.exam_subject_repo.get_exam_subjects_by_exam(exam_id, institution_id)
        
        subject_results = []
        for exam_subject in exam_subjects:
            marks = self.exam_marks_repo.get_student_marks(
                exam_subject.id, student_id, institution_id
            )
            
            if marks:
                theory_obtained = marks.theory_marks_obtained or Decimal('0')
                practical_obtained = marks.practical_marks_obtained or Decimal('0')
                total_obtained = theory_obtained + practical_obtained
                total_max = exam_subject.theory_max_marks + exam_subject.practical_max_marks
                
                subject_results.append({
                    'subject_id': exam_subject.subject_id,
                    'subject_name': exam_subject.subject.name,
                    'theory_marks': float(theory_obtained),
                    'theory_max': float(exam_subject.theory_max_marks),
                    'practical_marks': float(practical_obtained),
                    'practical_max': float(exam_subject.practical_max_marks),
                    'total_marks': float(total_obtained),
                    'total_max': float(total_max),
                    'is_absent': marks.is_absent
                })
        
        student = result.student
        section = result.section
        
        return StudentExamResult(
            student_id=student.id,
            student_name=f"{student.first_name} {student.last_name}",
            roll_number=student.roll_number,
            section_name=section.name if section else None,
            subject_results=subject_results,
            total_marks_obtained=result.total_marks_obtained,
            total_max_marks=result.total_max_marks,
            percentage=result.percentage,
            grade=result.grade,
            grade_point=result.grade_point,
            is_pass=result.is_pass,
            rank_in_section=result.rank_in_section,
            rank_in_grade=result.rank_in_grade
        )
    
    def generate_performance_analytics(
        self,
        exam_id: int,
        institution_id: int,
        section_id: Optional[int] = None,
        subject_id: Optional[int] = None
    ):
        if subject_id:
            return self._generate_subject_analytics(exam_id, institution_id, section_id, subject_id)
        else:
            return self._generate_overall_analytics(exam_id, institution_id, section_id)
    
    def _generate_overall_analytics(
        self,
        exam_id: int,
        institution_id: int,
        section_id: Optional[int] = None
    ):
        results = self.exam_result_repo.get_results_by_exam(exam_id, institution_id, section_id)
        
        if not results:
            return None
        
        total_students = len(results)
        students_appeared = len([r for r in results if r.total_marks_obtained > 0])
        students_passed = len([r for r in results if r.is_pass])
        students_failed = total_students - students_passed
        
        pass_percentage = (students_passed / total_students * 100) if total_students > 0 else 0
        
        percentages = [float(r.percentage) for r in results]
        average_marks = statistics.mean(percentages) if percentages else 0
        highest_marks = max(percentages) if percentages else 0
        lowest_marks = min(percentages) if percentages else 0
        median_marks = statistics.median(percentages) if percentages else 0
        std_dev = statistics.stdev(percentages) if len(percentages) > 1 else 0
        
        existing_analytics = self.analytics_repo.get_analytics_by_exam(
            exam_id, institution_id, section_id, None
        )
        
        analytics_data = {
            'institution_id': institution_id,
            'exam_id': exam_id,
            'section_id': section_id,
            'subject_id': None,
            'total_students': total_students,
            'students_appeared': students_appeared,
            'students_passed': students_passed,
            'students_failed': students_failed,
            'pass_percentage': Decimal(str(pass_percentage)),
            'average_marks': Decimal(str(average_marks)),
            'highest_marks': Decimal(str(highest_marks)),
            'lowest_marks': Decimal(str(lowest_marks)),
            'median_marks': Decimal(str(median_marks)),
            'standard_deviation': Decimal(str(std_dev)),
            'generated_at': datetime.utcnow()
        }
        
        if existing_analytics:
            return self.analytics_repo.update_analytics(
                existing_analytics.id, institution_id, analytics_data
            )
        else:
            return self.analytics_repo.create_analytics(analytics_data)
    
    def _generate_subject_analytics(
        self,
        exam_id: int,
        institution_id: int,
        section_id: Optional[int],
        subject_id: int
    ):
        exam_subjects = self.exam_subject_repo.get_exam_subjects_by_exam(exam_id, institution_id)
        exam_subject = next((es for es in exam_subjects if es.subject_id == subject_id), None)
        
        if not exam_subject:
            return None
        
        all_marks = self.exam_marks_repo.get_marks_by_exam_subject(exam_subject.id, institution_id)
        
        if section_id:
            all_marks = [m for m in all_marks if m.student.section_id == section_id]
        
        if not all_marks:
            return None
        
        total_students = len(all_marks)
        students_appeared = len([m for m in all_marks if not m.is_absent])
        
        marks_obtained = []
        students_passed = 0
        students_failed = 0
        
        for mark in all_marks:
            if not mark.is_absent:
                theory_obtained = mark.theory_marks_obtained or Decimal('0')
                practical_obtained = mark.practical_marks_obtained or Decimal('0')
                total_obtained = theory_obtained + practical_obtained
                total_max = exam_subject.theory_max_marks + exam_subject.practical_max_marks
                
                percentage = (total_obtained / total_max * 100) if total_max > 0 else 0
                marks_obtained.append(float(percentage))
                
                theory_pass = True
                practical_pass = True
                
                if exam_subject.theory_passing_marks:
                    theory_pass = theory_obtained >= exam_subject.theory_passing_marks
                
                if exam_subject.practical_passing_marks:
                    practical_pass = practical_obtained >= exam_subject.practical_passing_marks
                
                if theory_pass and practical_pass:
                    students_passed += 1
                else:
                    students_failed += 1
            else:
                students_failed += 1
        
        pass_percentage = (students_passed / total_students * 100) if total_students > 0 else 0
        
        average_marks = statistics.mean(marks_obtained) if marks_obtained else 0
        highest_marks = max(marks_obtained) if marks_obtained else 0
        lowest_marks = min(marks_obtained) if marks_obtained else 0
        median_marks = statistics.median(marks_obtained) if marks_obtained else 0
        std_dev = statistics.stdev(marks_obtained) if len(marks_obtained) > 1 else 0
        
        existing_analytics = self.analytics_repo.get_analytics_by_exam(
            exam_id, institution_id, section_id, subject_id
        )
        
        analytics_data = {
            'institution_id': institution_id,
            'exam_id': exam_id,
            'section_id': section_id,
            'subject_id': subject_id,
            'total_students': total_students,
            'students_appeared': students_appeared,
            'students_passed': students_passed,
            'students_failed': students_failed,
            'pass_percentage': Decimal(str(pass_percentage)),
            'average_marks': Decimal(str(average_marks)),
            'highest_marks': Decimal(str(highest_marks)),
            'lowest_marks': Decimal(str(lowest_marks)),
            'median_marks': Decimal(str(median_marks)),
            'standard_deviation': Decimal(str(std_dev)),
            'generated_at': datetime.utcnow()
        }
        
        if existing_analytics:
            return self.analytics_repo.update_analytics(
                existing_analytics.id, institution_id, analytics_data
            )
        else:
            return self.analytics_repo.create_analytics(analytics_data)
    
    def get_performance_analytics(
        self,
        exam_id: int,
        institution_id: int,
        section_id: Optional[int] = None,
        subject_id: Optional[int] = None
    ):
        return self.analytics_repo.get_analytics_by_exam(
            exam_id, institution_id, section_id, subject_id
        )
    
    def compare_performance(
        self,
        institution_id: int,
        comparison_request: PerformanceComparisonRequest
    ):
        comparisons = []
        
        for exam_id in comparison_request.exam_ids:
            exam = self.exam_repo.get_exam_by_id(exam_id, institution_id)
            if not exam:
                continue
            
            analytics = self.analytics_repo.get_analytics_by_exam(
                exam_id, 
                institution_id, 
                comparison_request.section_id,
                comparison_request.subject_id
            )
            
            if not analytics:
                analytics = self.generate_performance_analytics(
                    exam_id, 
                    institution_id,
                    comparison_request.section_id,
                    comparison_request.subject_id
                )
            
            if analytics:
                comparisons.append(PerformanceComparison(
                    exam_id=exam.id,
                    exam_name=exam.name,
                    exam_type=exam.exam_type.value,
                    analytics=analytics
                ))
        
        trend_analysis = self._calculate_trend_analysis(comparisons)
        
        return PerformanceComparisonResponse(
            comparisons=comparisons,
            trend_analysis=trend_analysis
        )
    
    def _calculate_trend_analysis(self, comparisons: List[PerformanceComparison]) -> dict:
        if len(comparisons) < 2:
            return None
        
        avg_marks_trend = [float(c.analytics.average_marks) for c in comparisons]
        pass_percentage_trend = [float(c.analytics.pass_percentage) for c in comparisons]
        
        avg_improvement = avg_marks_trend[-1] - avg_marks_trend[0]
        pass_improvement = pass_percentage_trend[-1] - pass_percentage_trend[0]
        
        return {
            'average_marks_trend': avg_marks_trend,
            'pass_percentage_trend': pass_percentage_trend,
            'average_marks_improvement': avg_improvement,
            'pass_percentage_improvement': pass_improvement,
            'overall_trend': 'improving' if avg_improvement > 0 else 'declining' if avg_improvement < 0 else 'stable'
        }
    
    def create_grade_configuration(self, config_data: GradeConfigurationCreate):
        return self.grade_config_repo.create_grade_configuration(config_data)
    
    def list_grade_configurations(self, institution_id: int, active_only: bool = True):
        return self.grade_config_repo.list_grade_configurations(institution_id, active_only)
    
    def update_grade_configuration(
        self,
        config_id: int,
        institution_id: int,
        config_data: GradeConfigurationUpdate
    ):
        return self.grade_config_repo.update_grade_configuration(
            config_id, institution_id, config_data
        )
    
    def delete_grade_configuration(self, config_id: int, institution_id: int) -> bool:
        return self.grade_config_repo.delete_grade_configuration(config_id, institution_id)
