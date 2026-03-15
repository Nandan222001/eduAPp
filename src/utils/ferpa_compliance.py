from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.document_vault import FamilyDocument, DocumentAccessLog


class FERPAComplianceChecker:
    @staticmethod
    def can_access_document(
        document: FamilyDocument,
        user: User,
        user_role: str,
        db: Session
    ) -> tuple[bool, Optional[str]]:
        if user_role in ["admin", "super_admin", "institution_admin"]:
            return True, None
        
        if document.uploaded_by_user_id == user.id:
            return True, None
        
        if user_role == "parent":
            from src.models.student import StudentParent, Parent
            
            parent = db.query(Parent).filter(Parent.user_id == user.id).first()
            if parent:
                student_parent_link = db.query(StudentParent).filter(
                    StudentParent.parent_id == parent.id,
                    StudentParent.student_id == document.student_id
                ).first()
                
                if student_parent_link:
                    return True, None
        
        if document.shared_with and user_role in document.shared_with:
            return True, None
        
        from src.models.document_vault import DocumentShare
        active_share = db.query(DocumentShare).filter(
            DocumentShare.document_id == document.id,
            DocumentShare.shared_with_user_id == user.id,
            DocumentShare.is_active == True
        ).first()
        
        if active_share:
            if active_share.expiry_date and active_share.expiry_date < datetime.utcnow():
                return False, "Share has expired"
            return True, None
        
        return False, "Access denied - insufficient permissions"
    
    @staticmethod
    def get_allowed_document_types(user_role: str) -> List[str]:
        role_permissions = {
            "admin": "all",
            "super_admin": "all",
            "institution_admin": "all",
            "teacher": [
                "report_card",
                "IEP",
                "504_plan",
                "transcript",
                "test_scores"
            ],
            "counselor": [
                "report_card",
                "IEP",
                "504_plan",
                "transcript",
                "test_scores",
                "medical_records"
            ],
            "nurse": [
                "immunization_record",
                "medical_records",
                "insurance"
            ],
            "parent": "all",
            "student": [
                "report_card",
                "transcript",
                "test_scores"
            ]
        }
        
        return role_permissions.get(user_role, [])
    
    @staticmethod
    def log_ferpa_access(
        document_id: int,
        user_id: int,
        institution_id: int,
        action_type: str,
        access_granted: bool,
        user_role: Optional[str] = None,
        user_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        denial_reason: Optional[str] = None,
        db: Session = None
    ) -> DocumentAccessLog:
        if not db:
            return None
        
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
            metadata={
                "ferpa_logged": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        db.add(log)
        db.commit()
        
        return log
    
    @staticmethod
    def check_consent_requirements(
        document: FamilyDocument,
        intended_recipient: User,
        db: Session
    ) -> tuple[bool, Optional[str]]:
        sensitive_document_types = [
            "medical_records",
            "IEP",
            "504_plan",
            "insurance"
        ]
        
        if document.document_type in sensitive_document_types:
            from src.models.document_vault import DocumentShare
            
            active_share = db.query(DocumentShare).filter(
                DocumentShare.document_id == document.id,
                DocumentShare.shared_with_user_id == intended_recipient.id,
                DocumentShare.is_active == True
            ).first()
            
            if not active_share:
                return False, "Explicit consent required for sharing sensitive documents"
        
        return True, None
    
    @staticmethod
    def generate_ferpa_audit_report(
        institution_id: int,
        start_date: datetime,
        end_date: datetime,
        db: Session
    ) -> Dict[str, Any]:
        logs = db.query(DocumentAccessLog).filter(
            DocumentAccessLog.institution_id == institution_id,
            DocumentAccessLog.created_at >= start_date,
            DocumentAccessLog.created_at <= end_date
        ).all()
        
        report = {
            "institution_id": institution_id,
            "report_period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "total_access_attempts": len(logs),
            "access_granted": sum(1 for log in logs if log.access_granted),
            "access_denied": sum(1 for log in logs if not log.access_granted),
            "access_by_action": {},
            "access_by_role": {},
            "denied_access_reasons": {}
        }
        
        for log in logs:
            action = log.action_type
            report["access_by_action"][action] = report["access_by_action"].get(action, 0) + 1
            
            if log.user_role:
                role = log.user_role
                report["access_by_role"][role] = report["access_by_role"].get(role, 0) + 1
            
            if not log.access_granted and log.denial_reason:
                reason = log.denial_reason
                report["denied_access_reasons"][reason] = report["denied_access_reasons"].get(reason, 0) + 1
        
        return report
    
    @staticmethod
    def validate_retention_compliance(
        document: FamilyDocument,
        retention_years: int = 7
    ) -> tuple[bool, Optional[str]]:
        from datetime import timedelta
        
        retention_period = timedelta(days=retention_years * 365)
        document_age = datetime.utcnow() - document.created_at
        
        if document_age > retention_period and not document.is_archived:
            return False, f"Document should be archived after {retention_years} years"
        
        return True, None


ferpa_checker = FERPAComplianceChecker()
