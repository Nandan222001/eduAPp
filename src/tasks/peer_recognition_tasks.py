from datetime import datetime, date, timedelta
from typing import Optional
from celery import Task
from sqlalchemy.orm import Session

from src.celery_app import celery_app
from src.database import SessionLocal
from src.models.institution import Institution
from src.services.peer_recognition_service import PeerRecognitionService


class PeerRecognitionTask(Task):
    _db: Optional[Session] = None

    @property
    def db(self) -> Session:
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs) -> None:
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(
    base=PeerRecognitionTask,
    bind=True,
    name="peer_recognition.update_daily_analytics"
)
def update_daily_analytics_task(
    self,
    institution_id: Optional[int] = None,
    analytics_date: Optional[str] = None
) -> dict:
    db = self.db
    
    if analytics_date:
        target_date = datetime.strptime(analytics_date, "%Y-%m-%d").date()
    else:
        target_date = date.today()
    
    processed = 0
    failed = 0
    
    if institution_id:
        institutions = [db.query(Institution).filter(Institution.id == institution_id).first()]
    else:
        institutions = db.query(Institution).filter(Institution.is_active == True).all()
    
    for institution in institutions:
        if not institution:
            continue
        
        try:
            PeerRecognitionService.update_analytics(
                db=db,
                institution_id=institution.id,
                analytics_date=target_date
            )
            processed += 1
        except Exception as e:
            failed += 1
            print(f"Failed to update analytics for institution {institution.id}: {str(e)}")
    
    return {
        "task": "update_daily_analytics",
        "date": target_date.isoformat(),
        "processed": processed,
        "failed": failed,
        "total": processed + failed
    }


@celery_app.task(
    base=PeerRecognitionTask,
    bind=True,
    name="peer_recognition.update_historical_analytics"
)
def update_historical_analytics_task(
    self,
    institution_id: int,
    days: int = 30
) -> dict:
    db = self.db
    
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    processed = 0
    failed = 0
    
    current_date = start_date
    while current_date <= end_date:
        try:
            PeerRecognitionService.update_analytics(
                db=db,
                institution_id=institution_id,
                analytics_date=current_date
            )
            processed += 1
        except Exception as e:
            failed += 1
            print(f"Failed to update analytics for {current_date}: {str(e)}")
        
        current_date += timedelta(days=1)
    
    return {
        "task": "update_historical_analytics",
        "institution_id": institution_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "processed": processed,
        "failed": failed,
        "total": processed + failed
    }
