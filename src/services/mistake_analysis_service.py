from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_

from src.models.mistake_analysis import MistakeType, RemediationStatus, EarnedVia
from src.models.examination import ExamMarks, ExamSubject
from src.models.assignment import Submission
from src.repositories.mistake_analysis_repository import (
    MistakePatternRepository,
    MistakeInsuranceTokenRepository,
    InsuranceReviewRepository
)
from src.schemas.mistake_analysis import (
    MistakePatternCreate, MistakePatternUpdate, MistakePatternResponse,
    MistakeInsuranceTokenCreate, MistakeInsuranceTokenResponse,
    InsuranceReviewCreate, InsuranceReviewResponse,
    MistakeAnalysisRequest, CorrectionPlanResponse, CorrectionPlanItem,
    InsuranceClaimRequest, InsuranceClaimValidationResponse, InsuranceClaimResponse,
    StudentMistakeSummary, SubjectMistakeAnalysis
)


class MistakeAnalysisService:
    def __init__(self, db: Session):
        self.db = db
        self.pattern_repo = MistakePatternRepository(db)
        self.token_repo = MistakeInsuranceTokenRepository(db)
        self.review_repo = InsuranceReviewRepository(db)
    
    def detect_patterns(self, request: MistakeAnalysisRequest) -> List[MistakePatternResponse]:
        patterns = []
        
        if request.exam_id:
            patterns.extend(self._analyze_exam_mistakes(
                request.student_id,
                request.exam_id,
                request.subject_id
            ))
        
        if request.assignment_id:
            patterns.extend(self._analyze_assignment_mistakes(
                request.student_id,
                request.assignment_id
            ))
        
        return patterns
    
    def _analyze_exam_mistakes(
        self,
        student_id: int,
        exam_id: int,
        subject_id: Optional[int] = None
    ) -> List[MistakePatternResponse]:
        query = self.db.query(ExamMarks).join(
            ExamSubject,
            ExamMarks.exam_subject_id == ExamSubject.id
        ).filter(
            and_(
                ExamMarks.student_id == student_id,
                ExamSubject.exam_id == exam_id
            )
        )
        
        if subject_id:
            query = query.filter(ExamSubject.subject_id == subject_id)
        
        exam_marks = query.all()
        detected_patterns = []
        
        for mark in exam_marks:
            exam_subject = mark.exam_subject
            
            theory_max = float(exam_subject.theory_max_marks or 0)
            theory_obtained = float(mark.theory_marks_obtained or 0)
            practical_max = float(exam_subject.practical_max_marks or 0)
            practical_obtained = float(mark.practical_marks_obtained or 0)
            
            total_max = theory_max + practical_max
            total_obtained = theory_obtained + practical_obtained
            
            if total_max > 0:
                marks_lost = Decimal(str(total_max - total_obtained))
                
                if marks_lost > 0:
                    mistake_type = self._categorize_mistake(mark, marks_lost, total_max)
                    
                    pattern = self._update_or_create_pattern(
                        student_id=student_id,
                        subject_id=exam_subject.subject_id,
                        chapter_id=None,
                        mistake_type=mistake_type,
                        marks_lost=marks_lost,
                        example={
                            'exam_id': exam_id,
                            'exam_subject_id': exam_subject.id,
                            'marks_lost': float(marks_lost),
                            'date': datetime.utcnow().isoformat()
                        }
                    )
                    detected_patterns.append(MistakePatternResponse.model_validate(pattern))
        
        return detected_patterns
    
    def _analyze_assignment_mistakes(
        self,
        student_id: int,
        assignment_id: int
    ) -> List[MistakePatternResponse]:
        submission = self.db.query(Submission).filter(
            and_(
                Submission.student_id == student_id,
                Submission.assignment_id == assignment_id
            )
        ).first()
        
        if not submission or not submission.marks_obtained:
            return []
        
        assignment = submission.assignment
        max_marks = float(assignment.max_marks)
        obtained_marks = float(submission.marks_obtained)
        marks_lost = Decimal(str(max_marks - obtained_marks))
        
        if marks_lost <= 0:
            return []
        
        mistake_type = self._categorize_assignment_mistake(submission, marks_lost, max_marks)
        
        pattern = self._update_or_create_pattern(
            student_id=student_id,
            subject_id=assignment.subject_id,
            chapter_id=assignment.chapter_id,
            mistake_type=mistake_type,
            marks_lost=marks_lost,
            example={
                'assignment_id': assignment_id,
                'marks_lost': float(marks_lost),
                'is_late': submission.is_late,
                'date': submission.submitted_at.isoformat() if submission.submitted_at else None
            }
        )
        
        return [MistakePatternResponse.model_validate(pattern)]
    
    def _categorize_mistake(
        self,
        exam_mark: ExamMarks,
        marks_lost: Decimal,
        total_max: float
    ) -> MistakeType:
        loss_percentage = (float(marks_lost) / total_max) * 100 if total_max > 0 else 0
        
        if exam_mark.remarks:
            remarks_lower = exam_mark.remarks.lower()
            if any(word in remarks_lower for word in ['calculation', 'arithmetic', 'silly']):
                return MistakeType.SILLY_CALCULATION
            if any(word in remarks_lower for word in ['sign', '+', '-', 'negative', 'positive']):
                return MistakeType.SIGN_ERROR
            if any(word in remarks_lower for word in ['unit', 'units', 'dimension']):
                return MistakeType.UNIT_MISSING
            if any(word in remarks_lower for word in ['concept', 'understanding', 'theory']):
                return MistakeType.CONCEPT_WRONG
            if any(word in remarks_lower for word in ['misread', 'question', 'instruction']):
                return MistakeType.MISREAD_QUESTION
            if any(word in remarks_lower for word in ['incomplete', 'steps', 'working']):
                return MistakeType.INCOMPLETE_STEPS
            if any(word in remarks_lower for word in ['presentation', 'handwriting', 'format']):
                return MistakeType.PRESENTATION
        
        if loss_percentage < 20:
            return MistakeType.SILLY_CALCULATION
        elif loss_percentage < 40:
            return MistakeType.INCOMPLETE_STEPS
        else:
            return MistakeType.CONCEPT_WRONG
    
    def _categorize_assignment_mistake(
        self,
        submission: Submission,
        marks_lost: Decimal,
        max_marks: float
    ) -> MistakeType:
        if submission.is_late:
            return MistakeType.INCOMPLETE_STEPS
        
        if submission.feedback:
            feedback_lower = submission.feedback.lower()
            if any(word in feedback_lower for word in ['calculation', 'arithmetic', 'silly']):
                return MistakeType.SILLY_CALCULATION
            if any(word in feedback_lower for word in ['sign', '+', '-']):
                return MistakeType.SIGN_ERROR
            if any(word in feedback_lower for word in ['unit', 'units']):
                return MistakeType.UNIT_MISSING
            if any(word in feedback_lower for word in ['concept', 'understanding']):
                return MistakeType.CONCEPT_WRONG
            if any(word in feedback_lower for word in ['presentation', 'format']):
                return MistakeType.PRESENTATION
        
        loss_percentage = (float(marks_lost) / max_marks) * 100 if max_marks > 0 else 0
        
        if loss_percentage < 15:
            return MistakeType.SILLY_CALCULATION
        elif loss_percentage < 35:
            return MistakeType.INCOMPLETE_STEPS
        else:
            return MistakeType.CONCEPT_WRONG
    
    def _update_or_create_pattern(
        self,
        student_id: int,
        subject_id: int,
        chapter_id: Optional[int],
        mistake_type: MistakeType,
        marks_lost: Decimal,
        example: Dict[str, Any]
    ):
        existing = self.pattern_repo.find_existing_pattern(
            student_id, subject_id, chapter_id, mistake_type
        )
        
        if existing:
            examples = existing.examples or []
            examples.append(example)
            if len(examples) > 10:
                examples = examples[-10:]
            
            update_data = MistakePatternUpdate(
                frequency_count=existing.frequency_count + 1,
                total_marks_lost=existing.total_marks_lost + marks_lost,
                last_detected_at=datetime.utcnow(),
                examples=examples
            )
            return self.pattern_repo.update_pattern(existing.id, update_data)
        else:
            create_data = MistakePatternCreate(
                student_id=student_id,
                subject_id=subject_id,
                chapter_id=chapter_id,
                mistake_type=mistake_type,
                frequency_count=1,
                total_marks_lost=marks_lost,
                first_detected_at=datetime.utcnow(),
                last_detected_at=datetime.utcnow(),
                remediation_status=RemediationStatus.UNRESOLVED,
                examples=[example]
            )
            return self.pattern_repo.create_pattern(create_data)
    
    def calculate_marks_impact(self, student_id: int, subject_id: Optional[int] = None) -> Dict[str, Any]:
        patterns = self.pattern_repo.get_student_patterns(
            student_id=student_id,
            subject_id=subject_id
        )
        
        impact = {
            'total_marks_lost': Decimal('0'),
            'by_type': {},
            'by_subject': {},
            'recoverable_marks': Decimal('0')
        }
        
        for pattern in patterns:
            impact['total_marks_lost'] += pattern.total_marks_lost
            
            type_key = pattern.mistake_type.value
            if type_key not in impact['by_type']:
                impact['by_type'][type_key] = {
                    'marks_lost': Decimal('0'),
                    'frequency': 0
                }
            impact['by_type'][type_key]['marks_lost'] += pattern.total_marks_lost
            impact['by_type'][type_key]['frequency'] += pattern.frequency_count
            
            if pattern.mistake_type in [MistakeType.SILLY_CALCULATION, MistakeType.SIGN_ERROR, 
                                       MistakeType.UNIT_MISSING, MistakeType.PRESENTATION]:
                impact['recoverable_marks'] += pattern.total_marks_lost
        
        return impact
    
    def generate_correction_plan(
        self,
        student_id: int,
        subject_id: Optional[int] = None
    ) -> CorrectionPlanResponse:
        patterns = self.pattern_repo.get_student_patterns(
            student_id=student_id,
            subject_id=subject_id,
            remediation_status=RemediationStatus.UNRESOLVED
        )
        
        correction_items = []
        total_improvement_potential = Decimal('0')
        
        for pattern in patterns:
            recommended_actions = self._get_recommended_actions(pattern.mistake_type)
            practice_resources = self._get_practice_resources(pattern.mistake_type)
            
            correction_items.append(CorrectionPlanItem(
                mistake_type=pattern.mistake_type,
                frequency=pattern.frequency_count,
                marks_lost=pattern.total_marks_lost,
                recommended_actions=recommended_actions,
                practice_resources=practice_resources
            ))
            
            if pattern.mistake_type in [MistakeType.SILLY_CALCULATION, MistakeType.SIGN_ERROR, 
                                       MistakeType.UNIT_MISSING, MistakeType.PRESENTATION]:
                total_improvement_potential += pattern.total_marks_lost * Decimal('0.8')
            else:
                total_improvement_potential += pattern.total_marks_lost * Decimal('0.5')
        
        overall_summary = self._generate_overall_summary(patterns)
        
        return CorrectionPlanResponse(
            student_id=student_id,
            subject_id=subject_id,
            overall_summary=overall_summary,
            correction_items=correction_items,
            estimated_improvement_potential=total_improvement_potential
        )
    
    def _get_recommended_actions(self, mistake_type: MistakeType) -> List[str]:
        recommendations = {
            MistakeType.SILLY_CALCULATION: [
                "Practice mental math daily for 10 minutes",
                "Double-check calculations before moving to next step",
                "Use calculator for complex calculations",
                "Write calculations step-by-step clearly"
            ],
            MistakeType.SIGN_ERROR: [
                "Circle or highlight sign changes in problems",
                "Practice sign rules systematically",
                "Verify sign after each step",
                "Create a sign reference card"
            ],
            MistakeType.UNIT_MISSING: [
                "Always write units with every answer",
                "Create a unit checklist for problems",
                "Practice unit conversion exercises",
                "Review dimensional analysis"
            ],
            MistakeType.CONCEPT_WRONG: [
                "Review fundamental concepts with teacher",
                "Watch concept explanation videos",
                "Solve conceptual problems with solutions",
                "Join study group for concept clarification"
            ],
            MistakeType.MISREAD_QUESTION: [
                "Underline key information in question",
                "Read question twice before solving",
                "Circle what is being asked",
                "Practice reading comprehension exercises"
            ],
            MistakeType.INCOMPLETE_STEPS: [
                "Show all working clearly",
                "Use structured problem-solving format",
                "Don't skip intermediate steps",
                "Time management practice"
            ],
            MistakeType.PRESENTATION: [
                "Practice neat handwriting",
                "Use proper formatting and spacing",
                "Organize work systematically",
                "Review presentation guidelines"
            ]
        }
        return recommendations.get(mistake_type, ["Consult with teacher for guidance"])
    
    def _get_practice_resources(self, mistake_type: MistakeType) -> List[str]:
        resources = {
            MistakeType.SILLY_CALCULATION: [
                "Mental math practice worksheets",
                "Calculation accuracy drills",
                "Khan Academy arithmetic section"
            ],
            MistakeType.SIGN_ERROR: [
                "Sign rules practice problems",
                "Integer operation worksheets",
                "Algebra sign practice"
            ],
            MistakeType.UNIT_MISSING: [
                "Unit conversion practice",
                "Dimensional analysis exercises",
                "Physics/Chemistry unit problems"
            ],
            MistakeType.CONCEPT_WRONG: [
                "Textbook chapter review",
                "Concept video tutorials",
                "Previous year problems with solutions"
            ],
            MistakeType.MISREAD_QUESTION: [
                "Reading comprehension exercises",
                "Question analysis practice",
                "Past exam paper analysis"
            ],
            MistakeType.INCOMPLETE_STEPS: [
                "Stepwise problem solving practice",
                "Timed practice tests",
                "Solution writing workshops"
            ],
            MistakeType.PRESENTATION: [
                "Answer writing practice",
                "Format guidelines review",
                "Sample answer analysis"
            ]
        }
        return resources.get(mistake_type, ["Consult teacher for resources"])
    
    def _generate_overall_summary(self, patterns) -> str:
        if not patterns:
            return "No unresolved mistake patterns found. Keep up the good work!"
        
        total_patterns = len(patterns)
        most_common = max(patterns, key=lambda p: p.frequency_count)
        
        return (
            f"Identified {total_patterns} mistake pattern(s) requiring attention. "
            f"Most frequent issue: {most_common.mistake_type.value.replace('_', ' ').title()} "
            f"({most_common.frequency_count} occurrences). "
            f"Focus on correcting these patterns to improve performance."
        )
    
    def process_insurance_claim(
        self,
        request: InsuranceClaimRequest
    ) -> InsuranceClaimResponse:
        validation = self.validate_insurance_claim(request)
        
        if not validation.is_valid:
            return InsuranceClaimResponse(
                review_id=0,
                original_score=Decimal('0'),
                revised_score=Decimal('0'),
                marks_recovered=Decimal('0'),
                success=False,
                message="; ".join(validation.validation_errors)
            )
        
        token = self.token_repo.get_token_by_id(request.token_id)
        exam_marks = self.db.query(ExamMarks).join(
            ExamSubject
        ).filter(
            and_(
                ExamMarks.student_id == token.student_id,
                ExamSubject.exam_id == request.exam_id
            )
        ).all()
        
        original_score = sum(
            (float(m.theory_marks_obtained or 0) + float(m.practical_marks_obtained or 0))
            for m in exam_marks
        )
        
        revised_score = original_score + float(validation.eligible_marks_recovery)
        
        self.token_repo.mark_token_as_used(request.token_id, request.exam_id)
        
        review_data = InsuranceReviewCreate(
            token_id=request.token_id,
            exam_id=request.exam_id,
            original_score=Decimal(str(original_score)),
            revised_score=Decimal(str(revised_score)),
            mistakes_corrected=request.mistakes_corrected,
            student_explanation=request.student_explanation
        )
        
        review = self.review_repo.create_review(review_data)
        
        return InsuranceClaimResponse(
            review_id=review.id,
            original_score=Decimal(str(original_score)),
            revised_score=Decimal(str(revised_score)),
            marks_recovered=validation.eligible_marks_recovery,
            success=True,
            message="Insurance claim processed successfully"
        )
    
    def validate_insurance_claim(
        self,
        request: InsuranceClaimRequest
    ) -> InsuranceClaimValidationResponse:
        errors = []
        
        token = self.token_repo.get_token_by_id(request.token_id)
        if not token:
            errors.append("Invalid token ID")
            return InsuranceClaimValidationResponse(
                is_valid=False,
                eligible_marks_recovery=Decimal('0'),
                max_recovery_cap=Decimal('0'),
                validation_errors=errors,
                correctable_mistakes=[]
            )
        
        if token.used_at is not None:
            errors.append("Token has already been used")
        
        correctable_mistakes = []
        total_correctable_marks = Decimal('0')
        
        for mistake in request.mistakes_corrected:
            mistake_type_str = mistake.get('mistake_type', '')
            try:
                mistake_type = MistakeType(mistake_type_str)
            except ValueError:
                errors.append(f"Invalid mistake type: {mistake_type_str}")
                continue
            
            if mistake_type not in [MistakeType.SILLY_CALCULATION, MistakeType.SIGN_ERROR, 
                                   MistakeType.UNIT_MISSING, MistakeType.PRESENTATION]:
                errors.append(
                    f"Mistake type '{mistake_type.value}' is not eligible for insurance correction. "
                    "Only silly mistakes are correctable."
                )
                continue
            
            marks = Decimal(str(mistake.get('marks_lost', 0)))
            correctable_mistakes.append(mistake)
            total_correctable_marks += marks
        
        exam_marks = self.db.query(ExamMarks).join(
            ExamSubject
        ).filter(
            and_(
                ExamMarks.student_id == token.student_id,
                ExamSubject.exam_id == request.exam_id
            )
        ).all()
        
        total_marks_lost = sum(
            (float(es.theory_max_marks or 0) + float(es.practical_max_marks or 0)) - 
            (float(m.theory_marks_obtained or 0) + float(m.practical_marks_obtained or 0))
            for m, es in [(m, m.exam_subject) for m in exam_marks]
        )
        
        max_recovery_cap = Decimal(str(total_marks_lost * 0.5))
        
        eligible_marks_recovery = min(total_correctable_marks, max_recovery_cap)
        
        if not correctable_mistakes:
            errors.append("No valid correctable mistakes found")
        
        return InsuranceClaimValidationResponse(
            is_valid=len(errors) == 0,
            eligible_marks_recovery=eligible_marks_recovery,
            max_recovery_cap=max_recovery_cap,
            validation_errors=errors,
            correctable_mistakes=correctable_mistakes
        )
    
    def get_student_summary(self, student_id: int) -> StudentMistakeSummary:
        stats = self.pattern_repo.get_statistics(student_id)
        available_tokens = self.token_repo.get_available_tokens_count(student_id)
        used_tokens = self.token_repo.get_used_tokens_count(student_id)
        
        return StudentMistakeSummary(
            student_id=student_id,
            total_patterns=stats['total_patterns'],
            patterns_by_type=stats['patterns_by_type'],
            total_marks_lost=Decimal(str(stats['total_marks_lost'])),
            unresolved_count=stats['unresolved_count'],
            in_progress_count=stats['in_progress_count'],
            mastered_count=stats['mastered_count'],
            available_tokens=available_tokens,
            used_tokens=used_tokens
        )
    
    def get_subject_analysis(self, student_id: int, subject_id: int) -> SubjectMistakeAnalysis:
        patterns = self.pattern_repo.get_patterns_by_subject(student_id, subject_id)
        
        total_frequency = sum(p.frequency_count for p in patterns)
        total_marks_lost = sum(p.total_marks_lost for p in patterns)
        
        most_common_mistake = None
        if patterns:
            most_common = max(patterns, key=lambda p: p.frequency_count)
            most_common_mistake = most_common.mistake_type
        
        pattern_responses = [MistakePatternResponse.model_validate(p) for p in patterns]
        
        return SubjectMistakeAnalysis(
            subject_id=subject_id,
            subject_name=None,
            patterns=pattern_responses,
            total_frequency=total_frequency,
            total_marks_lost=total_marks_lost,
            most_common_mistake=most_common_mistake
        )
    
    def create_insurance_token(
        self,
        student_id: int,
        earned_via: EarnedVia
    ) -> MistakeInsuranceTokenResponse:
        token_data = MistakeInsuranceTokenCreate(
            student_id=student_id,
            earned_via=earned_via
        )
        token = self.token_repo.create_token(token_data)
        return MistakeInsuranceTokenResponse.model_validate(token)
    
    def get_student_tokens(
        self,
        student_id: int,
        include_used: bool = True
    ) -> List[MistakeInsuranceTokenResponse]:
        tokens = self.token_repo.get_student_tokens(student_id, include_used)
        return [MistakeInsuranceTokenResponse.model_validate(t) for t in tokens]
    
    def update_pattern_status(
        self,
        pattern_id: int,
        status: RemediationStatus
    ) -> Optional[MistakePatternResponse]:
        update_data = MistakePatternUpdate(remediation_status=status)
        pattern = self.pattern_repo.update_pattern(pattern_id, update_data)
        if pattern:
            return MistakePatternResponse.model_validate(pattern)
        return None
