from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from fastapi import HTTPException, status
from datetime import date
from src.models.academic import AcademicYear, Grade, Section, Subject, GradeSubject
from src.schemas.academic import (
    AcademicYearCreate, AcademicYearUpdate,
    GradeCreate, GradeUpdate,
    SectionCreate, SectionUpdate,
    SubjectCreate, SubjectUpdate,
    GradeSubjectCreate
)


class AcademicYearService:
    def __init__(self, db: Session):
        self.db = db

    def create_academic_year(self, data: AcademicYearCreate) -> AcademicYear:
        if data.start_date >= data.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date"
            )
        
        existing = self.db.query(AcademicYear).filter(
            AcademicYear.institution_id == data.institution_id,
            AcademicYear.name == data.name
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Academic year with this name already exists"
            )
        
        if data.is_current:
            self.db.query(AcademicYear).filter(
                AcademicYear.institution_id == data.institution_id,
                AcademicYear.is_current == True
            ).update({"is_current": False})
        
        academic_year = AcademicYear(**data.model_dump())
        self.db.add(academic_year)
        self.db.commit()
        self.db.refresh(academic_year)
        return academic_year

    def get_academic_year(self, academic_year_id: int) -> Optional[AcademicYear]:
        return self.db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first()

    def list_academic_years(
        self, 
        institution_id: int,
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None,
        is_current: Optional[bool] = None
    ) -> Tuple[List[AcademicYear], int]:
        query = self.db.query(AcademicYear).filter(
            AcademicYear.institution_id == institution_id
        )
        
        if is_active is not None:
            query = query.filter(AcademicYear.is_active == is_active)
        
        if is_current is not None:
            query = query.filter(AcademicYear.is_current == is_current)
        
        total = query.count()
        academic_years = query.order_by(AcademicYear.start_date.desc()).offset(skip).limit(limit).all()
        
        return academic_years, total

    def update_academic_year(self, academic_year_id: int, data: AcademicYearUpdate) -> Optional[AcademicYear]:
        academic_year = self.get_academic_year(academic_year_id)
        if not academic_year:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        if 'start_date' in update_data or 'end_date' in update_data:
            start_date = update_data.get('start_date', academic_year.start_date)
            end_date = update_data.get('end_date', academic_year.end_date)
            if start_date >= end_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="End date must be after start date"
                )
        
        if update_data.get('is_current', False):
            self.db.query(AcademicYear).filter(
                AcademicYear.institution_id == academic_year.institution_id,
                AcademicYear.is_current == True,
                AcademicYear.id != academic_year_id
            ).update({"is_current": False})
        
        for key, value in update_data.items():
            setattr(academic_year, key, value)
        
        self.db.commit()
        self.db.refresh(academic_year)
        return academic_year

    def delete_academic_year(self, academic_year_id: int) -> bool:
        academic_year = self.get_academic_year(academic_year_id)
        if not academic_year:
            return False
        
        self.db.delete(academic_year)
        self.db.commit()
        return True


class GradeService:
    def __init__(self, db: Session):
        self.db = db

    def create_grade(self, data: GradeCreate) -> Grade:
        existing = self.db.query(Grade).filter(
            Grade.institution_id == data.institution_id,
            Grade.academic_year_id == data.academic_year_id,
            Grade.name == data.name
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grade with this name already exists in this academic year"
            )
        
        grade = Grade(**data.model_dump())
        self.db.add(grade)
        self.db.commit()
        self.db.refresh(grade)
        return grade

    def get_grade(self, grade_id: int) -> Optional[Grade]:
        return self.db.query(Grade).filter(Grade.id == grade_id).first()

    def list_grades(
        self, 
        institution_id: int,
        academic_year_id: Optional[int] = None,
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> Tuple[List[Grade], int]:
        query = self.db.query(Grade).filter(Grade.institution_id == institution_id)
        
        if academic_year_id:
            query = query.filter(Grade.academic_year_id == academic_year_id)
        
        if is_active is not None:
            query = query.filter(Grade.is_active == is_active)
        
        total = query.count()
        grades = query.order_by(Grade.display_order, Grade.name).offset(skip).limit(limit).all()
        
        return grades, total

    def update_grade(self, grade_id: int, data: GradeUpdate) -> Optional[Grade]:
        grade = self.get_grade(grade_id)
        if not grade:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(grade, key, value)
        
        self.db.commit()
        self.db.refresh(grade)
        return grade

    def delete_grade(self, grade_id: int) -> bool:
        grade = self.get_grade(grade_id)
        if not grade:
            return False
        
        self.db.delete(grade)
        self.db.commit()
        return True


class SectionService:
    def __init__(self, db: Session):
        self.db = db

    def create_section(self, data: SectionCreate) -> Section:
        existing = self.db.query(Section).filter(
            Section.grade_id == data.grade_id,
            Section.name == data.name
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Section with this name already exists in this grade"
            )
        
        section = Section(**data.model_dump())
        self.db.add(section)
        self.db.commit()
        self.db.refresh(section)
        return section

    def get_section(self, section_id: int) -> Optional[Section]:
        return self.db.query(Section).filter(Section.id == section_id).first()

    def list_sections(
        self, 
        institution_id: int,
        grade_id: Optional[int] = None,
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> Tuple[List[Section], int]:
        query = self.db.query(Section).filter(Section.institution_id == institution_id)
        
        if grade_id:
            query = query.filter(Section.grade_id == grade_id)
        
        if is_active is not None:
            query = query.filter(Section.is_active == is_active)
        
        total = query.count()
        sections = query.order_by(Section.name).offset(skip).limit(limit).all()
        
        return sections, total

    def update_section(self, section_id: int, data: SectionUpdate) -> Optional[Section]:
        section = self.get_section(section_id)
        if not section:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(section, key, value)
        
        self.db.commit()
        self.db.refresh(section)
        return section

    def delete_section(self, section_id: int) -> bool:
        section = self.get_section(section_id)
        if not section:
            return False
        
        self.db.delete(section)
        self.db.commit()
        return True


class SubjectService:
    def __init__(self, db: Session):
        self.db = db

    def create_subject(self, data: SubjectCreate) -> Subject:
        existing = self.db.query(Subject).filter(
            Subject.institution_id == data.institution_id,
            or_(
                Subject.name == data.name,
                and_(Subject.code == data.code, data.code is not None)
            )
        ).first()
        
        if existing:
            if existing.name == data.name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Subject with this name already exists"
                )
            if existing.code == data.code and data.code:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Subject with this code already exists"
                )
        
        subject = Subject(**data.model_dump())
        self.db.add(subject)
        self.db.commit()
        self.db.refresh(subject)
        return subject

    def get_subject(self, subject_id: int) -> Optional[Subject]:
        return self.db.query(Subject).filter(Subject.id == subject_id).first()

    def list_subjects(
        self, 
        institution_id: int,
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[Subject], int]:
        query = self.db.query(Subject).filter(Subject.institution_id == institution_id)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Subject.name.ilike(search_pattern),
                    Subject.code.ilike(search_pattern)
                )
            )
        
        if is_active is not None:
            query = query.filter(Subject.is_active == is_active)
        
        total = query.count()
        subjects = query.order_by(Subject.name).offset(skip).limit(limit).all()
        
        return subjects, total

    def update_subject(self, subject_id: int, data: SubjectUpdate) -> Optional[Subject]:
        subject = self.get_subject(subject_id)
        if not subject:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        if 'code' in update_data and update_data['code']:
            existing = self.db.query(Subject).filter(
                Subject.institution_id == subject.institution_id,
                Subject.code == update_data['code'],
                Subject.id != subject_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Subject with this code already exists"
                )
        
        for key, value in update_data.items():
            setattr(subject, key, value)
        
        self.db.commit()
        self.db.refresh(subject)
        return subject

    def delete_subject(self, subject_id: int) -> bool:
        subject = self.get_subject(subject_id)
        if not subject:
            return False
        
        self.db.delete(subject)
        self.db.commit()
        return True

    def assign_subject_to_grade(self, data: GradeSubjectCreate) -> GradeSubject:
        existing = self.db.query(GradeSubject).filter(
            GradeSubject.grade_id == data.grade_id,
            GradeSubject.subject_id == data.subject_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject already assigned to this grade"
            )
        
        grade_subject = GradeSubject(**data.model_dump())
        self.db.add(grade_subject)
        self.db.commit()
        self.db.refresh(grade_subject)
        return grade_subject

    def remove_subject_from_grade(self, grade_id: int, subject_id: int) -> bool:
        grade_subject = self.db.query(GradeSubject).filter(
            GradeSubject.grade_id == grade_id,
            GradeSubject.subject_id == subject_id
        ).first()
        
        if not grade_subject:
            return False
        
        self.db.delete(grade_subject)
        self.db.commit()
        return True

    def get_grade_subjects(self, grade_id: int) -> List[Subject]:
        grade_subjects = self.db.query(Subject).join(
            GradeSubject, Subject.id == GradeSubject.subject_id
        ).filter(
            GradeSubject.grade_id == grade_id
        ).all()
        
        return grade_subjects
