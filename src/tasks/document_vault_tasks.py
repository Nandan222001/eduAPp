from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging
from celery import Task
from sqlalchemy import and_, func

from src.celery_app import celery_app
from src.database import SessionLocal
from src.models.document_vault import (
    FamilyDocument,
    DocumentExpirationAlert
)
from src.models.notification import Notification

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    _db = None

    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.document_vault_tasks.check_expiring_documents")
def check_expiring_documents(self) -> Dict[str, Any]:
    try:
        now = datetime.utcnow()
        
        pending_alerts = self.db.query(DocumentExpirationAlert).filter(
            DocumentExpirationAlert.is_sent == False
        ).all()
        
        notifications_sent = 0
        
        for alert in pending_alerts:
            document = self.db.query(FamilyDocument).filter(
                FamilyDocument.id == alert.document_id
            ).first()
            
            if not document or not document.expiry_date:
                continue
            
            days_until_expiry = (document.expiry_date - now).days
            
            if days_until_expiry <= alert.days_before_expiry:
                notification = Notification(
                    institution_id=alert.institution_id,
                    user_id=alert.user_id,
                    title=f"Document Expiring Soon: {document.document_name}",
                    message=f"The document '{document.document_name}' will expire in {days_until_expiry} days.",
                    type="document_expiration",
                    priority="high" if days_until_expiry <= 7 else "medium",
                    metadata={
                        "document_id": document.id,
                        "document_name": document.document_name,
                        "document_type": document.document_type,
                        "expiry_date": document.expiry_date.isoformat(),
                        "days_until_expiry": days_until_expiry
                    }
                )
                self.db.add(notification)
                
                alert.is_sent = True
                alert.sent_at = now
                
                notifications_sent += 1
        
        self.db.commit()
        
        logger.info(f"Document expiration check completed. Notifications sent: {notifications_sent}")
        
        return {
            "status": "success",
            "notifications_sent": notifications_sent,
            "alerts_checked": len(pending_alerts)
        }
    
    except Exception as e:
        logger.error(f"Error checking expiring documents: {str(e)}")
        self.db.rollback()
        return {
            "status": "error",
            "error": str(e)
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.document_vault_tasks.cleanup_expired_shares")
def cleanup_expired_shares(self) -> Dict[str, Any]:
    try:
        from src.models.document_vault import DocumentShare
        
        now = datetime.utcnow()
        
        expired_shares = self.db.query(DocumentShare).filter(
            and_(
                DocumentShare.is_active == True,
                DocumentShare.expiry_date.isnot(None),
                DocumentShare.expiry_date <= now
            )
        ).all()
        
        for share in expired_shares:
            share.is_active = False
            share.revoked_at = now
        
        self.db.commit()
        
        logger.info(f"Cleaned up {len(expired_shares)} expired document shares")
        
        return {
            "status": "success",
            "expired_shares_cleaned": len(expired_shares)
        }
    
    except Exception as e:
        logger.error(f"Error cleaning up expired shares: {str(e)}")
        self.db.rollback()
        return {
            "status": "error",
            "error": str(e)
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.document_vault_tasks.generate_document_reports")
def generate_document_reports(self, institution_id: int) -> Dict[str, Any]:
    try:
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        total_documents = self.db.query(func.count(FamilyDocument.id)).filter(
            and_(
                FamilyDocument.institution_id == institution_id,
                FamilyDocument.is_deleted == False
            )
        ).scalar()
        
        recent_uploads = self.db.query(func.count(FamilyDocument.id)).filter(
            and_(
                FamilyDocument.institution_id == institution_id,
                FamilyDocument.is_deleted == False,
                FamilyDocument.created_at >= thirty_days_ago
            )
        ).scalar()
        
        expiring_soon = self.db.query(func.count(FamilyDocument.id)).filter(
            and_(
                FamilyDocument.institution_id == institution_id,
                FamilyDocument.is_deleted == False,
                FamilyDocument.expiry_date.isnot(None),
                FamilyDocument.expiry_date <= now + timedelta(days=30),
                FamilyDocument.expiry_date >= now
            )
        ).scalar()
        
        report = {
            "institution_id": institution_id,
            "report_date": now.isoformat(),
            "total_documents": total_documents,
            "recent_uploads_30_days": recent_uploads,
            "expiring_soon_30_days": expiring_soon
        }
        
        logger.info(f"Generated document report for institution {institution_id}")
        
        return {
            "status": "success",
            "report": report
        }
    
    except Exception as e:
        logger.error(f"Error generating document reports: {str(e)}")
        return {
            "status": "error",
            "error": str(e)
        }


@celery_app.task(base=DatabaseTask, bind=True, name="src.tasks.document_vault_tasks.archive_old_documents")
def archive_old_documents(self, days_threshold: int = 365) -> Dict[str, Any]:
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_threshold)
        
        old_documents = self.db.query(FamilyDocument).filter(
            and_(
                FamilyDocument.created_at <= cutoff_date,
                FamilyDocument.is_archived == False,
                FamilyDocument.is_deleted == False,
                FamilyDocument.expiry_date.isnot(None),
                FamilyDocument.expiry_date <= datetime.utcnow()
            )
        ).all()
        
        for doc in old_documents:
            doc.is_archived = True
            doc.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        logger.info(f"Archived {len(old_documents)} old documents")
        
        return {
            "status": "success",
            "documents_archived": len(old_documents),
            "days_threshold": days_threshold
        }
    
    except Exception as e:
        logger.error(f"Error archiving old documents: {str(e)}")
        self.db.rollback()
        return {
            "status": "error",
            "error": str(e)
        }
