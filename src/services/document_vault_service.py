from typing import Optional, List, Tuple, Dict, Any, BinaryIO
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta
from fastapi import HTTPException, status, UploadFile
import io

from src.models.document_vault import (
    FamilyDocument,
    DocumentAccessLog,
    DocumentShare,
    DocumentExpirationAlert
)
from src.schemas.document_vault import (
    DocumentUploadRequest,
    FamilyDocumentCreate,
    FamilyDocumentUpdate,
    DocumentShareCreate,
    DocumentShareUpdate,
    BulkUploadResult,
    DocumentFolderStructure,
    ExpiringDocumentAlert,
    DocumentStatistics,
    DocumentType
)
from src.services.encryption_service import encryption_service
from src.utils.s3_client import s3_client
from src.utils.ocr_service import ocr_service
from src.config import settings


class DocumentVaultService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_document(
        self,
        file: UploadFile,
        request_data: DocumentUploadRequest,
        institution_id: int,
        user_id: int,
        user_role: str,
        ip_address: Optional[str] = None
    ) -> FamilyDocument:
        encryption_key = encryption_service.generate_encryption_key()
        
        file_content = file.file.read()
        file.file.seek(0)
        
        if request_data.is_sensitive:
            encrypted_content = encryption_service.encrypt_file(file_content, encryption_key)
            upload_content = io.BytesIO(encrypted_content)
        else:
            upload_content = io.BytesIO(file_content)
        
        folder = f"documents/{institution_id}/{request_data.student_id}/{request_data.document_type.value}"
        file_url, s3_key = s3_client.upload_file(
            upload_content,
            file.filename or "document",
            folder=folder,
            content_type=file.content_type
        )
        
        ocr_text = None
        if file.content_type == "application/pdf":
            ocr_text = ocr_service.extract_text_from_pdf(file_content)
        
        document = FamilyDocument(
            institution_id=institution_id,
            student_id=request_data.student_id,
            uploaded_by_user_id=user_id,
            uploaded_by_role=user_role,
            document_name=request_data.document_name,
            document_type=request_data.document_type.value,
            file_url=file_url,
            s3_key=s3_key,
            encryption_key=encryption_key,
            file_size=len(file_content),
            mime_type=file.content_type,
            expiry_date=request_data.expiry_date,
            shared_with=request_data.shared_with or [],
            is_sensitive=request_data.is_sensitive,
            ocr_text=ocr_text,
            metadata=request_data.metadata or {}
        )
        
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        
        self._log_access(
            document_id=document.id,
            user_id=user_id,
            institution_id=institution_id,
            action_type="upload",
            user_role=user_role,
            ip_address=ip_address,
            access_granted=True
        )
        
        if request_data.expiry_date:
            self._create_expiration_alerts(document)
        
        return document
    
    def bulk_upload_documents(
        self,
        files: List[UploadFile],
        student_id: int,
        institution_id: int,
        user_id: int,
        user_role: str,
        auto_categorize: bool = True,
        shared_with: Optional[List[str]] = None,
        ip_address: Optional[str] = None
    ) -> BulkUploadResult:
        uploaded_documents = []
        errors = []
        successful = 0
        failed = 0
        
        for file in files:
            try:
                document_type = DocumentType.OTHER
                
                if auto_categorize:
                    document_type = self._categorize_document(file.filename or "")
                
                upload_request = DocumentUploadRequest(
                    student_id=student_id,
                    document_name=file.filename or "Untitled Document",
                    document_type=document_type,
                    shared_with=shared_with,
                    is_sensitive=True,
                    metadata={"auto_categorized": auto_categorize}
                )
                
                document = self.create_document(
                    file,
                    upload_request,
                    institution_id,
                    user_id,
                    user_role,
                    ip_address
                )
                
                uploaded_documents.append(document)
                successful += 1
                
            except Exception as e:
                errors.append({
                    "filename": file.filename or "unknown",
                    "error": str(e)
                })
                failed += 1
        
        return BulkUploadResult(
            total_files=len(files),
            successful_uploads=successful,
            failed_uploads=failed,
            uploaded_documents=uploaded_documents,
            errors=errors
        )
    
    def get_document(
        self,
        document_id: int,
        institution_id: int,
        user_id: int,
        user_role: str,
        check_permissions: bool = True
    ) -> FamilyDocument:
        document = self.db.query(FamilyDocument).filter(
            and_(
                FamilyDocument.id == document_id,
                FamilyDocument.institution_id == institution_id,
                FamilyDocument.is_deleted == False
            )
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        if check_permissions and not self._has_access(document, user_id, user_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this document"
            )
        
        return document
    
    def download_document(
        self,
        document_id: int,
        institution_id: int,
        user_id: int,
        user_role: str,
        ip_address: Optional[str] = None
    ) -> Tuple[str, FamilyDocument]:
        document = self.get_document(document_id, institution_id, user_id, user_role)
        
        presigned_url = s3_client.generate_presigned_url(
            document.s3_key,
            expiration=settings.document_vault_presigned_url_expiry
        )
        
        self._log_access(
            document_id=document.id,
            user_id=user_id,
            institution_id=institution_id,
            action_type="download",
            user_role=user_role,
            ip_address=ip_address,
            access_granted=True
        )
        
        return presigned_url, document
    
    def update_document(
        self,
        document_id: int,
        update_data: FamilyDocumentUpdate,
        institution_id: int,
        user_id: int,
        user_role: str
    ) -> FamilyDocument:
        document = self.get_document(document_id, institution_id, user_id, user_role)
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        if "document_type" in update_dict:
            update_dict["document_type"] = update_dict["document_type"].value
        
        for key, value in update_dict.items():
            setattr(document, key, value)
        
        document.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(document)
        
        self._log_access(
            document_id=document.id,
            user_id=user_id,
            institution_id=institution_id,
            action_type="update",
            user_role=user_role,
            access_granted=True
        )
        
        return document
    
    def delete_document(
        self,
        document_id: int,
        institution_id: int,
        user_id: int,
        user_role: str,
        permanent: bool = False
    ) -> bool:
        document = self.get_document(document_id, institution_id, user_id, user_role)
        
        if permanent:
            try:
                s3_client.delete_file(document.s3_key)
            except Exception:
                pass
            
            self.db.delete(document)
        else:
            document.is_deleted = True
            document.deleted_at = datetime.utcnow()
        
        self.db.commit()
        
        self._log_access(
            document_id=document.id,
            user_id=user_id,
            institution_id=institution_id,
            action_type="delete",
            user_role=user_role,
            access_granted=True
        )
        
        return True
    
    def list_documents(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        document_type: Optional[str] = None,
        is_archived: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[FamilyDocument], int]:
        query = self.db.query(FamilyDocument).filter(
            and_(
                FamilyDocument.institution_id == institution_id,
                FamilyDocument.is_deleted == False
            )
        )
        
        if student_id:
            query = query.filter(FamilyDocument.student_id == student_id)
        
        if document_type:
            query = query.filter(FamilyDocument.document_type == document_type)
        
        if is_archived is not None:
            query = query.filter(FamilyDocument.is_archived == is_archived)
        
        total = query.count()
        
        documents = query.order_by(desc(FamilyDocument.created_at)).offset(skip).limit(limit).all()
        
        return documents, total
    
    def get_folder_structure(
        self,
        institution_id: int,
        student_id: int,
        user_id: int,
        user_role: str
    ) -> DocumentFolderStructure:
        from src.models.student import Student
        
        student = self.db.query(Student).filter(
            and_(
                Student.id == student_id,
                Student.institution_id == institution_id
            )
        ).first()
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        documents, _ = self.list_documents(
            institution_id=institution_id,
            student_id=student_id,
            limit=1000
        )
        
        folders: Dict[str, List[FamilyDocument]] = {}
        total_size = 0
        
        for doc in documents:
            if self._has_access(doc, user_id, user_role):
                doc_type = doc.document_type
                if doc_type not in folders:
                    folders[doc_type] = []
                folders[doc_type].append(doc)
                total_size += doc.file_size or 0
        
        student_name = f"{student.first_name} {student.last_name}"
        
        return DocumentFolderStructure(
            student_id=student_id,
            student_name=student_name,
            folders=folders,
            total_documents=len(documents),
            total_size_bytes=total_size
        )
    
    def share_document(
        self,
        share_data: DocumentShareCreate,
        institution_id: int,
        user_id: int,
        user_role: str
    ) -> DocumentShare:
        document = self.get_document(
            share_data.document_id,
            institution_id,
            user_id,
            user_role
        )
        
        existing_share = self.db.query(DocumentShare).filter(
            and_(
                DocumentShare.document_id == share_data.document_id,
                DocumentShare.shared_with_user_id == share_data.shared_with_user_id,
                DocumentShare.is_active == True
            )
        ).first()
        
        if existing_share:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document is already shared with this user"
            )
        
        share = DocumentShare(
            document_id=share_data.document_id,
            shared_by_user_id=user_id,
            shared_with_user_id=share_data.shared_with_user_id,
            share_type=share_data.share_type.value,
            permissions=share_data.permissions or ["view"],
            expiry_date=share_data.expiry_date
        )
        
        self.db.add(share)
        self.db.commit()
        self.db.refresh(share)
        
        self._log_access(
            document_id=document.id,
            user_id=user_id,
            institution_id=institution_id,
            action_type="share",
            user_role=user_role,
            access_granted=True,
            metadata={
                "shared_with_user_id": share_data.shared_with_user_id,
                "share_type": share_data.share_type.value
            }
        )
        
        return share
    
    def revoke_share(
        self,
        share_id: int,
        institution_id: int,
        user_id: int,
        user_role: str
    ) -> bool:
        share = self.db.query(DocumentShare).filter(
            DocumentShare.id == share_id
        ).first()
        
        if not share:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Share not found"
            )
        
        document = self.get_document(
            share.document_id,
            institution_id,
            user_id,
            user_role
        )
        
        share.is_active = False
        share.revoked_at = datetime.utcnow()
        
        self.db.commit()
        
        self._log_access(
            document_id=document.id,
            user_id=user_id,
            institution_id=institution_id,
            action_type="revoke_share",
            user_role=user_role,
            access_granted=True,
            metadata={"share_id": share_id}
        )
        
        return True
    
    def get_expiring_documents(
        self,
        institution_id: int,
        days_ahead: int = 30
    ) -> List[ExpiringDocumentAlert]:
        from src.models.student import Student
        
        cutoff_date = datetime.utcnow() + timedelta(days=days_ahead)
        
        documents = self.db.query(FamilyDocument, Student).join(
            Student, FamilyDocument.student_id == Student.id
        ).filter(
            and_(
                FamilyDocument.institution_id == institution_id,
                FamilyDocument.is_deleted == False,
                FamilyDocument.expiry_date.isnot(None),
                FamilyDocument.expiry_date <= cutoff_date,
                FamilyDocument.expiry_date >= datetime.utcnow()
            )
        ).all()
        
        alerts = []
        for doc, student in documents:
            days_until_expiry = (doc.expiry_date - datetime.utcnow()).days
            
            alerts.append(ExpiringDocumentAlert(
                document_id=doc.id,
                document_name=doc.document_name,
                document_type=doc.document_type,
                student_id=student.id,
                student_name=f"{student.first_name} {student.last_name}",
                expiry_date=doc.expiry_date,
                days_until_expiry=days_until_expiry
            ))
        
        return alerts
    
    def get_access_logs(
        self,
        document_id: int,
        institution_id: int,
        user_id: int,
        user_role: str,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[DocumentAccessLog], int]:
        document = self.get_document(document_id, institution_id, user_id, user_role)
        
        query = self.db.query(DocumentAccessLog).filter(
            DocumentAccessLog.document_id == document_id
        )
        
        total = query.count()
        
        logs = query.order_by(desc(DocumentAccessLog.created_at)).offset(skip).limit(limit).all()
        
        return logs, total
    
    def get_statistics(
        self,
        institution_id: int,
        student_id: Optional[int] = None
    ) -> DocumentStatistics:
        query = self.db.query(FamilyDocument).filter(
            and_(
                FamilyDocument.institution_id == institution_id,
                FamilyDocument.is_deleted == False
            )
        )
        
        if student_id:
            query = query.filter(FamilyDocument.student_id == student_id)
        
        documents = query.all()
        
        total_documents = len(documents)
        total_size = sum(doc.file_size or 0 for doc in documents)
        
        documents_by_type: Dict[str, int] = {}
        documents_by_student: Dict[int, int] = {}
        
        for doc in documents:
            documents_by_type[doc.document_type] = documents_by_type.get(doc.document_type, 0) + 1
            documents_by_student[doc.student_id] = documents_by_student.get(doc.student_id, 0) + 1
        
        expiring_soon = sum(
            1 for doc in documents
            if doc.expiry_date and doc.expiry_date <= datetime.utcnow() + timedelta(days=30)
        )
        
        recent_uploads = sorted(documents, key=lambda x: x.created_at, reverse=True)[:10]
        
        return DocumentStatistics(
            total_documents=total_documents,
            documents_by_type=documents_by_type,
            documents_by_student=documents_by_student,
            expiring_soon_count=expiring_soon,
            total_size_bytes=total_size,
            recent_uploads=recent_uploads
        )
    
    def _has_access(
        self,
        document: FamilyDocument,
        user_id: int,
        user_role: str
    ) -> bool:
        if user_id == document.uploaded_by_user_id:
            return True
        
        if user_role in ["admin", "super_admin", "institution_admin"]:
            return True
        
        if document.shared_with and user_role in document.shared_with:
            return True
        
        active_share = self.db.query(DocumentShare).filter(
            and_(
                DocumentShare.document_id == document.id,
                DocumentShare.shared_with_user_id == user_id,
                DocumentShare.is_active == True,
                or_(
                    DocumentShare.expiry_date.is_(None),
                    DocumentShare.expiry_date > datetime.utcnow()
                )
            )
        ).first()
        
        return active_share is not None
    
    def _log_access(
        self,
        document_id: int,
        user_id: int,
        institution_id: int,
        action_type: str,
        user_role: Optional[str] = None,
        user_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        access_granted: bool = True,
        denial_reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> DocumentAccessLog:
        log = DocumentAccessLog(
            document_id=document_id,
            user_id=user_id,
            institution_id=institution_id,
            action_type=action_type,
            user_role=user_role,
            user_name=user_name,
            ip_address=ip_address,
            access_granted=access_granted,
            denial_reason=denial_reason,
            metadata=metadata
        )
        
        self.db.add(log)
        self.db.commit()
        
        return log
    
    def _create_expiration_alerts(self, document: FamilyDocument) -> None:
        if not document.expiry_date:
            return
        
        alert_days = [7, 14, 30]
        
        for days in alert_days:
            alert = DocumentExpirationAlert(
                document_id=document.id,
                user_id=document.uploaded_by_user_id,
                institution_id=document.institution_id,
                alert_type="expiration_warning",
                days_before_expiry=days
            )
            self.db.add(alert)
        
        self.db.commit()
    
    def _categorize_document(self, filename: str) -> DocumentType:
        filename_lower = filename.lower()
        
        if any(term in filename_lower for term in ["birth", "certificate"]):
            return DocumentType.BIRTH_CERTIFICATE
        elif any(term in filename_lower for term in ["immunization", "vaccine", "vaccination"]):
            return DocumentType.IMMUNIZATION_RECORD
        elif any(term in filename_lower for term in ["report", "card", "grade"]):
            return DocumentType.REPORT_CARD
        elif "iep" in filename_lower:
            return DocumentType.IEP
        elif "504" in filename_lower:
            return DocumentType.PLAN_504
        elif any(term in filename_lower for term in ["transcript"]):
            return DocumentType.TRANSCRIPT
        elif any(term in filename_lower for term in ["test", "score", "sat", "act"]):
            return DocumentType.TEST_SCORES
        elif any(term in filename_lower for term in ["medical", "health"]):
            return DocumentType.MEDICAL_RECORDS
        elif any(term in filename_lower for term in ["insurance"]):
            return DocumentType.INSURANCE
        elif any(term in filename_lower for term in ["id", "passport", "license"]):
            return DocumentType.ID_PROOF
        else:
            return DocumentType.OTHER
