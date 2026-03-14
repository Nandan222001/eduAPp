from celery import Task
from datetime import datetime, timedelta
from typing import Dict, Any
import json
import csv
import io
import boto3
from botocore.exceptions import ClientError
from sqlalchemy.orm import Session

from src.celery_app import celery_app
from src.database import SessionLocal, get_db_with_context
from src.models.super_admin_reports import (
    ScheduledReport, ReportExecution, DataExportJob, ArchivalJob,
    DataRetentionPolicy, DataRetentionExecution
)
from src.services.super_admin_report_service import (
    report_builder_service,
    data_export_service,
    data_retention_service,
)
from src.services.email_service import email_service
from src.config import settings


class ReportTaskBase(Task):
    """Base task class for report tasks."""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure."""
        print(f"Task {task_id} failed: {exc}")


@celery_app.task(base=ReportTaskBase, bind=True)
def execute_scheduled_report(self, report_id: int):
    """Execute a scheduled report and deliver via email/S3."""
    db = SessionLocal()
    
    try:
        report = db.query(ScheduledReport).filter(ScheduledReport.id == report_id).first()
        if not report or not report.is_active:
            return {"status": "skipped", "reason": "Report not found or inactive"}
        
        # Create execution record
        execution = ReportExecution(
            scheduled_report_id=report_id,
            status="running",
            started_at=datetime.utcnow(),
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)
        
        try:
            # Execute the report
            from src.schemas.super_admin_reports import ReportBuilderRequest
            report_config = ReportBuilderRequest(**report.report_config)
            
            result = report_builder_service.execute_report(db, report_config, report.created_by_id)
            
            # Generate file
            file_content = generate_report_file(result, report_config.output_format)
            file_size = len(file_content)
            
            # Upload to S3 if configured
            s3_key = None
            download_url = None
            
            if report.store_in_s3 and settings.s3_bucket_name:
                s3_key = f"{report.s3_prefix}{report.report_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{report_config.output_format}"
                download_url = upload_to_s3(
                    file_content,
                    settings.s3_bucket_name,
                    s3_key
                )
            
            # Send email to recipients
            for recipient in report.email_recipients:
                send_report_email(
                    recipient["email"],
                    recipient.get("name", recipient["email"]),
                    report.report_name,
                    download_url or "Report attached",
                    file_content if not download_url else None,
                    report_config.output_format
                )
            
            # Update execution record
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            execution.duration_seconds = int((execution.completed_at - execution.started_at).total_seconds())
            execution.row_count = result["row_count"]
            execution.file_size_bytes = file_size
            execution.s3_key = s3_key
            execution.download_url = download_url
            
            # Update report
            report.last_run_at = datetime.utcnow()
            report.last_status = "success"
            report.execution_count += 1
            report.next_run_at = calculate_next_run(report.schedule)
            
            db.commit()
            
            return {
                "status": "success",
                "execution_id": execution.id,
                "row_count": result["row_count"],
                "file_size": file_size
            }
            
        except Exception as e:
            execution.status = "failed"
            execution.completed_at = datetime.utcnow()
            execution.error_message = str(e)
            
            report.last_status = "failed"
            report.last_error = str(e)
            
            db.commit()
            raise
        
    finally:
        db.close()


@celery_app.task(base=ReportTaskBase, bind=True)
def process_data_export(self, job_id: int):
    """Process a data export job with anonymization."""
    db = SessionLocal()
    
    try:
        job = db.query(DataExportJob).filter(DataExportJob.id == job_id).first()
        if not job:
            return {"status": "error", "message": "Job not found"}
        
        job.status = "processing"
        job.started_at = datetime.utcnow()
        db.commit()
        
        try:
            # Collect data from all requested entity types
            all_data = []
            
            for entity_type in job.entity_types:
                entity_data = collect_entity_data(
                    db,
                    entity_type,
                    job.institution_ids,
                    job.date_from,
                    job.date_to,
                    job.fields_config
                )
                all_data.extend(entity_data)
            
            # Apply anonymization
            anonymization_config = job.anonymization_config
            if anonymization_config.get("enabled", True):
                all_data = apply_anonymization(all_data, anonymization_config)
            
            # Generate export file
            file_content = generate_export_file(all_data, job.output_format, job.compression)
            file_size = len(file_content)
            
            # Upload to S3
            s3_key = f"exports/{job.export_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{job.output_format}"
            if job.compression:
                s3_key += ".gz"
            
            download_url = upload_to_s3(
                file_content,
                settings.s3_bucket_name,
                s3_key
            )
            
            # Update job
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.duration_seconds = int((job.completed_at - job.started_at).total_seconds())
            job.row_count = len(all_data)
            job.file_size_bytes = file_size
            job.s3_key = s3_key
            job.download_url = download_url
            
            db.commit()
            
            return {
                "status": "success",
                "job_id": job_id,
                "row_count": len(all_data),
                "file_size": file_size,
                "download_url": download_url
            }
            
        except Exception as e:
            job.status = "failed"
            job.completed_at = datetime.utcnow()
            job.error_message = str(e)
            db.commit()
            raise
        
    finally:
        db.close()


@celery_app.task(base=ReportTaskBase, bind=True)
def execute_retention_policy(self, policy_id: int):
    """Execute a data retention policy."""
    db = SessionLocal()
    
    try:
        policy = db.query(DataRetentionPolicy).filter(DataRetentionPolicy.id == policy_id).first()
        if not policy or not policy.is_active:
            return {"status": "skipped", "reason": "Policy not found or inactive"}
        
        # Create execution record
        execution = DataRetentionExecution(
            policy_id=policy_id,
            status="running",
            started_at=datetime.utcnow(),
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)
        
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=policy.retention_days)
            
            records_archived = 0
            records_deleted = 0
            
            if policy.action == "archive":
                # Archive old data
                records_archived = archive_old_data(
                    db,
                    policy.entity_type,
                    cutoff_date,
                    policy.filters
                )
            elif policy.action == "delete":
                # Delete old data
                records_deleted = delete_old_data(
                    db,
                    policy.entity_type,
                    cutoff_date,
                    policy.filters
                )
            elif policy.action == "anonymize":
                # Anonymize old data
                records_processed = anonymize_old_data(
                    db,
                    policy.entity_type,
                    cutoff_date,
                    policy.filters
                )
                records_archived = records_processed
            
            # Update execution
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            execution.duration_seconds = int((execution.completed_at - execution.started_at).total_seconds())
            execution.records_archived = records_archived
            execution.records_deleted = records_deleted
            execution.records_processed = records_archived + records_deleted
            
            # Update policy
            policy.last_executed_at = datetime.utcnow()
            policy.records_processed += execution.records_processed
            policy.last_execution_status = "success"
            
            if policy.auto_execute:
                policy.next_execution_at = calculate_next_execution(policy.execution_schedule)
            
            db.commit()
            
            return {
                "status": "success",
                "execution_id": execution.id,
                "records_archived": records_archived,
                "records_deleted": records_deleted
            }
            
        except Exception as e:
            execution.status = "failed"
            execution.completed_at = datetime.utcnow()
            execution.error_message = str(e)
            
            policy.last_execution_status = "failed"
            policy.last_error = str(e)
            
            db.commit()
            raise
        
    finally:
        db.close()


@celery_app.task(base=ReportTaskBase, bind=True)
def process_archival_job(self, job_id: int):
    """Process a data archival job."""
    db = SessionLocal()
    
    try:
        job = db.query(ArchivalJob).filter(ArchivalJob.id == job_id).first()
        if not job:
            return {"status": "error", "message": "Job not found"}
        
        job.status = "processing"
        job.started_at = datetime.utcnow()
        db.commit()
        
        try:
            # Collect data to archive
            data = collect_entity_data(
                db,
                job.entity_type,
                None,  # All institutions
                job.date_from,
                job.date_to,
                {"fields_to_include": None, "fields_to_exclude": []}
            )
            
            # Generate archive file
            file_content = generate_export_file(data, "json", job.compression)
            file_size = len(file_content)
            
            # Upload to S3
            s3_key = f"{job.s3_prefix}{job.entity_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
            if job.compression:
                s3_key += ".gz"
            
            upload_to_s3(
                file_content,
                job.s3_bucket or settings.s3_bucket_name,
                s3_key
            )
            
            records_archived = len(data)
            records_deleted = 0
            
            # Delete data if configured
            if job.delete_after_archive:
                records_deleted = delete_archived_records(
                    db,
                    job.entity_type,
                    job.date_from,
                    job.date_to,
                    job.filters
                )
            
            # Update job
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.duration_seconds = int((job.completed_at - job.started_at).total_seconds())
            job.records_archived = records_archived
            job.records_deleted = records_deleted
            job.file_size_bytes = file_size
            job.s3_key = s3_key
            
            db.commit()
            
            return {
                "status": "success",
                "job_id": job_id,
                "records_archived": records_archived,
                "records_deleted": records_deleted,
                "file_size": file_size
            }
            
        except Exception as e:
            job.status = "failed"
            job.completed_at = datetime.utcnow()
            job.error_message = str(e)
            db.commit()
            raise
        
    finally:
        db.close()


# Helper functions

def generate_report_file(result: Dict[str, Any], format: str) -> bytes:
    """Generate report file in specified format."""
    if format == "csv":
        output = io.StringIO()
        if result["data"]:
            writer = csv.DictWriter(output, fieldnames=result["columns"])
            writer.writeheader()
            writer.writerows(result["data"])
        return output.getvalue().encode("utf-8")
    
    elif format == "json":
        return json.dumps(result, indent=2, default=str).encode("utf-8")
    
    else:
        # Default to JSON
        return json.dumps(result, indent=2, default=str).encode("utf-8")


def generate_export_file(data: list, format: str, compression: bool) -> bytes:
    """Generate export file with optional compression."""
    if format == "csv":
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        content = output.getvalue().encode("utf-8")
    else:
        content = json.dumps(data, indent=2, default=str).encode("utf-8")
    
    if compression:
        import gzip
        return gzip.compress(content)
    
    return content


def upload_to_s3(content: bytes, bucket: str, key: str) -> str:
    """Upload file to S3 and return download URL."""
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=content,
            ServerSideEncryption="AES256"
        )
        
        # Generate presigned URL (valid for 7 days)
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=604800  # 7 days
        )
        
        return url
        
    except ClientError as e:
        print(f"S3 upload error: {e}")
        return None


def send_report_email(to_email: str, to_name: str, report_name: str,
                     download_url: str, attachment: bytes = None, format: str = "pdf"):
    """Send report via email."""
    # Placeholder - would use email service
    print(f"Sending report '{report_name}' to {to_email}")


def collect_entity_data(db: Session, entity_type: str, institution_ids: list,
                       date_from: datetime, date_to: datetime, fields_config: dict) -> list:
    """Collect data for export."""
    # Placeholder - would query database for entity data
    return []


def apply_anonymization(data: list, config: dict) -> list:
    """Apply anonymization to exported data."""
    import hashlib
    
    fields = config.get("fields", [])
    
    for record in data:
        for field_config in fields:
            field_name = field_config["field_name"]
            strategy = field_config["strategy"]
            
            if field_name in record:
                if strategy == "hash":
                    # Hash the value
                    value = str(record[field_name])
                    salt = config.get("hash_salt", "default_salt")
                    hashed = hashlib.sha256(f"{value}{salt}".encode()).hexdigest()
                    record[field_name] = hashed
                
                elif strategy == "mask":
                    # Mask the value
                    value = str(record[field_name])
                    if len(value) > 4:
                        record[field_name] = value[:2] + "***" + value[-2:]
                    else:
                        record[field_name] = "***"
                
                elif strategy == "remove":
                    # Remove the field
                    del record[field_name]
    
    return data


def archive_old_data(db: Session, entity_type: str, cutoff_date: datetime, filters: dict) -> int:
    """Archive old data to S3."""
    # Placeholder - would archive data
    return 0


def delete_old_data(db: Session, entity_type: str, cutoff_date: datetime, filters: dict) -> int:
    """Delete old data."""
    # Placeholder - would delete data
    return 0


def anonymize_old_data(db: Session, entity_type: str, cutoff_date: datetime, filters: dict) -> int:
    """Anonymize old data."""
    # Placeholder - would anonymize data
    return 0


def delete_archived_records(db: Session, entity_type: str, date_from: datetime,
                           date_to: datetime, filters: dict) -> int:
    """Delete records that have been archived."""
    # Placeholder - would delete archived records
    return 0


def calculate_next_run(schedule: dict) -> datetime:
    """Calculate next run time from schedule configuration."""
    from src.services.super_admin_report_service import ScheduledReportService
    service = ScheduledReportService()
    
    from src.schemas.super_admin_reports import ScheduleConfig
    schedule_obj = ScheduleConfig(**schedule)
    
    return service._calculate_next_run(schedule_obj)


def calculate_next_execution(cron_expression: str) -> datetime:
    """Calculate next execution from cron expression."""
    # Placeholder - would parse cron expression
    return datetime.utcnow() + timedelta(days=1)


# Periodic tasks for scheduled reports

@celery_app.task(name="super_admin_reports.check_scheduled_reports")
def check_scheduled_reports():
    """Check for scheduled reports that need to run."""
    db = SessionLocal()
    
    try:
        now = datetime.utcnow()
        
        # Find reports that need to run
        reports = db.query(ScheduledReport).filter(
            ScheduledReport.is_active == True,
            ScheduledReport.next_run_at <= now
        ).all()
        
        for report in reports:
            execute_scheduled_report.delay(report.id)
        
        return {"checked": len(reports), "queued": len(reports)}
        
    finally:
        db.close()


@celery_app.task(name="super_admin_reports.check_retention_policies")
def check_retention_policies():
    """Check for retention policies that need to execute."""
    db = SessionLocal()
    
    try:
        now = datetime.utcnow()
        
        # Find policies that need to execute
        policies = db.query(DataRetentionPolicy).filter(
            DataRetentionPolicy.is_active == True,
            DataRetentionPolicy.auto_execute == True,
            DataRetentionPolicy.next_execution_at <= now
        ).all()
        
        for policy in policies:
            execute_retention_policy.delay(policy.id)
        
        return {"checked": len(policies), "queued": len(policies)}
        
    finally:
        db.close()
