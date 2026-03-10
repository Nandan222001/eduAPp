from typing import List, Optional, Dict, Any
from datetime import date
from sqlalchemy.orm import Session

from src.ml.ml_service import MLService


class MLRepository:

    def __init__(self, db: Session):
        self.db = db
        self.ml_service = MLService(db)

    def get_student_performance_summary(
        self,
        institution_id: int,
        student_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        return self.ml_service.get_student_performance_summary(
            institution_id=institution_id,
            student_id=student_id,
            start_date=start_date,
            end_date=end_date
        )

    def get_batch_performance(
        self,
        institution_id: int,
        student_ids: List[int],
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        df = self.ml_service.get_batch_performance_summary(
            institution_id=institution_id,
            student_ids=student_ids,
            start_date=start_date,
            end_date=end_date
        )
        return df.to_dict('records') if not df.empty else []

    def identify_at_risk_students(
        self,
        institution_id: int,
        attendance_threshold: float = 75.0,
        assignment_threshold: float = 60.0,
        exam_threshold: float = 50.0,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        return self.ml_service.identify_at_risk_students(
            institution_id=institution_id,
            attendance_threshold=attendance_threshold,
            assignment_threshold=assignment_threshold,
            exam_threshold=exam_threshold,
            start_date=start_date,
            end_date=end_date
        )

    def get_subject_difficulty_analysis(
        self,
        institution_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        return self.ml_service.get_subject_difficulty_analysis(
            institution_id=institution_id,
            start_date=start_date,
            end_date=end_date
        )

    def prepare_training_dataset(
        self,
        institution_id: int,
        target_column: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        test_size: float = 0.2,
        val_size: float = 0.1,
        normalize: bool = True,
        normalization_method: str = 'standard',
        handle_missing: bool = True,
        missing_strategy: str = 'mean',
        random_state: int = 42
    ) -> Dict[str, Any]:
        return self.ml_service.prepare_training_dataset(
            institution_id=institution_id,
            target_column=target_column,
            start_date=start_date,
            end_date=end_date,
            test_size=test_size,
            val_size=val_size,
            normalize=normalize,
            normalization_method=normalization_method,
            handle_missing=handle_missing,
            missing_strategy=missing_strategy,
            random_state=random_state
        )

    def get_feature_matrix(
        self,
        institution_id: int,
        student_ids: Optional[List[int]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        df = self.ml_service.extract_and_prepare_features(
            institution_id=institution_id,
            student_ids=student_ids,
            start_date=start_date,
            end_date=end_date
        )
        return df.to_dict('records') if not df.empty else []
