# Document Vault Implementation

## Overview

This implementation provides a secure, FERPA-compliant digital document vault for managing family and student documents in educational institutions.

## Features Implemented

### 1. Core Models (`src/models/document_vault.py`)

#### FamilyDocument Model
- **Document Metadata**: name, type, size, mime type
- **Security**: AES-256 encryption keys, S3 storage
- **Access Control**: uploaded_by, shared_with array, expiry dates
- **OCR Integration**: Automatic text extraction for searchability
- **Soft Delete**: is_deleted flag for recovery
- **Archive Support**: is_archived flag for retention policies

#### DocumentAccessLog Model
- **Comprehensive Audit Trail**: Tracks all document interactions
- **FERPA Compliance**: IP addresses, user agents, timestamps
- **Access Decisions**: Logs both granted and denied access
- **Metadata**: Additional context for each access event

#### DocumentShare Model
- **Granular Sharing**: Share with specific users
- **Permission Control**: View, download, edit permissions
- **Time-Limited**: Expiry dates for temporary access
- **Revocable**: Can be deactivated at any time

#### DocumentExpirationAlert Model
- **Automated Alerts**: 7, 14, and 30-day warnings
- **Notification Tracking**: sent_at, is_sent fields
- **Multi-level Alerts**: Progressive reminders

### 2. API Endpoints (`src/api/v1/document_vault.py`)

All endpoints are protected by authentication and role-based access control.

#### Document Operations
- `POST /upload` - Upload a single document with encryption
- `POST /bulk-upload` - Upload multiple documents (max 20)
- `GET /` - List documents with filtering
- `GET /{id}` - Get document details
- `GET /{id}/download` - Get secure presigned download URL
- `PUT /{id}` - Update document metadata
- `DELETE /{id}` - Soft or permanent delete

#### Organization & Discovery
- `GET /folder-structure/{student_id}` - Get organized folder view
- `GET /statistics` - Get document analytics
- `GET /expiring` - Get documents expiring soon

#### Sharing & Access
- `POST /share` - Share document with user
- `DELETE /share/{id}` - Revoke document share
- `GET /{id}/audit-trail` - Get complete access history

### 3. Service Layer (`src/services/document_vault_service.py`)

#### DocumentVaultService
- **Encryption**: Automatic AES-256 encryption for sensitive documents
- **OCR Processing**: Text extraction from PDFs
- **Auto-Categorization**: ML-based document type detection
- **Bulk Operations**: Efficient multi-document handling
- **Access Control**: FERPA-compliant permission checks
- **Audit Logging**: Automatic tracking of all operations

Key Methods:
- `create_document()` - Upload with encryption
- `bulk_upload_documents()` - Batch upload with categorization
- `get_document()` - Retrieve with permission check
- `download_document()` - Generate secure presigned URL
- `share_document()` - Manage sharing
- `get_expiring_documents()` - Alert monitoring
- `get_access_logs()` - Audit trail retrieval

### 4. Encryption Service (`src/services/encryption_service.py`)

#### EncryptionService
- **AES-256**: Industry-standard encryption via Fernet
- **Unique Keys**: Per-document encryption keys
- **File & Text**: Support for both binary and text encryption
- **Key Derivation**: PBKDF2 for password-based encryption

Security Features:
- Fernet encryption (AES-128-CBC + HMAC)
- Authenticated encryption prevents tampering
- Random key generation with secure entropy
- No key reuse across documents

### 5. Background Tasks (`src/tasks/document_vault_tasks.py`)

#### Celery Tasks
- `check_expiring_documents` - Daily check for expiring documents
- `cleanup_expired_shares` - Remove expired sharing permissions
- `generate_document_reports` - Analytics and reporting
- `archive_old_documents` - Automatic archival based on retention policy

### 6. FERPA Compliance (`src/utils/ferpa_compliance.py`)

#### FERPAComplianceChecker
- **Access Validation**: Role-based permission checks
- **Consent Management**: Explicit sharing for sensitive documents
- **Audit Reporting**: Comprehensive compliance reports
- **Retention Policies**: Configurable retention periods

Key Functions:
- `can_access_document()` - Permission validation
- `get_allowed_document_types()` - Role-based type filtering
- `log_ferpa_access()` - Compliant access logging
- `check_consent_requirements()` - Sensitive document checks
- `generate_ferpa_audit_report()` - Compliance reporting

### 7. Schemas (`src/schemas/document_vault.py`)

Complete Pydantic models for:
- Document creation, update, response
- Sharing management
- Bulk operations
- Statistics and analytics
- Audit trails

### 8. Database Migration (`alembic/versions/024_create_document_vault_tables.py`)

Complete migration with:
- All tables with proper indexes
- Foreign key constraints
- JSONB fields for metadata
- PostgreSQL ARRAY fields for sharing
- Proper cascade deletes

## Document Types Supported

1. **Birth Certificate** - Legal identity documents
2. **Immunization Records** - Vaccination history
3. **Report Cards** - Academic performance
4. **IEP** - Individualized Education Programs
5. **504 Plan** - Accommodation plans
6. **Transcripts** - Academic records
7. **Test Scores** - Standardized test results
8. **Medical Records** - Health information
9. **Insurance** - Coverage documents
10. **ID Proof** - Identity verification
11. **Other** - Miscellaneous documents

## Security Features

### Encryption
- **AES-256 encryption** for all sensitive documents
- **Unique keys** per document stored securely
- **Encrypted at rest** in S3
- **Encrypted in transit** via HTTPS

### Access Control
- **Role-based permissions** (admin, teacher, counselor, nurse, parent)
- **Document-level sharing** with specific users
- **Time-limited access** via presigned URLs
- **Expiring shares** with automatic revocation

### Audit & Compliance
- **Complete audit trail** of all document access
- **FERPA-compliant logging** with IP addresses
- **Access denial tracking** with reasons
- **Retention policies** with automatic archival

## Configuration

Environment variables (`.env`):

```bash
# Document Vault Configuration
DOCUMENT_VAULT_MAX_FILE_SIZE=52428800          # 50MB default
DOCUMENT_VAULT_PRESIGNED_URL_EXPIRY=3600       # 1 hour
DOCUMENT_VAULT_RETENTION_YEARS=7               # 7 years FERPA requirement
```

## Usage Examples

### Upload Document

```python
import httpx

files = {"file": open("birth_certificate.pdf", "rb")}
data = {
    "student_id": 123,
    "document_name": "Birth Certificate",
    "document_type": "birth_certificate",
    "is_sensitive": True
}

response = httpx.post(
    "http://api.example.com/api/v1/document-vault/upload",
    files=files,
    data=data,
    headers={"Authorization": f"Bearer {token}"}
)
```

### Bulk Upload with Auto-Categorization

```python
files = [
    ("files", open("doc1.pdf", "rb")),
    ("files", open("doc2.pdf", "rb")),
    ("files", open("doc3.pdf", "rb"))
]

response = httpx.post(
    "http://api.example.com/api/v1/document-vault/bulk-upload?student_id=123&auto_categorize=true",
    files=files,
    headers={"Authorization": f"Bearer {token}"}
)
```

### Share Document

```python
share_data = {
    "document_id": 456,
    "shared_with_user_id": 789,
    "share_type": "teacher",
    "permissions": ["view", "download"],
    "expiry_date": "2024-12-31T23:59:59"
}

response = httpx.post(
    "http://api.example.com/api/v1/document-vault/share",
    json=share_data,
    headers={"Authorization": f"Bearer {token}"}
)
```

### Get Audit Trail

```python
response = httpx.get(
    "http://api.example.com/api/v1/document-vault/456/audit-trail",
    headers={"Authorization": f"Bearer {token}"}
)

audit_trail = response.json()
for log in audit_trail["access_logs"]:
    print(f"{log['created_at']}: {log['user_name']} - {log['action_type']}")
```

## Database Schema

### family_documents
- Primary document storage
- Encryption keys (never exposed via API)
- S3 references
- OCR text for search
- Soft delete support

### document_access_logs
- Complete audit trail
- FERPA compliance
- IP and user agent tracking
- Access decisions

### document_shares
- User-to-user sharing
- Permission management
- Time-limited access
- Revocation support

### document_expiration_alerts
- Automated alerting
- Multi-day warnings
- Delivery tracking

## FERPA Compliance Checklist

- ✅ Role-based access control
- ✅ Complete audit logging
- ✅ Parental access rights
- ✅ Consent-based sharing
- ✅ Secure storage (encrypted)
- ✅ Access denial tracking
- ✅ 7-year retention policy
- ✅ Automated compliance reporting
- ✅ IP address logging
- ✅ Time-stamped access logs

## Testing

Run tests:
```bash
poetry run pytest tests/test_document_vault.py -v
```

Tests cover:
- Encryption/decryption
- Document upload
- Auto-categorization
- Access control
- FERPA compliance
- Audit logging

## Background Jobs

Configure Celery beat schedule to run:
- Document expiration checks (daily)
- Share cleanup (hourly)
- Document archival (weekly)
- Analytics generation (daily)

## API Documentation

Full API documentation available at:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

## Future Enhancements

See `docs/document_vault.md` for planned features:
- AWS Textract integration for advanced OCR
- Document versioning
- Full-text search
- E-signature integration
- Mobile offline support
- Virus scanning
- Advanced analytics

## Support

For issues or questions:
1. Check the documentation: `docs/document_vault.md`
2. Review test cases: `tests/test_document_vault.py`
3. Examine code examples in this README

## License

See main project LICENSE file.
