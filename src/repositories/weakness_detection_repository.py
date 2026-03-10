from typing import List, Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc

from src.models.study_planner import (
    ChapterPerformance,
    QuestionRecommendation,
    FocusArea,
    PersonalizedInsight
)


class ChapterPerformanceRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, performance_data: Dict[str, Any]) -> ChapterPerformance:
        performance = ChapterPerformance(**performance_data)
        self.db.add(performance)
        self.db.commit()
        self.db.refresh(performance)
        return performance
    
    def get_by_id(self, performance_id: int, institution_id: int) -> Optional[ChapterPerformance]:
        return self.db.query(ChapterPerformance).filter(
            ChapterPerformance.id == performance_id,
            ChapterPerformance.institution_id == institution_id
        ).first()
    
    def get_by_student_chapter(
        self,
        student_id: int,
        chapter_id: int,
        institution_id: int
    ) -> Optional[ChapterPerformance]:
        return self.db.query(ChapterPerformance).filter(
            ChapterPerformance.student_id == student_id,
            ChapterPerformance.chapter_id == chapter_id,
            ChapterPerformance.institution_id == institution_id
        ).first()
    
    def list_by_student(
        self,
        student_id: int,
        institution_id: int,
        subject_id: Optional[int] = None,
        min_mastery_score: Optional[Decimal] = None,
        max_mastery_score: Optional[Decimal] = None
    ) -> List[ChapterPerformance]:
        query = self.db.query(ChapterPerformance).filter(
            ChapterPerformance.student_id == student_id,
            ChapterPerformance.institution_id == institution_id
        )
        
        if subject_id:
            query = query.filter(ChapterPerformance.subject_id == subject_id)
        
        if min_mastery_score is not None:
            query = query.filter(ChapterPerformance.mastery_score >= min_mastery_score)
        
        if max_mastery_score is not None:
            query = query.filter(ChapterPerformance.mastery_score <= max_mastery_score)
        
        return query.all()
    
    def update(
        self,
        performance_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[ChapterPerformance]:
        performance = self.get_by_id(performance_id, institution_id)
        if not performance:
            return None
        
        for key, value in update_data.items():
            if hasattr(performance, key):
                setattr(performance, key, value)
        
        performance.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(performance)
        return performance
    
    def delete(self, performance_id: int, institution_id: int) -> bool:
        performance = self.get_by_id(performance_id, institution_id)
        if not performance:
            return False
        
        self.db.delete(performance)
        self.db.commit()
        return True


class QuestionRecommendationRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, recommendation_data: Dict[str, Any]) -> QuestionRecommendation:
        recommendation = QuestionRecommendation(**recommendation_data)
        self.db.add(recommendation)
        self.db.commit()
        self.db.refresh(recommendation)
        return recommendation
    
    def get_by_id(self, recommendation_id: int, institution_id: int) -> Optional[QuestionRecommendation]:
        return self.db.query(QuestionRecommendation).filter(
            QuestionRecommendation.id == recommendation_id,
            QuestionRecommendation.institution_id == institution_id
        ).first()
    
    def get_by_student_question(
        self,
        student_id: int,
        question_id: int,
        institution_id: int
    ) -> Optional[QuestionRecommendation]:
        return self.db.query(QuestionRecommendation).filter(
            QuestionRecommendation.student_id == student_id,
            QuestionRecommendation.question_id == question_id,
            QuestionRecommendation.institution_id == institution_id
        ).first()
    
    def list_by_student(
        self,
        student_id: int,
        institution_id: int,
        is_completed: Optional[bool] = None,
        due_before: Optional[date] = None,
        limit: int = 50
    ) -> List[QuestionRecommendation]:
        query = self.db.query(QuestionRecommendation).filter(
            QuestionRecommendation.student_id == student_id,
            QuestionRecommendation.institution_id == institution_id
        )
        
        if is_completed is not None:
            query = query.filter(QuestionRecommendation.is_completed == is_completed)
        
        if due_before:
            query = query.filter(
                QuestionRecommendation.next_review_date <= due_before
            )
        
        return query.order_by(
            QuestionRecommendation.priority_rank.asc()
        ).limit(limit).all()
    
    def update(
        self,
        recommendation_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[QuestionRecommendation]:
        recommendation = self.get_by_id(recommendation_id, institution_id)
        if not recommendation:
            return None
        
        for key, value in update_data.items():
            if hasattr(recommendation, key):
                setattr(recommendation, key, value)
        
        recommendation.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(recommendation)
        return recommendation
    
    def delete(self, recommendation_id: int, institution_id: int) -> bool:
        recommendation = self.get_by_id(recommendation_id, institution_id)
        if not recommendation:
            return False
        
        self.db.delete(recommendation)
        self.db.commit()
        return True


class FocusAreaRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, focus_area_data: Dict[str, Any]) -> FocusArea:
        focus_area = FocusArea(**focus_area_data)
        self.db.add(focus_area)
        self.db.commit()
        self.db.refresh(focus_area)
        return focus_area
    
    def get_by_id(self, focus_area_id: int, institution_id: int) -> Optional[FocusArea]:
        return self.db.query(FocusArea).filter(
            FocusArea.id == focus_area_id,
            FocusArea.institution_id == institution_id
        ).first()
    
    def list_by_student(
        self,
        student_id: int,
        institution_id: int,
        status: Optional[str] = None,
        focus_type: Optional[str] = None,
        limit: int = 50
    ) -> List[FocusArea]:
        query = self.db.query(FocusArea).filter(
            FocusArea.student_id == student_id,
            FocusArea.institution_id == institution_id
        )
        
        if status:
            query = query.filter(FocusArea.status == status)
        
        if focus_type:
            query = query.filter(FocusArea.focus_type == focus_type)
        
        return query.order_by(
            FocusArea.combined_priority.desc()
        ).limit(limit).all()
    
    def update(
        self,
        focus_area_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[FocusArea]:
        focus_area = self.get_by_id(focus_area_id, institution_id)
        if not focus_area:
            return None
        
        for key, value in update_data.items():
            if hasattr(focus_area, key):
                setattr(focus_area, key, value)
        
        focus_area.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(focus_area)
        return focus_area
    
    def delete(self, focus_area_id: int, institution_id: int) -> bool:
        focus_area = self.get_by_id(focus_area_id, institution_id)
        if not focus_area:
            return False
        
        self.db.delete(focus_area)
        self.db.commit()
        return True


class PersonalizedInsightRepository:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, insight_data: Dict[str, Any]) -> PersonalizedInsight:
        insight = PersonalizedInsight(**insight_data)
        self.db.add(insight)
        self.db.commit()
        self.db.refresh(insight)
        return insight
    
    def get_by_id(self, insight_id: int, institution_id: int) -> Optional[PersonalizedInsight]:
        return self.db.query(PersonalizedInsight).filter(
            PersonalizedInsight.id == insight_id,
            PersonalizedInsight.institution_id == institution_id
        ).first()
    
    def list_by_student(
        self,
        student_id: int,
        institution_id: int,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        is_resolved: Optional[bool] = None,
        is_acknowledged: Optional[bool] = None,
        limit: int = 50
    ) -> List[PersonalizedInsight]:
        query = self.db.query(PersonalizedInsight).filter(
            PersonalizedInsight.student_id == student_id,
            PersonalizedInsight.institution_id == institution_id
        )
        
        if category:
            query = query.filter(PersonalizedInsight.category == category)
        
        if severity:
            query = query.filter(PersonalizedInsight.severity == severity)
        
        if is_resolved is not None:
            query = query.filter(PersonalizedInsight.is_resolved == is_resolved)
        
        if is_acknowledged is not None:
            query = query.filter(PersonalizedInsight.is_acknowledged == is_acknowledged)
        
        return query.order_by(
            PersonalizedInsight.priority.asc()
        ).limit(limit).all()
    
    def update(
        self,
        insight_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[PersonalizedInsight]:
        insight = self.get_by_id(insight_id, institution_id)
        if not insight:
            return None
        
        for key, value in update_data.items():
            if hasattr(insight, key):
                setattr(insight, key, value)
        
        insight.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(insight)
        return insight
    
    def delete(self, insight_id: int, institution_id: int) -> bool:
        insight = self.get_by_id(insight_id, institution_id)
        if not insight:
            return False
        
        self.db.delete(insight)
        self.db.commit()
        return True
    
    def get_summary(self, student_id: int, institution_id: int) -> Dict[str, Any]:
        insights = self.list_by_student(
            student_id=student_id,
            institution_id=institution_id,
            is_resolved=False,
            limit=1000
        )
        
        summary = {
            'total_insights': len(insights),
            'by_severity': {},
            'by_category': {},
            'acknowledged': sum(1 for i in insights if i.is_acknowledged),
            'unacknowledged': sum(1 for i in insights if not i.is_acknowledged),
            'actionable': sum(1 for i in insights if i.is_actionable),
            'ai_generated': sum(1 for i in insights if i.ai_generated)
        }
        
        for insight in insights:
            summary['by_severity'][insight.severity] = summary['by_severity'].get(insight.severity, 0) + 1
            summary['by_category'][insight.category] = summary['by_category'].get(insight.category, 0) + 1
        
        return summary
