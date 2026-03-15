from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.document_vault import (
    DocumentUploadRequest,
    FamilyDocumentResponse,
    FamilyDocumentUpdate,
    DocumentShareCreate,
    DocumentShareUpdate,
    DocumentShareResponse,
    BulkUploadResult,
    DocumentDownloadResponse,
    DocumentFolderStructure,
    ExpiringDocumentAlert,
    DocumentStatistics,
    AuditTrailResponse,
    DocumentAccessLogResponse,
    DocumentType
)
from src.services.document_vault_service import DocumentVaultService
from src.config import settings


router = APIRouter()


def get_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post("/upload", response_model=FamilyDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    student_id: int = Query(...),
    document_name: str = Query(...),
    document_type: DocumentType = Query(...),
    expiry_date: Optional[str] = Query(None),
    is_sensitive: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    
    if file.size and file.size > settings.document_vault_max_file_size:
        max_size_mb = settings.document_vault_max_file_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {max_size_mb}MB limit"
        )
    
    allowed_types = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed"
        )
    
    expiry_datetime = None
    if expiry_date:
        try:
            expiry_datetime = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid expiry date format"
            )
    
    upload_request = DocumentUploadRequest(
        student_id=student_id,
        document_name=document_name,
        document_type=document_type,
        expiry_date=expiry_datetime,
        is_sensitive=is_sensitive
    )
    
    service = DocumentVaultService(db)
    
    from src.models.role import Role
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = user_role.name if user_role else "user"
    
    document = service.create_document(
        file=file,
        request_data=upload_request,
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        user_role=role_name,
        ip_address=get_client_ip(request)
    )
    
    return document


@router.post("/bulk-upload", response_model=BulkUploadResult)
async def bulk_upload_documents(
    request: Request,
    files: List[UploadFile] = File(...),
    student_id: int = Query(...),
    auto_categorize: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(files) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 files allowed per bulk upload"
        )
    
    service = DocumentVaultService(db)
    
    from src.models.role import Role
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = user_role.name if user_role else "user"
    
    result = service.bulk_upload_documents(
        files=files,
        student_id=student_id,
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        user_role=role_name,
        auto_categorize=auto_categorize,
        ip_address=get_client_ip(request)
    )
    
    return result


@router.get("/", response_model=dict)
async def list_documents(
    student_id: Optional[int] = Query(None),
    document_type: Optional[str] = Query(None),
    is_archived: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    documents, total = service.list_documents(
        institution_id=current_user.institution_id,
        student_id=student_id,
        document_type=document_type,
        is_archived=is_archived,
        skip=skip,
        limit=limit
    )
    
    return {
        "items": documents,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/folder-structure/{student_id}", response_model=DocumentFolderStructure)
async def get_folder_structure(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    
    from src.models.role import Role
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = user_role.name if user_role else "user"
    
    return service.get_folder_structure(
        institution_id=current_user.institution_id,
        student_id=student_id,
        user_id=current_user.id,
        user_role=role_name
    )


@router.get("/statistics", response_model=DocumentStatistics)
async def get_statistics(
    student_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    return service.get_statistics(
        institution_id=current_user.institution_id,
        student_id=student_id
    )


@router.get("/expiring", response_model=List[ExpiringDocumentAlert])
async def get_expiring_documents(
    days_ahead: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    return service.get_expiring_documents(
        institution_id=current_user.institution_id,
        days_ahead=days_ahead
    )


@router.get("/{document_id}", response_model=FamilyDocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    
    from src.models.role import Role
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = user_role.name if user_role else "user"
    
    document = service.get_document(
        document_id=document_id,
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        user_role=role_name
    )
    
    return document


@router.get("/{document_id}/download", response_model=DocumentDownloadResponse)
async def download_document(
    request: Request,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    
    from src.models.role import Role
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = user_role.name if user_role else "user"
    
    presigned_url, document = service.download_document(
        document_id=document_id,
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        user_role=role_name,
        ip_address=get_client_ip(request)
    )
    
    return DocumentDownloadResponse(
        presigned_url=presigned_url,
        document_name=document.document_name,
        mime_type=document.mime_type,
        expires_in_seconds=3600
    )


@router.put("/{document_id}", response_model=FamilyDocumentResponse)
async def update_document(
    document_id: int,
    update_data: FamilyDocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    
    from src.models.role import Role
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = user_role.name if user_role else "user"
    
    document = service.update_document(
        document_id=document_id,
        update_data=update_data,
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        user_role=role_name
    )
    
    return document


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    permanent: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    
    from src.models.role import Role
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = user_role.name if user_role else "user"
    
    success = service.delete_document(
        document_id=document_id,
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        user_role=role_name,
        permanent=permanent
    )
    
    return {"success": success, "message": "Document deleted successfully"}


@router.post("/share", response_model=DocumentShareResponse, status_code=status.HTTP_201_CREATED)
async def share_document(
    share_data: DocumentShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    
    from src.models.role import Role
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = user_role.name if user_role else "user"
    
    share = service.share_document(
        share_data=share_data,
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        user_role=role_name
    )
    
    return share


@router.delete("/share/{share_id}")
async def revoke_share(
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    
    from src.models.role import Role
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = user_role.name if user_role else "user"
    
    success = service.revoke_share(
        share_id=share_id,
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        user_role=role_name
    )
    
    return {"success": success, "message": "Share revoked successfully"}


@router.get("/{document_id}/audit-trail", response_model=AuditTrailResponse)
async def get_audit_trail(
    document_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentVaultService(db)
    
    from src.models.role import Role
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = user_role.name if user_role else "user"
    
    document = service.get_document(
        document_id=document_id,
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        user_role=role_name
    )
    
    logs, total = service.get_access_logs(
        document_id=document_id,
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        user_role=role_name,
        skip=skip,
        limit=limit
    )
    
    return AuditTrailResponse(
        document_id=document.id,
        document_name=document.document_name,
        access_logs=logs,
        total_accesses=total
    )
