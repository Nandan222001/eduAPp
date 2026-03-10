from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class AcademicYearBase(BaseModel):
    name: str = Field(..., max_length=100)
    start_date: date
    end_date: date
    is_active: bool = True
    is_current: bool = False
    description: Optional[str] = None


class AcademicYearCreate(AcademicYearBase):
    institution_id: int


class AcademicYearUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    is_current: Optional[bool] = None
    description: Optional[str] = None


class AcademicYearResponse(AcademicYearBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


class GradeBase(BaseModel):
    name: str = Field(..., max_length=100)
    display_order: int = 0
    description: Optional[str] = None
    is_active: bool = True


class GradeCreate(GradeBase):
    institution_id: int
    academic_year_id: int


class GradeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    display_order: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class GradeResponse(GradeBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    academic_year_id: int
    created_at: datetime
    updated_at: datetime


class SectionBase(BaseModel):
    name: str = Field(..., max_length=100)
    capacity: Optional[int] = None
    description: Optional[str] = None
    is_active: bool = True


class SectionCreate(SectionBase):
    institution_id: int
    grade_id: int


class SectionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    capacity: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SectionResponse(SectionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    grade_id: int
    created_at: datetime
    updated_at: datetime


class SubjectBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    is_active: bool = True


class SubjectCreate(SubjectBase):
    institution_id: int


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SubjectResponse(SubjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


class GradeSubjectBase(BaseModel):
    grade_id: int
    subject_id: int
    is_compulsory: bool = True


class GradeSubjectCreate(GradeSubjectBase):
    institution_id: int


class GradeSubjectResponse(GradeSubjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime


class GradeWithSectionsResponse(GradeResponse):
    sections: List[SectionResponse] = []


class GradeWithSubjectsResponse(GradeResponse):
    subjects: List[SubjectResponse] = []


class AcademicYearWithGradesResponse(AcademicYearResponse):
    grades: List[GradeResponse] = []


class ChapterBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    display_order: int = 0
    description: Optional[str] = None
    is_active: bool = True


class ChapterCreate(ChapterBase):
    institution_id: int
    subject_id: int
    grade_id: int


class ChapterUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    display_order: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ChapterResponse(ChapterBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    subject_id: int
    grade_id: int
    created_at: datetime
    updated_at: datetime


class TopicBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    display_order: int = 0
    description: Optional[str] = None
    is_active: bool = True


class TopicCreate(TopicBase):
    institution_id: int
    chapter_id: int


class TopicUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    display_order: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TopicResponse(TopicBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    chapter_id: int
    created_at: datetime
    updated_at: datetime


class ChapterWithTopicsResponse(ChapterResponse):
    topics: List[TopicResponse] = []


class SubjectWithChaptersResponse(SubjectResponse):
    chapters: List[ChapterResponse] = []
