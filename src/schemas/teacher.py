from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class TeacherBase(BaseModel):
    employee_id: Optional[str] = Field(None, max_length=50)
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    qualification: Optional[str] = Field(None, max_length=255)
    specialization: Optional[str] = Field(None, max_length=255)
    joining_date: Optional[date] = None
    is_active: bool = True


class TeacherCreate(TeacherBase):
    institution_id: int
    user_id: Optional[int] = None


class TeacherUpdate(BaseModel):
    employee_id: Optional[str] = Field(None, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    qualification: Optional[str] = Field(None, max_length=255)
    specialization: Optional[str] = Field(None, max_length=255)
    joining_date: Optional[date] = None
    is_active: Optional[bool] = None


class TeacherResponse(TeacherBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class TeacherSubjectBase(BaseModel):
    teacher_id: int
    subject_id: int
    is_primary: bool = False


class TeacherSubjectCreate(TeacherSubjectBase):
    institution_id: int


class TeacherSubjectResponse(TeacherSubjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime


class TeacherBulkImportRow(BaseModel):
    employee_id: Optional[str] = None
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    joining_date: Optional[str] = None


class BulkImportResult(BaseModel):
    total: int
    success: int
    failed: int
    errors: List[dict] = []
