import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from io import BytesIO

from src.models.document_vault import FamilyDocument, DocumentAccessLog, DocumentShare
from src.schemas.document_vault import (
    DocumentUploadRequest,
    FamilyDocumentUpdate,
    DocumentShareCreate,
    DocumentType,
    ShareType
)
from src.services.document_vault_service import DocumentVaultService
from src.services.encryption_service import encryption_service


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def document_service(mock_db):
    return DocumentVaultService(mock_db)


@pytest.fixture
def mock_file():
    file = MagicMock()
    file.filename = "test_document.pdf"
    file.content_type = "application/pdf"
    file.file = BytesIO(b"test file content")
    return file


@pytest.fixture
def sample_document():
    return FamilyDocument(
        id=1,
        institution_id=1,
        student_id=1,
        uploaded_by_user_id=1,
        document_name="Test Document",
        document_type="birth_certificate",
        file_url="https://s3.example.com/test.pdf",
        s3_key="documents/1/1/birth_certificate/test.pdf",
        encryption_key="test_encryption_key",
        file_size=1024,
        mime_type="application/pdf",
        is_sensitive=True,
        is_archived=False,
        is_deleted=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


class TestEncryptionService:
    def test_generate_encryption_key(self):
        key1 = encryption_service.generate_encryption_key()
        key2 = encryption_service.generate_encryption_key()
        
        assert key1 != key2
        assert len(key1) > 0
        assert isinstance(key1, str)
    
    def test_encrypt_decrypt_file(self):
        key = encryption_service.generate_encryption_key()
        original_data = b"This is sensitive document content"
        
        encrypted = encryption_service.encrypt_file(original_data, key)
        assert encrypted != original_data
        
        decrypted = encryption_service.decrypt_file(encrypted, key)
        assert decrypted == original_data
    
    def test_encrypt_decrypt_text(self):
        key = encryption_service.generate_encryption_key()
        original_text = "Sensitive information"
        
        encrypted = encryption_service.encrypt_text(original_text, key)
        assert encrypted != original_text
        
        decrypted = encryption_service.decrypt_text(encrypted, key)
        assert decrypted == original_text


class TestDocumentVaultService:
    @patch('src.services.document_vault_service.s3_client')
    @patch('src.services.document_vault_service.ocr_service')
    def test_create_document(self, mock_ocr, mock_s3, document_service, mock_file, mock_db):
        mock_s3.upload_file.return_value = (
            "https://s3.example.com/test.pdf",
            "documents/1/1/birth_certificate/test.pdf"
        )
        mock_ocr.extract_text_from_pdf.return_value = "Extracted text"
        
        request_data = DocumentUploadRequest(
            student_id=1,
            document_name="Test Document",
            document_type=DocumentType.BIRTH_CERTIFICATE,
            is_sensitive=True
        )
        
        mock_db.add = MagicMock()
        mock_db.commit = MagicMock()
        mock_db.refresh = MagicMock()
        
        document = document_service.create_document(
            file=mock_file,
            request_data=request_data,
            institution_id=1,
            user_id=1,
            user_role="admin"
        )
        
        mock_db.add.assert_called()
        mock_db.commit.assert_called()
    
    def test_categorize_document(self, document_service):
        assert document_service._categorize_document("birth_certificate.pdf") == DocumentType.BIRTH_CERTIFICATE
        assert document_service._categorize_document("immunization_record.pdf") == DocumentType.IMMUNIZATION_RECORD
        assert document_service._categorize_document("report_card_2024.pdf") == DocumentType.REPORT_CARD
        assert document_service._categorize_document("iep_document.pdf") == DocumentType.IEP
        assert document_service._categorize_document("504_plan.pdf") == DocumentType.PLAN_504
        assert document_service._categorize_document("transcript.pdf") == DocumentType.TRANSCRIPT
        assert document_service._categorize_document("test_scores_sat.pdf") == DocumentType.TEST_SCORES
        assert document_service._categorize_document("medical_records.pdf") == DocumentType.MEDICAL_RECORDS
        assert document_service._categorize_document("insurance_card.pdf") == DocumentType.INSURANCE
        assert document_service._categorize_document("id_proof.pdf") == DocumentType.ID_PROOF
        assert document_service._categorize_document("random_file.pdf") == DocumentType.OTHER
    
    def test_has_access_uploader(self, document_service, sample_document):
        assert document_service._has_access(sample_document, user_id=1, user_role="parent") is True
    
    def test_has_access_admin(self, document_service, sample_document):
        assert document_service._has_access(sample_document, user_id=999, user_role="admin") is True
        assert document_service._has_access(sample_document, user_id=999, user_role="super_admin") is True
        assert document_service._has_access(sample_document, user_id=999, user_role="institution_admin") is True
    
    def test_has_access_shared_with_role(self, document_service, sample_document):
        sample_document.shared_with = ["teacher", "counselor"]
        assert document_service._has_access(sample_document, user_id=999, user_role="teacher") is True
        assert document_service._has_access(sample_document, user_id=999, user_role="counselor") is True
        assert document_service._has_access(sample_document, user_id=999, user_role="nurse") is False


class TestDocumentTypes:
    def test_document_type_enum(self):
        assert DocumentType.BIRTH_CERTIFICATE == "birth_certificate"
        assert DocumentType.IMMUNIZATION_RECORD == "immunization_record"
        assert DocumentType.REPORT_CARD == "report_card"
        assert DocumentType.IEP == "IEP"
        assert DocumentType.PLAN_504 == "504_plan"
        assert DocumentType.TRANSCRIPT == "transcript"
        assert DocumentType.TEST_SCORES == "test_scores"
        assert DocumentType.MEDICAL_RECORDS == "medical_records"
        assert DocumentType.INSURANCE == "insurance"
        assert DocumentType.ID_PROOF == "ID_proof"
        assert DocumentType.OTHER == "other"


class TestFERPACompliance:
    def test_access_logging(self, document_service, mock_db):
        mock_db.add = MagicMock()
        mock_db.commit = MagicMock()
        
        document_service._log_access(
            document_id=1,
            user_id=1,
            institution_id=1,
            action_type="view",
            user_role="teacher",
            access_granted=True
        )
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        
        call_args = mock_db.add.call_args[0][0]
        assert isinstance(call_args, DocumentAccessLog)
        assert call_args.document_id == 1
        assert call_args.user_id == 1
        assert call_args.action_type == "view"
        assert call_args.access_granted is True


class TestDocumentSharing:
    def test_share_type_enum(self):
        assert ShareType.TEACHER == "teacher"
        assert ShareType.COUNSELOR == "counselor"
        assert ShareType.NURSE == "nurse"
        assert ShareType.ADMIN == "admin"
        assert ShareType.PARENT == "parent"
