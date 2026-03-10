from typing import List, Optional, Dict, Any, Tuple
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc

from src.models.study_planner import (
    ChapterPerformance, QuestionRecommendation, FocusArea, PersonalizedInsight, WeakArea
)
from src.models.examination import ExamMarks, ExamSubject, Exam
from src.models.assignment import Submission
from src.models.academic import Chapter, Topic, Subject
from src.models.previous_year_papers import QuestionBank, TopicPrediction, DifficultyLevel
from src.models.ml_prediction import PerformancePrediction
from src.ml.prediction_service import PerformancePredictionService


class ChapterPerformanceAnalyzer:
    
    def __init__(self, db: Session):
        self.db = db
    
    def analyze_chapter_performance(
        self,
        institution_id: int,
        student_id: int,
        subject_id: Optional[int] = None,
        chapter_id: Optional[int] = None
    ) -> List[ChapterPerformance]:
        query = self.db.query(ExamMarks).join(ExamSubject).join(Exam).filter(
            ExamMarks.institution_id == institution_id,
            ExamMarks.student_id == student_id,
            ExamMarks.is_absent == False
        )
        
        if subject_id:
            query = query.filter(ExamSubject.subject_id == subject_id)
        
        exam_marks_list = query.all()
        
        chapter_stats = {}
        for mark in exam_marks_list:
            exam_subject = mark.exam_subject
            subject = exam_subject.subject
            
            chapters = self.db.query(Chapter).filter(
                Chapter.subject_id == subject.id,
                Chapter.institution_id == institution_id
            ).all()
            
            for chapter in chapters:
                if chapter_id and chapter.id != chapter_id:
                    continue
                    
                key = (student_id, chapter.id)
                if key not in chapter_stats:
                    chapter_stats[key] = {
                        'chapter_id': chapter.id,
                        'subject_id': subject.id,
                        'scores': [],
                        'attempts': 0,
                        'time_spent': 0
                    }
                
                theory = float(mark.theory_marks_obtained or 0)
                practical = float(mark.practical_marks_obtained or 0)
                total_obtained = theory + practical
                total_max = float(exam_subject.theory_max_marks + exam_subject.practical_max_marks)
                
                if total_max > 0:
                    percentage = (total_obtained / total_max) * 100
                    chapter_stats[key]['scores'].append(percentage)
                    chapter_stats[key]['attempts'] += 1
        
        performances = []
        for (student_id, chapter_id), stats in chapter_stats.items():
            if stats['scores']:
                avg_score = sum(stats['scores']) / len(stats['scores'])
                success_rate = sum(1 for s in stats['scores'] if s >= 60) / len(stats['scores']) * 100
                successful = sum(1 for s in stats['scores'] if s >= 60)
                failed = len(stats['scores']) - successful
                
                trend = self._calculate_trend(stats['scores'])
                improvement_rate = self._calculate_improvement_rate(stats['scores'])
                proficiency_level = self._determine_proficiency_level(avg_score)
                mastery_score = self._calculate_mastery_score(avg_score, success_rate, stats['attempts'])
                
                existing = self.db.query(ChapterPerformance).filter(
                    ChapterPerformance.student_id == student_id,
                    ChapterPerformance.chapter_id == chapter_id
                ).first()
                
                if existing:
                    existing.average_score = Decimal(str(avg_score))
                    existing.total_attempts = stats['attempts']
                    existing.successful_attempts = successful
                    existing.failed_attempts = failed
                    existing.success_rate = Decimal(str(success_rate))
                    existing.proficiency_level = proficiency_level
                    existing.trend = trend
                    existing.improvement_rate = Decimal(str(improvement_rate))
                    existing.mastery_score = Decimal(str(mastery_score))
                    existing.updated_at = datetime.utcnow()
                    performance = existing
                else:
                    performance = ChapterPerformance(
                        institution_id=institution_id,
                        student_id=student_id,
                        subject_id=stats['subject_id'],
                        chapter_id=chapter_id,
                        average_score=Decimal(str(avg_score)),
                        total_attempts=stats['attempts'],
                        successful_attempts=successful,
                        failed_attempts=failed,
                        success_rate=Decimal(str(success_rate)),
                        proficiency_level=proficiency_level,
                        trend=trend,
                        improvement_rate=Decimal(str(improvement_rate)),
                        mastery_score=Decimal(str(mastery_score))
                    )
                    self.db.add(performance)
                
                performances.append(performance)
        
        self.db.commit()
        return performances
    
    def _calculate_trend(self, scores: List[float]) -> str:
        if len(scores) < 2:
            return "stable"
        
        recent_avg = sum(scores[-3:]) / len(scores[-3:])
        older_avg = sum(scores[:3]) / min(3, len(scores[:3]))
        
        diff = recent_avg - older_avg
        if diff > 5:
            return "improving"
        elif diff < -5:
            return "declining"
        return "stable"
    
    def _calculate_improvement_rate(self, scores: List[float]) -> float:
        if len(scores) < 2:
            return 0.0
        
        return scores[-1] - scores[0]
    
    def _determine_proficiency_level(self, avg_score: float) -> str:
        if avg_score >= 90:
            return "expert"
        elif avg_score >= 75:
            return "proficient"
        elif avg_score >= 60:
            return "competent"
        elif avg_score >= 40:
            return "developing"
        else:
            return "beginner"
    
    def _calculate_mastery_score(self, avg_score: float, success_rate: float, attempts: int) -> float:
        consistency_bonus = min(attempts * 2, 20)
        base_score = (avg_score * 0.6) + (success_rate * 0.4)
        return min(base_score + consistency_bonus, 100)
    
    def get_weak_chapters(
        self,
        institution_id: int,
        student_id: int,
        mastery_threshold: float = 60.0,
        limit: int = 10
    ) -> List[ChapterPerformance]:
        return self.db.query(ChapterPerformance).filter(
            ChapterPerformance.institution_id == institution_id,
            ChapterPerformance.student_id == student_id,
            ChapterPerformance.mastery_score < mastery_threshold
        ).order_by(ChapterPerformance.mastery_score.asc()).limit(limit).all()


class SmartQuestionRecommender:
    
    def __init__(self, db: Session):
        self.db = db
        self.INITIAL_INTERVAL = 1
        self.EASY_BONUS = 0.1
        self.HARD_PENALTY = -0.2
    
    def generate_recommendations(
        self,
        institution_id: int,
        student_id: int,
        weak_areas: List[WeakArea],
        limit: int = 20
    ) -> List[QuestionRecommendation]:
        recommendations = []
        
        for weak_area in weak_areas[:10]:
            questions = self.db.query(QuestionBank).filter(
                QuestionBank.institution_id == institution_id,
                QuestionBank.subject_id == weak_area.subject_id,
                QuestionBank.is_active == True
            )
            
            if weak_area.chapter_id:
                questions = questions.filter(QuestionBank.chapter_id == weak_area.chapter_id)
            if weak_area.topic_id:
                questions = questions.filter(QuestionBank.topic_id == weak_area.topic_id)
            
            questions = questions.limit(5).all()
            
            for question in questions:
                existing = self.db.query(QuestionRecommendation).filter(
                    QuestionRecommendation.student_id == student_id,
                    QuestionRecommendation.question_id == question.id
                ).first()
                
                if existing and existing.is_completed:
                    continue
                
                relevance_score = self._calculate_relevance_score(question, weak_area)
                difficulty_match = self._calculate_difficulty_match(question, weak_area)
                weakness_alignment = float(weak_area.weakness_score)
                spaced_rep_score = self._calculate_spaced_repetition_score(existing)
                
                recommendation_score = (
                    relevance_score * 0.3 +
                    difficulty_match * 0.25 +
                    weakness_alignment * 0.25 +
                    spaced_rep_score * 0.2
                )
                
                if existing:
                    existing.recommendation_score = Decimal(str(recommendation_score))
                    existing.relevance_score = Decimal(str(relevance_score))
                    existing.difficulty_match_score = Decimal(str(difficulty_match))
                    existing.weakness_alignment_score = Decimal(str(weakness_alignment))
                    existing.spaced_repetition_score = Decimal(str(spaced_rep_score))
                    existing.updated_at = datetime.utcnow()
                    rec = existing
                else:
                    rec = QuestionRecommendation(
                        institution_id=institution_id,
                        student_id=student_id,
                        question_id=question.id,
                        recommendation_score=Decimal(str(recommendation_score)),
                        relevance_score=Decimal(str(relevance_score)),
                        difficulty_match_score=Decimal(str(difficulty_match)),
                        weakness_alignment_score=Decimal(str(weakness_alignment)),
                        spaced_repetition_score=Decimal(str(spaced_rep_score)),
                        next_review_date=date.today() + timedelta(days=self.INITIAL_INTERVAL)
                    )
                    self.db.add(rec)
                
                recommendations.append(rec)
        
        self.db.commit()
        
        recommendations.sort(key=lambda x: float(x.recommendation_score), reverse=True)
        for idx, rec in enumerate(recommendations[:limit], 1):
            rec.priority_rank = idx
        
        self.db.commit()
        return recommendations[:limit]
    
    def _calculate_relevance_score(self, question: QuestionBank, weak_area: WeakArea) -> float:
        score = 50.0
        
        if question.topic_id == weak_area.topic_id:
            score += 30.0
        elif question.chapter_id == weak_area.chapter_id:
            score += 20.0
        
        if question.subject_id == weak_area.subject_id:
            score += 20.0
        
        return min(score, 100.0)
    
    def _calculate_difficulty_match(self, question: QuestionBank, weak_area: WeakArea) -> float:
        avg_score = float(weak_area.average_score or 50)
        
        difficulty_map = {
            DifficultyLevel.VERY_EASY: 90,
            DifficultyLevel.EASY: 75,
            DifficultyLevel.MEDIUM: 60,
            DifficultyLevel.HARD: 45,
            DifficultyLevel.VERY_HARD: 30
        }
        
        question_level = difficulty_map.get(question.difficulty_level, 60)
        
        diff = abs(avg_score - question_level)
        match_score = 100 - min(diff, 50)
        
        return match_score
    
    def _calculate_spaced_repetition_score(self, existing_rec: Optional[QuestionRecommendation]) -> float:
        if not existing_rec:
            return 100.0
        
        if not existing_rec.next_review_date:
            return 100.0
        
        days_until_review = (existing_rec.next_review_date - date.today()).days
        
        if days_until_review <= 0:
            return 100.0
        elif days_until_review <= 3:
            return 80.0
        elif days_until_review <= 7:
            return 50.0
        else:
            return 20.0
    
    def update_spaced_repetition(
        self,
        recommendation_id: int,
        performance_score: float,
        institution_id: int
    ) -> QuestionRecommendation:
        rec = self.db.query(QuestionRecommendation).filter(
            QuestionRecommendation.id == recommendation_id,
            QuestionRecommendation.institution_id == institution_id
        ).first()
        
        if not rec:
            raise ValueError(f"Recommendation {recommendation_id} not found")
        
        quality = self._performance_to_quality(performance_score)
        
        new_ease_factor = float(rec.ease_factor) + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        new_ease_factor = max(1.3, new_ease_factor)
        
        if quality >= 3:
            if rec.repetition_number == 0:
                interval = 1
            elif rec.repetition_number == 1:
                interval = 6
            else:
                interval = int(rec.interval_days * new_ease_factor)
            
            rec.repetition_number += 1
        else:
            rec.repetition_number = 0
            interval = 1
        
        rec.ease_factor = Decimal(str(new_ease_factor))
        rec.interval_days = interval
        rec.next_review_date = date.today() + timedelta(days=interval)
        rec.last_reviewed_at = datetime.utcnow()
        rec.last_performance = Decimal(str(performance_score))
        
        if performance_score >= 80 and rec.repetition_number >= 3:
            rec.is_completed = True
            rec.completed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(rec)
        return rec
    
    def _performance_to_quality(self, performance_score: float) -> int:
        if performance_score >= 90:
            return 5
        elif performance_score >= 80:
            return 4
        elif performance_score >= 60:
            return 3
        elif performance_score >= 40:
            return 2
        elif performance_score >= 20:
            return 1
        else:
            return 0


class FocusAreaPrioritizer:
    
    def __init__(self, db: Session):
        self.db = db
    
    def identify_focus_areas(
        self,
        institution_id: int,
        student_id: int,
        target_exam_date: Optional[date] = None,
        ai_predictions: Optional[List[PerformancePrediction]] = None
    ) -> List[FocusArea]:
        weak_areas = self.db.query(WeakArea).filter(
            WeakArea.institution_id == institution_id,
            WeakArea.student_id == student_id,
            WeakArea.is_resolved == False
        ).all()
        
        chapter_performances = self.db.query(ChapterPerformance).filter(
            ChapterPerformance.institution_id == institution_id,
            ChapterPerformance.student_id == student_id
        ).all()
        
        topic_predictions = self.db.query(TopicPrediction).filter(
            TopicPrediction.institution_id == institution_id
        ).all()
        
        focus_areas = []
        
        for weak_area in weak_areas:
            urgency = self._calculate_urgency(weak_area, target_exam_date)
            importance = self._calculate_importance(weak_area, topic_predictions)
            impact = self._calculate_impact(weak_area, chapter_performances)
            
            combined_priority = (urgency * 0.35 + importance * 0.40 + impact * 0.25) * 100
            
            current_perf = float(weak_area.average_score or 0)
            target_perf = 75.0
            perf_gap = target_perf - current_perf
            
            recommended_hours = self._calculate_recommended_hours(
                float(weak_area.weakness_score),
                perf_gap
            )
            
            estimated_improvement = self._estimate_improvement(
                float(weak_area.weakness_score),
                recommended_hours
            )
            
            ai_insights = self._extract_ai_insights(weak_area, ai_predictions)
            
            focus_type = self._determine_focus_type(weak_area, urgency, importance)
            
            existing = self.db.query(FocusArea).filter(
                FocusArea.institution_id == institution_id,
                FocusArea.student_id == student_id,
                FocusArea.subject_id == weak_area.subject_id,
                FocusArea.chapter_id == weak_area.chapter_id,
                FocusArea.topic_id == weak_area.topic_id,
                FocusArea.status == 'active'
            ).first()
            
            if existing:
                existing.urgency_score = Decimal(str(urgency))
                existing.importance_score = Decimal(str(importance))
                existing.impact_score = Decimal(str(impact))
                existing.combined_priority = Decimal(str(combined_priority))
                existing.current_performance = Decimal(str(current_perf))
                existing.target_performance = Decimal(str(target_perf))
                existing.performance_gap = Decimal(str(perf_gap))
                existing.recommended_hours = Decimal(str(recommended_hours))
                existing.estimated_improvement = Decimal(str(estimated_improvement))
                existing.ai_insights = ai_insights
                existing.updated_at = datetime.utcnow()
                focus = existing
            else:
                focus = FocusArea(
                    institution_id=institution_id,
                    student_id=student_id,
                    subject_id=weak_area.subject_id,
                    chapter_id=weak_area.chapter_id,
                    topic_id=weak_area.topic_id,
                    focus_type=focus_type,
                    urgency_score=Decimal(str(urgency)),
                    importance_score=Decimal(str(importance)),
                    impact_score=Decimal(str(impact)),
                    combined_priority=Decimal(str(combined_priority)),
                    current_performance=Decimal(str(current_perf)),
                    target_performance=Decimal(str(target_perf)),
                    performance_gap=Decimal(str(perf_gap)),
                    recommended_hours=Decimal(str(recommended_hours)),
                    estimated_improvement=Decimal(str(estimated_improvement)),
                    confidence_level=self._determine_confidence(len(weak_areas)),
                    reasoning=self._generate_reasoning(weak_area, urgency, importance, impact),
                    ai_insights=ai_insights,
                    status='active'
                )
                self.db.add(focus)
            
            focus_areas.append(focus)
        
        self.db.commit()
        return sorted(focus_areas, key=lambda x: float(x.combined_priority), reverse=True)
    
    def _calculate_urgency(self, weak_area: WeakArea, target_exam_date: Optional[date]) -> float:
        base_urgency = 50.0
        
        if target_exam_date:
            days_until_exam = (target_exam_date - date.today()).days
            if days_until_exam <= 7:
                base_urgency = 100.0
            elif days_until_exam <= 14:
                base_urgency = 85.0
            elif days_until_exam <= 30:
                base_urgency = 70.0
            elif days_until_exam <= 60:
                base_urgency = 55.0
        
        if weak_area.last_attempted_at:
            days_since_attempt = (datetime.utcnow() - weak_area.last_attempted_at).days
            if days_since_attempt > 30:
                base_urgency += 15.0
        
        return min(base_urgency, 100.0)
    
    def _calculate_importance(self, weak_area: WeakArea, topic_predictions: List[TopicPrediction]) -> float:
        base_importance = 50.0
        
        for prediction in topic_predictions:
            if prediction.topic_id == weak_area.topic_id or prediction.chapter_id == weak_area.chapter_id:
                base_importance = float(prediction.probability_score)
                break
        
        weakness_factor = float(weak_area.weakness_score) / 100.0
        base_importance = base_importance + (weakness_factor * 20)
        
        return min(base_importance, 100.0)
    
    def _calculate_impact(self, weak_area: WeakArea, performances: List[ChapterPerformance]) -> float:
        base_impact = 50.0
        
        for perf in performances:
            if perf.chapter_id == weak_area.chapter_id:
                mastery = float(perf.mastery_score)
                base_impact = 100 - mastery
                break
        
        return min(base_impact, 100.0)
    
    def _calculate_recommended_hours(self, weakness_score: float, performance_gap: float) -> float:
        base_hours = 2.0
        weakness_multiplier = weakness_score / 100.0
        gap_multiplier = max(performance_gap / 50.0, 0)
        
        total_hours = base_hours * (1 + weakness_multiplier + gap_multiplier)
        return min(total_hours, 15.0)
    
    def _estimate_improvement(self, weakness_score: float, recommended_hours: float) -> float:
        improvement_rate = 5.0
        max_improvement = 100 - (100 - weakness_score)
        
        estimated = improvement_rate * recommended_hours
        return min(estimated, max_improvement)
    
    def _extract_ai_insights(
        self,
        weak_area: WeakArea,
        predictions: Optional[List[PerformancePrediction]]
    ) -> Dict[str, Any]:
        insights = {
            'predicted_score': None,
            'confidence_interval': None,
            'key_factors': []
        }
        
        if predictions:
            for pred in predictions:
                if pred.student_id == weak_area.student_id:
                    insights['predicted_score'] = float(pred.predicted_value)
                    insights['confidence_interval'] = {
                        'lower': float(pred.confidence_lower or 0),
                        'upper': float(pred.confidence_upper or 0)
                    }
                    
                    if pred.feature_contributions:
                        top_features = sorted(
                            pred.feature_contributions.items(),
                            key=lambda x: abs(x[1].get('contribution', 0)),
                            reverse=True
                        )[:3]
                        insights['key_factors'] = [f[0] for f in top_features]
                    break
        
        return insights
    
    def _determine_focus_type(self, weak_area: WeakArea, urgency: float, importance: float) -> str:
        if urgency >= 80 and importance >= 70:
            return "critical"
        elif urgency >= 60 or importance >= 60:
            return "high_priority"
        elif float(weak_area.weakness_score) >= 70:
            return "remedial"
        else:
            return "maintenance"
    
    def _determine_confidence(self, data_points: int) -> str:
        if data_points >= 10:
            return "high"
        elif data_points >= 5:
            return "medium"
        else:
            return "low"
    
    def _generate_reasoning(
        self,
        weak_area: WeakArea,
        urgency: float,
        importance: float,
        impact: float
    ) -> str:
        reasons = []
        
        if float(weak_area.weakness_score) >= 70:
            reasons.append(f"Significant weakness detected (score: {weak_area.weakness_score})")
        
        if urgency >= 80:
            reasons.append("High urgency due to upcoming assessment")
        
        if importance >= 70:
            reasons.append("Topic has high probability of appearing in exams")
        
        if impact >= 70:
            reasons.append("Addressing this will significantly improve overall performance")
        
        return "; ".join(reasons) if reasons else "Standard improvement recommendation"


class PersonalizedInsightGenerator:
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_insights(
        self,
        institution_id: int,
        student_id: int,
        focus_areas: List[FocusArea],
        chapter_performances: List[ChapterPerformance],
        weak_areas: List[WeakArea]
    ) -> List[PersonalizedInsight]:
        insights = []
        
        insights.extend(self._generate_performance_insights(
            institution_id, student_id, chapter_performances
        ))
        
        insights.extend(self._generate_trend_insights(
            institution_id, student_id, chapter_performances
        ))
        
        insights.extend(self._generate_focus_insights(
            institution_id, student_id, focus_areas
        ))
        
        insights.extend(self._generate_strength_insights(
            institution_id, student_id, chapter_performances
        ))
        
        insights.extend(self._generate_actionable_insights(
            institution_id, student_id, weak_areas, focus_areas
        ))
        
        for idx, insight in enumerate(sorted(insights, key=lambda x: x.priority), 1):
            insight.priority = idx
        
        self.db.commit()
        return insights
    
    def _generate_performance_insights(
        self,
        institution_id: int,
        student_id: int,
        performances: List[ChapterPerformance]
    ) -> List[PersonalizedInsight]:
        insights = []
        
        low_mastery = [p for p in performances if float(p.mastery_score) < 40]
        
        if low_mastery:
            affected_subjects = list(set([p.subject.name for p in low_mastery]))
            affected_chapters = [{'id': p.chapter_id, 'name': p.chapter.name} for p in low_mastery[:5]]
            
            insight = PersonalizedInsight(
                institution_id=institution_id,
                student_id=student_id,
                insight_type='low_mastery_alert',
                category='performance',
                title=f"Low Mastery in {len(low_mastery)} Chapter(s)",
                description=f"You have low mastery scores in {len(low_mastery)} chapters. Focus on these areas to improve your overall performance.",
                severity='high',
                priority=1,
                is_actionable=True,
                actionable_items=[
                    {'action': 'Review chapter concepts', 'chapters': affected_chapters[:3]},
                    {'action': 'Practice more questions', 'frequency': 'daily'},
                    {'action': 'Seek help from teacher', 'subjects': affected_subjects}
                ],
                recommendations=[
                    f"Dedicate 1-2 hours daily to reviewing {len(low_mastery)} weak chapters",
                    "Start with the most fundamental concepts",
                    "Take regular practice tests to track improvement"
                ],
                affected_subjects=affected_subjects,
                affected_chapters=affected_chapters,
                ai_generated=False,
                confidence_score=Decimal('85.0')
            )
            self.db.add(insight)
            insights.append(insight)
        
        return insights
    
    def _generate_trend_insights(
        self,
        institution_id: int,
        student_id: int,
        performances: List[ChapterPerformance]
    ) -> List[PersonalizedInsight]:
        insights = []
        
        declining = [p for p in performances if p.trend == 'declining']
        
        if declining:
            insight = PersonalizedInsight(
                institution_id=institution_id,
                student_id=student_id,
                insight_type='declining_performance',
                category='trend',
                title=f"Declining Performance in {len(declining)} Area(s)",
                description=f"Your performance is declining in {len(declining)} chapters. Early intervention can prevent further drops.",
                severity='medium',
                priority=5,
                is_actionable=True,
                actionable_items=[
                    {'action': 'Identify root cause', 'areas': [p.chapter.name for p in declining[:3]]},
                    {'action': 'Adjust study strategy', 'recommendation': 'increase_practice_time'}
                ],
                recommendations=[
                    "Review recent mistakes and identify patterns",
                    "Increase study time for declining subjects",
                    "Consider forming study groups"
                ],
                affected_chapters=[{'id': p.chapter_id, 'name': p.chapter.name} for p in declining],
                ai_generated=False,
                confidence_score=Decimal('75.0')
            )
            self.db.add(insight)
            insights.append(insight)
        
        improving = [p for p in performances if p.trend == 'improving']
        
        if len(improving) >= 3:
            insight = PersonalizedInsight(
                institution_id=institution_id,
                student_id=student_id,
                insight_type='positive_trend',
                category='trend',
                title=f"Improving in {len(improving)} Area(s)!",
                description=f"Great job! You're showing improvement in {len(improving)} chapters. Keep up the good work!",
                severity='info',
                priority=10,
                is_actionable=False,
                recommendations=[
                    "Maintain your current study routine",
                    "Apply successful strategies to other subjects"
                ],
                affected_chapters=[{'id': p.chapter_id, 'name': p.chapter.name} for p in improving],
                ai_generated=False,
                confidence_score=Decimal('90.0')
            )
            self.db.add(insight)
            insights.append(insight)
        
        return insights
    
    def _generate_focus_insights(
        self,
        institution_id: int,
        student_id: int,
        focus_areas: List[FocusArea]
    ) -> List[PersonalizedInsight]:
        insights = []
        
        critical_areas = [f for f in focus_areas if f.focus_type == 'critical']
        
        if critical_areas:
            total_hours = sum(float(f.recommended_hours) for f in critical_areas)
            
            insight = PersonalizedInsight(
                institution_id=institution_id,
                student_id=student_id,
                insight_type='critical_focus_required',
                category='priority',
                title=f"{len(critical_areas)} Critical Area(s) Need Immediate Attention",
                description=f"You have {len(critical_areas)} critical focus areas requiring approximately {total_hours:.1f} hours of study.",
                severity='critical',
                priority=1,
                is_actionable=True,
                actionable_items=[
                    {
                        'area': f.chapter.name if f.chapter else f.subject.name,
                        'hours': float(f.recommended_hours),
                        'priority': float(f.combined_priority)
                    } for f in critical_areas[:5]
                ],
                recommendations=[
                    f"Allocate {total_hours:.1f} hours over the next week",
                    "Start with highest priority areas",
                    "Break study sessions into 45-minute blocks"
                ],
                supporting_data={
                    'total_critical_areas': len(critical_areas),
                    'total_recommended_hours': total_hours,
                    'average_performance_gap': sum(float(f.performance_gap or 0) for f in critical_areas) / len(critical_areas)
                },
                ai_generated=True,
                confidence_score=Decimal('88.0')
            )
            self.db.add(insight)
            insights.append(insight)
        
        return insights
    
    def _generate_strength_insights(
        self,
        institution_id: int,
        student_id: int,
        performances: List[ChapterPerformance]
    ) -> List[PersonalizedInsight]:
        insights = []
        
        strengths = [p for p in performances if float(p.mastery_score) >= 80]
        
        if len(strengths) >= 3:
            insight = PersonalizedInsight(
                institution_id=institution_id,
                student_id=student_id,
                insight_type='strengths_identified',
                category='achievement',
                title=f"Strong Performance in {len(strengths)} Area(s)",
                description=f"You've mastered {len(strengths)} chapters! These are your strengths.",
                severity='info',
                priority=15,
                is_actionable=True,
                actionable_items=[
                    {'action': 'Maintain mastery', 'method': 'periodic_review'},
                    {'action': 'Help peers', 'benefit': 'reinforces_learning'}
                ],
                recommendations=[
                    "Review these topics once every 2 weeks to maintain mastery",
                    "Consider helping classmates with these topics",
                    "Use these strengths to boost confidence"
                ],
                affected_chapters=[{'id': p.chapter_id, 'name': p.chapter.name} for p in strengths],
                ai_generated=False,
                confidence_score=Decimal('95.0')
            )
            self.db.add(insight)
            insights.append(insight)
        
        return insights
    
    def _generate_actionable_insights(
        self,
        institution_id: int,
        student_id: int,
        weak_areas: List[WeakArea],
        focus_areas: List[FocusArea]
    ) -> List[PersonalizedInsight]:
        insights = []
        
        if weak_areas and focus_areas:
            top_focus = sorted(focus_areas, key=lambda x: float(x.combined_priority), reverse=True)[:3]
            
            weekly_plan = []
            for idx, focus in enumerate(top_focus, 1):
                weekly_plan.append({
                    'rank': idx,
                    'area': focus.chapter.name if focus.chapter else focus.subject.name,
                    'hours': float(focus.recommended_hours),
                    'expected_improvement': float(focus.estimated_improvement or 0)
                })
            
            insight = PersonalizedInsight(
                institution_id=institution_id,
                student_id=student_id,
                insight_type='weekly_focus_plan',
                category='action_plan',
                title="Personalized Weekly Focus Plan",
                description="Based on your performance analysis, here's your customized study plan for the week.",
                severity='info',
                priority=3,
                is_actionable=True,
                actionable_items=weekly_plan,
                recommendations=[
                    "Follow this plan to maximize improvement",
                    "Track your progress daily",
                    "Adjust based on your comfort level"
                ],
                supporting_data={
                    'total_focus_areas': len(focus_areas),
                    'total_weak_areas': len(weak_areas),
                    'plan_duration_days': 7
                },
                ai_generated=True,
                confidence_score=Decimal('82.0'),
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
            self.db.add(insight)
            insights.append(insight)
        
        return insights


class WeaknessDetectionEngine:
    
    def __init__(self, db: Session):
        self.db = db
        self.chapter_analyzer = ChapterPerformanceAnalyzer(db)
        self.question_recommender = SmartQuestionRecommender(db)
        self.focus_prioritizer = FocusAreaPrioritizer(db)
        self.insight_generator = PersonalizedInsightGenerator(db)
    
    def run_comprehensive_analysis(
        self,
        institution_id: int,
        student_id: int,
        target_exam_date: Optional[date] = None,
        generate_recommendations: bool = True
    ) -> Dict[str, Any]:
        
        chapter_performances = self.chapter_analyzer.analyze_chapter_performance(
            institution_id, student_id
        )
        
        weak_chapters = self.chapter_analyzer.get_weak_chapters(
            institution_id, student_id, mastery_threshold=60.0
        )
        
        weak_areas = self.db.query(WeakArea).filter(
            WeakArea.institution_id == institution_id,
            WeakArea.student_id == student_id,
            WeakArea.is_resolved == False
        ).order_by(WeakArea.weakness_score.desc()).all()
        
        ai_predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.institution_id == institution_id,
            PerformancePrediction.student_id == student_id,
            PerformancePrediction.is_scenario == False
        ).order_by(PerformancePrediction.predicted_at.desc()).limit(10).all()
        
        focus_areas = self.focus_prioritizer.identify_focus_areas(
            institution_id, student_id, target_exam_date, ai_predictions
        )
        
        question_recommendations = []
        if generate_recommendations:
            question_recommendations = self.question_recommender.generate_recommendations(
                institution_id, student_id, weak_areas, limit=20
            )
        
        personalized_insights = self.insight_generator.generate_insights(
            institution_id, student_id, focus_areas, chapter_performances, weak_areas
        )
        
        summary = {
            'total_chapters_analyzed': len(chapter_performances),
            'weak_chapters_count': len(weak_chapters),
            'weak_areas_count': len(weak_areas),
            'focus_areas_count': len(focus_areas),
            'critical_focus_areas': len([f for f in focus_areas if f.focus_type == 'critical']),
            'question_recommendations_count': len(question_recommendations),
            'personalized_insights_count': len(personalized_insights),
            'average_mastery_score': sum(float(p.mastery_score) for p in chapter_performances) / len(chapter_performances) if chapter_performances else 0,
            'improvement_areas': [
                {
                    'chapter': p.chapter.name,
                    'subject': p.subject.name,
                    'mastery_score': float(p.mastery_score),
                    'trend': p.trend
                } for p in weak_chapters[:5]
            ],
            'top_priorities': [
                {
                    'area': f.chapter.name if f.chapter else f.subject.name,
                    'priority_score': float(f.combined_priority),
                    'recommended_hours': float(f.recommended_hours),
                    'type': f.focus_type
                } for f in focus_areas[:5]
            ]
        }
        
        return {
            'summary': summary,
            'chapter_performances': chapter_performances,
            'weak_areas': weak_areas,
            'focus_areas': focus_areas,
            'question_recommendations': question_recommendations,
            'personalized_insights': personalized_insights
        }
