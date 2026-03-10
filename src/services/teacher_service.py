from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from fastapi import HTTPException, status, UploadFile
import csv
import io
from datetime import datetime, date
from src.models.teacher import Teacher, TeacherSubject
from src.models.academic import Subject
from src.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherSubjectCreate, TeacherBulkImportRow


class TeacherService:
    def __init__(self, db: Session):
        self.db = db

    def create_teacher(self, data: TeacherCreate) -> Teacher:
        existing = self.db.query(Teacher).filter(
            Teacher.institution_id == data.institution_id,
            or_(
                Teacher.email == data.email,
                and_(Teacher.employee_id == data.employee_id, data.employee_id is not None)
            )
        ).first()
        
        if existing:
            if existing.email == data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher with this email already exists"
                )
            if existing.employee_id == data.employee_id and data.employee_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher with this employee ID already exists"
                )
        
        teacher = Teacher(**data.model_dump())
        self.db.add(teacher)
        self.db.commit()
        self.db.refresh(teacher)
        return teacher

    def get_teacher(self, teacher_id: int) -> Optional[Teacher]:
        return self.db.query(Teacher).options(
            joinedload(Teacher.teacher_subjects).joinedload(TeacherSubject.subject)
        ).filter(Teacher.id == teacher_id).first()

    def get_teacher_by_email(self, institution_id: int, email: str) -> Optional[Teacher]:
        return self.db.query(Teacher).filter(
            Teacher.institution_id == institution_id,
            Teacher.email == email
        ).first()

    def list_teachers(
        self, 
        institution_id: int,
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[Teacher], int]:
        query = self.db.query(Teacher).filter(Teacher.institution_id == institution_id)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Teacher.first_name.ilike(search_pattern),
                    Teacher.last_name.ilike(search_pattern),
                    Teacher.email.ilike(search_pattern),
                    Teacher.employee_id.ilike(search_pattern)
                )
            )
        
        if is_active is not None:
            query = query.filter(Teacher.is_active == is_active)
        
        total = query.count()
        teachers = query.order_by(Teacher.first_name, Teacher.last_name).offset(skip).limit(limit).all()
        
        return teachers, total

    def update_teacher(self, teacher_id: int, data: TeacherUpdate) -> Optional[Teacher]:
        teacher = self.get_teacher(teacher_id)
        if not teacher:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        if 'email' in update_data:
            existing = self.db.query(Teacher).filter(
                Teacher.institution_id == teacher.institution_id,
                Teacher.email == update_data['email'],
                Teacher.id != teacher_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher with this email already exists"
                )
        
        if 'employee_id' in update_data and update_data['employee_id']:
            existing = self.db.query(Teacher).filter(
                Teacher.institution_id == teacher.institution_id,
                Teacher.employee_id == update_data['employee_id'],
                Teacher.id != teacher_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher with this employee ID already exists"
                )
        
        for key, value in update_data.items():
            setattr(teacher, key, value)
        
        self.db.commit()
        self.db.refresh(teacher)
        return teacher

    def delete_teacher(self, teacher_id: int) -> bool:
        teacher = self.get_teacher(teacher_id)
        if not teacher:
            return False
        
        self.db.delete(teacher)
        self.db.commit()
        return True

    def assign_subject_to_teacher(self, data: TeacherSubjectCreate) -> TeacherSubject:
        existing = self.db.query(TeacherSubject).filter(
            TeacherSubject.teacher_id == data.teacher_id,
            TeacherSubject.subject_id == data.subject_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject already assigned to this teacher"
            )
        
        teacher_subject = TeacherSubject(**data.model_dump())
        self.db.add(teacher_subject)
        self.db.commit()
        self.db.refresh(teacher_subject)
        return teacher_subject

    def remove_subject_from_teacher(self, teacher_id: int, subject_id: int) -> bool:
        teacher_subject = self.db.query(TeacherSubject).filter(
            TeacherSubject.teacher_id == teacher_id,
            TeacherSubject.subject_id == subject_id
        ).first()
        
        if not teacher_subject:
            return False
        
        self.db.delete(teacher_subject)
        self.db.commit()
        return True

    def get_teacher_subjects(self, teacher_id: int) -> List[Subject]:
        subjects = self.db.query(Subject).join(
            TeacherSubject, Subject.id == TeacherSubject.subject_id
        ).filter(
            TeacherSubject.teacher_id == teacher_id
        ).all()
        
        return subjects

    async def bulk_import_teachers(
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
                teacher_data = {
                    "institution_id": institution_id,
                    "employee_id": row.get('employee_id') or None,
                    "first_name": row.get('first_name', '').strip(),
                    "last_name": row.get('last_name', '').strip(),
                    "email": row.get('email', '').strip(),
                    "phone": row.get('phone') or None,
                    "gender": row.get('gender') or None,
                    "address": row.get('address') or None,
                    "qualification": row.get('qualification') or None,
                    "specialization": row.get('specialization') or None,
                }
                
                if row.get('date_of_birth'):
                    try:
                        teacher_data['date_of_birth'] = datetime.strptime(
                            row['date_of_birth'], '%Y-%m-%d'
                        ).date()
                    except ValueError:
                        pass
                
                if row.get('joining_date'):
                    try:
                        teacher_data['joining_date'] = datetime.strptime(
                            row['joining_date'], '%Y-%m-%d'
                        ).date()
                    except ValueError:
                        pass
                
                if not teacher_data['first_name'] or not teacher_data['email']:
                    raise ValueError("First name and email are required")
                
                existing = self.db.query(Teacher).filter(
                    Teacher.institution_id == institution_id,
                    Teacher.email == teacher_data['email']
                ).first()
                
                if existing:
                    results["errors"].append({
                        "row": row_num,
                        "email": teacher_data['email'],
                        "error": "Teacher with this email already exists"
                    })
                    results["failed"] += 1
                    continue
                
                teacher = Teacher(**teacher_data)
                self.db.add(teacher)
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
