from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from src.database import get_db
from src.models.user import User
from src.schemas.notification import (
    NotificationResponse,
    NotificationUpdate,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    BulkNotificationRequest,
    NotificationStats
)
from src.services.notification_service import NotificationService
from src.dependencies.auth import get_current_user
from src.tasks.notification_tasks import send_notification, send_bulk_notifications

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    status: Optional[str] = None,
    channel: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    notifications = service.get_notifications(
        user_id=current_user.id,
        status=status,
        channel=channel,
        skip=skip,
        limit=limit
    )
    return notifications


@router.get("/stats", response_model=NotificationStats)
def get_notification_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    return service.get_notification_stats(current_user.id)


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    notification = service.get_notification_by_id(notification_id, current_user.id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return notification


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    notification = service.mark_as_read(notification_id, current_user.id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return notification


@router.post("/mark-all-read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    count = service.mark_all_as_read(current_user.id)
    return {"message": f"Marked {count} notifications as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    success = service.delete_notification(notification_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return {"message": "Notification deleted successfully"}


@router.get("/preferences/me", response_model=NotificationPreferenceResponse)
def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    return service.get_or_create_preferences(current_user.id)


@router.put("/preferences/me", response_model=NotificationPreferenceResponse)
def update_notification_preferences(
    preference_update: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = NotificationService(db)
    return service.update_preferences(current_user.id, preference_update)


@router.post("/bulk")
def send_bulk_notification(
    request: BulkNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = send_bulk_notifications.delay(
        institution_id=current_user.institution_id,
        user_ids=request.user_ids,
        title=request.title,
        message=request.message,
        notification_type=request.notification_type,
        channel=request.channel.value,
        priority=request.priority.value,
        data=request.data
    )
    
    return {
        "message": "Bulk notifications queued for processing",
        "task_id": task.id,
        "user_count": len(request.user_ids)
    }
