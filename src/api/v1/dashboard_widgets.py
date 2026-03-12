from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.services.dashboard_widget_service import DashboardWidgetService
from src.schemas.dashboard_widget import (
    DashboardWidgetResponse,
    DashboardWidgetCreate,
    DashboardWidgetUpdate,
    BulkWidgetPositionUpdate,
    WidgetDataResponse,
    WidgetPresetResponse,
    InitializeDefaultWidgetsRequest
)
from datetime import datetime

router = APIRouter()


@router.get("/widgets", response_model=List[DashboardWidgetResponse])
async def get_user_widgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    widgets = DashboardWidgetService.get_user_widgets(db, current_user.id)
    return widgets


@router.post("/widgets", response_model=DashboardWidgetResponse, status_code=status.HTTP_201_CREATED)
async def create_widget(
    widget_data: DashboardWidgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    widget = DashboardWidgetService.create_widget(db, current_user.id, widget_data)
    return widget


@router.get("/widgets/{widget_id}", response_model=DashboardWidgetResponse)
async def get_widget(
    widget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    widget = DashboardWidgetService.get_widget_by_id(db, widget_id, current_user.id)
    if not widget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget not found"
        )
    return widget


@router.put("/widgets/{widget_id}", response_model=DashboardWidgetResponse)
async def update_widget(
    widget_id: int,
    widget_data: DashboardWidgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    widget = DashboardWidgetService.update_widget(db, widget_id, current_user.id, widget_data)
    if not widget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget not found"
        )
    return widget


@router.delete("/widgets/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_widget(
    widget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = DashboardWidgetService.delete_widget(db, widget_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget not found"
        )
    return None


@router.post("/widgets/positions", status_code=status.HTTP_200_OK)
async def update_widget_positions(
    updates: BulkWidgetPositionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    DashboardWidgetService.update_positions(
        db, 
        current_user.id, 
        [u.dict() for u in updates.updates]
    )
    return {"message": "Widget positions updated successfully"}


@router.get("/widgets/{widget_id}/data", response_model=WidgetDataResponse)
async def get_widget_data(
    widget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    widget = DashboardWidgetService.get_widget_by_id(db, widget_id, current_user.id)
    if not widget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget not found"
        )
    
    data = DashboardWidgetService.get_widget_data(db, current_user, widget)
    
    return WidgetDataResponse(
        widget_id=widget.id,
        widget_type=widget.widget_type,
        data=data,
        last_updated=datetime.utcnow()
    )


@router.post("/widgets/initialize", response_model=List[DashboardWidgetResponse])
async def initialize_default_widgets(
    request: InitializeDefaultWidgetsRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    widgets = DashboardWidgetService.initialize_default_widgets(db, current_user)
    return widgets


@router.get("/presets", response_model=List[WidgetPresetResponse])
async def get_role_presets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    presets = DashboardWidgetService.get_role_presets(db, current_user.role.slug)
    return presets


@router.post("/widgets/reset", response_model=List[DashboardWidgetResponse])
async def reset_to_defaults(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from src.models.dashboard_widget import DashboardWidget
    
    db.query(DashboardWidget).filter(
        DashboardWidget.user_id == current_user.id
    ).delete()
    db.commit()
    
    widgets = DashboardWidgetService.initialize_default_widgets(db, current_user)
    return widgets
