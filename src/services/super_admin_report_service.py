from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc, text, cast, Integer, String, extract, case
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
from decimal import Decimal
import json
import csv
import io
import hashlib
import uuid
import boto3
from botocore.exceptions import ClientError
import math

from src.models.super_admin_reports import (
    ScheduledReport, ReportExecution, DataExportJob, ComplianceReport,
    ExecutiveDashboard, SecurityAuditReport, DataRetentionPolicy,
    DataRetentionExecution, ArchivalJob, ReportBuilderSavedQuery
)
from src.models.user import User
from src.models.institution import Institution
from src.models.subscription import Subscription, Payment, Invoice, UsageRecord
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.audit_log import AuditLog, ActivityLog, ImpersonationLog
from src.models.assignment import Assignment
from src.models.attendance import Attendance
from src.config import settings


class ReportBuilderService:
    """Service for building custom reports with drag-drop functionality."""
    
    ENTITY_MODELS = {
        "users": User,
        "institutions": Institution,
        "subscriptions": Subscription,
        "payments": Payment,
        "invoices": Invoice,
        "students": Student,
        "teachers": Teacher,
        "audit_logs": AuditLog,
        "activity_logs": ActivityLog,
        "assignments": Assignment,
        "attendances": Attendance,
    }
    
    AGGREGATION_FUNCTIONS = {
        "count": func.count,
        "sum": func.sum,
        "avg": func.avg,
        "min": func.min,
        "max": func.max,
        "distinct_count": lambda x: func.count(func.distinct(x)),
    }
    
    def get_available_fields(self, entity_type: str) -> List[Dict[str, Any]]:
        """Get available fields for a specific entity type."""
        model = self.ENTITY_MODELS.get(entity_type)
        if not model:
            return []
        
        fields = []
        for column in model.__table__.columns:
            fields.append({
                "field_name": column.name,
                "data_type": str(column.type),
                "nullable": column.nullable,
                "is_primary_key": column.primary_key,
                "is_foreign_key": len(column.foreign_keys) > 0,
            })
        
        return fields
    
    def validate_report_config(self, db: Session, report_request) -> Dict[str, Any]:
        """Validate report configuration."""
        errors = []
        warnings = []
        
        # Validate entity type
        if report_request.entity_type not in self.ENTITY_MODELS:
            errors.append(f"Invalid entity type: {report_request.entity_type}")
            return {"valid": False, "errors": errors, "warnings": warnings}
        
        model = self.ENTITY_MODELS[report_request.entity_type]
        available_fields = [col.name for col in model.__table__.columns]
        
        # Validate selected fields
        for field_config in report_request.selected_fields:
            if field_config.field_name not in available_fields:
                errors.append(f"Invalid field: {field_config.field_name}")
            
            if field_config.aggregation and field_config.aggregation not in self.AGGREGATION_FUNCTIONS:
                errors.append(f"Invalid aggregation: {field_config.aggregation}")
        
        # Validate filters
        for filter_config in report_request.filters or []:
            if filter_config.field_name not in available_fields:
                errors.append(f"Invalid filter field: {filter_config.field_name}")
        
        # Validate group by
        for group_field in report_request.group_by or []:
            if group_field not in available_fields:
                errors.append(f"Invalid group by field: {group_field}")
        
        # Warnings
        if report_request.limit > 10000:
            warnings.append("Large limit may impact performance")
        
        if len(report_request.selected_fields) > 50:
            warnings.append("Too many fields may impact readability")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    def execute_report(self, db: Session, report_request, user_id: int):
        """Execute a custom report based on configuration."""
        start_time = datetime.utcnow()
        
        # Validate configuration
        validation = self.validate_report_config(db, report_request)
        if not validation["valid"]:
            raise ValueError(f"Invalid report configuration: {validation['errors']}")
        
        model = self.ENTITY_MODELS[report_request.entity_type]
        
        # Build query
        query = db.query(model)
        
        # Apply filters
        for filter_config in report_request.filters or []:
            column = getattr(model, filter_config.field_name)
            
            if filter_config.operator == "equals":
                query = query.filter(column == filter_config.value)
            elif filter_config.operator == "not_equals":
                query = query.filter(column != filter_config.value)
            elif filter_config.operator == "greater_than":
                query = query.filter(column > filter_config.value)
            elif filter_config.operator == "less_than":
                query = query.filter(column < filter_config.value)
            elif filter_config.operator == "contains":
                query = query.filter(column.ilike(f"%{filter_config.value}%"))
            elif filter_config.operator == "in":
                query = query.filter(column.in_(filter_config.value))
            elif filter_config.operator == "between":
                query = query.filter(and_(
                    column >= filter_config.value.get("start"),
                    column <= filter_config.value.get("end")
                ))
        
        # Handle grouping and aggregation
        if report_request.group_by:
            # Group by fields
            group_columns = [getattr(model, field) for field in report_request.group_by]
            
            # Select fields with aggregations
            select_fields = []
            for field_config in report_request.selected_fields:
                column = getattr(model, field_config.field_name)
                
                if field_config.aggregation:
                    agg_func = self.AGGREGATION_FUNCTIONS[field_config.aggregation]
                    select_fields.append(agg_func(column).label(
                        f"{field_config.aggregation}_{field_config.field_name}"
                    ))
                elif field_config.field_name in report_request.group_by:
                    select_fields.append(column)
            
            query = db.query(*group_columns, *select_fields).group_by(*group_columns)
        
        # Apply sorting
        for sort_config in report_request.sort_by or []:
            column = getattr(model, sort_config.field_name)
            if sort_config.direction == "desc":
                query = query.order_by(desc(column))
            else:
                query = query.order_by(asc(column))
        
        # Apply limit
        query = query.limit(report_request.limit)
        
        # Execute query
        results = query.all()
        
        # Format results
        columns = []
        data = []
        
        if report_request.group_by:
            # Column names for grouped results
            for field in report_request.group_by:
                columns.append(field)
            for field_config in report_request.selected_fields:
                if field_config.aggregation:
                    col_name = f"{field_config.aggregation}_{field_config.field_name}"
                    columns.append(field_config.display_name or col_name)
            
            # Format data
            for row in results:
                row_dict = {}
                for idx, col in enumerate(columns):
                    value = row[idx]
                    if isinstance(value, datetime):
                        value = value.isoformat()
                    elif isinstance(value, Decimal):
                        value = float(value)
                    row_dict[col] = value
                data.append(row_dict)
        else:
            # Column names for non-grouped results
            for field_config in report_request.selected_fields:
                columns.append(field_config.display_name or field_config.field_name)
            
            # Format data
            for row in results:
                row_dict = {}
                for field_config in report_request.selected_fields:
                    value = getattr(row, field_config.field_name)
                    if isinstance(value, datetime):
                        value = value.isoformat()
                    elif isinstance(value, Decimal):
                        value = float(value)
                    col_name = field_config.display_name or field_config.field_name
                    row_dict[col_name] = value
                data.append(row_dict)
        
        # Calculate totals if requested
        totals = None
        if report_request.include_totals:
            totals = {}
            for field_config in report_request.selected_fields:
                if field_config.aggregation and field_config.aggregation in ["sum", "avg", "count"]:
                    column = getattr(model, field_config.field_name)
                    agg_func = self.AGGREGATION_FUNCTIONS[field_config.aggregation]
                    
                    # Apply same filters
                    total_query = db.query(agg_func(column))
                    for filter_config in report_request.filters or []:
                        filter_column = getattr(model, filter_config.field_name)
                        if filter_config.operator == "equals":
                            total_query = total_query.filter(filter_column == filter_config.value)
                    
                    total_value = total_query.scalar()
                    if isinstance(total_value, Decimal):
                        total_value = float(total_value)
                    
                    col_name = field_config.display_name or field_config.field_name
                    totals[col_name] = total_value
        
        execution_time_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        return {
            "report_name": report_request.report_name,
            "entity_type": report_request.entity_type,
            "columns": columns,
            "data": data,
            "totals": totals,
            "row_count": len(data),
            "generated_at": datetime.utcnow(),
            "execution_time_ms": round(execution_time_ms, 2),
        }


class ScheduledReportService:
    """Service for managing scheduled reports."""
    
    def create_scheduled_report(self, db: Session, report_data, user_id: int):
        """Create a new scheduled report."""
        report = ScheduledReport(
            report_name=report_data.report_name,
            description=report_data.description,
            report_config=report_data.report_config.dict(),
            schedule=report_data.schedule.dict(),
            email_recipients=[r.dict() for r in report_data.email_recipients],
            store_in_s3=report_data.store_in_s3,
            s3_bucket=report_data.s3_bucket or settings.s3_bucket_name,
            s3_prefix=report_data.s3_prefix,
            retention_days=report_data.retention_days,
            is_active=report_data.is_active,
            next_run_at=self._calculate_next_run(report_data.schedule),
            created_by_id=user_id,
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return report
    
    def list_scheduled_reports(self, db: Session, page: int, page_size: int,
                               is_active: Optional[bool], report_type: Optional[str]):
        """List scheduled reports with pagination."""
        query = db.query(ScheduledReport)
        
        if is_active is not None:
            query = query.filter(ScheduledReport.is_active == is_active)
        
        total = query.count()
        reports = query.order_by(desc(ScheduledReport.created_at)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        total_pages = math.ceil(total / page_size) if total > 0 else 0
        
        return {
            "items": reports,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    
    def get_scheduled_report(self, db: Session, report_id: int):
        """Get a specific scheduled report."""
        return db.query(ScheduledReport).filter(ScheduledReport.id == report_id).first()
    
    def update_scheduled_report(self, db: Session, report_id: int, report_data):
        """Update a scheduled report."""
        report = self.get_scheduled_report(db, report_id)
        if not report:
            raise ValueError("Scheduled report not found")
        
        update_data = report_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if key == "report_config" and value:
                value = value.dict()
            elif key == "schedule" and value:
                value = value.dict()
            elif key == "email_recipients" and value:
                value = [r.dict() for r in value]
            
            setattr(report, key, value)
        
        if report_data.schedule:
            report.next_run_at = self._calculate_next_run(report_data.schedule)
        
        db.commit()
        db.refresh(report)
        
        return report
    
    def delete_scheduled_report(self, db: Session, report_id: int):
        """Delete a scheduled report."""
        report = self.get_scheduled_report(db, report_id)
        if not report:
            raise ValueError("Scheduled report not found")
        
        db.delete(report)
        db.commit()
    
    def schedule_report_task(self, report_id: int):
        """Schedule the report generation task (to be implemented with Celery)."""
        # This would integrate with Celery beat scheduler
        pass
    
    def execute_report_now(self, report_id: int, user_id: int):
        """Execute a scheduled report immediately."""
        # This would be implemented as a Celery task
        pass
    
    def get_execution_history(self, db: Session, report_id: int, page: int, page_size: int):
        """Get execution history for a scheduled report."""
        query = db.query(ReportExecution).filter(
            ReportExecution.scheduled_report_id == report_id
        )
        
        total = query.count()
        executions = query.order_by(desc(ReportExecution.started_at)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        total_pages = math.ceil(total / page_size) if total > 0 else 0
        
        return {
            "items": executions,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    
    def _calculate_next_run(self, schedule) -> datetime:
        """Calculate next run time based on schedule configuration."""
        now = datetime.utcnow()
        
        if schedule.frequency == "daily":
            # Run daily at specified time
            hour, minute = map(int, schedule.time_of_day.split(":"))
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)
            return next_run
        
        elif schedule.frequency == "weekly":
            # Run weekly on specified day
            hour, minute = map(int, schedule.time_of_day.split(":"))
            days_ahead = schedule.day_of_week - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_run = now + timedelta(days=days_ahead)
            next_run = next_run.replace(hour=hour, minute=minute, second=0, microsecond=0)
            return next_run
        
        elif schedule.frequency == "monthly":
            # Run monthly on specified day
            hour, minute = map(int, schedule.time_of_day.split(":"))
            if now.day < schedule.day_of_month:
                next_run = now.replace(day=schedule.day_of_month, hour=hour, minute=minute, second=0, microsecond=0)
            else:
                # Next month
                if now.month == 12:
                    next_run = now.replace(year=now.year + 1, month=1, day=schedule.day_of_month, hour=hour, minute=minute, second=0, microsecond=0)
                else:
                    next_run = now.replace(month=now.month + 1, day=schedule.day_of_month, hour=hour, minute=minute, second=0, microsecond=0)
            return next_run
        
        return now + timedelta(days=1)


class DataExportService:
    """Service for cross-institution data exports."""
    
    def create_export_job(self, db: Session, export_request, user_id: int):
        """Create a new data export job."""
        job = DataExportJob(
            export_name=export_request.export_name,
            description=export_request.description,
            entity_types=export_request.entity_types,
            institution_ids=export_request.institution_ids,
            date_from=export_request.date_from,
            date_to=export_request.date_to,
            fields_config={
                "fields_to_include": export_request.fields_to_include,
                "fields_to_exclude": export_request.fields_to_exclude,
            },
            anonymization_config=export_request.anonymization.dict(),
            output_format=export_request.output_format,
            compression=export_request.compression,
            purpose=export_request.purpose,
            status="pending",
            created_by_id=user_id,
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        return job
    
    def process_export_job(self, job_id: int):
        """Process a data export job (implemented as background task)."""
        # This would be implemented as a Celery task
        pass
    
    def get_export_job_status(self, db: Session, job_id: int):
        """Get status of an export job."""
        job = db.query(DataExportJob).filter(DataExportJob.id == job_id).first()
        if not job:
            return None
        
        return {
            "job_id": job.id,
            "export_name": job.export_name,
            "status": job.status,
            "progress_percentage": 0 if job.status == "pending" else (100 if job.status == "completed" else 50),
            "row_count": job.row_count,
            "file_size_bytes": job.file_size_bytes,
            "download_url": job.download_url,
            "error_message": job.error_message,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
        }
    
    def get_export_file(self, db: Session, job_id: int):
        """Get the exported data file."""
        job = db.query(DataExportJob).filter(DataExportJob.id == job_id).first()
        if not job or job.status != "completed":
            return None
        
        # Download from S3 or retrieve from storage
        # This is a placeholder - actual implementation would download from S3
        return {
            "content": b"",  # File content
            "filename": f"{job.export_name}.{job.output_format}",
            "media_type": self._get_media_type(job.output_format),
        }
    
    def list_export_jobs(self, db: Session, page: int, page_size: int, status: Optional[str]):
        """List all export jobs."""
        query = db.query(DataExportJob)
        
        if status:
            query = query.filter(DataExportJob.status == status)
        
        total = query.count()
        jobs = query.order_by(desc(DataExportJob.created_at)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        total_pages = math.ceil(total / page_size) if total > 0 else 0
        
        return {
            "items": jobs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    
    def _get_media_type(self, format: str) -> str:
        """Get media type for file format."""
        media_types = {
            "csv": "text/csv",
            "json": "application/json",
            "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "parquet": "application/octet-stream",
        }
        return media_types.get(format, "application/octet-stream")


class ComplianceReportService:
    """Service for generating compliance reports."""
    
    def generate_privacy_audit_report(self, db: Session, request, user_id: int):
        """Generate student data privacy audit report."""
        # Query audit logs for student data access
        query = db.query(AuditLog).filter(
            and_(
                AuditLog.table_name.in_(["students", "student_profiles"]),
                AuditLog.created_at >= request.start_date,
                AuditLog.created_at <= request.end_date
            )
        )
        
        if request.institution_ids:
            query = query.filter(AuditLog.institution_id.in_(request.institution_ids))
        
        audit_records = query.all()
        
        summary = {
            "total_access_events": len(audit_records),
            "access_by_action": {},
            "access_by_user": {},
            "institutions_covered": len(set(r.institution_id for r in audit_records if r.institution_id)),
        }
        
        # Group by action
        for record in audit_records:
            summary["access_by_action"][record.action] = summary["access_by_action"].get(record.action, 0) + 1
        
        report_id = f"privacy_audit_{uuid.uuid4().hex[:8]}"
        
        report = ComplianceReport(
            report_id=report_id,
            report_type="student_privacy_audit",
            period_start=request.start_date,
            period_end=request.end_date,
            institution_ids=request.institution_ids,
            filters=request.filters,
            summary=summary,
            output_format=request.output_format,
            generated_by_id=user_id,
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return {
            "report_id": report.report_id,
            "report_type": report.report_type,
            "generated_at": report.generated_at,
            "period_start": report.period_start,
            "period_end": report.period_end,
            "summary": report.summary,
            "download_url": None,  # Would be generated after file creation
        }
    
    def generate_billing_report(self, db: Session, request, user_id: int):
        """Generate billing history report for tax compliance."""
        query = db.query(Payment).filter(
            and_(
                Payment.created_at >= request.start_date,
                Payment.created_at <= request.end_date,
                Payment.status == "paid"
            )
        )
        
        if request.institution_ids:
            query = query.filter(Payment.institution_id.in_(request.institution_ids))
        
        payments = query.all()
        
        total_revenue = sum(float(p.amount) for p in payments)
        
        summary = {
            "total_payments": len(payments),
            "total_revenue": total_revenue,
            "currency": "INR",
            "payments_by_month": {},
            "institutions_covered": len(set(p.institution_id for p in payments)),
        }
        
        report_id = f"billing_{uuid.uuid4().hex[:8]}"
        
        report = ComplianceReport(
            report_id=report_id,
            report_type="billing_history",
            period_start=request.start_date,
            period_end=request.end_date,
            institution_ids=request.institution_ids,
            filters=request.filters,
            summary=summary,
            output_format=request.output_format,
            generated_by_id=user_id,
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return {
            "report_id": report.report_id,
            "report_type": report.report_type,
            "generated_at": report.generated_at,
            "period_start": report.period_start,
            "period_end": report.period_end,
            "summary": report.summary,
            "download_url": None,
        }
    
    def generate_usage_report(self, db: Session, request, user_id: int):
        """Generate usage report for contract renewals."""
        query = db.query(UsageRecord).filter(
            and_(
                UsageRecord.recorded_at >= request.start_date,
                UsageRecord.recorded_at <= request.end_date
            )
        )
        
        if request.institution_ids:
            query = query.filter(UsageRecord.institution_id.in_(request.institution_ids))
        
        usage_records = query.all()
        
        summary = {
            "total_records": len(usage_records),
            "metrics_tracked": list(set(r.metric_name for r in usage_records)),
            "average_values": {},
        }
        
        report_id = f"usage_{uuid.uuid4().hex[:8]}"
        
        report = ComplianceReport(
            report_id=report_id,
            report_type="usage_report",
            period_start=request.start_date,
            period_end=request.end_date,
            institution_ids=request.institution_ids,
            filters=request.filters,
            summary=summary,
            output_format=request.output_format,
            generated_by_id=user_id,
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return {
            "report_id": report.report_id,
            "report_type": report.report_type,
            "generated_at": report.generated_at,
            "period_start": report.period_start,
            "period_end": report.period_end,
            "summary": report.summary,
            "download_url": None,
        }
    
    def generate_gdpr_report(self, db: Session, user_id: int):
        """Generate GDPR data access report for a user."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Collect all personal data
        report_data = {
            "user_profile": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "created_at": user.created_at.isoformat(),
            },
            "audit_logs": [],
            "activity_logs": [],
        }
        
        # Get audit logs
        audit_logs = db.query(AuditLog).filter(AuditLog.user_id == user_id).limit(1000).all()
        report_data["audit_logs"] = [
            {"action": log.action, "table": log.table_name, "timestamp": log.created_at.isoformat()}
            for log in audit_logs
        ]
        
        return {
            "user_id": user_id,
            "report_data": report_data,
            "generated_at": datetime.utcnow().isoformat(),
        }


class ExecutiveDashboardService:
    """Service for generating executive dashboards."""
    
    def generate_dashboard(self, db: Session, request):
        """Generate executive dashboard."""
        metrics = []
        
        for metric_type in request.metrics:
            if metric_type == "mrr":
                metric_data = self._calculate_mrr_metric(db, request)
                metrics.append(metric_data)
            elif metric_type == "arr":
                metric_data = self._calculate_arr_metric(db, request)
                metrics.append(metric_data)
            elif metric_type == "user_metrics":
                metric_data = self._calculate_user_metrics(db, request)
                metrics.append(metric_data)
            elif metric_type == "growth":
                metric_data = self._calculate_growth_metrics(db, request)
                metrics.append(metric_data)
        
        summary = {
            "total_metrics": len(metrics),
            "period_days": (request.end_date - request.start_date).days,
        }
        
        insights = [
            "Revenue is trending upward",
            "User growth is accelerating",
            "Churn rate remains within acceptable range",
        ]
        
        return {
            "template_id": request.template_id,
            "template_name": "Executive Dashboard",
            "generated_at": datetime.utcnow(),
            "period_start": request.start_date,
            "period_end": request.end_date,
            "metrics": metrics,
            "summary": summary,
            "insights": insights,
        }
    
    def export_dashboard(self, db: Session, request, format: str):
        """Export dashboard in specified format."""
        # Placeholder - would generate PDF/PPTX/Excel
        return {
            "content": b"",
            "filename": f"executive_dashboard.{format}",
            "media_type": "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        }
    
    def _calculate_mrr_metric(self, db: Session, request):
        """Calculate MRR metric."""
        active_subs = db.query(Subscription).filter(Subscription.status == "active").all()
        
        current_mrr = sum(
            float(sub.price) if sub.billing_cycle == "monthly"
            else float(sub.price) / 12 if sub.billing_cycle == "yearly"
            else float(sub.price) / 3
            for sub in active_subs
        )
        
        return {
            "metric_name": "Monthly Recurring Revenue",
            "current_value": current_mrr,
            "previous_value": None,
            "change_percentage": None,
            "trend": "stable",
            "chart_data": [],
        }
    
    def _calculate_arr_metric(self, db: Session, request):
        """Calculate ARR metric."""
        active_subs = db.query(Subscription).filter(Subscription.status == "active").all()
        
        current_mrr = sum(
            float(sub.price) if sub.billing_cycle == "monthly"
            else float(sub.price) / 12 if sub.billing_cycle == "yearly"
            else float(sub.price) / 3
            for sub in active_subs
        )
        
        current_arr = current_mrr * 12
        
        return {
            "metric_name": "Annual Recurring Revenue",
            "current_value": current_arr,
            "previous_value": None,
            "change_percentage": None,
            "trend": "stable",
            "chart_data": [],
        }
    
    def _calculate_user_metrics(self, db: Session, request):
        """Calculate user metrics."""
        total_users = db.query(func.count(User.id)).scalar() or 0
        active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
        
        return {
            "metric_name": "Total Active Users",
            "current_value": active_users,
            "previous_value": None,
            "change_percentage": None,
            "trend": "up",
            "chart_data": [],
        }
    
    def _calculate_growth_metrics(self, db: Session, request):
        """Calculate growth metrics."""
        period_days = (request.end_date - request.start_date).days
        previous_start = request.start_date - timedelta(days=period_days)
        
        current_institutions = db.query(func.count(Institution.id)).filter(
            and_(
                Institution.created_at >= request.start_date,
                Institution.created_at <= request.end_date
            )
        ).scalar() or 0
        
        previous_institutions = db.query(func.count(Institution.id)).filter(
            and_(
                Institution.created_at >= previous_start,
                Institution.created_at < request.start_date
            )
        ).scalar() or 0
        
        change_pct = ((current_institutions - previous_institutions) / previous_institutions * 100) if previous_institutions > 0 else 0
        
        return {
            "metric_name": "Institution Growth",
            "current_value": current_institutions,
            "previous_value": previous_institutions,
            "change_percentage": round(change_pct, 2),
            "trend": "up" if change_pct > 0 else "down",
            "chart_data": [],
        }


class SecurityAuditService:
    """Service for security audit reports and monitoring."""
    
    def get_api_access_logs(self, db: Session, filters, page: int, page_size: int):
        """Get API access logs with filtering."""
        query = db.query(ActivityLog)
        
        if filters.start_date:
            query = query.filter(ActivityLog.created_at >= filters.start_date)
        if filters.end_date:
            query = query.filter(ActivityLog.created_at <= filters.end_date)
        if filters.user_id:
            query = query.filter(ActivityLog.user_id == filters.user_id)
        if filters.institution_id:
            query = query.filter(ActivityLog.institution_id == filters.institution_id)
        if filters.endpoint:
            query = query.filter(ActivityLog.endpoint.ilike(f"%{filters.endpoint}%"))
        if filters.method:
            query = query.filter(ActivityLog.method == filters.method)
        if filters.status_code:
            query = query.filter(ActivityLog.status_code == filters.status_code)
        if filters.has_errors is not None:
            if filters.has_errors:
                query = query.filter(ActivityLog.error_message.isnot(None))
            else:
                query = query.filter(ActivityLog.error_message.is_(None))
        if filters.ip_address:
            query = query.filter(ActivityLog.ip_address == filters.ip_address)
        
        total = query.count()
        logs = query.order_by(desc(ActivityLog.created_at)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        items = []
        for log in logs:
            user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
            items.append({
                "id": log.id,
                "user_id": log.user_id,
                "user_email": user.email if user else None,
                "institution_id": log.institution_id,
                "endpoint": log.endpoint,
                "method": log.method,
                "status_code": log.status_code,
                "request_data": log.request_data,
                "response_time_ms": log.duration_ms,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "error_message": log.error_message,
                "created_at": log.created_at,
            })
        
        total_pages = math.ceil(total / page_size) if total > 0 else 0
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    
    def generate_audit_report(self, db: Session, request, user_id: int):
        """Generate comprehensive security audit report."""
        # Count various security events
        failed_logins = 0  # Would query from authentication logs
        suspicious_activities = 0
        data_access_count = db.query(func.count(AuditLog.id)).filter(
            and_(
                AuditLog.created_at >= request.start_date,
                AuditLog.created_at <= request.end_date
            )
        ).scalar() or 0
        
        impersonation_count = db.query(func.count(ImpersonationLog.id)).filter(
            and_(
                ImpersonationLog.started_at >= request.start_date,
                ImpersonationLog.started_at <= request.end_date
            )
        ).scalar() or 0
        
        anomalies = []
        summary = {
            "period_days": (request.end_date - request.start_date).days,
            "total_events": data_access_count + impersonation_count,
        }
        
        report_id = f"security_audit_{uuid.uuid4().hex[:8]}"
        
        report = SecurityAuditReport(
            report_id=report_id,
            period_start=request.start_date,
            period_end=request.end_date,
            institution_ids=request.institution_ids,
            failed_login_count=failed_logins,
            suspicious_activity_count=suspicious_activities,
            data_access_count=data_access_count,
            impersonation_count=impersonation_count,
            anomalies=anomalies,
            summary=summary,
            generated_by_id=user_id,
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return {
            "report_id": report.report_id,
            "generated_at": report.generated_at,
            "period_start": report.period_start,
            "period_end": report.period_end,
            "failed_login_count": report.failed_login_count,
            "suspicious_activity_count": report.suspicious_activity_count,
            "data_access_count": report.data_access_count,
            "impersonation_count": report.impersonation_count,
            "anomalies": report.anomalies,
            "summary": report.summary,
            "download_url": None,
        }
    
    def detect_anomalies(self, db: Session, days: int):
        """Detect security anomalies."""
        # Placeholder - would implement anomaly detection logic
        return []
    
    def get_failed_login_attempts(self, db: Session, hours: int, page: int, page_size: int):
        """Get recent failed login attempts."""
        # Placeholder - would query authentication logs
        return {
            "items": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
        }
    
    def analyze_access_patterns(self, db: Session, entity_type: str, days: int):
        """Analyze data access patterns."""
        # Placeholder - would analyze audit logs
        return {
            "entity_type": entity_type,
            "period_days": days,
            "access_patterns": [],
            "unusual_patterns": [],
        }


class DataRetentionService:
    """Service for data retention policy management."""
    
    def create_policy(self, db: Session, policy_data, user_id: int):
        """Create a new data retention policy."""
        policy = DataRetentionPolicy(
            policy_name=policy_data.policy_name,
            description=policy_data.description,
            entity_type=policy_data.entity_type,
            retention_days=policy_data.retention_days,
            action=policy_data.action.value,
            filters=policy_data.filters,
            is_active=policy_data.is_active,
            auto_execute=policy_data.auto_execute,
            execution_schedule=policy_data.execution_schedule,
            created_by_id=user_id,
        )
        
        if policy_data.auto_execute and policy_data.execution_schedule:
            policy.next_execution_at = self._calculate_next_execution(policy_data.execution_schedule)
        
        db.add(policy)
        db.commit()
        db.refresh(policy)
        
        return policy
    
    def list_policies(self, db: Session, page: int, page_size: int,
                     is_active: Optional[bool], entity_type: Optional[str]):
        """List data retention policies."""
        query = db.query(DataRetentionPolicy)
        
        if is_active is not None:
            query = query.filter(DataRetentionPolicy.is_active == is_active)
        if entity_type:
            query = query.filter(DataRetentionPolicy.entity_type == entity_type)
        
        total = query.count()
        policies = query.order_by(desc(DataRetentionPolicy.created_at)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        total_pages = math.ceil(total / page_size) if total > 0 else 0
        
        return {
            "items": policies,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    
    def get_policy(self, db: Session, policy_id: int):
        """Get a specific retention policy."""
        return db.query(DataRetentionPolicy).filter(DataRetentionPolicy.id == policy_id).first()
    
    def update_policy(self, db: Session, policy_id: int, policy_data):
        """Update a retention policy."""
        policy = self.get_policy(db, policy_id)
        if not policy:
            raise ValueError("Data retention policy not found")
        
        update_data = policy_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if key == "action" and value:
                value = value.value
            setattr(policy, key, value)
        
        db.commit()
        db.refresh(policy)
        
        return policy
    
    def delete_policy(self, db: Session, policy_id: int):
        """Delete a retention policy."""
        policy = self.get_policy(db, policy_id)
        if not policy:
            raise ValueError("Data retention policy not found")
        
        db.delete(policy)
        db.commit()
    
    def preview_policy_execution(self, db: Session, policy_id: int):
        """Preview what would be affected by policy execution."""
        policy = self.get_policy(db, policy_id)
        if not policy:
            raise ValueError("Policy not found")
        
        cutoff_date = datetime.utcnow() - timedelta(days=policy.retention_days)
        
        # Placeholder - would count affected records
        return {
            "policy_id": policy_id,
            "policy_name": policy.policy_name,
            "entity_type": policy.entity_type,
            "cutoff_date": cutoff_date,
            "estimated_records": 0,
            "action": policy.action,
        }
    
    def execute_policy(self, policy_id: int, user_id: int):
        """Execute a retention policy."""
        # Would be implemented as a Celery task
        pass
    
    def create_archival_job(self, db: Session, job_data, user_id: int):
        """Create a new archival job."""
        job = ArchivalJob(
            job_name=job_data.job_name,
            description=job_data.description,
            entity_type=job_data.entity_type,
            date_from=job_data.date_from,
            date_to=job_data.date_to,
            filters=job_data.filters,
            s3_bucket=job_data.s3_bucket or settings.s3_bucket_name,
            s3_prefix=job_data.s3_prefix,
            compression=job_data.compression,
            delete_after_archive=job_data.delete_after_archive,
            status="pending",
            created_by_id=user_id,
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        return job
    
    def list_archival_jobs(self, db: Session, page: int, page_size: int,
                          status: Optional[str], entity_type: Optional[str]):
        """List archival jobs."""
        query = db.query(ArchivalJob)
        
        if status:
            query = query.filter(ArchivalJob.status == status)
        if entity_type:
            query = query.filter(ArchivalJob.entity_type == entity_type)
        
        total = query.count()
        jobs = query.order_by(desc(ArchivalJob.created_at)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        total_pages = math.ceil(total / page_size) if total > 0 else 0
        
        return {
            "items": jobs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    
    def get_archival_job(self, db: Session, job_id: int):
        """Get a specific archival job."""
        return db.query(ArchivalJob).filter(ArchivalJob.id == job_id).first()
    
    def process_archival_job(self, job_id: int):
        """Process an archival job."""
        # Would be implemented as a Celery task
        pass
    
    def restore_archived_data(self, job_id: int, user_id: int):
        """Restore archived data."""
        # Would be implemented as a Celery task
        pass
    
    def get_storage_stats(self, db: Session):
        """Get archival storage statistics."""
        total_jobs = db.query(func.count(ArchivalJob.id)).filter(
            ArchivalJob.status == "completed"
        ).scalar() or 0
        
        total_size = db.query(func.sum(ArchivalJob.file_size_bytes)).filter(
            ArchivalJob.status == "completed"
        ).scalar() or 0
        
        return {
            "total_archival_jobs": total_jobs,
            "total_storage_bytes": total_size,
            "total_storage_gb": round(total_size / (1024**3), 2) if total_size else 0,
            "estimated_monthly_cost_usd": round(total_size / (1024**3) * 0.023, 2) if total_size else 0,
        }
    
    def preview_cleanup(self, db: Session, entity_type: str, days_old: int):
        """Preview what would be deleted."""
        # Placeholder - would count records to be deleted
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        return {
            "entity_type": entity_type,
            "cutoff_date": cutoff_date,
            "estimated_records": 0,
            "warning": "These records will be permanently deleted",
        }
    
    def cleanup_old_data(self, entity_type: str, days_old: int, user_id: int):
        """Cleanup old data."""
        # Would be implemented as a Celery task
        pass
    
    def _calculate_next_execution(self, schedule: str) -> datetime:
        """Calculate next execution time from cron expression."""
        # Placeholder - would parse cron expression
        return datetime.utcnow() + timedelta(days=1)


# Service instances
report_builder_service = ReportBuilderService()
scheduled_report_service = ScheduledReportService()
data_export_service = DataExportService()
compliance_report_service = ComplianceReportService()
executive_dashboard_service = ExecutiveDashboardService()
security_audit_service = SecurityAuditService()
data_retention_service = DataRetentionService()
