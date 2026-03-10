from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from fastapi import HTTPException, status
from datetime import date
from src.models.academic import AcademicYear, Grade, Section, Subject, GradeSubject, Chapter, Topic
from src.schemas.academic import (
    AcademicYearCreate, AcademicYearUpdate,
    GradeCreate, GradeUpdate,
    SectionCreate, SectionUpdate,
    SubjectCreate, SubjectUpdate,
    GradeSubjectCreate,
    ChapterCreate, ChapterUpdate,
    TopicCreate, TopicUpdate
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

    def create_academic_years_bulk(self, years_data: List[AcademicYearCreate]) -> List[AcademicYear]:
        academic_years = []
        for data in years_data:
            if data.start_date >= data.end_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"End date must be after start date for {data.name}"
                )
            
            existing = self.db.query(AcademicYear).filter(
                AcademicYear.institution_id == data.institution_id,
                AcademicYear.name == data.name
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Academic year '{data.name}' already exists"
                )
            
            if data.is_current:
                self.db.query(AcademicYear).filter(
                    AcademicYear.institution_id == data.institution_id,
                    AcademicYear.is_current == True
                ).update({"is_current": False})
            
            academic_year = AcademicYear(**data.model_dump())
            academic_years.append(academic_year)
        
        self.db.add_all(academic_years)
        self.db.commit()
        for academic_year in academic_years:
            self.db.refresh(academic_year)
        return academic_years


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

    def create_grades_bulk(self, grades_data: List[GradeCreate]) -> List[Grade]:
        grades = []
        for data in grades_data:
            existing = self.db.query(Grade).filter(
                Grade.institution_id == data.institution_id,
                Grade.academic_year_id == data.academic_year_id,
                Grade.name == data.name
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Grade '{data.name}' already exists in this academic year"
                )
            
            grade = Grade(**data.model_dump())
            grades.append(grade)
        
        self.db.add_all(grades)
        self.db.commit()
        for grade in grades:
            self.db.refresh(grade)
        return grades


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

    def create_sections_bulk(self, sections_data: List[SectionCreate]) -> List[Section]:
        sections = []
        for data in sections_data:
            existing = self.db.query(Section).filter(
                Section.grade_id == data.grade_id,
                Section.name == data.name
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Section '{data.name}' already exists in this grade"
                )
            
            section = Section(**data.model_dump())
            sections.append(section)
        
        self.db.add_all(sections)
        self.db.commit()
        for section in sections:
            self.db.refresh(section)
        return sections


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

    def create_subjects_bulk(self, subjects_data: List[SubjectCreate]) -> List[Subject]:
        subjects = []
        for data in subjects_data:
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
                        detail=f"Subject '{data.name}' already exists"
                    )
                if existing.code == data.code and data.code:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Subject with code '{data.code}' already exists"
                    )
            
            subject = Subject(**data.model_dump())
            subjects.append(subject)
        
        self.db.add_all(subjects)
        self.db.commit()
        for subject in subjects:
            self.db.refresh(subject)
        return subjects


class ChapterService:
    def __init__(self, db: Session):
        self.db = db

    def create_chapter(self, data: ChapterCreate) -> Chapter:
        existing = self.db.query(Chapter).filter(
            Chapter.subject_id == data.subject_id,
            Chapter.grade_id == data.grade_id,
            or_(
                Chapter.name == data.name,
                and_(Chapter.code == data.code, data.code is not None)
            )
        ).first()
        
        if existing:
            if existing.name == data.name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Chapter with this name already exists for this subject and grade"
                )
            if existing.code == data.code and data.code:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Chapter with this code already exists for this subject and grade"
                )
        
        chapter = Chapter(**data.model_dump())
        self.db.add(chapter)
        self.db.commit()
        self.db.refresh(chapter)
        return chapter

    def create_chapters_bulk(self, chapters_data: List[ChapterCreate]) -> List[Chapter]:
        chapters = []
        for data in chapters_data:
            existing = self.db.query(Chapter).filter(
                Chapter.subject_id == data.subject_id,
                Chapter.grade_id == data.grade_id,
                or_(
                    Chapter.name == data.name,
                    and_(Chapter.code == data.code, data.code is not None)
                )
            ).first()
            
            if existing:
                if existing.name == data.name:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Chapter '{data.name}' already exists for this subject and grade"
                    )
                if existing.code == data.code and data.code:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Chapter with code '{data.code}' already exists for this subject and grade"
                    )
            
            chapter = Chapter(**data.model_dump())
            chapters.append(chapter)
        
        self.db.add_all(chapters)
        self.db.commit()
        for chapter in chapters:
            self.db.refresh(chapter)
        return chapters

    def get_chapter(self, chapter_id: int) -> Optional[Chapter]:
        return self.db.query(Chapter).filter(Chapter.id == chapter_id).first()

    def list_chapters(
        self, 
        institution_id: int,
        subject_id: Optional[int] = None,
        grade_id: Optional[int] = None,
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[Chapter], int]:
        query = self.db.query(Chapter).filter(Chapter.institution_id == institution_id)
        
        if subject_id:
            query = query.filter(Chapter.subject_id == subject_id)
        
        if grade_id:
            query = query.filter(Chapter.grade_id == grade_id)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Chapter.name.ilike(search_pattern),
                    Chapter.code.ilike(search_pattern)
                )
            )
        
        if is_active is not None:
            query = query.filter(Chapter.is_active == is_active)
        
        total = query.count()
        chapters = query.order_by(Chapter.display_order, Chapter.name).offset(skip).limit(limit).all()
        
        return chapters, total

    def update_chapter(self, chapter_id: int, data: ChapterUpdate) -> Optional[Chapter]:
        chapter = self.get_chapter(chapter_id)
        if not chapter:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        if 'code' in update_data and update_data['code']:
            existing = self.db.query(Chapter).filter(
                Chapter.subject_id == chapter.subject_id,
                Chapter.grade_id == chapter.grade_id,
                Chapter.code == update_data['code'],
                Chapter.id != chapter_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Chapter with this code already exists for this subject and grade"
                )
        
        for key, value in update_data.items():
            setattr(chapter, key, value)
        
        self.db.commit()
        self.db.refresh(chapter)
        return chapter

    def update_chapters_bulk(self, updates: List[Dict[str, Any]]) -> List[Chapter]:
        updated_chapters = []
        for update_dict in updates:
            chapter_id = update_dict.get('id')
            if not chapter_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Chapter ID is required for bulk update"
                )
            
            chapter = self.get_chapter(chapter_id)
            if not chapter:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Chapter with id {chapter_id} not found"
                )
            
            update_data = {k: v for k, v in update_dict.items() if k != 'id'}
            
            for key, value in update_data.items():
                setattr(chapter, key, value)
            
            updated_chapters.append(chapter)
        
        self.db.commit()
        for chapter in updated_chapters:
            self.db.refresh(chapter)
        return updated_chapters

    def delete_chapter(self, chapter_id: int) -> bool:
        chapter = self.get_chapter(chapter_id)
        if not chapter:
            return False
        
        self.db.delete(chapter)
        self.db.commit()
        return True

    def delete_chapters_bulk(self, chapter_ids: List[int]) -> Dict[str, Any]:
        deleted_count = 0
        errors = []
        
        for chapter_id in chapter_ids:
            chapter = self.get_chapter(chapter_id)
            if not chapter:
                errors.append(f"Chapter with id {chapter_id} not found")
                continue
            
            try:
                self.db.delete(chapter)
                deleted_count += 1
            except Exception as e:
                errors.append(f"Error deleting chapter {chapter_id}: {str(e)}")
        
        self.db.commit()
        return {
            "deleted_count": deleted_count,
            "errors": errors
        }

    def get_chapter_with_topics(self, chapter_id: int) -> Optional[Chapter]:
        return self.db.query(Chapter).options(
            joinedload(Chapter.topics)
        ).filter(Chapter.id == chapter_id).first()


class TopicService:
    def __init__(self, db: Session):
        self.db = db

    def create_topic(self, data: TopicCreate) -> Topic:
        existing = self.db.query(Topic).filter(
            Topic.chapter_id == data.chapter_id,
            or_(
                Topic.name == data.name,
                and_(Topic.code == data.code, data.code is not None)
            )
        ).first()
        
        if existing:
            if existing.name == data.name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Topic with this name already exists in this chapter"
                )
            if existing.code == data.code and data.code:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Topic with this code already exists in this chapter"
                )
        
        topic = Topic(**data.model_dump())
        self.db.add(topic)
        self.db.commit()
        self.db.refresh(topic)
        return topic

    def create_topics_bulk(self, topics_data: List[TopicCreate]) -> List[Topic]:
        topics = []
        for data in topics_data:
            existing = self.db.query(Topic).filter(
                Topic.chapter_id == data.chapter_id,
                or_(
                    Topic.name == data.name,
                    and_(Topic.code == data.code, data.code is not None)
                )
            ).first()
            
            if existing:
                if existing.name == data.name:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Topic '{data.name}' already exists in this chapter"
                    )
                if existing.code == data.code and data.code:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Topic with code '{data.code}' already exists in this chapter"
                    )
            
            topic = Topic(**data.model_dump())
            topics.append(topic)
        
        self.db.add_all(topics)
        self.db.commit()
        for topic in topics:
            self.db.refresh(topic)
        return topics

    def get_topic(self, topic_id: int) -> Optional[Topic]:
        return self.db.query(Topic).filter(Topic.id == topic_id).first()

    def list_topics(
        self, 
        institution_id: int,
        chapter_id: Optional[int] = None,
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[Topic], int]:
        query = self.db.query(Topic).filter(Topic.institution_id == institution_id)
        
        if chapter_id:
            query = query.filter(Topic.chapter_id == chapter_id)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Topic.name.ilike(search_pattern),
                    Topic.code.ilike(search_pattern)
                )
            )
        
        if is_active is not None:
            query = query.filter(Topic.is_active == is_active)
        
        total = query.count()
        topics = query.order_by(Topic.display_order, Topic.name).offset(skip).limit(limit).all()
        
        return topics, total

    def update_topic(self, topic_id: int, data: TopicUpdate) -> Optional[Topic]:
        topic = self.get_topic(topic_id)
        if not topic:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        if 'code' in update_data and update_data['code']:
            existing = self.db.query(Topic).filter(
                Topic.chapter_id == topic.chapter_id,
                Topic.code == update_data['code'],
                Topic.id != topic_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Topic with this code already exists in this chapter"
                )
        
        for key, value in update_data.items():
            setattr(topic, key, value)
        
        self.db.commit()
        self.db.refresh(topic)
        return topic

    def update_topics_bulk(self, updates: List[Dict[str, Any]]) -> List[Topic]:
        updated_topics = []
        for update_dict in updates:
            topic_id = update_dict.get('id')
            if not topic_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Topic ID is required for bulk update"
                )
            
            topic = self.get_topic(topic_id)
            if not topic:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Topic with id {topic_id} not found"
                )
            
            update_data = {k: v for k, v in update_dict.items() if k != 'id'}
            
            for key, value in update_data.items():
                setattr(topic, key, value)
            
            updated_topics.append(topic)
        
        self.db.commit()
        for topic in updated_topics:
            self.db.refresh(topic)
        return updated_topics

    def delete_topic(self, topic_id: int) -> bool:
        topic = self.get_topic(topic_id)
        if not topic:
            return False
        
        self.db.delete(topic)
        self.db.commit()
        return True

    def delete_topics_bulk(self, topic_ids: List[int]) -> Dict[str, Any]:
        deleted_count = 0
        errors = []
        
        for topic_id in topic_ids:
            topic = self.get_topic(topic_id)
            if not topic:
                errors.append(f"Topic with id {topic_id} not found")
                continue
            
            try:
                self.db.delete(topic)
                deleted_count += 1
            except Exception as e:
                errors.append(f"Error deleting topic {topic_id}: {str(e)}")
        
        self.db.commit()
        return {
            "deleted_count": deleted_count,
            "errors": errors
        }
