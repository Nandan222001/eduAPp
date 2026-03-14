from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc, or_
from datetime import datetime, date, timedelta
from decimal import Decimal
from src.models.sel import (
    SELCompetency,
    SELAssessment,
    SELObservation,
    SELGrowthTracking,
    PeerRelationshipMapping,
    SELProgressReport,
    CASELCompetency,
    AssessmentType,
    RubricLevel,
)
from src.schemas.sel import (
    SELCompetencyCreate,
    SELCompetencyUpdate,
    SELAssessmentCreate,
    SELAssessmentUpdate,
    SELObservationCreate,
    SELObservationUpdate,
    PeerRelationshipCreate,
    PeerRelationshipUpdate,
    SELProgressReportCreate,
)


class SELRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_competency(
        self, institution_id: int, competency_data: SELCompetencyCreate
    ) -> SELCompetency:
        competency = SELCompetency(
            institution_id=institution_id,
            competency_type=competency_data.competency_type,
            name=competency_data.name,
            description=competency_data.description,
            grade_level=competency_data.grade_level,
            rubric_emerging=competency_data.rubric_emerging,
            rubric_developing=competency_data.rubric_developing,
            rubric_proficient=competency_data.rubric_proficient,
            rubric_advanced=competency_data.rubric_advanced,
            indicators=competency_data.indicators,
            weight=competency_data.weight,
        )
        self.db.add(competency)
        self.db.commit()
        self.db.refresh(competency)
        return competency

    def get_competency(self, competency_id: int, institution_id: int) -> Optional[SELCompetency]:
        return (
            self.db.query(SELCompetency)
            .filter(
                and_(
                    SELCompetency.id == competency_id,
                    SELCompetency.institution_id == institution_id,
                )
            )
            .first()
        )

    def get_competencies(
        self, institution_id: int, competency_type: Optional[str] = None, skip: int = 0, limit: int = 100
    ) -> List[SELCompetency]:
        query = self.db.query(SELCompetency).filter(
            SELCompetency.institution_id == institution_id, SELCompetency.is_active == True
        )
        if competency_type:
            query = query.filter(SELCompetency.competency_type == competency_type)
        return query.offset(skip).limit(limit).all()

    def update_competency(
        self, competency: SELCompetency, update_data: SELCompetencyUpdate
    ) -> SELCompetency:
        for key, value in update_data.model_dump(exclude_unset=True).items():
            setattr(competency, key, value)
        self.db.commit()
        self.db.refresh(competency)
        return competency

    def create_assessment(
        self, institution_id: int, assessor_id: int, assessment_data: SELAssessmentCreate
    ) -> SELAssessment:
        assessment = SELAssessment(
            institution_id=institution_id,
            assessor_id=assessor_id,
            student_id=assessment_data.student_id,
            competency_id=assessment_data.competency_id,
            assessment_type=assessment_data.assessment_type,
            rubric_level=assessment_data.rubric_level,
            score=assessment_data.score,
            max_score=assessment_data.max_score,
            notes=assessment_data.notes,
            evidence=assessment_data.evidence,
            strengths=assessment_data.strengths,
            areas_for_growth=assessment_data.areas_for_growth,
            assessment_date=assessment_data.assessment_date,
            term=assessment_data.term,
            academic_year=assessment_data.academic_year,
        )
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def get_assessment(
        self, assessment_id: int, institution_id: int
    ) -> Optional[SELAssessment]:
        return (
            self.db.query(SELAssessment)
            .filter(
                and_(
                    SELAssessment.id == assessment_id,
                    SELAssessment.institution_id == institution_id,
                )
            )
            .first()
        )

    def get_assessments(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        competency_id: Optional[int] = None,
        assessment_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[SELAssessment]:
        query = self.db.query(SELAssessment).filter(
            SELAssessment.institution_id == institution_id
        )
        if student_id:
            query = query.filter(SELAssessment.student_id == student_id)
        if competency_id:
            query = query.filter(SELAssessment.competency_id == competency_id)
        if assessment_type:
            query = query.filter(SELAssessment.assessment_type == assessment_type)
        return query.order_by(desc(SELAssessment.assessment_date)).offset(skip).limit(limit).all()

    def update_assessment(
        self, assessment: SELAssessment, update_data: SELAssessmentUpdate
    ) -> SELAssessment:
        for key, value in update_data.model_dump(exclude_unset=True).items():
            setattr(assessment, key, value)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def submit_assessment(self, assessment: SELAssessment) -> SELAssessment:
        assessment.is_submitted = True
        assessment.submitted_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def create_observation(
        self, institution_id: int, observer_id: int, observation_data: SELObservationCreate
    ) -> SELObservation:
        observation = SELObservation(
            institution_id=institution_id,
            observer_id=observer_id,
            student_id=observation_data.student_id,
            competency_id=observation_data.competency_id,
            observation_type=observation_data.observation_type,
            title=observation_data.title,
            description=observation_data.description,
            context=observation_data.context,
            behaviors_observed=observation_data.behaviors_observed,
            impact_rating=observation_data.impact_rating,
            frequency=observation_data.frequency,
            observation_date=observation_data.observation_date,
            location=observation_data.location,
            tags=observation_data.tags,
            attachments=observation_data.attachments,
            is_positive=observation_data.is_positive,
            requires_followup=observation_data.requires_followup,
            followup_notes=observation_data.followup_notes,
            followup_date=observation_data.followup_date,
        )
        self.db.add(observation)
        self.db.commit()
        self.db.refresh(observation)
        return observation

    def get_observation(
        self, observation_id: int, institution_id: int
    ) -> Optional[SELObservation]:
        return (
            self.db.query(SELObservation)
            .filter(
                and_(
                    SELObservation.id == observation_id,
                    SELObservation.institution_id == institution_id,
                )
            )
            .first()
        )

    def get_observations(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        observer_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[SELObservation]:
        query = self.db.query(SELObservation).filter(
            SELObservation.institution_id == institution_id
        )
        if student_id:
            query = query.filter(SELObservation.student_id == student_id)
        if observer_id:
            query = query.filter(SELObservation.observer_id == observer_id)
        return query.order_by(desc(SELObservation.observation_date)).offset(skip).limit(limit).all()

    def update_observation(
        self, observation: SELObservation, update_data: SELObservationUpdate
    ) -> SELObservation:
        for key, value in update_data.model_dump(exclude_unset=True).items():
            setattr(observation, key, value)
        self.db.commit()
        self.db.refresh(observation)
        return observation

    def create_peer_relationship(
        self, institution_id: int, observer_id: int, relationship_data: PeerRelationshipCreate
    ) -> PeerRelationshipMapping:
        relationship = PeerRelationshipMapping(
            institution_id=institution_id,
            observed_by=observer_id,
            student_id=relationship_data.student_id,
            peer_student_id=relationship_data.peer_student_id,
            relationship_type=relationship_data.relationship_type,
            strength=relationship_data.strength,
            interaction_frequency=relationship_data.interaction_frequency,
            collaboration_quality=relationship_data.collaboration_quality,
            conflict_incidents=relationship_data.conflict_incidents,
            positive_interactions=relationship_data.positive_interactions,
            notes=relationship_data.notes,
            last_interaction_date=relationship_data.last_interaction_date,
            first_observed_date=relationship_data.first_observed_date,
        )
        self.db.add(relationship)
        self.db.commit()
        self.db.refresh(relationship)
        return relationship

    def get_peer_relationships(
        self, student_id: int, institution_id: int, active_only: bool = True
    ) -> List[PeerRelationshipMapping]:
        query = self.db.query(PeerRelationshipMapping).filter(
            and_(
                PeerRelationshipMapping.student_id == student_id,
                PeerRelationshipMapping.institution_id == institution_id,
            )
        )
        if active_only:
            query = query.filter(PeerRelationshipMapping.is_active == True)
        return query.all()

    def update_peer_relationship(
        self, relationship: PeerRelationshipMapping, update_data: PeerRelationshipUpdate
    ) -> PeerRelationshipMapping:
        for key, value in update_data.model_dump(exclude_unset=True).items():
            setattr(relationship, key, value)
        self.db.commit()
        self.db.refresh(relationship)
        return relationship

    def calculate_growth_tracking(
        self, student_id: int, institution_id: int, period_start: date, period_end: date
    ) -> List[SELGrowthTracking]:
        growth_records = []
        
        for competency_type in CASELCompetency:
            assessments = (
                self.db.query(SELAssessment)
                .join(SELCompetency)
                .filter(
                    and_(
                        SELAssessment.student_id == student_id,
                        SELAssessment.institution_id == institution_id,
                        SELAssessment.assessment_date >= period_start,
                        SELAssessment.assessment_date <= period_end,
                        SELAssessment.is_submitted == True,
                        SELCompetency.competency_type == competency_type,
                    )
                )
                .all()
            )

            if not assessments:
                continue

            teacher_ratings = [a.score for a in assessments if a.assessment_type == AssessmentType.TEACHER_RATING]
            self_assessments = [a.score for a in assessments if a.assessment_type == AssessmentType.SELF_ASSESSMENT]
            peer_assessments = [a.score for a in assessments if a.assessment_type == AssessmentType.PEER_ASSESSMENT]

            all_scores = [a.score for a in assessments]
            current_score = sum(all_scores) / len(all_scores) if all_scores else Decimal("0")

            existing_growth = (
                self.db.query(SELGrowthTracking)
                .filter(
                    and_(
                        SELGrowthTracking.student_id == student_id,
                        SELGrowthTracking.institution_id == institution_id,
                        SELGrowthTracking.competency_type == competency_type,
                        SELGrowthTracking.period_start == period_start,
                        SELGrowthTracking.period_end == period_end,
                    )
                )
                .first()
            )

            if existing_growth:
                baseline = existing_growth.baseline_score or current_score
                growth_pct = ((current_score - baseline) / baseline * 100) if baseline > 0 else Decimal("0")
                
                existing_growth.current_score = current_score
                existing_growth.growth_percentage = growth_pct
                existing_growth.assessment_count = len(assessments)
                existing_growth.teacher_ratings_avg = sum(teacher_ratings) / len(teacher_ratings) if teacher_ratings else None
                existing_growth.self_assessment_avg = sum(self_assessments) / len(self_assessments) if self_assessments else None
                existing_growth.peer_assessment_avg = sum(peer_assessments) / len(peer_assessments) if peer_assessments else None
                existing_growth.trend = "improving" if growth_pct > 0 else "declining" if growth_pct < 0 else "stable"
                existing_growth.last_calculated_at = datetime.utcnow()
                growth_records.append(existing_growth)
            else:
                growth = SELGrowthTracking(
                    institution_id=institution_id,
                    student_id=student_id,
                    competency_type=competency_type,
                    period_start=period_start,
                    period_end=period_end,
                    baseline_score=current_score,
                    current_score=current_score,
                    growth_percentage=Decimal("0"),
                    assessment_count=len(assessments),
                    teacher_ratings_avg=sum(teacher_ratings) / len(teacher_ratings) if teacher_ratings else None,
                    self_assessment_avg=sum(self_assessments) / len(self_assessments) if self_assessments else None,
                    peer_assessment_avg=sum(peer_assessments) / len(peer_assessments) if peer_assessments else None,
                    trend="stable",
                )
                self.db.add(growth)
                growth_records.append(growth)

        self.db.commit()
        return growth_records

    def get_growth_tracking(
        self, student_id: int, institution_id: int, competency_type: Optional[str] = None
    ) -> List[SELGrowthTracking]:
        query = self.db.query(SELGrowthTracking).filter(
            and_(
                SELGrowthTracking.student_id == student_id,
                SELGrowthTracking.institution_id == institution_id,
            )
        )
        if competency_type:
            query = query.filter(SELGrowthTracking.competency_type == competency_type)
        return query.order_by(desc(SELGrowthTracking.period_start)).all()

    def create_progress_report(
        self, institution_id: int, generator_id: int, report_data: SELProgressReportCreate
    ) -> SELProgressReport:
        assessments = (
            self.db.query(SELAssessment)
            .join(SELCompetency)
            .filter(
                and_(
                    SELAssessment.student_id == report_data.student_id,
                    SELAssessment.institution_id == institution_id,
                    SELAssessment.assessment_date >= report_data.period_start,
                    SELAssessment.assessment_date <= report_data.period_end,
                    SELAssessment.is_submitted == True,
                )
            )
            .all()
        )

        competency_scores = {}
        for competency_type in CASELCompetency:
            comp_assessments = [
                a for a in assessments 
                if a.competency.competency_type == competency_type
            ]
            if comp_assessments:
                avg_score = sum(a.score for a in comp_assessments) / len(comp_assessments)
                competency_scores[competency_type.value] = avg_score

        overall_score = (
            sum(competency_scores.values()) / len(competency_scores)
            if competency_scores
            else Decimal("0")
        )

        overall_level = self._determine_rubric_level(overall_score)

        observations = (
            self.db.query(SELObservation)
            .filter(
                and_(
                    SELObservation.student_id == report_data.student_id,
                    SELObservation.institution_id == institution_id,
                    SELObservation.observation_date >= report_data.period_start,
                    SELObservation.observation_date <= report_data.period_end,
                )
            )
            .all()
        )

        peer_relationships = (
            self.db.query(PeerRelationshipMapping)
            .filter(
                and_(
                    PeerRelationshipMapping.student_id == report_data.student_id,
                    PeerRelationshipMapping.institution_id == institution_id,
                    PeerRelationshipMapping.is_active == True,
                )
            )
            .all()
        )

        report = SELProgressReport(
            institution_id=institution_id,
            student_id=report_data.student_id,
            report_type=report_data.report_type,
            period_start=report_data.period_start,
            period_end=report_data.period_end,
            term=report_data.term,
            academic_year=report_data.academic_year,
            overall_score=overall_score,
            overall_level=overall_level,
            self_awareness_score=competency_scores.get("self_awareness"),
            self_management_score=competency_scores.get("self_management"),
            social_awareness_score=competency_scores.get("social_awareness"),
            relationship_skills_score=competency_scores.get("relationship_skills"),
            responsible_decision_making_score=competency_scores.get("responsible_decision_making"),
            teacher_comments=report_data.teacher_comments,
            generated_by=generator_id,
            observations_summary={
                "total_observations": len(observations),
                "positive_observations": len([o for o in observations if o.is_positive]),
                "areas_needing_attention": len([o for o in observations if o.requires_followup]),
            },
            peer_relationships_summary={
                "total_connections": len(peer_relationships),
                "average_strength": float(sum(r.strength for r in peer_relationships) / len(peer_relationships)) if peer_relationships else 0,
            },
        )

        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def get_progress_report(
        self, report_id: int, institution_id: int
    ) -> Optional[SELProgressReport]:
        return (
            self.db.query(SELProgressReport)
            .filter(
                and_(
                    SELProgressReport.id == report_id,
                    SELProgressReport.institution_id == institution_id,
                )
            )
            .first()
        )

    def get_progress_reports(
        self, student_id: int, institution_id: int, skip: int = 0, limit: int = 100
    ) -> List[SELProgressReport]:
        return (
            self.db.query(SELProgressReport)
            .filter(
                and_(
                    SELProgressReport.student_id == student_id,
                    SELProgressReport.institution_id == institution_id,
                )
            )
            .order_by(desc(SELProgressReport.period_end))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def share_report_with_parent(self, report: SELProgressReport) -> SELProgressReport:
        report.shared_with_parent = True
        self.db.commit()
        self.db.refresh(report)
        return report

    def mark_parent_viewed(self, report: SELProgressReport) -> SELProgressReport:
        report.parent_viewed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(report)
        return report

    def _determine_rubric_level(self, score: Decimal) -> RubricLevel:
        if score >= Decimal("3.5"):
            return RubricLevel.ADVANCED
        elif score >= Decimal("2.5"):
            return RubricLevel.PROFICIENT
        elif score >= Decimal("1.5"):
            return RubricLevel.DEVELOPING
        else:
            return RubricLevel.EMERGING
