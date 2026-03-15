from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class DocumentType(str, Enum):
    BIRTH_CERTIFICATE = "birth_certificate"
    IMMUNIZATION_RECORD = "immunization_record"
    REPORT_CARD = "report_card"
    IEP = "IEP"
    PLAN_504 = "504_plan"
    TRANSCRIPT = "transcript"
    TEST_SCORES = "test_scores"
    MEDICAL_RECORDS = "medical_records"
    INSURANCE = "insurance"
    ID_PROOF = "ID_proof"
    OTHER = "other"


class ShareType(str, Enum):
    TEACHER = "teacher"
    COUNSELOR = "counselor"
    NURSE = "nurse"
    ADMIN = "admin"
    PARENT = "parent"


class ActionType(str, Enum):
    UPLOAD = "upload"
    VIEW = "view"
    DOWNLOAD = "download"
    SHARE = "share"
    REVOKE_SHARE = "revoke_share"
    DELETE = "delete"
    UPDATE = "update"


class FamilyDocumentBase(BaseModel):
    document_name: str = Field(..., max_length=255)
    document_type: DocumentType
    expiry_date: Optional[datetime] = None
    shared_with: Optional[List[str]] = None
    is_sensitive: bool = True


class FamilyDocumentCreate(FamilyDocumentBase):
    student_id: int
    metadata: Optional[Dict[str, Any]] = None


class FamilyDocumentUpdate(BaseModel):
    document_name: Optional[str] = Field(None, max_length=255)
    document_type: Optional[DocumentType] = None
    expiry_date: Optional[datetime] = None
    shared_with: Optional[List[str]] = None
    is_sensitive: Optional[bool] = None
    is_archived: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class FamilyDocumentResponse(FamilyDocumentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    uploaded_by_user_id: Optional[int] = None
    file_url: str
    s3_key: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by_role: Optional[str] = None
    is_archived: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class DocumentAccessLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    user_id: Optional[int] = None
    action_type: str
    user_role: Optional[str] = None
    user_name: Optional[str] = None
    ip_address: Optional[str] = None
    access_granted: bool
    denial_reason: Optional[str] = None
    created_at: datetime


class DocumentShareCreate(BaseModel):
    document_id: int
    shared_with_user_id: int
    share_type: ShareType
    permissions: Optional[List[str]] = Field(default=["view"])
    expiry_date: Optional[datetime] = None


class DocumentShareUpdate(BaseModel):
    permissions: Optional[List[str]] = None
    expiry_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class DocumentShareResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    shared_by_user_id: Optional[int] = None
    shared_with_user_id: Optional[int] = None
    share_type: str
    permissions: Optional[List[str]] = None
    expiry_date: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DocumentUploadRequest(BaseModel):
    student_id: int
    document_name: str = Field(..., max_length=255)
    document_type: DocumentType
    expiry_date: Optional[datetime] = None
    shared_with: Optional[List[str]] = None
    is_sensitive: bool = True
    metadata: Optional[Dict[str, Any]] = None


class BulkDocumentUploadRequest(BaseModel):
    student_id: int
    auto_categorize: bool = True
    shared_with: Optional[List[str]] = None


class BulkUploadResult(BaseModel):
    total_files: int
    successful_uploads: int
    failed_uploads: int
    uploaded_documents: List[FamilyDocumentResponse]
    errors: List[Dict[str, str]]


class DocumentDownloadResponse(BaseModel):
    presigned_url: str
    document_name: str
    mime_type: Optional[str] = None
    expires_in_seconds: int = 3600


class DocumentFolderStructure(BaseModel):
    student_id: int
    student_name: str
    folders: Dict[str, List[FamilyDocumentResponse]]
    total_documents: int
    total_size_bytes: int


class ExpiringDocumentAlert(BaseModel):
    document_id: int
    document_name: str
    document_type: str
    student_id: int
    student_name: str
    expiry_date: datetime
    days_until_expiry: int


class DocumentStatistics(BaseModel):
    total_documents: int
    documents_by_type: Dict[str, int]
    documents_by_student: Dict[int, int]
    expiring_soon_count: int
    total_size_bytes: int
    recent_uploads: List[FamilyDocumentResponse]


class AuditTrailResponse(BaseModel):
    document_id: int
    document_name: str
    access_logs: List[DocumentAccessLogResponse]
    total_accesses: int
