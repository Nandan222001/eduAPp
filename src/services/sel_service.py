from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from decimal import Decimal
from src.repositories.sel_repository import SELRepository
from src.models.sel import CASELCompetency
from src.schemas.sel import (
    SELCompetencyCreate,
    SELCompetencyUpdate,
    SELCompetencyResponse,
    SELAssessmentCreate,
    SELAssessmentUpdate,
    SELAssessmentResponse,
    SELObservationCreate,
    SELObservationUpdate,
    SELObservationResponse,
    PeerRelationshipCreate,
    PeerRelationshipUpdate,
    PeerRelationshipResponse,
    SELGrowthTrackingResponse,
    SELProgressReportCreate,
    SELProgressReportResponse,
    SELAnalyticsResponse,
    StudentSELDashboard,
    ParentProgressReport,
    CompetencyScore,
    GrowthIndicator,
    RubricLevelEnum,
)


class SELService:
    def __init__(self, db: Session):
        self.repository = SELRepository(db)
        self.db = db

    def create_competency(
        self, institution_id: int, competency_data: SELCompetencyCreate
    ) -> SELCompetencyResponse:
        competency = self.repository.create_competency(institution_id, competency_data)
        return SELCompetencyResponse.model_validate(competency)

    def get_competency(
        self, competency_id: int, institution_id: int
    ) -> Optional[SELCompetencyResponse]:
        competency = self.repository.get_competency(competency_id, institution_id)
        if competency:
            return SELCompetencyResponse.model_validate(competency)
        return None

    def get_competencies(
        self, institution_id: int, competency_type: Optional[str] = None, skip: int = 0, limit: int = 100
    ) -> List[SELCompetencyResponse]:
        competencies = self.repository.get_competencies(
            institution_id, competency_type, skip, limit
        )
        return [SELCompetencyResponse.model_validate(c) for c in competencies]

    def update_competency(
        self, competency_id: int, institution_id: int, update_data: SELCompetencyUpdate
    ) -> Optional[SELCompetencyResponse]:
        competency = self.repository.get_competency(competency_id, institution_id)
        if not competency:
            return None
        updated = self.repository.update_competency(competency, update_data)
        return SELCompetencyResponse.model_validate(updated)

    def create_assessment(
        self, institution_id: int, assessor_id: int, assessment_data: SELAssessmentCreate
    ) -> SELAssessmentResponse:
        assessment = self.repository.create_assessment(
            institution_id, assessor_id, assessment_data
        )
        return SELAssessmentResponse.model_validate(assessment)

    def get_assessment(
        self, assessment_id: int, institution_id: int
    ) -> Optional[SELAssessmentResponse]:
        assessment = self.repository.get_assessment(assessment_id, institution_id)
        if assessment:
            return SELAssessmentResponse.model_validate(assessment)
        return None

    def get_assessments(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        competency_id: Optional[int] = None,
        assessment_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[SELAssessmentResponse]:
        assessments = self.repository.get_assessments(
            institution_id, student_id, competency_id, assessment_type, skip, limit
        )
        return [SELAssessmentResponse.model_validate(a) for a in assessments]

    def update_assessment(
        self, assessment_id: int, institution_id: int, update_data: SELAssessmentUpdate
    ) -> Optional[SELAssessmentResponse]:
        assessment = self.repository.get_assessment(assessment_id, institution_id)
        if not assessment:
            return None
        updated = self.repository.update_assessment(assessment, update_data)
        return SELAssessmentResponse.model_validate(updated)

    def submit_assessment(
        self, assessment_id: int, institution_id: int
    ) -> Optional[SELAssessmentResponse]:
        assessment = self.repository.get_assessment(assessment_id, institution_id)
        if not assessment:
            return None
        submitted = self.repository.submit_assessment(assessment)
        return SELAssessmentResponse.model_validate(submitted)

    def create_observation(
        self, institution_id: int, observer_id: int, observation_data: SELObservationCreate
    ) -> SELObservationResponse:
        observation = self.repository.create_observation(
            institution_id, observer_id, observation_data
        )
        return SELObservationResponse.model_validate(observation)

    def get_observation(
        self, observation_id: int, institution_id: int
    ) -> Optional[SELObservationResponse]:
        observation = self.repository.get_observation(observation_id, institution_id)
        if observation:
            return SELObservationResponse.model_validate(observation)
        return None

    def get_observations(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        observer_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[SELObservationResponse]:
        observations = self.repository.get_observations(
            institution_id, student_id, observer_id, skip, limit
        )
        return [SELObservationResponse.model_validate(o) for o in observations]

    def update_observation(
        self, observation_id: int, institution_id: int, update_data: SELObservationUpdate
    ) -> Optional[SELObservationResponse]:
        observation = self.repository.get_observation(observation_id, institution_id)
        if not observation:
            return None
        updated = self.repository.update_observation(observation, update_data)
        return SELObservationResponse.model_validate(updated)

    def create_peer_relationship(
        self, institution_id: int, observer_id: int, relationship_data: PeerRelationshipCreate
    ) -> PeerRelationshipResponse:
        relationship = self.repository.create_peer_relationship(
            institution_id, observer_id, relationship_data
        )
        return PeerRelationshipResponse.model_validate(relationship)

    def get_peer_relationships(
        self, student_id: int, institution_id: int
    ) -> List[PeerRelationshipResponse]:
        relationships = self.repository.get_peer_relationships(student_id, institution_id)
        return [PeerRelationshipResponse.model_validate(r) for r in relationships]

    def get_growth_tracking(
        self, student_id: int, institution_id: int, period_start: date, period_end: date
    ) -> List[SELGrowthTrackingResponse]:
        growth_records = self.repository.calculate_growth_tracking(
            student_id, institution_id, period_start, period_end
        )
        return [SELGrowthTrackingResponse.model_validate(g) for g in growth_records]

    def get_student_growth_history(
        self, student_id: int, institution_id: int, competency_type: Optional[str] = None
    ) -> List[SELGrowthTrackingResponse]:
        growth_records = self.repository.get_growth_tracking(
            student_id, institution_id, competency_type
        )
        return [SELGrowthTrackingResponse.model_validate(g) for g in growth_records]

    def create_progress_report(
        self, institution_id: int, generator_id: int, report_data: SELProgressReportCreate
    ) -> SELProgressReportResponse:
        report = self.repository.create_progress_report(
            institution_id, generator_id, report_data
        )
        return SELProgressReportResponse.model_validate(report)

    def get_progress_report(
        self, report_id: int, institution_id: int
    ) -> Optional[SELProgressReportResponse]:
        report = self.repository.get_progress_report(report_id, institution_id)
        if report:
            return SELProgressReportResponse.model_validate(report)
        return None

    def get_progress_reports(
        self, student_id: int, institution_id: int, skip: int = 0, limit: int = 100
    ) -> List[SELProgressReportResponse]:
        reports = self.repository.get_progress_reports(
            student_id, institution_id, skip, limit
        )
        return [SELProgressReportResponse.model_validate(r) for r in reports]

    def share_report_with_parent(
        self, report_id: int, institution_id: int
    ) -> Optional[SELProgressReportResponse]:
        report = self.repository.get_progress_report(report_id, institution_id)
        if not report:
            return None
        shared = self.repository.share_report_with_parent(report)
        return SELProgressReportResponse.model_validate(shared)

    def mark_parent_viewed(
        self, report_id: int, institution_id: int
    ) -> Optional[SELProgressReportResponse]:
        report = self.repository.get_progress_report(report_id, institution_id)
        if not report:
            return None
        viewed = self.repository.mark_parent_viewed(report)
        return SELProgressReportResponse.model_validate(viewed)

    def get_sel_analytics(
        self, student_id: int, institution_id: int, period_start: date, period_end: date
    ) -> SELAnalyticsResponse:
        assessments = self.repository.get_assessments(
            institution_id=institution_id,
            student_id=student_id,
            skip=0,
            limit=1000,
        )
        
        period_assessments = [
            a for a in assessments
            if period_start <= a.assessment_date <= period_end
        ]

        observations = self.repository.get_observations(
            institution_id=institution_id,
            student_id=student_id,
            skip=0,
            limit=1000,
        )
        
        period_observations = [
            o for o in observations
            if period_start <= o.observation_date <= period_end
        ]

        peer_relationships = self.repository.get_peer_relationships(
            student_id, institution_id
        )

        competency_scores = []
        total_score = Decimal("0")
        
        for competency_type in CASELCompetency:
            comp_assessments = [
                a for a in period_assessments
                if a.competency.competency_type == competency_type
            ]
            if comp_assessments:
                avg_score = sum(a.score for a in comp_assessments) / len(comp_assessments)
                level = self._determine_level(avg_score)
                competency_scores.append(
                    CompetencyScore(
                        competency_type=competency_type,
                        score=avg_score,
                        level=level,
                        assessment_count=len(comp_assessments),
                        trend=self._calculate_trend(comp_assessments),
                    )
                )
                total_score += avg_score

        overall_score = (
            total_score / len(competency_scores) if competency_scores else Decimal("0")
        )
        overall_level = self._determine_level(overall_score)

        growth_indicators = self._build_growth_indicators(period_assessments)

        positive_obs = [o for o in period_observations if o.is_positive]
        positive_pct = (
            Decimal(len(positive_obs)) / Decimal(len(period_observations)) * 100
            if period_observations
            else Decimal("0")
        )

        strengths = self._extract_strengths(period_assessments)
        areas_for_growth = self._extract_areas_for_growth(period_assessments)

        return SELAnalyticsResponse(
            student_id=student_id,
            period_start=period_start,
            period_end=period_end,
            overall_score=overall_score,
            overall_level=overall_level,
            competency_scores=competency_scores,
            growth_indicators=growth_indicators,
            total_assessments=len(period_assessments),
            total_observations=len(period_observations),
            peer_connections=len(peer_relationships),
            positive_observations_percentage=positive_pct,
            strengths=strengths,
            areas_for_growth=areas_for_growth,
        )

    def get_student_dashboard(
        self, student_id: int, institution_id: int
    ) -> StudentSELDashboard:
        from src.models.student import Student
        
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("Student not found")

        today = date.today()
        current_period_start = today - timedelta(days=90)
        previous_period_start = current_period_start - timedelta(days=90)
        previous_period_end = current_period_start - timedelta(days=1)

        current_analytics = self.get_sel_analytics(
            student_id, institution_id, current_period_start, today
        )
        
        previous_analytics = self.get_sel_analytics(
            student_id, institution_id, previous_period_start, previous_period_end
        )

        growth_pct = Decimal("0")
        if previous_analytics.overall_score > 0:
            growth_pct = (
                (current_analytics.overall_score - previous_analytics.overall_score)
                / previous_analytics.overall_score
                * 100
            )

        recent_assessments = self.get_assessments(
            institution_id=institution_id,
            student_id=student_id,
            skip=0,
            limit=5,
        )

        recent_observations = self.get_observations(
            institution_id=institution_id,
            student_id=student_id,
            skip=0,
            limit=5,
        )

        peer_relationships = self.get_peer_relationships(student_id, institution_id)

        return StudentSELDashboard(
            student_id=student_id,
            student_name=f"{student.first_name} {student.last_name}",
            current_period_score=current_analytics.overall_score,
            previous_period_score=previous_analytics.overall_score,
            growth_percentage=growth_pct,
            competency_breakdown=current_analytics.competency_scores,
            recent_assessments=recent_assessments,
            recent_observations=recent_observations,
            peer_relationship_count=len(peer_relationships),
            recommendations=current_analytics.areas_for_growth[:3],
        )

    def get_parent_report(
        self, report_id: int, institution_id: int
    ) -> Optional[ParentProgressReport]:
        from src.models.student import Student
        
        report = self.repository.get_progress_report(report_id, institution_id)
        if not report:
            return None

        student = self.db.query(Student).filter(Student.id == report.student_id).first()
        if not student:
            return None

        competency_scores = {
            "Self-Awareness": float(report.self_awareness_score or 0),
            "Self-Management": float(report.self_management_score or 0),
            "Social Awareness": float(report.social_awareness_score or 0),
            "Relationship Skills": float(report.relationship_skills_score or 0),
            "Responsible Decision-Making": float(report.responsible_decision_making_score or 0),
        }

        growth_records = self.repository.get_growth_tracking(
            report.student_id, institution_id
        )
        
        visual_progress = []
        for growth in growth_records[:6]:
            visual_progress.append(
                GrowthIndicator(
                    period=f"{growth.period_start} - {growth.period_end}",
                    score=growth.current_score,
                    date=growth.period_end,
                )
            )

        growth_summary = self._generate_growth_summary(report)

        return ParentProgressReport(
            report_id=report.id,
            student_name=f"{student.first_name} {student.last_name}",
            period=f"{report.period_start} to {report.period_end}",
            overall_score=report.overall_score,
            overall_level=report.overall_level,
            competency_scores=competency_scores,
            growth_summary=growth_summary,
            strengths=report.strengths or [],
            areas_for_growth=report.areas_for_growth or [],
            teacher_comments=report.teacher_comments,
            visual_progress=visual_progress,
            peer_relationships_summary=report.peer_relationships_summary,
            recommendations=report.recommendations or [],
        )

    def _determine_level(self, score: Decimal) -> RubricLevelEnum:
        if score >= Decimal("3.5"):
            return RubricLevelEnum.ADVANCED
        elif score >= Decimal("2.5"):
            return RubricLevelEnum.PROFICIENT
        elif score >= Decimal("1.5"):
            return RubricLevelEnum.DEVELOPING
        else:
            return RubricLevelEnum.EMERGING

    def _calculate_trend(self, assessments: list) -> str:
        if len(assessments) < 2:
            return "stable"
        
        sorted_assessments = sorted(assessments, key=lambda a: a.assessment_date)
        first_half = sorted_assessments[: len(sorted_assessments) // 2]
        second_half = sorted_assessments[len(sorted_assessments) // 2 :]

        first_avg = sum(a.score for a in first_half) / len(first_half)
        second_avg = sum(a.score for a in second_half) / len(second_half)

        if second_avg > first_avg * Decimal("1.05"):
            return "improving"
        elif second_avg < first_avg * Decimal("0.95"):
            return "declining"
        else:
            return "stable"

    def _build_growth_indicators(self, assessments: list) -> List[GrowthIndicator]:
        from collections import defaultdict

        monthly_scores = defaultdict(list)
        for assessment in assessments:
            period_key = assessment.assessment_date.strftime("%Y-%m")
            monthly_scores[period_key].append(assessment.score)

        indicators = []
        for period, scores in sorted(monthly_scores.items()):
            avg_score = sum(scores) / len(scores)
            indicators.append(
                GrowthIndicator(
                    period=period,
                    score=avg_score,
                    date=date.fromisoformat(f"{period}-01"),
                )
            )

        return indicators

    def _extract_strengths(self, assessments: list) -> List[str]:
        all_strengths = []
        for assessment in assessments:
            if assessment.strengths:
                all_strengths.extend(assessment.strengths)
        
        from collections import Counter
        if all_strengths:
            common_strengths = Counter(all_strengths).most_common(5)
            return [strength for strength, _ in common_strengths]
        return []

    def _extract_areas_for_growth(self, assessments: list) -> List[str]:
        all_areas = []
        for assessment in assessments:
            if assessment.areas_for_growth:
                all_areas.extend(assessment.areas_for_growth)
        
        from collections import Counter
        if all_areas:
            common_areas = Counter(all_areas).most_common(5)
            return [area for area, _ in common_areas]
        return []

    def _generate_growth_summary(self, report) -> str:
        level_text = report.overall_level.value.replace("_", " ").title()
        score_text = f"{float(report.overall_score):.2f}"
        
        summary = f"Your child is performing at a {level_text} level with an overall score of {score_text} out of 4.0. "
        
        if report.growth_summary:
            summary += str(report.growth_summary)
        
        return summary
