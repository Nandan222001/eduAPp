from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.homework_scanner import (
    HomeworkScanCreate,
    HomeworkScanResponse,
    HomeworkScanWithFeedbackResponse,
    ImageUploadResponse,
    ScanProcessRequest,
    ScanProcessResponse,
    MistakePatternResponse,
    TeacherNotificationRequest
)
from src.services.homework_scanner_service import HomeworkScannerService
from src.services.notification_service import NotificationService

router = APIRouter()


@router.post("/upload-image", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_homework_image(
    file: UploadFile = File(...),
    student_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HomeworkScannerService(db)
    result = await service.upload_image(file, student_id)
    return result


@router.post("/scans", response_model=HomeworkScanResponse, status_code=status.HTTP_201_CREATED)
async def create_homework_scan(
    scan_data: HomeworkScanCreate,
    image_urls: List[str] = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HomeworkScannerService(db)
    scan = service.create_scan(scan_data, image_urls)
    return scan


@router.post("/scans/process", response_model=HomeworkScanWithFeedbackResponse)
async def process_homework_scan(
    process_data: ScanProcessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HomeworkScannerService(db)
    scan = service.process_scan(process_data.scan_id, process_data.answer_key)
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    return scan


@router.get("/scans/{scan_id}", response_model=HomeworkScanWithFeedbackResponse)
async def get_homework_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HomeworkScannerService(db)
    scan = service.get_scan_with_feedbacks(scan_id)
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    return scan


@router.get("/scans/student/{student_id}", response_model=dict)
async def list_student_scans(
    student_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    subject_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HomeworkScannerService(db)
    scans, total = service.list_scans_by_student(student_id, skip, limit, subject_id)
    
    return {
        "items": scans,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/students/{student_id}/mistake-patterns", response_model=List[MistakePatternResponse])
async def get_student_mistake_patterns(
    student_id: int,
    subject_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HomeworkScannerService(db)
    patterns = service.identify_mistake_patterns(student_id, subject_id)
    return patterns


@router.post("/notify-teacher", status_code=status.HTTP_200_OK)
async def notify_teacher_about_scan(
    notification_data: TeacherNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scan_service = HomeworkScannerService(db)
    scan = scan_service.get_scan_with_feedbacks(notification_data.scan_id)
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    notification_service = NotificationService(db)
    
    message = notification_data.message or f"Student homework scan completed with score: {scan.total_score}%"
    
    notification = notification_service.create_notification(
        institution_id=current_user.institution_id,
        user_id=notification_data.teacher_id,
        title="Student Homework Scan Completed",
        message=message,
        notification_type="homework_scan",
        channel="in_app",
        priority="medium",
        notification_group="academic",
        data={
            "scan_id": notification_data.scan_id,
            "student_id": scan.student_id,
            "subject_id": scan.subject_id,
            "total_score": float(scan.total_score) if scan.total_score else 0,
            "scan_date": scan.scan_date.isoformat()
        }
    )
    
    return {
        "message": "Teacher notified successfully",
        "notification_id": notification.id
    }
