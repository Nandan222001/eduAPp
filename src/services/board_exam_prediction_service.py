import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from collections import defaultdict, Counter
import math

from src.models.previous_year_papers import (
    QuestionBank,
    Board,
    TopicPrediction
)
from src.models.academic import Topic, Chapter
from src.repositories.previous_year_papers_repository import (
    QuestionBankRepository,
    TopicPredictionRepository
)
from src.redis_client import get_redis


class BoardExamPredictionService:
    def __init__(self, db: Session):
        self.db = db
        self.question_repo = QuestionBankRepository(db)
        self.prediction_repo = TopicPredictionRepository(db)

    async def analyze_and_predict(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        year_start: Optional[int] = None,
        year_end: Optional[int] = None
    ) -> Dict[str, Any]:
        current_year = datetime.now().year
        year_end = year_end or current_year
        year_start = year_start or (year_end - 10)

        topic_data = self._collect_topic_data(
            institution_id, board, grade_id, subject_id, year_start, year_end
        )

        predictions = []
        for topic_name, data in topic_data.items():
            prediction = self._calculate_topic_prediction(
                institution_id=institution_id,
                board=board,
                grade_id=grade_id,
                subject_id=subject_id,
                topic_name=topic_name,
                topic_data=data,
                year_start=year_start,
                year_end=year_end,
                current_year=current_year
            )
            predictions.append(prediction)

        predictions.sort(key=lambda x: x['probability_score'], reverse=True)
        
        for rank, pred in enumerate(predictions, start=1):
            pred['prediction_rank'] = rank

        self.prediction_repo.delete_existing_predictions(
            institution_id, board, grade_id, subject_id
        )

        self.prediction_repo.bulk_create(predictions)

        cache_key = f"exam_predictions:{institution_id}:{board.value}:{grade_id}:{subject_id}"
        await self._cache_predictions(cache_key, predictions)

        return {
            "total_topics_analyzed": len(topic_data),
            "year_range": f"{year_start}-{year_end}",
            "predictions_generated": len(predictions),
            "cache_key": cache_key,
            "analyzed_at": datetime.utcnow()
        }

    def _collect_topic_data(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        year_start: int,
        year_end: int
    ) -> Dict[str, Dict[str, Any]]:
        from src.models.previous_year_papers import PreviousYearPaper
        
        questions = self.db.query(QuestionBank).join(
            PreviousYearPaper,
            QuestionBank.paper_id == PreviousYearPaper.id
        ).filter(
            and_(
                QuestionBank.institution_id == institution_id,
                QuestionBank.grade_id == grade_id,
                QuestionBank.subject_id == subject_id,
                PreviousYearPaper.board == board,
                PreviousYearPaper.year >= year_start,
                PreviousYearPaper.year <= year_end,
                QuestionBank.topic_id.isnot(None)
            )
        ).all()

        topic_data = defaultdict(lambda: {
            'topic_id': None,
            'chapter_id': None,
            'appearances': [],
            'marks': [],
            'years': []
        })

        for question in questions:
            topic = self.db.query(Topic).filter(Topic.id == question.topic_id).first()
            if not topic:
                continue
            
            topic_name = topic.name
            paper = self.db.query(PreviousYearPaper).filter(
                PreviousYearPaper.id == question.paper_id
            ).first()
            
            if paper:
                topic_data[topic_name]['topic_id'] = question.topic_id
                topic_data[topic_name]['chapter_id'] = question.chapter_id
                topic_data[topic_name]['years'].append(paper.year)
                topic_data[topic_name]['marks'].append(question.marks or 0)
                topic_data[topic_name]['appearances'].append({
                    'year': paper.year,
                    'marks': question.marks or 0,
                    'question_type': question.question_type.value,
                    'difficulty': question.difficulty_level.value
                })

        return dict(topic_data)

    def _calculate_topic_prediction(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        topic_name: str,
        topic_data: Dict[str, Any],
        year_start: int,
        year_end: int,
        current_year: int
    ) -> Dict[str, Any]:
        frequency_count = len(topic_data['years'])
        years = sorted(topic_data['years'])
        marks = topic_data['marks']
        
        total_marks = sum(marks)
        avg_marks_per_appearance = total_marks / frequency_count if frequency_count > 0 else 0.0
        
        last_appeared_year = max(years) if years else None
        years_since_last_appearance = current_year - last_appeared_year if last_appeared_year else 999
        
        frequency_score = self._calculate_frequency_score(frequency_count, year_end - year_start + 1)
        cyclical_pattern_score = self._detect_cyclical_pattern(years, year_start, year_end)
        trend_score = self._calculate_trend_score(years, year_start, year_end)
        weightage_score = self._calculate_weightage_score(total_marks, avg_marks_per_appearance)
        recency_score = self._calculate_recency_score(years_since_last_appearance)
        
        probability_score = (
            frequency_score * 0.25 +
            cyclical_pattern_score * 0.20 +
            trend_score * 0.15 +
            weightage_score * 0.20 +
            recency_score * 0.20
        )
        
        is_due = self._is_topic_due(years, years_since_last_appearance, cyclical_pattern_score)
        
        confidence_level = self._determine_confidence_level(
            frequency_count, cyclical_pattern_score, years_since_last_appearance
        )
        
        analysis_metadata = json.dumps({
            'frequency_score': frequency_score,
            'cyclical_pattern_score': cyclical_pattern_score,
            'trend_score': trend_score,
            'weightage_score': weightage_score,
            'recency_score': recency_score,
            'appearances': topic_data['appearances']
        })
        
        return {
            'institution_id': institution_id,
            'board': board,
            'grade_id': grade_id,
            'subject_id': subject_id,
            'chapter_id': topic_data.get('chapter_id'),
            'topic_id': topic_data.get('topic_id'),
            'topic_name': topic_name,
            'frequency_count': frequency_count,
            'appearance_years': ','.join(map(str, years)),
            'total_marks': total_marks,
            'avg_marks_per_appearance': avg_marks_per_appearance,
            'years_since_last_appearance': years_since_last_appearance,
            'last_appeared_year': last_appeared_year,
            'cyclical_pattern_score': cyclical_pattern_score,
            'trend_score': trend_score,
            'weightage_score': weightage_score,
            'probability_score': probability_score,
            'is_due': is_due,
            'confidence_level': confidence_level,
            'analysis_metadata': analysis_metadata,
            'analysis_year_start': year_start,
            'analysis_year_end': year_end,
            'analyzed_at': datetime.utcnow()
        }

    def _calculate_frequency_score(self, frequency_count: int, total_years: int) -> float:
        if total_years == 0:
            return 0.0
        appearance_rate = frequency_count / total_years
        return min(appearance_rate * 100, 100.0)

    def _detect_cyclical_pattern(self, years: List[int], year_start: int, year_end: int) -> float:
        if len(years) < 2:
            return 0.0
        
        sorted_years = sorted(years)
        intervals = [sorted_years[i+1] - sorted_years[i] for i in range(len(sorted_years) - 1)]
        
        if not intervals:
            return 0.0
        
        avg_interval = sum(intervals) / len(intervals)
        interval_variance = sum((x - avg_interval) ** 2 for x in intervals) / len(intervals)
        interval_std_dev = math.sqrt(interval_variance) if interval_variance > 0 else 0
        
        consistency_score = 100.0
        if avg_interval > 0:
            coefficient_of_variation = (interval_std_dev / avg_interval) * 100
            consistency_score = max(0, 100 - coefficient_of_variation)
        
        expected_appearances = (year_end - year_start + 1) / avg_interval if avg_interval > 0 else 0
        actual_appearances = len(years)
        adherence_score = min((actual_appearances / expected_appearances) * 100, 100.0) if expected_appearances > 0 else 0
        
        cyclical_score = (consistency_score * 0.6 + adherence_score * 0.4)
        
        return min(cyclical_score, 100.0)

    def _calculate_trend_score(self, years: List[int], year_start: int, year_end: int) -> float:
        if len(years) < 2:
            return 50.0
        
        sorted_years = sorted(years)
        
        total_years = year_end - year_start + 1
        mid_point = year_start + (total_years // 2)
        
        recent_years = [y for y in sorted_years if y >= mid_point]
        older_years = [y for y in sorted_years if y < mid_point]
        
        recent_frequency = len(recent_years)
        older_frequency = len(older_years)
        
        if older_frequency == 0:
            trend_multiplier = 1.5 if recent_frequency > 0 else 1.0
        else:
            trend_multiplier = recent_frequency / older_frequency
        
        trend_score = min(trend_multiplier * 50, 100.0)
        
        return trend_score

    def _calculate_weightage_score(self, total_marks: float, avg_marks: float) -> float:
        marks_score = min((avg_marks / 10) * 100, 100.0)
        
        total_marks_score = min((total_marks / 50) * 100, 100.0)
        
        weightage_score = (marks_score * 0.7 + total_marks_score * 0.3)
        
        return weightage_score

    def _calculate_recency_score(self, years_since_last: int) -> float:
        if years_since_last == 0:
            return 20.0
        elif years_since_last == 1:
            return 40.0
        elif years_since_last == 2:
            return 70.0
        elif years_since_last == 3:
            return 90.0
        elif years_since_last >= 4:
            return 100.0
        else:
            return max(0, 100 - (years_since_last * 10))

    def _is_topic_due(
        self,
        years: List[int],
        years_since_last: int,
        cyclical_score: float
    ) -> bool:
        if len(years) < 2:
            return False
        
        sorted_years = sorted(years)
        intervals = [sorted_years[i+1] - sorted_years[i] for i in range(len(sorted_years) - 1)]
        avg_interval = sum(intervals) / len(intervals) if intervals else 0
        
        if cyclical_score > 60 and years_since_last >= avg_interval:
            return True
        
        if years_since_last >= 3:
            return True
        
        return False

    def _determine_confidence_level(
        self,
        frequency_count: int,
        cyclical_score: float,
        years_since_last: int
    ) -> str:
        if frequency_count >= 7 and cyclical_score >= 70:
            return "Very High"
        elif frequency_count >= 5 and cyclical_score >= 60:
            return "High"
        elif frequency_count >= 3 and cyclical_score >= 40:
            return "Medium"
        elif frequency_count >= 2:
            return "Low"
        else:
            return "Very Low"

    async def _cache_predictions(self, cache_key: str, predictions: List[Dict[str, Any]]) -> None:
        try:
            redis = await get_redis()
            cache_data = json.dumps(predictions, default=str)
            await redis.setex(cache_key, 3600 * 24, cache_data)
        except Exception:
            pass

    async def get_cached_predictions(self, cache_key: str) -> Optional[List[Dict[str, Any]]]:
        try:
            redis = await get_redis()
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass
        return None

    def get_predictions(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        skip: int = 0,
        limit: int = 100,
        order_by: str = 'probability_score'
    ) -> Tuple[List[TopicPrediction], int]:
        return self.prediction_repo.get_predictions(
            institution_id, board, grade_id, subject_id, skip, limit, order_by
        )

    def get_top_predictions(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        top_n: int = 20
    ) -> List[TopicPrediction]:
        return self.prediction_repo.get_top_predictions(
            institution_id, board, grade_id, subject_id, top_n
        )

    def get_due_topics(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int
    ) -> List[TopicPrediction]:
        return self.prediction_repo.get_due_topics(
            institution_id, board, grade_id, subject_id
        )

    def get_by_chapter(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        chapter_id: int
    ) -> List[TopicPrediction]:
        return self.prediction_repo.get_by_chapter(
            institution_id, board, grade_id, subject_id, chapter_id
        )

    def get_analysis_summary(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int
    ) -> Dict[str, Any]:
        return self.prediction_repo.get_analysis_summary(
            institution_id, board, grade_id, subject_id
        )
