from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, desc
from fastapi import HTTPException, status, UploadFile
import csv
import io
from datetime import datetime, date, timedelta
from src.models.student import Student, Parent, StudentParent
from src.models.academic import Section, Grade, AcademicYear
from src.models.attendance import Attendance, AttendanceSummary, AttendanceStatus
from src.models.examination import ExamResult, Exam
from src.models.assignment import Assignment, Submission
from src.schemas.student import (
    StudentCreate, 
    StudentUpdate, 
    StudentBulkImportRow,
    BulkImportPreviewRow,
    BulkImportPreviewResponse,
    StudentPromotionRequest,
    StudentTransferRequest,
    AttendanceSummaryData,
    PerformanceSummaryData,
    StudentProfileResponse,
    StudentFilterParams,
    IDCardData,
    ParentCreate,
    ParentUpdate,
    LinkParentRequest,
    StudentStatistics,
)


class StudentService:
    def __init__(self, db: Session):
        self.db = db

    def create_student(self, data: StudentCreate) -> Student:
        existing = self.db.query(Student).filter(
            Student.institution_id == data.institution_id,
            or_(
                and_(Student.email == data.email, data.email is not None),
                and_(Student.admission_number == data.admission_number, data.admission_number is not None)
            )
        ).first()
        
        if existing:
            if existing.email == data.email and data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student with this email already exists"
                )
            if existing.admission_number == data.admission_number and data.admission_number:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student with this admission number already exists"
                )
        
        data_dict = data.model_dump(exclude={'parent_ids'})
        student = Student(**data_dict)
        self.db.add(student)
        self.db.flush()
        
        if data.parent_ids:
            for parent_id in data.parent_ids:
                parent = self.db.query(Parent).filter(
                    Parent.id == parent_id,
                    Parent.institution_id == data.institution_id
                ).first()
                if parent:
                    student_parent = StudentParent(
                        student_id=student.id,
                        parent_id=parent_id,
                        relation_type=parent.relation_type or "parent",
                        is_primary_contact=parent.is_primary_contact
                    )
                    self.db.add(student_parent)
        
        self.db.commit()
        self.db.refresh(student)
        return student

    def get_student(self, student_id: int) -> Optional[Student]:
        return self.db.query(Student).options(
            joinedload(Student.section).joinedload(Section.grade),
            joinedload(Student.parents).joinedload(StudentParent.parent)
        ).filter(Student.id == student_id).first()

    def get_student_profile(self, student_id: int) -> Optional[Dict[str, Any]]:
        student = self.get_student(student_id)
        if not student:
            return None
        
        student_dict = {
            "id": student.id,
            "institution_id": student.institution_id,
            "user_id": student.user_id,
            "section_id": student.section_id,
            "admission_number": student.admission_number,
            "roll_number": student.roll_number,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.email,
            "phone": student.phone,
            "date_of_birth": student.date_of_birth,
            "gender": student.gender,
            "blood_group": student.blood_group,
            "address": student.address,
            "parent_name": student.parent_name,
            "parent_email": student.parent_email,
            "parent_phone": student.parent_phone,
            "admission_date": student.admission_date,
            "photo_url": student.photo_url,
            "emergency_contact_name": student.emergency_contact_name,
            "emergency_contact_phone": student.emergency_contact_phone,
            "emergency_contact_relation": student.emergency_contact_relation,
            "previous_school": student.previous_school,
            "medical_conditions": student.medical_conditions,
            "nationality": student.nationality,
            "religion": student.religion,
            "caste": student.caste,
            "category": student.category,
            "aadhar_number": student.aadhar_number,
            "status": student.status,
            "is_active": student.is_active,
            "created_at": student.created_at,
            "updated_at": student.updated_at,
        }
        
        if student.section:
            student_dict["section"] = {
                "id": student.section.id,
                "name": student.section.name,
                "grade_id": student.section.grade_id,
            }
        
        student_dict["parents_info"] = []
        for sp in student.parents:
            if sp.parent:
                student_dict["parents_info"].append({
                    "id": sp.parent.id,
                    "first_name": sp.parent.first_name,
                    "last_name": sp.parent.last_name,
                    "email": sp.parent.email,
                    "phone": sp.parent.phone,
                    "relation_type": sp.relation_type,
                    "is_primary_contact": sp.is_primary_contact,
                })
        
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        attendance_summary = self.db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == student_id,
            AttendanceSummary.month == current_month,
            AttendanceSummary.year == current_year,
            AttendanceSummary.subject_id.is_(None)
        ).first()
        
        if attendance_summary:
            student_dict["attendance_summary"] = {
                "total_days": attendance_summary.total_days,
                "present_days": attendance_summary.present_days,
                "absent_days": attendance_summary.absent_days,
                "late_days": attendance_summary.late_days,
                "half_days": attendance_summary.half_days,
                "attendance_percentage": float(attendance_summary.attendance_percentage),
            }
        
        recent_results = self.db.query(ExamResult).join(
            Exam, ExamResult.exam_id == Exam.id
        ).filter(
            ExamResult.student_id == student_id
        ).order_by(desc(Exam.start_date)).limit(5).all()
        
        student_dict["recent_performance"] = []
        for result in recent_results:
            student_dict["recent_performance"].append({
                "exam_name": result.exam.name,
                "total_marks": float(result.total_max_marks),
                "obtained_marks": float(result.total_marks_obtained),
                "percentage": float(result.percentage),
                "grade": result.grade,
                "rank": result.rank_in_section,
            })
        
        total_assignments = self.db.query(func.count(Assignment.id)).filter(
            Assignment.section_id == student.section_id
        ).scalar() or 0
        
        completed_assignments = self.db.query(func.count(Submission.id)).filter(
            Submission.student_id == student_id,
            Submission.submitted_at.isnot(None)
        ).scalar() or 0
        
        student_dict["total_assignments"] = total_assignments
        student_dict["completed_assignments"] = completed_assignments
        student_dict["pending_assignments"] = total_assignments - completed_assignments
        
        return student_dict

    def get_student_by_email(self, institution_id: int, email: str) -> Optional[Student]:
        return self.db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.email == email
        ).first()

    def get_student_by_admission_number(self, institution_id: int, admission_number: str) -> Optional[Student]:
        return self.db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.admission_number == admission_number
        ).first()

    def list_students(
        self, 
        institution_id: int,
        grade_id: Optional[int] = None,
        section_id: Optional[int] = None,
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        status: Optional[str] = None,
        gender: Optional[str] = None
    ) -> Tuple[List[Student], int]:
        query = self.db.query(Student).options(
            joinedload(Student.section).joinedload(Section.grade)
        ).filter(Student.institution_id == institution_id)
        
        if grade_id:
            query = query.join(Section).filter(Section.grade_id == grade_id)
        
        if section_id:
            query = query.filter(Student.section_id == section_id)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Student.first_name.ilike(search_pattern),
                    Student.last_name.ilike(search_pattern),
                    Student.email.ilike(search_pattern),
                    Student.admission_number.ilike(search_pattern),
                    Student.roll_number.ilike(search_pattern)
                )
            )
        
        if is_active is not None:
            query = query.filter(Student.is_active == is_active)
        
        if status:
            query = query.filter(Student.status == status)
        
        if gender:
            query = query.filter(Student.gender == gender)
        
        total = query.count()
        students = query.order_by(Student.first_name, Student.last_name).offset(skip).limit(limit).all()
        
        return students, total

    def update_student(self, student_id: int, data: StudentUpdate) -> Optional[Student]:
        student = self.get_student(student_id)
        if not student:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        if 'email' in update_data and update_data['email']:
            existing = self.db.query(Student).filter(
                Student.institution_id == student.institution_id,
                Student.email == update_data['email'],
                Student.id != student_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student with this email already exists"
                )
        
        if 'admission_number' in update_data and update_data['admission_number']:
            existing = self.db.query(Student).filter(
                Student.institution_id == student.institution_id,
                Student.admission_number == update_data['admission_number'],
                Student.id != student_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student with this admission number already exists"
                )
        
        for key, value in update_data.items():
            setattr(student, key, value)
        
        self.db.commit()
        self.db.refresh(student)
        return student

    def delete_student(self, student_id: int) -> bool:
        student = self.get_student(student_id)
        if not student:
            return False
        
        self.db.delete(student)
        self.db.commit()
        return True

    async def preview_bulk_import(
        self,
        institution_id: int,
        file: UploadFile
    ) -> BulkImportPreviewResponse:
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files are allowed"
            )
        
        content = await file.read()
        csv_file = io.StringIO(content.decode('utf-8'))
        csv_reader = csv.DictReader(csv_file)
        
        preview_rows = []
        valid_count = 0
        invalid_count = 0
        
        for row_num, row in enumerate(csv_reader, start=2):
            errors = []
            warnings = []
            
            if not row.get('first_name', '').strip():
                errors.append("First name is required")
            
            if not row.get('last_name', '').strip():
                errors.append("Last name is required")
            
            if row.get('email'):
                existing = self.db.query(Student).filter(
                    Student.institution_id == institution_id,
                    Student.email == row['email'].strip()
                ).first()
                if existing:
                    errors.append(f"Email {row['email']} already exists")
            
            if row.get('admission_number'):
                existing = self.db.query(Student).filter(
                    Student.institution_id == institution_id,
                    Student.admission_number == row['admission_number'].strip()
                ).first()
                if existing:
                    errors.append(f"Admission number {row['admission_number']} already exists")
            
            if row.get('grade_name') and row.get('section_name'):
                section = self.db.query(Section).join(
                    Grade, Section.grade_id == Grade.id
                ).filter(
                    Grade.institution_id == institution_id,
                    Grade.name == row['grade_name'].strip(),
                    Section.name == row['section_name'].strip()
                ).first()
                
                if not section:
                    warnings.append(f"Section {row['section_name']} in grade {row['grade_name']} not found")
            
            is_valid = len(errors) == 0
            if is_valid:
                valid_count += 1
            else:
                invalid_count += 1
            
            preview_rows.append(BulkImportPreviewRow(
                row_number=row_num,
                data=dict(row),
                errors=errors,
                warnings=warnings,
                is_valid=is_valid
            ))
            
            if row_num > 100:
                break
        
        return BulkImportPreviewResponse(
            total_rows=len(preview_rows),
            valid_rows=valid_count,
            invalid_rows=invalid_count,
            preview=preview_rows
        )

    async def bulk_import_students(
        self, 
        institution_id: int, 
        file: UploadFile
    ) -> dict:
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files are allowed"
            )
        
        content = await file.read()
        csv_file = io.StringIO(content.decode('utf-8'))
        csv_reader = csv.DictReader(csv_file)
        
        results = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for row_num, row in enumerate(csv_reader, start=2):
            results["total"] += 1
            
            try:
                section_id = None
                if row.get('grade_name') and row.get('section_name'):
                    section = self.db.query(Section).join(
                        Grade, Section.grade_id == Grade.id
                    ).filter(
                        Grade.institution_id == institution_id,
                        Grade.name == row['grade_name'].strip(),
                        Section.name == row['section_name'].strip()
                    ).first()
                    
                    if section:
                        section_id = section.id
                
                student_data = {
                    "institution_id": institution_id,
                    "section_id": section_id,
                    "admission_number": row.get('admission_number') or None,
                    "roll_number": row.get('roll_number') or None,
                    "first_name": row.get('first_name', '').strip(),
                    "last_name": row.get('last_name', '').strip(),
                    "email": row.get('email') or None,
                    "phone": row.get('phone') or None,
                    "gender": row.get('gender') or None,
                    "blood_group": row.get('blood_group') or None,
                    "address": row.get('address') or None,
                    "parent_name": row.get('parent_name') or None,
                    "parent_email": row.get('parent_email') or None,
                    "parent_phone": row.get('parent_phone') or None,
                    "emergency_contact_name": row.get('emergency_contact_name') or None,
                    "emergency_contact_phone": row.get('emergency_contact_phone') or None,
                    "emergency_contact_relation": row.get('emergency_contact_relation') or None,
                    "previous_school": row.get('previous_school') or None,
                    "medical_conditions": row.get('medical_conditions') or None,
                    "nationality": row.get('nationality') or None,
                    "religion": row.get('religion') or None,
                    "caste": row.get('caste') or None,
                    "category": row.get('category') or None,
                    "aadhar_number": row.get('aadhar_number') or None,
                }
                
                if row.get('date_of_birth'):
                    try:
                        student_data['date_of_birth'] = datetime.strptime(
                            row['date_of_birth'], '%Y-%m-%d'
                        ).date()
                    except ValueError:
                        pass
                
                if row.get('admission_date'):
                    try:
                        student_data['admission_date'] = datetime.strptime(
                            row['admission_date'], '%Y-%m-%d'
                        ).date()
                    except ValueError:
                        pass
                
                if not student_data['first_name']:
                    raise ValueError("First name is required")
                
                if student_data['email']:
                    existing = self.db.query(Student).filter(
                        Student.institution_id == institution_id,
                        Student.email == student_data['email']
                    ).first()
                    
                    if existing:
                        results["errors"].append({
                            "row": row_num,
                            "email": student_data['email'],
                            "error": "Student with this email already exists"
                        })
                        results["failed"] += 1
                        continue
                
                if student_data['admission_number']:
                    existing = self.db.query(Student).filter(
                        Student.institution_id == institution_id,
                        Student.admission_number == student_data['admission_number']
                    ).first()
                    
                    if existing:
                        results["errors"].append({
                            "row": row_num,
                            "admission_number": student_data['admission_number'],
                            "error": "Student with this admission number already exists"
                        })
                        results["failed"] += 1
                        continue
                
                student = Student(**student_data)
                self.db.add(student)
                self.db.commit()
                
                results["success"] += 1
                
            except Exception as e:
                self.db.rollback()
                results["errors"].append({
                    "row": row_num,
                    "error": str(e)
                })
                results["failed"] += 1
        
        return results

    def promote_students(
        self,
        institution_id: int,
        data: StudentPromotionRequest
    ) -> Dict[str, Any]:
        target_grade = self.db.query(Grade).filter(
            Grade.id == data.target_grade_id,
            Grade.institution_id == institution_id
        ).first()
        
        if not target_grade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target grade not found"
            )
        
        if data.target_section_id:
            target_section = self.db.query(Section).filter(
                Section.id == data.target_section_id,
                Section.grade_id == data.target_grade_id
            ).first()
            
            if not target_section:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Target section not found"
                )
        
        promoted_count = 0
        failed_count = 0
        errors = []
        
        for student_id in data.student_ids:
            try:
                student = self.db.query(Student).filter(
                    Student.id == student_id,
                    Student.institution_id == institution_id
                ).first()
                
                if not student:
                    errors.append({
                        "student_id": student_id,
                        "error": "Student not found"
                    })
                    failed_count += 1
                    continue
                
                student.section_id = data.target_section_id
                promoted_count += 1
                
            except Exception as e:
                errors.append({
                    "student_id": student_id,
                    "error": str(e)
                })
                failed_count += 1
        
        self.db.commit()
        
        return {
            "promoted": promoted_count,
            "failed": failed_count,
            "errors": errors
        }

    def transfer_student(
        self,
        institution_id: int,
        data: StudentTransferRequest
    ) -> Student:
        student = self.db.query(Student).filter(
            Student.id == data.student_id,
            Student.institution_id == institution_id
        ).first()
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        target_section = self.db.query(Section).filter(
            Section.id == data.target_section_id,
            Section.institution_id == institution_id
        ).first()
        
        if not target_section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target section not found"
            )
        
        student.section_id = data.target_section_id
        self.db.commit()
        self.db.refresh(student)
        
        return student

    def get_id_card_data(self, student_id: int, institution_id: int) -> Optional[IDCardData]:
        student = self.db.query(Student).options(
            joinedload(Student.section).joinedload(Section.grade)
        ).filter(
            Student.id == student_id,
            Student.institution_id == institution_id
        ).first()
        
        if not student:
            return None
        
        from src.models.institution import Institution
        institution = self.db.query(Institution).filter(
            Institution.id == institution_id
        ).first()
        
        class_section = ""
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"
        
        current_year = datetime.now().year
        valid_until = date(current_year + 1, 3, 31)
        
        return IDCardData(
            student_id=student.id,
            student_name=f"{student.first_name} {student.last_name}",
            admission_number=student.admission_number or "",
            class_section=class_section,
            photo_url=student.photo_url,
            institution_name=institution.name if institution else "",
            institution_logo=getattr(institution, 'logo_url', None) if institution else None,
            valid_until=valid_until,
            date_of_birth=student.date_of_birth,
            blood_group=student.blood_group
        )

    def get_statistics(self, institution_id: int) -> StudentStatistics:
        total_students = self.db.query(func.count(Student.id)).filter(
            Student.institution_id == institution_id
        ).scalar() or 0
        
        active_students = self.db.query(func.count(Student.id)).filter(
            Student.institution_id == institution_id,
            Student.is_active == True
        ).scalar() or 0
        
        inactive_students = total_students - active_students
        
        male_students = self.db.query(func.count(Student.id)).filter(
            Student.institution_id == institution_id,
            Student.gender == 'male'
        ).scalar() or 0
        
        female_students = self.db.query(func.count(Student.id)).filter(
            Student.institution_id == institution_id,
            Student.gender == 'female'
        ).scalar() or 0
        
        students_by_grade = {}
        grade_counts = self.db.query(
            Grade.name, func.count(Student.id)
        ).join(
            Section, Grade.id == Section.grade_id
        ).join(
            Student, Section.id == Student.section_id
        ).filter(
            Student.institution_id == institution_id
        ).group_by(Grade.name).all()
        
        for grade_name, count in grade_counts:
            students_by_grade[grade_name] = count
        
        students_by_status = {}
        status_counts = self.db.query(
            Student.status, func.count(Student.id)
        ).filter(
            Student.institution_id == institution_id
        ).group_by(Student.status).all()
        
        for status, count in status_counts:
            students_by_status[status] = count
        
        return StudentStatistics(
            total_students=total_students,
            active_students=active_students,
            inactive_students=inactive_students,
            male_students=male_students,
            female_students=female_students,
            students_by_grade=students_by_grade,
            students_by_status=students_by_status
        )

    def create_parent(self, data: ParentCreate) -> Parent:
        existing = self.db.query(Parent).filter(
            Parent.institution_id == data.institution_id,
            Parent.email == data.email,
            data.email is not None
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent with this email already exists"
            )
        
        parent = Parent(**data.model_dump())
        self.db.add(parent)
        self.db.commit()
        self.db.refresh(parent)
        return parent

    def link_parent_to_student(
        self,
        student_id: int,
        institution_id: int,
        data: LinkParentRequest
    ) -> StudentParent:
        student = self.db.query(Student).filter(
            Student.id == student_id,
            Student.institution_id == institution_id
        ).first()
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        parent = self.db.query(Parent).filter(
            Parent.id == data.parent_id,
            Parent.institution_id == institution_id
        ).first()
        
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent not found"
            )
        
        existing = self.db.query(StudentParent).filter(
            StudentParent.student_id == student_id,
            StudentParent.parent_id == data.parent_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent is already linked to this student"
            )
        
        student_parent = StudentParent(
            student_id=student_id,
            parent_id=data.parent_id,
            relation_type=data.relation_type,
            is_primary_contact=data.is_primary_contact
        )
        self.db.add(student_parent)
        self.db.commit()
        self.db.refresh(student_parent)
        return student_parent

    def unlink_parent_from_student(
        self,
        student_id: int,
        parent_id: int,
        institution_id: int
    ) -> bool:
        student_parent = self.db.query(StudentParent).join(
            Student, StudentParent.student_id == Student.id
        ).filter(
            StudentParent.student_id == student_id,
            StudentParent.parent_id == parent_id,
            Student.institution_id == institution_id
        ).first()
        
        if not student_parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent link not found"
            )
        
        self.db.delete(student_parent)
        self.db.commit()
        return True
