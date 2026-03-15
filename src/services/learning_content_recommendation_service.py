from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, case
from decimal import Decimal
import numpy as np

from src.models.learning_styles import (
    LearningStyleProfile, AdaptiveContentRecommendation, PersonalizedContentFeed,
    ContentTag, ContentDeliveryFormat
)
from src.models.study_material import StudyMaterial, MaterialAccessLog
from src.models.examination import ExamMarks
from src.models.assignment import Submission
from src.models.student import Student


class LearningContentRecommendationService:
    def __init__(self, db: Session):
        self.db = db
    
    def generate_recommendations(
        self,
        student_id: int,
        institution_id: int,
        subject_id: Optional[int] = None,
        chapter_id: Optional[int] = None,
        topic_id: Optional[int] = None,
        limit: int = 10
    ) -> List[AdaptiveContentRecommendation]:
        profile = self.db.query(LearningStyleProfile).filter(
            LearningStyleProfile.student_id == student_id
        ).first()
        
        if not profile:
            return []
        
        query = self.db.query(StudyMaterial).filter(
            and_(
                StudyMaterial.institution_id == institution_id,
                StudyMaterial.is_active == True
            )
        )
        
        if subject_id:
            query = query.filter(StudyMaterial.subject_id == subject_id)
        if chapter_id:
            query = query.filter(StudyMaterial.chapter_id == chapter_id)
        if topic_id:
            query = query.filter(StudyMaterial.topic_id == topic_id)
        
        materials = query.all()
        
        recommendations = []
        for material in materials:
            content_tag = self.db.query(ContentTag).filter(
                and_(
                    ContentTag.content_type == "study_material",
                    ContentTag.content_id == material.id
                )
            ).first()
            
            learning_style_score = self._calculate_learning_style_match(profile, content_tag)
            difficulty_score = self._calculate_difficulty_match(student_id, material)
            performance_score = self._calculate_performance_based_score(student_id, material)
            collaborative_score = self._calculate_collaborative_filter_score(student_id, material)
            
            overall_score = (
                learning_style_score * 0.35 +
                difficulty_score * 0.20 +
                performance_score * 0.25 +
                collaborative_score * 0.20
            )
            
            recommended_format = self._determine_recommended_format(profile, content_tag)
            
            reasoning = {
                "learning_style_match": f"{learning_style_score:.2f}",
                "difficulty_match": f"{difficulty_score:.2f}",
                "performance_alignment": f"{performance_score:.2f}",
                "collaborative_signal": f"{collaborative_score:.2f}",
                "primary_reason": self._get_primary_reason(
                    learning_style_score, difficulty_score, performance_score, collaborative_score
                )
            }
            
            recommendation = AdaptiveContentRecommendation(
                institution_id=institution_id,
                profile_id=profile.id,
                student_id=student_id,
                content_type="study_material",
                content_id=material.id,
                subject_id=material.subject_id,
                chapter_id=material.chapter_id,
                topic_id=material.topic_id,
                recommended_format=recommended_format,
                learning_style_match_score=Decimal(str(learning_style_score)),
                difficulty_match_score=Decimal(str(difficulty_score)),
                performance_based_score=Decimal(str(performance_score)),
                collaborative_filter_score=Decimal(str(collaborative_score)),
                overall_score=Decimal(str(overall_score)),
                reasoning=reasoning
            )
            
            recommendations.append(recommendation)
        
        recommendations.sort(key=lambda x: float(x.overall_score), reverse=True)
        
        for idx, rec in enumerate(recommendations[:limit]):
            rec.rank = idx + 1
            self.db.add(rec)
        
        self.db.commit()
        
        return recommendations[:limit]
    
    def _calculate_learning_style_match(
        self,
        profile: LearningStyleProfile,
        content_tag: Optional[ContentTag]
    ) -> float:
        if not content_tag:
            return 0.5
        
        visual_match = float(profile.visual_score) * float(content_tag.visual_suitability)
        auditory_match = float(profile.auditory_score) * float(content_tag.auditory_suitability)
        kinesthetic_match = float(profile.kinesthetic_score) * float(content_tag.kinesthetic_suitability)
        rw_match = float(profile.reading_writing_score) * float(content_tag.reading_writing_suitability)
        
        style_match = visual_match + auditory_match + kinesthetic_match + rw_match
        
        social_match = 1.0
        if profile.social_vs_solitary.value == "social" and content_tag.supports_social_learning:
            social_match = 1.2
        elif profile.social_vs_solitary.value == "solitary" and content_tag.supports_solitary_learning:
            social_match = 1.2
        
        processing_match = 1.0
        if profile.sequential_vs_global.value == "sequential" and content_tag.sequential_flow:
            processing_match = 1.2
        elif profile.sequential_vs_global.value == "global" and content_tag.holistic_approach:
            processing_match = 1.2
        
        final_score = style_match * social_match * processing_match
        
        return min(final_score, 1.0)
    
    def _calculate_difficulty_match(
        self,
        student_id: int,
        material: StudyMaterial
    ) -> float:
        recent_performance = self.db.query(
            func.avg(ExamMarks.marks_obtained / ExamMarks.total_marks * 100)
        ).join(
            ExamMarks.exam_result
        ).filter(
            and_(
                ExamMarks.student_id == student_id,
                material.subject_id.isnot(None)
            )
        ).scalar()
        
        if recent_performance is None:
            return 0.7
        
        if recent_performance >= 85:
            preferred_difficulty = "advanced"
        elif recent_performance >= 70:
            preferred_difficulty = "medium"
        else:
            preferred_difficulty = "easy"
        
        return 0.9
    
    def _calculate_performance_based_score(
        self,
        student_id: int,
        material: StudyMaterial
    ) -> float:
        if not material.chapter_id:
            return 0.5
        
        chapter_performance = self.db.query(
            func.avg(ExamMarks.marks_obtained / ExamMarks.total_marks * 100)
        ).join(
            ExamMarks.exam_result
        ).filter(
            ExamMarks.student_id == student_id
        ).scalar()
        
        if chapter_performance is None:
            return 0.5
        
        if chapter_performance < 60:
            return 0.9
        elif chapter_performance < 75:
            return 0.7
        else:
            return 0.5
    
    def _calculate_collaborative_filter_score(
        self,
        student_id: int,
        material: StudyMaterial
    ) -> float:
        student = self.db.query(Student).filter(Student.id == student_id).first()
        
        if not student or not student.section_id:
            return 0.5
        
        similar_students = self.db.query(Student).filter(
            and_(
                Student.section_id == student.section_id,
                Student.id != student_id
            )
        ).limit(20).all()
        
        similar_student_ids = [s.id for s in similar_students]
        
        access_count = self.db.query(func.count(MaterialAccessLog.id)).filter(
            and_(
                MaterialAccessLog.material_id == material.id,
                MaterialAccessLog.user_id.in_(similar_student_ids)
            )
        ).scalar()
        
        if access_count > 10:
            return 0.9
        elif access_count > 5:
            return 0.7
        elif access_count > 0:
            return 0.6
        else:
            return 0.4
    
    def _determine_recommended_format(
        self,
        profile: LearningStyleProfile,
        content_tag: Optional[ContentTag]
    ) -> ContentDeliveryFormat:
        if content_tag:
            return content_tag.delivery_format
        
        scores = {
            "visual": float(profile.visual_score),
            "auditory": float(profile.auditory_score),
            "kinesthetic": float(profile.kinesthetic_score),
            "reading_writing": float(profile.reading_writing_score)
        }
        
        dominant = max(scores.items(), key=lambda x: x[1])[0]
        
        format_map = {
            "visual": ContentDeliveryFormat.VIDEO,
            "auditory": ContentDeliveryFormat.AUDIO,
            "kinesthetic": ContentDeliveryFormat.INTERACTIVE,
            "reading_writing": ContentDeliveryFormat.TEXT
        }
        
        return format_map.get(dominant, ContentDeliveryFormat.MIXED)
    
    def _get_primary_reason(
        self,
        learning_style_score: float,
        difficulty_score: float,
        performance_score: float,
        collaborative_score: float
    ) -> str:
        scores = {
            "Matches your learning style preferences": learning_style_score,
            "Appropriate difficulty level": difficulty_score,
            "Addresses your learning needs": performance_score,
            "Popular among similar students": collaborative_score
        }
        
        return max(scores.items(), key=lambda x: x[1])[0]
    
    def generate_personalized_feed(
        self,
        student_id: int,
        institution_id: int,
        subject_id: Optional[int] = None,
        limit: int = 20,
        algorithm_version: str = "v1.0"
    ) -> List[PersonalizedContentFeed]:
        recommendations = self.generate_recommendations(
            student_id, institution_id, subject_id, limit=limit * 2
        )
        
        feed_items = []
        for idx, rec in enumerate(recommendations[:limit]):
            recency_score = 1.0 - (idx * 0.02)
            
            feed_item = PersonalizedContentFeed(
                institution_id=institution_id,
                student_id=student_id,
                content_type=rec.content_type,
                content_id=rec.content_id,
                subject_id=rec.subject_id,
                position=idx + 1,
                learning_style_score=rec.learning_style_match_score,
                collaborative_score=rec.collaborative_filter_score,
                performance_score=rec.performance_based_score,
                recency_score=Decimal(str(recency_score)),
                final_score=rec.overall_score,
                algorithm_version=algorithm_version,
                generated_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(hours=24)
            )
            
            feed_items.append(feed_item)
            self.db.add(feed_item)
        
        self.db.commit()
        
        return feed_items
    
    def record_feed_interaction(
        self,
        feed_id: int,
        student_id: int,
        time_spent_seconds: Optional[int] = None
    ) -> None:
        feed_item = self.db.query(PersonalizedContentFeed).filter(
            and_(
                PersonalizedContentFeed.id == feed_id,
                PersonalizedContentFeed.student_id == student_id
            )
        ).first()
        
        if feed_item:
            feed_item.was_clicked = True
            feed_item.clicked_at = datetime.utcnow()
            if time_spent_seconds:
                feed_item.time_spent_seconds = time_spent_seconds
            
            self.db.commit()
    
    def get_active_feed(
        self,
        student_id: int,
        institution_id: int
    ) -> List[PersonalizedContentFeed]:
        return self.db.query(PersonalizedContentFeed).filter(
            and_(
                PersonalizedContentFeed.student_id == student_id,
                PersonalizedContentFeed.institution_id == institution_id,
                PersonalizedContentFeed.expires_at > datetime.utcnow()
            )
        ).order_by(PersonalizedContentFeed.position).all()
    
    def get_recommendation_effectiveness(
        self,
        student_id: int,
        institution_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        recommendations = self.db.query(AdaptiveContentRecommendation).filter(
            and_(
                AdaptiveContentRecommendation.student_id == student_id,
                AdaptiveContentRecommendation.institution_id == institution_id,
                AdaptiveContentRecommendation.created_at >= cutoff_date
            )
        ).all()
        
        if not recommendations:
            return {
                "total_recommendations": 0,
                "view_rate": 0,
                "engagement_rate": 0,
                "average_effectiveness": 0
            }
        
        total = len(recommendations)
        viewed = sum(1 for r in recommendations if r.was_viewed)
        engaged = sum(1 for r in recommendations if r.was_engaged)
        
        effectiveness_scores = [
            float(r.effectiveness_score) for r in recommendations 
            if r.effectiveness_score is not None
        ]
        
        avg_effectiveness = sum(effectiveness_scores) / len(effectiveness_scores) if effectiveness_scores else 0
        
        return {
            "total_recommendations": total,
            "view_rate": round(viewed / total, 2) if total > 0 else 0,
            "engagement_rate": round(engaged / total, 2) if total > 0 else 0,
            "average_effectiveness": round(avg_effectiveness, 2)
        }
