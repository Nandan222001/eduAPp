from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from fastapi import HTTPException, status, UploadFile
import csv
import io
from datetime import datetime, date
from src.models.student import Student
from src.models.academic import Section, Grade
from src.schemas.student import StudentCreate, StudentUpdate, StudentBulkImportRow


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
        
        student = Student(**data.model_dump())
        self.db.add(student)
        self.db.commit()
        self.db.refresh(student)
        return student

    def get_student(self, student_id: int) -> Optional[Student]:
        return self.db.query(Student).options(
            joinedload(Student.section)
        ).filter(Student.id == student_id).first()

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
        section_id: Optional[int] = None,
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[Student], int]:
        query = self.db.query(Student).filter(Student.institution_id == institution_id)
        
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
