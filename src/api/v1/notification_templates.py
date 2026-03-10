from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from src.database import get_db
from src.models.user import User
from src.models.notification import NotificationTemplate
from src.schemas.notification import (
    NotificationTemplateCreate,
    NotificationTemplateUpdate,
    NotificationTemplateResponse
)
from src.dependencies.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=NotificationTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: NotificationTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    template = NotificationTemplate(
        institution_id=current_user.institution_id,
        **template_data.model_dump()
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/", response_model=List[NotificationTemplateResponse])
def get_templates(
    notification_type: Optional[str] = None,
    channel: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(NotificationTemplate).filter(
        NotificationTemplate.institution_id == current_user.institution_id
    )
    
    if notification_type:
        query = query.filter(NotificationTemplate.notification_type == notification_type)
    if channel:
        query = query.filter(NotificationTemplate.channel == channel)
    if is_active is not None:
        query = query.filter(NotificationTemplate.is_active == is_active)
    
    templates = query.offset(skip).limit(limit).all()
    return templates


@router.get("/{template_id}", response_model=NotificationTemplateResponse)
def get_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    template = db.query(NotificationTemplate).filter(
        NotificationTemplate.id == template_id,
        NotificationTemplate.institution_id == current_user.institution_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return template


@router.put("/{template_id}", response_model=NotificationTemplateResponse)
def update_template(
    template_id: int,
    template_update: NotificationTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    template = db.query(NotificationTemplate).filter(
        NotificationTemplate.id == template_id,
        NotificationTemplate.institution_id == current_user.institution_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    update_data = template_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    template = db.query(NotificationTemplate).filter(
        NotificationTemplate.id == template_id,
        NotificationTemplate.institution_id == current_user.institution_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}
