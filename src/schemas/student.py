from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class StudentBase(BaseModel):
    admission_number: Optional[str] = Field(None, max_length=50)
    roll_number: Optional[str] = Field(None, max_length=50)
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    blood_group: Optional[str] = Field(None, max_length=10)
    address: Optional[str] = None
    parent_name: Optional[str] = Field(None, max_length=255)
    parent_email: Optional[EmailStr] = None
    parent_phone: Optional[str] = Field(None, max_length=20)
    admission_date: Optional[date] = None
    is_active: bool = True


class StudentCreate(StudentBase):
    institution_id: int
    section_id: Optional[int] = None
    user_id: Optional[int] = None


class StudentUpdate(BaseModel):
    admission_number: Optional[str] = Field(None, max_length=50)
    roll_number: Optional[str] = Field(None, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    blood_group: Optional[str] = Field(None, max_length=10)
    address: Optional[str] = None
    parent_name: Optional[str] = Field(None, max_length=255)
    parent_email: Optional[EmailStr] = None
    parent_phone: Optional[str] = Field(None, max_length=20)
    admission_date: Optional[date] = None
    section_id: Optional[int] = None
    is_active: Optional[bool] = None


class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    user_id: Optional[int] = None
    section_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class StudentBulkImportRow(BaseModel):
    admission_number: Optional[str] = None
    roll_number: Optional[str] = None
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone: Optional[str] = None
    admission_date: Optional[str] = None
    section_name: Optional[str] = None
    grade_name: Optional[str] = None


class BulkImportResult(BaseModel):
    total: int
    success: int
    failed: int
    errors: List[dict] = []
