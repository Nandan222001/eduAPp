from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from src.database import get_db
from src.models.user import User
from src.schemas.notification import (
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementResponse,
    AnnouncementPublish
)
from src.services.announcement_service import AnnouncementService
from src.dependencies.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnnouncementService(db)
    announcement = service.create_announcement(
        institution_id=current_user.institution_id,
        created_by=current_user.id,
        announcement_data=announcement_data
    )
    return announcement


@router.get("/", response_model=List[AnnouncementResponse])
def get_announcements(
    is_published: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnnouncementService(db)
    announcements = service.get_announcements(
        institution_id=current_user.institution_id,
        is_published=is_published,
        skip=skip,
        limit=limit
    )
    return announcements


@router.get("/my-announcements", response_model=List[AnnouncementResponse])
def get_my_announcements(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnnouncementService(db)
    announcements = service.get_user_announcements(
        user_id=current_user.id,
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit
    )
    return announcements


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnnouncementService(db)
    announcement = service.get_announcement_by_id(
        announcement_id,
        current_user.institution_id
    )
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    return announcement


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    announcement_update: AnnouncementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnnouncementService(db)
    announcement = service.update_announcement(
        announcement_id,
        current_user.institution_id,
        announcement_update
    )
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found or already published"
        )
    return announcement


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnnouncementService(db)
    success = service.delete_announcement(
        announcement_id,
        current_user.institution_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found or already published"
        )
    return {"message": "Announcement deleted successfully"}


@router.post("/{announcement_id}/publish", response_model=AnnouncementResponse)
def publish_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AnnouncementService(db)
    announcement = service.publish_announcement(
        announcement_id,
        current_user.institution_id
    )
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    return announcement
