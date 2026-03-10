from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.repositories.ml_repository import MLRepository
from src.schemas.ml_schemas import (
    PerformanceSummaryRequest,
    PerformanceSummaryResponse,
    BatchPerformanceRequest,
    AtRiskStudentsRequest,
    AtRiskStudentsResponse,
    AtRiskStudent,
    SubjectDifficultyRequest,
    SubjectDifficultyResponse,
    SubjectDifficulty,
    TrainingDataRequest,
    TrainingDataResponse,
    DataQualityReport,
    FeatureMatrixRequest,
    FeatureMatrixResponse
)

router = APIRouter(prefix="/ml", tags=["Machine Learning"])


@router.post("/performance/summary", response_model=PerformanceSummaryResponse)
def get_student_performance_summary(
    request: PerformanceSummaryRequest,
    db: Session = Depends(get_db)
) -> PerformanceSummaryResponse:
    try:
        ml_repo = MLRepository(db)
        summary = ml_repo.get_student_performance_summary(
            institution_id=request.institution_id,
            student_id=request.student_id,
            start_date=request.start_date,
            end_date=request.end_date
        )
        return PerformanceSummaryResponse(**summary)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating performance summary: {str(e)}"
        )


@router.post("/performance/batch")
def get_batch_performance(
    request: BatchPerformanceRequest,
    db: Session = Depends(get_db)
) -> List[dict]:
    try:
        ml_repo = MLRepository(db)
        performance_data = ml_repo.get_batch_performance(
            institution_id=request.institution_id,
            student_ids=request.student_ids,
            start_date=request.start_date,
            end_date=request.end_date
        )
        return performance_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating batch performance: {str(e)}"
        )


@router.post("/students/at-risk", response_model=AtRiskStudentsResponse)
def identify_at_risk_students(
    request: AtRiskStudentsRequest,
    db: Session = Depends(get_db)
) -> AtRiskStudentsResponse:
    try:
        ml_repo = MLRepository(db)
        at_risk_students = ml_repo.identify_at_risk_students(
            institution_id=request.institution_id,
            attendance_threshold=request.attendance_threshold,
            assignment_threshold=request.assignment_threshold,
            exam_threshold=request.exam_threshold,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        students = [AtRiskStudent(**student) for student in at_risk_students]
        
        return AtRiskStudentsResponse(
            students=students,
            total_count=len(students)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error identifying at-risk students: {str(e)}"
        )


@router.post("/subjects/difficulty", response_model=SubjectDifficultyResponse)
def get_subject_difficulty_analysis(
    request: SubjectDifficultyRequest,
    db: Session = Depends(get_db)
) -> SubjectDifficultyResponse:
    try:
        ml_repo = MLRepository(db)
        subjects = ml_repo.get_subject_difficulty_analysis(
            institution_id=request.institution_id,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        subject_difficulties = [SubjectDifficulty(**subject) for subject in subjects]
        
        return SubjectDifficultyResponse(
            subjects=subject_difficulties,
            total_count=len(subject_difficulties)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing subject difficulty: {str(e)}"
        )


@router.post("/training/prepare", response_model=TrainingDataResponse)
def prepare_training_dataset(
    request: TrainingDataRequest,
    db: Session = Depends(get_db)
) -> TrainingDataResponse:
    try:
        ml_repo = MLRepository(db)
        dataset = ml_repo.prepare_training_dataset(
            institution_id=request.institution_id,
            target_column=request.target_column,
            start_date=request.start_date,
            end_date=request.end_date,
            test_size=request.test_size,
            val_size=request.val_size,
            normalize=request.normalize,
            normalization_method=request.normalization_method,
            handle_missing=request.handle_missing,
            missing_strategy=request.missing_strategy,
            random_state=request.random_state
        )
        
        train_size = len(dataset['X_train'])
        test_size = len(dataset['X_test'])
        val_size = len(dataset.get('X_val', [])) if 'X_val' in dataset else 0
        
        quality_report = DataQualityReport(**dataset['quality_report'])
        
        return TrainingDataResponse(
            train_size=train_size,
            test_size=test_size,
            val_size=val_size if val_size > 0 else None,
            feature_count=len(dataset['feature_names']),
            feature_names=dataset['feature_names'],
            quality_report=quality_report,
            message=f"Training dataset prepared successfully with {train_size} training samples"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error preparing training dataset: {str(e)}"
        )


@router.post("/features/extract", response_model=FeatureMatrixResponse)
def extract_feature_matrix(
    request: FeatureMatrixRequest,
    db: Session = Depends(get_db)
) -> FeatureMatrixResponse:
    try:
        ml_repo = MLRepository(db)
        features = ml_repo.get_feature_matrix(
            institution_id=request.institution_id,
            student_ids=request.student_ids,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        if not features:
            return FeatureMatrixResponse(
                features=[],
                feature_names=[],
                student_count=0
            )
        
        feature_names = list(features[0].keys()) if features else []
        
        return FeatureMatrixResponse(
            features=features,
            feature_names=feature_names,
            student_count=len(features)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting feature matrix: {str(e)}"
        )
