from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime

from src.database import get_db
from src.services.parent_roi_service import ParentROIService
from src.models.parent_roi import ParentROIReport


router = APIRouter()


@router.post("/reports/generate")
def generate_roi_report(
    parent_id: int,
    institution_id: int,
    academic_year: str,
    db: Session = Depends(get_db)
):
    """Generate ROI report for a parent"""
    roi_service = ParentROIService(db)
    
    try:
        report = roi_service.calculate_roi_report(
            parent_id=parent_id,
            institution_id=institution_id,
            academic_year=academic_year
        )
        
        return {
            "id": report.id,
            "parent_id": report.parent_id,
            "academic_year": report.academic_year,
            "fees_paid": float(report.fees_paid),
            "money_saved": float(report.money_saved),
            "tuition_cost_avoidance": float(report.tuition_cost_avoidance),
            "time_saved_hours": report.time_saved_hours,
            "performance_improvement": report.performance_improvement,
            "features_used": report.features_used,
            "engagement_score": report.engagement_score,
            "roi_percentage": report.roi_percentage,
            "report_generated_at": report.report_generated_at,
            "created_at": report.created_at
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/reports/parent/{parent_id}")
def get_parent_roi_report(
    parent_id: int,
    academic_year: str,
    db: Session = Depends(get_db)
):
    """Get ROI report for a specific parent and academic year"""
    roi_service = ParentROIService(db)
    report = roi_service.get_roi_report(
        parent_id=parent_id,
        academic_year=academic_year
    )
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ROI report not found"
        )
    
    return {
        "id": report.id,
        "parent_id": report.parent_id,
        "academic_year": report.academic_year,
        "fees_paid": float(report.fees_paid),
        "money_saved": float(report.money_saved),
        "tuition_cost_avoidance": float(report.tuition_cost_avoidance),
        "time_saved_hours": report.time_saved_hours,
        "performance_improvement": report.performance_improvement,
        "features_used": report.features_used,
        "engagement_score": report.engagement_score,
        "roi_percentage": report.roi_percentage,
        "report_generated_at": report.report_generated_at,
        "created_at": report.created_at
    }


@router.get("/reports/institution/{institution_id}")
def list_institution_roi_reports(
    institution_id: int,
    academic_year: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all ROI reports for an institution"""
    roi_service = ParentROIService(db)
    reports = roi_service.list_roi_reports(
        institution_id=institution_id,
        academic_year=academic_year,
        skip=skip,
        limit=limit
    )
    
    return [
        {
            "id": report.id,
            "parent_id": report.parent_id,
            "academic_year": report.academic_year,
            "fees_paid": float(report.fees_paid),
            "money_saved": float(report.money_saved),
            "tuition_cost_avoidance": float(report.tuition_cost_avoidance),
            "time_saved_hours": report.time_saved_hours,
            "performance_improvement": report.performance_improvement,
            "features_used": report.features_used,
            "engagement_score": report.engagement_score,
            "roi_percentage": report.roi_percentage,
            "report_generated_at": report.report_generated_at
        }
        for report in reports
    ]


@router.get("/reports/{report_id}")
def get_roi_report_by_id(
    report_id: int,
    db: Session = Depends(get_db)
):
    """Get specific ROI report by ID"""
    report = db.query(ParentROIReport).filter(
        ParentROIReport.id == report_id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ROI report not found"
        )
    
    return {
        "id": report.id,
        "parent_id": report.parent_id,
        "academic_year": report.academic_year,
        "fees_paid": float(report.fees_paid),
        "money_saved": float(report.money_saved),
        "tuition_cost_avoidance": float(report.tuition_cost_avoidance),
        "time_saved_hours": report.time_saved_hours,
        "performance_improvement": report.performance_improvement,
        "features_used": report.features_used,
        "engagement_score": report.engagement_score,
        "roi_percentage": report.roi_percentage,
        "report_generated_at": report.report_generated_at,
        "created_at": report.created_at,
        "updated_at": report.updated_at
    }
