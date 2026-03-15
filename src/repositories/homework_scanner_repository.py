from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from datetime import datetime
from src.models.homework_scanner import HomeworkScan, HomeworkFeedback, MistakeType


class HomeworkScanRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> HomeworkScan:
        scan = HomeworkScan(**kwargs)
        self.db.add(scan)
        self.db.flush()
        return scan

    def get_by_id(self, scan_id: int) -> Optional[HomeworkScan]:
        return self.db.query(HomeworkScan).filter(HomeworkScan.id == scan_id).first()

    def get_with_feedbacks(self, scan_id: int) -> Optional[HomeworkScan]:
        return self.db.query(HomeworkScan).options(
            joinedload(HomeworkScan.feedbacks)
        ).filter(HomeworkScan.id == scan_id).first()

    def list_by_student(
        self,
        student_id: int,
        skip: int = 0,
        limit: int = 100,
        subject_id: Optional[int] = None
    ) -> List[HomeworkScan]:
        query = self.db.query(HomeworkScan).filter(
            HomeworkScan.student_id == student_id
        )

        if subject_id:
            query = query.filter(HomeworkScan.subject_id == subject_id)

        return query.order_by(desc(HomeworkScan.scan_date)).offset(skip).limit(limit).all()

    def count_by_student(
        self,
        student_id: int,
        subject_id: Optional[int] = None
    ) -> int:
        query = self.db.query(HomeworkScan).filter(
            HomeworkScan.student_id == student_id
        )

        if subject_id:
            query = query.filter(HomeworkScan.subject_id == subject_id)

        return query.count()

    def update(self, scan_id: int, **kwargs) -> Optional[HomeworkScan]:
        scan = self.get_by_id(scan_id)
        if scan:
            for key, value in kwargs.items():
                setattr(scan, key, value)
            scan.updated_at = datetime.utcnow()
            self.db.flush()
        return scan

    def delete(self, scan_id: int) -> bool:
        scan = self.get_by_id(scan_id)
        if scan:
            self.db.delete(scan)
            self.db.flush()
            return True
        return False


class HomeworkFeedbackRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> HomeworkFeedback:
        feedback = HomeworkFeedback(**kwargs)
        self.db.add(feedback)
        self.db.flush()
        return feedback

    def create_bulk(self, feedbacks: List[Dict[str, Any]]) -> List[HomeworkFeedback]:
        feedback_objects = [HomeworkFeedback(**f) for f in feedbacks]
        self.db.add_all(feedback_objects)
        self.db.flush()
        return feedback_objects

    def get_by_scan_id(self, scan_id: int) -> List[HomeworkFeedback]:
        return self.db.query(HomeworkFeedback).filter(
            HomeworkFeedback.scan_id == scan_id
        ).order_by(HomeworkFeedback.question_number).all()

    def get_mistake_patterns_by_student(
        self,
        student_id: int,
        subject_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        query = self.db.query(
            HomeworkFeedback.mistake_type,
            func.count(HomeworkFeedback.id).label('count')
        ).join(
            HomeworkScan
        ).filter(
            HomeworkScan.student_id == student_id,
            HomeworkFeedback.mistake_type.isnot(None)
        )

        if subject_id:
            query = query.filter(HomeworkScan.subject_id == subject_id)

        results = query.group_by(HomeworkFeedback.mistake_type).all()
        
        total = sum(r.count for r in results)
        
        return [
            {
                'mistake_type': r.mistake_type,
                'count': r.count,
                'percentage': (r.count / total * 100) if total > 0 else 0
            }
            for r in results
        ]
