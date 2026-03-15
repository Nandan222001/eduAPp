from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from decimal import Decimal
import numpy as np

from src.models.learning_styles import (
    LearningStyleProfile, AdaptiveContentRecommendation, PersonalizedContentFeed,
    AdaptiveLearningSession, LearningStyleEffectiveness, ContentTag,
    ContentDeliveryFormat, ProcessingStyle, SocialPreference
)
from src.models.study_material import StudyMaterial, MaterialType, MaterialAccessLog
from src.models.examination import ExamMarks
from src.models.assignment import Submission


class AdaptiveLearningService:
    def __init__(self, db: Session):
        self.db = db
    
    def adjust_content_difficulty(
        self,
        session_id: int,
        performance_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        session = self.db.query(AdaptiveLearningSession).filter(
            AdaptiveLearningSession.id == session_id
        ).first()
        
        if not session:
            return {"error": "Session not found"}
        
        success_rate = performance_metrics.get('success_rate', 0)
        current_difficulty = session.current_difficulty or "medium"
        
        difficulty_map = {
            "beginner": 1,
            "easy": 2,
            "medium": 3,
            "hard": 4,
            "advanced": 5
        }
        
        reverse_map = {v: k for k, v in difficulty_map.items()}
        current_level = difficulty_map.get(current_difficulty, 3)
        
        if success_rate >= 0.85:
            new_level = min(current_level + 1, 5)
            adjustment_reason = "High success rate, increasing difficulty"
        elif success_rate >= 0.70:
            new_level = current_level
            adjustment_reason = "Optimal performance, maintaining difficulty"
        elif success_rate >= 0.50:
            new_level = max(current_level - 1, 1)
            adjustment_reason = "Moderate struggle, decreasing difficulty"
        else:
            new_level = max(current_level - 1, 1)
            adjustment_reason = "Low success rate, decreasing difficulty"
        
        new_difficulty = reverse_map[new_level]
        
        adjustments = session.difficulty_adjustments or []
        adjustments.append({
            "timestamp": datetime.utcnow().isoformat(),
            "from": current_difficulty,
            "to": new_difficulty,
            "reason": adjustment_reason,
            "success_rate": success_rate
        })
        
        session.current_difficulty = new_difficulty
        session.difficulty_adjustments = adjustments
        session.success_rate = Decimal(str(success_rate))
        session.last_activity_at = datetime.utcnow()
        
        self.db.commit()
        
        return {
            "new_difficulty": new_difficulty,
            "previous_difficulty": current_difficulty,
            "reason": adjustment_reason,
            "adjustment_magnitude": new_level - current_level
        }
    
    def adjust_content_format(
        self,
        session_id: int,
        engagement_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        session = self.db.query(AdaptiveLearningSession).filter(
            AdaptiveLearningSession.id == session_id
        ).first()
        
        if not session:
            return {"error": "Session not found"}
        
        profile = self.db.query(LearningStyleProfile).filter(
            LearningStyleProfile.student_id == session.student_id
        ).first()
        
        engagement_rate = engagement_metrics.get('engagement_rate', 0)
        time_on_content = engagement_metrics.get('time_spent_seconds', 0)
        interaction_count = engagement_metrics.get('interaction_count', 0)
        
        current_format = session.current_format
        
        if engagement_rate < 0.40:
            format_scores = {}
            
            if profile:
                format_scores[ContentDeliveryFormat.VIDEO] = float(profile.visual_score) * 0.6 + float(profile.auditory_score) * 0.4
                format_scores[ContentDeliveryFormat.AUDIO] = float(profile.auditory_score)
                format_scores[ContentDeliveryFormat.TEXT] = float(profile.reading_writing_score)
                format_scores[ContentDeliveryFormat.INTERACTIVE] = float(profile.kinesthetic_score) * 0.8 + float(profile.visual_score) * 0.2
                format_scores[ContentDeliveryFormat.HANDS_ON] = float(profile.kinesthetic_score)
            else:
                format_scores = {
                    ContentDeliveryFormat.VIDEO: 0.5,
                    ContentDeliveryFormat.AUDIO: 0.4,
                    ContentDeliveryFormat.TEXT: 0.5,
                    ContentDeliveryFormat.INTERACTIVE: 0.6,
                    ContentDeliveryFormat.HANDS_ON: 0.5
                }
            
            for fmt in format_scores:
                if fmt == current_format:
                    format_scores[fmt] *= 0.5
            
            recommended_format = max(format_scores.items(), key=lambda x: x[1])[0]
            adjustment_reason = "Low engagement, switching to better-suited format"
        else:
            recommended_format = current_format
            adjustment_reason = "Good engagement, maintaining current format"
        
        if recommended_format != current_format:
            adjustments = session.format_adjustments or []
            adjustments.append({
                "timestamp": datetime.utcnow().isoformat(),
                "from": current_format.value,
                "to": recommended_format.value,
                "reason": adjustment_reason,
                "engagement_rate": engagement_rate
            })
            
            session.current_format = recommended_format
            session.format_adjustments = adjustments
        
        session.engagement_rate = Decimal(str(engagement_rate))
        session.time_spent_seconds = (session.time_spent_seconds or 0) + time_on_content
        session.interaction_count = (session.interaction_count or 0) + interaction_count
        session.last_activity_at = datetime.utcnow()
        
        engagement_data = session.engagement_data or {}
        engagement_data[datetime.utcnow().isoformat()] = engagement_metrics
        session.engagement_data = engagement_data
        
        self.db.commit()
        
        return {
            "recommended_format": recommended_format.value,
            "previous_format": current_format.value,
            "reason": adjustment_reason,
            "format_changed": recommended_format != current_format
        }
    
    def create_learning_session(
        self,
        student_id: int,
        institution_id: int,
        content_type: str,
        content_id: int,
        initial_format: ContentDeliveryFormat,
        initial_difficulty: Optional[str] = None
    ) -> AdaptiveLearningSession:
        session = AdaptiveLearningSession(
            institution_id=institution_id,
            student_id=student_id,
            content_type=content_type,
            content_id=content_id,
            initial_format=initial_format,
            current_format=initial_format,
            initial_difficulty=initial_difficulty or "medium",
            current_difficulty=initial_difficulty or "medium",
            started_at=datetime.utcnow(),
            last_activity_at=datetime.utcnow()
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def update_session_performance(
        self,
        session_id: int,
        performance_data: Dict[str, Any]
    ) -> None:
        session = self.db.query(AdaptiveLearningSession).filter(
            AdaptiveLearningSession.id == session_id
        ).first()
        
        if session:
            current_performance = session.performance_data or {}
            current_performance.update(performance_data)
            session.performance_data = current_performance
            session.last_activity_at = datetime.utcnow()
            
            self.db.commit()
    
    def end_learning_session(
        self,
        session_id: int
    ) -> AdaptiveLearningSession:
        session = self.db.query(AdaptiveLearningSession).filter(
            AdaptiveLearningSession.id == session_id
        ).first()
        
        if session:
            session.ended_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(session)
        
        return session
    
    def get_real_time_adjustments(
        self,
        session_id: int,
        performance_metrics: Dict[str, Any],
        engagement_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        difficulty_adjustment = self.adjust_content_difficulty(session_id, performance_metrics)
        format_adjustment = self.adjust_content_format(session_id, engagement_metrics)
        
        return {
            "difficulty": difficulty_adjustment,
            "format": format_adjustment,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_student_performance_trend(
        self,
        student_id: int,
        institution_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        sessions = self.db.query(AdaptiveLearningSession).filter(
            and_(
                AdaptiveLearningSession.student_id == student_id,
                AdaptiveLearningSession.institution_id == institution_id,
                AdaptiveLearningSession.started_at >= cutoff_date
            )
        ).all()
        
        if not sessions:
            return {
                "average_success_rate": 0,
                "average_engagement_rate": 0,
                "total_sessions": 0,
                "total_time_spent": 0,
                "trend": "insufficient_data"
            }
        
        success_rates = [float(s.success_rate) for s in sessions if s.success_rate is not None]
        engagement_rates = [float(s.engagement_rate) for s in sessions if s.engagement_rate is not None]
        total_time = sum(s.time_spent_seconds or 0 for s in sessions)
        
        avg_success = sum(success_rates) / len(success_rates) if success_rates else 0
        avg_engagement = sum(engagement_rates) / len(engagement_rates) if engagement_rates else 0
        
        if len(success_rates) >= 5:
            recent_success = sum(success_rates[-5:]) / 5
            older_success = sum(success_rates[:-5]) / len(success_rates[:-5]) if len(success_rates) > 5 else avg_success
            
            if recent_success > older_success * 1.1:
                trend = "improving"
            elif recent_success < older_success * 0.9:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "average_success_rate": round(avg_success, 2),
            "average_engagement_rate": round(avg_engagement, 2),
            "total_sessions": len(sessions),
            "total_time_spent": total_time,
            "trend": trend,
            "difficulty_distribution": self._get_difficulty_distribution(sessions)
        }
    
    def _get_difficulty_distribution(self, sessions: List[AdaptiveLearningSession]) -> Dict[str, int]:
        distribution = {}
        for session in sessions:
            difficulty = session.current_difficulty or "medium"
            distribution[difficulty] = distribution.get(difficulty, 0) + 1
        return distribution
    
    def record_effectiveness(
        self,
        student_id: int,
        institution_id: int,
        content_type: str,
        content_id: int,
        delivery_format: ContentDeliveryFormat,
        metrics: Dict[str, Any]
    ) -> LearningStyleEffectiveness:
        profile = self.db.query(LearningStyleProfile).filter(
            LearningStyleProfile.student_id == student_id
        ).first()
        
        learning_style_snapshot = None
        if profile:
            learning_style_snapshot = {
                "visual": float(profile.visual_score),
                "auditory": float(profile.auditory_score),
                "kinesthetic": float(profile.kinesthetic_score),
                "reading_writing": float(profile.reading_writing_score),
                "dominant_style": profile.dominant_style
            }
        
        effectiveness = LearningStyleEffectiveness(
            institution_id=institution_id,
            student_id=student_id,
            content_type=content_type,
            content_id=content_id,
            delivery_format=delivery_format,
            time_spent_seconds=metrics.get('time_spent_seconds', 0),
            completion_rate=Decimal(str(metrics.get('completion_rate', 0))),
            pre_assessment_score=Decimal(str(metrics['pre_assessment_score'])) if 'pre_assessment_score' in metrics else None,
            post_assessment_score=Decimal(str(metrics['post_assessment_score'])) if 'post_assessment_score' in metrics else None,
            improvement=Decimal(str(metrics['improvement'])) if 'improvement' in metrics else None,
            engagement_score=Decimal(str(metrics.get('engagement_score', 0))),
            satisfaction_rating=metrics.get('satisfaction_rating'),
            would_recommend=metrics.get('would_recommend'),
            feedback=metrics.get('feedback'),
            learning_style_at_time=learning_style_snapshot
        )
        
        self.db.add(effectiveness)
        self.db.commit()
        self.db.refresh(effectiveness)
        
        return effectiveness
    
    def get_format_effectiveness_analysis(
        self,
        student_id: int,
        institution_id: int
    ) -> Dict[str, Any]:
        effectiveness_records = self.db.query(LearningStyleEffectiveness).filter(
            and_(
                LearningStyleEffectiveness.student_id == student_id,
                LearningStyleEffectiveness.institution_id == institution_id
            )
        ).all()
        
        if not effectiveness_records:
            return {"error": "No effectiveness data available"}
        
        format_stats = {}
        for record in effectiveness_records:
            fmt = record.delivery_format.value
            if fmt not in format_stats:
                format_stats[fmt] = {
                    "count": 0,
                    "total_engagement": 0,
                    "total_improvement": 0,
                    "total_time": 0,
                    "satisfaction_ratings": []
                }
            
            format_stats[fmt]["count"] += 1
            format_stats[fmt]["total_engagement"] += float(record.engagement_score or 0)
            format_stats[fmt]["total_improvement"] += float(record.improvement or 0)
            format_stats[fmt]["total_time"] += record.time_spent_seconds
            if record.satisfaction_rating:
                format_stats[fmt]["satisfaction_ratings"].append(record.satisfaction_rating)
        
        analysis = {}
        for fmt, stats in format_stats.items():
            count = stats["count"]
            analysis[fmt] = {
                "usage_count": count,
                "average_engagement": round(stats["total_engagement"] / count, 2),
                "average_improvement": round(stats["total_improvement"] / count, 2),
                "average_time_spent": round(stats["total_time"] / count, 2),
                "average_satisfaction": round(sum(stats["satisfaction_ratings"]) / len(stats["satisfaction_ratings"]), 2) if stats["satisfaction_ratings"] else None
            }
        
        return analysis
