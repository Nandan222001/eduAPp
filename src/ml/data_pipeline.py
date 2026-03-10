from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
import pandas as pd
import numpy as np

from src.models.student import Student
from src.models.attendance import Attendance, AttendanceStatus, AttendanceSummary
from src.models.assignment import Assignment, Submission, SubmissionStatus
from src.models.examination import ExamMarks, ExamSubject, Exam, ExamResult
from src.models.academic import Subject, Chapter


class StudentPerformanceDataPipeline:

    def __init__(self, db: Session):
        self.db = db

    def extract_student_data(
        self,
        institution_id: int,
        student_ids: Optional[List[int]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> pd.DataFrame:
        query = self.db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.is_active == True
        )
        
        if student_ids:
            query = query.filter(Student.id.in_(student_ids))
        
        students = query.all()
        
        student_data = []
        for student in students:
            student_data.append({
                'student_id': student.id,
                'section_id': student.section_id,
                'admission_date': student.admission_date,
                'created_at': student.created_at
            })
        
        return pd.DataFrame(student_data)

    def extract_attendance_data(
        self,
        institution_id: int,
        student_ids: Optional[List[int]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> pd.DataFrame:
        query = self.db.query(
            Attendance.student_id,
            Attendance.subject_id,
            Attendance.date,
            Attendance.status
        ).filter(
            Attendance.institution_id == institution_id
        )
        
        if student_ids:
            query = query.filter(Attendance.student_id.in_(student_ids))
        
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        
        attendances = query.all()
        
        attendance_data = []
        for att in attendances:
            attendance_data.append({
                'student_id': att.student_id,
                'subject_id': att.subject_id,
                'date': att.date,
                'status': att.status.value if att.status else None
            })
        
        return pd.DataFrame(attendance_data)

    def extract_assignment_data(
        self,
        institution_id: int,
        student_ids: Optional[List[int]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> pd.DataFrame:
        query = self.db.query(
            Submission.student_id,
            Submission.assignment_id,
            Assignment.subject_id,
            Assignment.chapter_id,
            Assignment.max_marks,
            Submission.marks_obtained,
            Submission.submitted_at,
            Submission.is_late,
            Submission.status,
            Assignment.due_date
        ).join(
            Assignment, Submission.assignment_id == Assignment.id
        ).filter(
            Assignment.institution_id == institution_id,
            Assignment.status == 'published'
        )
        
        if student_ids:
            query = query.filter(Submission.student_id.in_(student_ids))
        
        if start_date:
            query = query.filter(Assignment.due_date >= start_date)
        
        if end_date:
            query = query.filter(Assignment.due_date <= end_date)
        
        submissions = query.all()
        
        assignment_data = []
        for sub in submissions:
            assignment_data.append({
                'student_id': sub.student_id,
                'assignment_id': sub.assignment_id,
                'subject_id': sub.subject_id,
                'chapter_id': sub.chapter_id,
                'max_marks': float(sub.max_marks) if sub.max_marks else None,
                'marks_obtained': float(sub.marks_obtained) if sub.marks_obtained else None,
                'submitted_at': sub.submitted_at,
                'is_late': sub.is_late,
                'status': sub.status.value if sub.status else None,
                'due_date': sub.due_date
            })
        
        return pd.DataFrame(assignment_data)

    def extract_exam_data(
        self,
        institution_id: int,
        student_ids: Optional[List[int]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> pd.DataFrame:
        query = self.db.query(
            ExamMarks.student_id,
            ExamMarks.exam_subject_id,
            ExamSubject.exam_id,
            ExamSubject.subject_id,
            ExamSubject.theory_max_marks,
            ExamSubject.practical_max_marks,
            ExamMarks.theory_marks_obtained,
            ExamMarks.practical_marks_obtained,
            ExamMarks.is_absent,
            ExamMarks.entered_at,
            Exam.exam_type,
            Exam.start_date,
            Exam.end_date
        ).join(
            ExamSubject, ExamMarks.exam_subject_id == ExamSubject.id
        ).join(
            Exam, ExamSubject.exam_id == Exam.id
        ).filter(
            ExamMarks.institution_id == institution_id
        )
        
        if student_ids:
            query = query.filter(ExamMarks.student_id.in_(student_ids))
        
        if start_date:
            query = query.filter(Exam.start_date >= start_date)
        
        if end_date:
            query = query.filter(Exam.end_date <= end_date)
        
        exam_marks = query.all()
        
        exam_data = []
        for mark in exam_marks:
            theory_marks = float(mark.theory_marks_obtained) if mark.theory_marks_obtained else 0
            practical_marks = float(mark.practical_marks_obtained) if mark.practical_marks_obtained else 0
            theory_max = float(mark.theory_max_marks) if mark.theory_max_marks else 0
            practical_max = float(mark.practical_max_marks) if mark.practical_max_marks else 0
            total_obtained = theory_marks + practical_marks
            total_max = theory_max + practical_max
            
            exam_data.append({
                'student_id': mark.student_id,
                'exam_id': mark.exam_id,
                'exam_subject_id': mark.exam_subject_id,
                'subject_id': mark.subject_id,
                'theory_max_marks': theory_max,
                'practical_max_marks': practical_max,
                'theory_marks_obtained': theory_marks,
                'practical_marks_obtained': practical_marks,
                'total_marks_obtained': total_obtained,
                'total_max_marks': total_max,
                'is_absent': mark.is_absent,
                'exam_type': mark.exam_type.value if mark.exam_type else None,
                'exam_start_date': mark.start_date,
                'exam_end_date': mark.end_date
            })
        
        return pd.DataFrame(exam_data)

    def extract_all_data(
        self,
        institution_id: int,
        student_ids: Optional[List[int]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, pd.DataFrame]:
        students_df = self.extract_student_data(
            institution_id, student_ids, start_date, end_date
        )
        
        attendance_df = self.extract_attendance_data(
            institution_id, student_ids, start_date, end_date
        )
        
        assignment_df = self.extract_assignment_data(
            institution_id, student_ids, start_date, end_date
        )
        
        exam_df = self.extract_exam_data(
            institution_id, student_ids, start_date, end_date
        )
        
        return {
            'students': students_df,
            'attendance': attendance_df,
            'assignments': assignment_df,
            'exams': exam_df
        }
