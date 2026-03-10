from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from src.models.academic import AcademicYear, Grade, Section, Subject, GradeSubject, Chapter, Topic


class AcademicYearRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> AcademicYear:
        academic_year = AcademicYear(**kwargs)
        self.db.add(academic_year)
        self.db.flush()
        return academic_year

    def create_bulk(self, items: List[Dict[str, Any]]) -> List[AcademicYear]:
        academic_years = [AcademicYear(**item) for item in items]
        self.db.add_all(academic_years)
        self.db.flush()
        return academic_years

    def get_by_id(self, academic_year_id: int) -> Optional[AcademicYear]:
        return self.db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first()

    def get_by_institution_and_name(self, institution_id: int, name: str) -> Optional[AcademicYear]:
        return self.db.query(AcademicYear).filter(
            AcademicYear.institution_id == institution_id,
            AcademicYear.name == name
        ).first()

    def get_current_by_institution(self, institution_id: int) -> Optional[AcademicYear]:
        return self.db.query(AcademicYear).filter(
            AcademicYear.institution_id == institution_id,
            AcademicYear.is_current == True
        ).first()

    def list_by_institution(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
        is_current: Optional[bool] = None
    ) -> List[AcademicYear]:
        query = self.db.query(AcademicYear).filter(
            AcademicYear.institution_id == institution_id
        )
        
        if is_active is not None:
            query = query.filter(AcademicYear.is_active == is_active)
        
        if is_current is not None:
            query = query.filter(AcademicYear.is_current == is_current)
        
        return query.order_by(AcademicYear.start_date.desc()).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        is_active: Optional[bool] = None,
        is_current: Optional[bool] = None
    ) -> int:
        query = self.db.query(AcademicYear).filter(
            AcademicYear.institution_id == institution_id
        )
        
        if is_active is not None:
            query = query.filter(AcademicYear.is_active == is_active)
        
        if is_current is not None:
            query = query.filter(AcademicYear.is_current == is_current)
        
        return query.count()

    def update(self, academic_year: AcademicYear, **kwargs) -> AcademicYear:
        for key, value in kwargs.items():
            setattr(academic_year, key, value)
        self.db.flush()
        return academic_year

    def update_bulk(self, updates: List[Dict[str, Any]]) -> List[AcademicYear]:
        updated = []
        for update_dict in updates:
            academic_year_id = update_dict.pop('id')
            academic_year = self.get_by_id(academic_year_id)
            if academic_year:
                for key, value in update_dict.items():
                    setattr(academic_year, key, value)
                updated.append(academic_year)
        self.db.flush()
        return updated

    def delete(self, academic_year: AcademicYear) -> None:
        self.db.delete(academic_year)
        self.db.flush()

    def delete_bulk(self, academic_year_ids: List[int]) -> int:
        count = self.db.query(AcademicYear).filter(
            AcademicYear.id.in_(academic_year_ids)
        ).delete(synchronize_session=False)
        self.db.flush()
        return count

    def set_current(self, institution_id: int, academic_year_id: int) -> None:
        self.db.query(AcademicYear).filter(
            AcademicYear.institution_id == institution_id,
            AcademicYear.is_current == True
        ).update({"is_current": False}, synchronize_session=False)
        
        self.db.query(AcademicYear).filter(
            AcademicYear.id == academic_year_id
        ).update({"is_current": True}, synchronize_session=False)
        self.db.flush()


class GradeRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Grade:
        grade = Grade(**kwargs)
        self.db.add(grade)
        self.db.flush()
        return grade

    def create_bulk(self, items: List[Dict[str, Any]]) -> List[Grade]:
        grades = [Grade(**item) for item in items]
        self.db.add_all(grades)
        self.db.flush()
        return grades

    def get_by_id(self, grade_id: int) -> Optional[Grade]:
        return self.db.query(Grade).filter(Grade.id == grade_id).first()

    def get_by_institution_year_and_name(
        self,
        institution_id: int,
        academic_year_id: int,
        name: str
    ) -> Optional[Grade]:
        return self.db.query(Grade).filter(
            Grade.institution_id == institution_id,
            Grade.academic_year_id == academic_year_id,
            Grade.name == name
        ).first()

    def list_by_institution(
        self,
        institution_id: int,
        academic_year_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Grade]:
        query = self.db.query(Grade).filter(Grade.institution_id == institution_id)
        
        if academic_year_id:
            query = query.filter(Grade.academic_year_id == academic_year_id)
        
        if is_active is not None:
            query = query.filter(Grade.is_active == is_active)
        
        return query.order_by(Grade.display_order, Grade.name).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        academic_year_id: Optional[int] = None,
        is_active: Optional[bool] = None
    ) -> int:
        query = self.db.query(Grade).filter(Grade.institution_id == institution_id)
        
        if academic_year_id:
            query = query.filter(Grade.academic_year_id == academic_year_id)
        
        if is_active is not None:
            query = query.filter(Grade.is_active == is_active)
        
        return query.count()

    def update(self, grade: Grade, **kwargs) -> Grade:
        for key, value in kwargs.items():
            setattr(grade, key, value)
        self.db.flush()
        return grade

    def update_bulk(self, updates: List[Dict[str, Any]]) -> List[Grade]:
        updated = []
        for update_dict in updates:
            grade_id = update_dict.pop('id')
            grade = self.get_by_id(grade_id)
            if grade:
                for key, value in update_dict.items():
                    setattr(grade, key, value)
                updated.append(grade)
        self.db.flush()
        return updated

    def delete(self, grade: Grade) -> None:
        self.db.delete(grade)
        self.db.flush()

    def delete_bulk(self, grade_ids: List[int]) -> int:
        count = self.db.query(Grade).filter(
            Grade.id.in_(grade_ids)
        ).delete(synchronize_session=False)
        self.db.flush()
        return count

    def get_with_sections(self, grade_id: int) -> Optional[Grade]:
        return self.db.query(Grade).options(
            joinedload(Grade.sections)
        ).filter(Grade.id == grade_id).first()

    def get_with_subjects(self, grade_id: int) -> Optional[Grade]:
        return self.db.query(Grade).options(
            joinedload(Grade.grade_subjects).joinedload(GradeSubject.subject)
        ).filter(Grade.id == grade_id).first()


class SectionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Section:
        section = Section(**kwargs)
        self.db.add(section)
        self.db.flush()
        return section

    def create_bulk(self, items: List[Dict[str, Any]]) -> List[Section]:
        sections = [Section(**item) for item in items]
        self.db.add_all(sections)
        self.db.flush()
        return sections

    def get_by_id(self, section_id: int) -> Optional[Section]:
        return self.db.query(Section).filter(Section.id == section_id).first()

    def get_by_grade_and_name(self, grade_id: int, name: str) -> Optional[Section]:
        return self.db.query(Section).filter(
            Section.grade_id == grade_id,
            Section.name == name
        ).first()

    def list_by_institution(
        self,
        institution_id: int,
        grade_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Section]:
        query = self.db.query(Section).filter(Section.institution_id == institution_id)
        
        if grade_id:
            query = query.filter(Section.grade_id == grade_id)
        
        if is_active is not None:
            query = query.filter(Section.is_active == is_active)
        
        return query.order_by(Section.name).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        grade_id: Optional[int] = None,
        is_active: Optional[bool] = None
    ) -> int:
        query = self.db.query(Section).filter(Section.institution_id == institution_id)
        
        if grade_id:
            query = query.filter(Section.grade_id == grade_id)
        
        if is_active is not None:
            query = query.filter(Section.is_active == is_active)
        
        return query.count()

    def update(self, section: Section, **kwargs) -> Section:
        for key, value in kwargs.items():
            setattr(section, key, value)
        self.db.flush()
        return section

    def update_bulk(self, updates: List[Dict[str, Any]]) -> List[Section]:
        updated = []
        for update_dict in updates:
            section_id = update_dict.pop('id')
            section = self.get_by_id(section_id)
            if section:
                for key, value in update_dict.items():
                    setattr(section, key, value)
                updated.append(section)
        self.db.flush()
        return updated

    def delete(self, section: Section) -> None:
        self.db.delete(section)
        self.db.flush()

    def delete_bulk(self, section_ids: List[int]) -> int:
        count = self.db.query(Section).filter(
            Section.id.in_(section_ids)
        ).delete(synchronize_session=False)
        self.db.flush()
        return count


class SubjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Subject:
        subject = Subject(**kwargs)
        self.db.add(subject)
        self.db.flush()
        return subject

    def create_bulk(self, items: List[Dict[str, Any]]) -> List[Subject]:
        subjects = [Subject(**item) for item in items]
        self.db.add_all(subjects)
        self.db.flush()
        return subjects

    def get_by_id(self, subject_id: int) -> Optional[Subject]:
        return self.db.query(Subject).filter(Subject.id == subject_id).first()

    def get_by_institution_and_name(self, institution_id: int, name: str) -> Optional[Subject]:
        return self.db.query(Subject).filter(
            Subject.institution_id == institution_id,
            Subject.name == name
        ).first()

    def get_by_institution_and_code(self, institution_id: int, code: str) -> Optional[Subject]:
        return self.db.query(Subject).filter(
            Subject.institution_id == institution_id,
            Subject.code == code
        ).first()

    def list_by_institution(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[Subject]:
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
        
        return query.order_by(Subject.name).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> int:
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
        
        return query.count()

    def update(self, subject: Subject, **kwargs) -> Subject:
        for key, value in kwargs.items():
            setattr(subject, key, value)
        self.db.flush()
        return subject

    def update_bulk(self, updates: List[Dict[str, Any]]) -> List[Subject]:
        updated = []
        for update_dict in updates:
            subject_id = update_dict.pop('id')
            subject = self.get_by_id(subject_id)
            if subject:
                for key, value in update_dict.items():
                    setattr(subject, key, value)
                updated.append(subject)
        self.db.flush()
        return updated

    def delete(self, subject: Subject) -> None:
        self.db.delete(subject)
        self.db.flush()

    def delete_bulk(self, subject_ids: List[int]) -> int:
        count = self.db.query(Subject).filter(
            Subject.id.in_(subject_ids)
        ).delete(synchronize_session=False)
        self.db.flush()
        return count

    def list_by_grade(self, grade_id: int) -> List[Subject]:
        return self.db.query(Subject).join(
            GradeSubject, Subject.id == GradeSubject.subject_id
        ).filter(
            GradeSubject.grade_id == grade_id
        ).all()


class ChapterRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Chapter:
        chapter = Chapter(**kwargs)
        self.db.add(chapter)
        self.db.flush()
        return chapter

    def create_bulk(self, items: List[Dict[str, Any]]) -> List[Chapter]:
        chapters = [Chapter(**item) for item in items]
        self.db.add_all(chapters)
        self.db.flush()
        return chapters

    def get_by_id(self, chapter_id: int) -> Optional[Chapter]:
        return self.db.query(Chapter).filter(Chapter.id == chapter_id).first()

    def get_by_subject_grade_and_name(
        self,
        subject_id: int,
        grade_id: int,
        name: str
    ) -> Optional[Chapter]:
        return self.db.query(Chapter).filter(
            Chapter.subject_id == subject_id,
            Chapter.grade_id == grade_id,
            Chapter.name == name
        ).first()

    def get_by_subject_grade_and_code(
        self,
        subject_id: int,
        grade_id: int,
        code: str
    ) -> Optional[Chapter]:
        return self.db.query(Chapter).filter(
            Chapter.subject_id == subject_id,
            Chapter.grade_id == grade_id,
            Chapter.code == code
        ).first()

    def list_by_institution(
        self,
        institution_id: int,
        subject_id: Optional[int] = None,
        grade_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[Chapter]:
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
        
        return query.order_by(Chapter.display_order, Chapter.name).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        subject_id: Optional[int] = None,
        grade_id: Optional[int] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> int:
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
        
        return query.count()

    def update(self, chapter: Chapter, **kwargs) -> Chapter:
        for key, value in kwargs.items():
            setattr(chapter, key, value)
        self.db.flush()
        return chapter

    def update_bulk(self, updates: List[Dict[str, Any]]) -> List[Chapter]:
        updated = []
        for update_dict in updates:
            chapter_id = update_dict.pop('id')
            chapter = self.get_by_id(chapter_id)
            if chapter:
                for key, value in update_dict.items():
                    setattr(chapter, key, value)
                updated.append(chapter)
        self.db.flush()
        return updated

    def delete(self, chapter: Chapter) -> None:
        self.db.delete(chapter)
        self.db.flush()

    def delete_bulk(self, chapter_ids: List[int]) -> int:
        count = self.db.query(Chapter).filter(
            Chapter.id.in_(chapter_ids)
        ).delete(synchronize_session=False)
        self.db.flush()
        return count

    def get_with_topics(self, chapter_id: int) -> Optional[Chapter]:
        return self.db.query(Chapter).options(
            joinedload(Chapter.topics)
        ).filter(Chapter.id == chapter_id).first()


class TopicRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Topic:
        topic = Topic(**kwargs)
        self.db.add(topic)
        self.db.flush()
        return topic

    def create_bulk(self, items: List[Dict[str, Any]]) -> List[Topic]:
        topics = [Topic(**item) for item in items]
        self.db.add_all(topics)
        self.db.flush()
        return topics

    def get_by_id(self, topic_id: int) -> Optional[Topic]:
        return self.db.query(Topic).filter(Topic.id == topic_id).first()

    def get_by_chapter_and_name(self, chapter_id: int, name: str) -> Optional[Topic]:
        return self.db.query(Topic).filter(
            Topic.chapter_id == chapter_id,
            Topic.name == name
        ).first()

    def get_by_chapter_and_code(self, chapter_id: int, code: str) -> Optional[Topic]:
        return self.db.query(Topic).filter(
            Topic.chapter_id == chapter_id,
            Topic.code == code
        ).first()

    def list_by_institution(
        self,
        institution_id: int,
        chapter_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[Topic]:
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
        
        return query.order_by(Topic.display_order, Topic.name).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        chapter_id: Optional[int] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> int:
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
        
        return query.count()

    def update(self, topic: Topic, **kwargs) -> Topic:
        for key, value in kwargs.items():
            setattr(topic, key, value)
        self.db.flush()
        return topic

    def update_bulk(self, updates: List[Dict[str, Any]]) -> List[Topic]:
        updated = []
        for update_dict in updates:
            topic_id = update_dict.pop('id')
            topic = self.get_by_id(topic_id)
            if topic:
                for key, value in update_dict.items():
                    setattr(topic, key, value)
                updated.append(topic)
        self.db.flush()
        return updated

    def delete(self, topic: Topic) -> None:
        self.db.delete(topic)
        self.db.flush()

    def delete_bulk(self, topic_ids: List[int]) -> int:
        count = self.db.query(Topic).filter(
            Topic.id.in_(topic_ids)
        ).delete(synchronize_session=False)
        self.db.flush()
        return count

    def list_by_chapter(self, chapter_id: int) -> List[Topic]:
        return self.db.query(Topic).filter(
            Topic.chapter_id == chapter_id
        ).order_by(Topic.display_order, Topic.name).all()
