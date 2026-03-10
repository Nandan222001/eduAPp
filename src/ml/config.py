from typing import Dict, Any
from pydantic import BaseModel, Field


class MLConfig(BaseModel):
    random_state: int = Field(default=42)
    test_size: float = Field(default=0.2, ge=0.1, le=0.5)
    val_size: float = Field(default=0.1, ge=0.0, le=0.3)
    
    normalization_method: str = Field(default='standard')
    missing_value_strategy: str = Field(default='mean')
    
    attendance_threshold: float = Field(default=75.0, ge=0, le=100)
    assignment_threshold: float = Field(default=60.0, ge=0, le=100)
    exam_threshold: float = Field(default=50.0, ge=0, le=100)
    
    min_data_points: int = Field(default=5)
    max_features: int = Field(default=100)
    
    model_storage_path: str = Field(default='models/')
    predictions_storage_path: str = Field(default='predictions/')
    
    trend_window_size: int = Field(default=3)
    moving_average_window: int = Field(default=3)
    
    outlier_detection_method: str = Field(default='iqr')
    outlier_iqr_multiplier: float = Field(default=1.5)
    outlier_zscore_threshold: float = Field(default=3.0)
    
    feature_importance_top_n: int = Field(default=10)


class FeatureConfig(BaseModel):
    attendance_features: Dict[str, bool] = Field(default={
        'overall_percentage': True,
        'subject_wise': True,
        'monthly_trend': True
    })
    
    assignment_features: Dict[str, bool] = Field(default={
        'avg_score': True,
        'submission_rate': True,
        'late_submission_rate': True,
        'subject_wise': True,
        'chapter_wise': True
    })
    
    exam_features: Dict[str, bool] = Field(default={
        'avg_score': True,
        'pass_rate': True,
        'trend_slope': True,
        'subject_wise': True,
        'exam_type_wise': True
    })
    
    derived_features: Dict[str, bool] = Field(default={
        'performance_index': True,
        'consistency_score': True,
        'improvement_rate': True,
        'risk_score': True
    })


class RiskAssessmentConfig(BaseModel):
    low_attendance_weight: float = Field(default=0.3)
    low_assignment_weight: float = Field(default=0.3)
    low_exam_weight: float = Field(default=0.3)
    declining_trend_weight: float = Field(default=0.1)
    
    risk_levels: Dict[str, Dict[str, float]] = Field(default={
        'critical': {'min_score': 80, 'color': 'red'},
        'high': {'min_score': 60, 'color': 'orange'},
        'medium': {'min_score': 40, 'color': 'yellow'},
        'low': {'min_score': 20, 'color': 'green'},
        'minimal': {'min_score': 0, 'color': 'blue'}
    })


class ModelTrainingConfig(BaseModel):
    model_type: str = Field(default='random_forest')
    
    random_forest_params: Dict[str, Any] = Field(default={
        'n_estimators': 100,
        'max_depth': 10,
        'min_samples_split': 5,
        'min_samples_leaf': 2,
        'random_state': 42
    })
    
    gradient_boosting_params: Dict[str, Any] = Field(default={
        'n_estimators': 100,
        'learning_rate': 0.1,
        'max_depth': 5,
        'random_state': 42
    })
    
    logistic_regression_params: Dict[str, Any] = Field(default={
        'C': 1.0,
        'max_iter': 1000,
        'random_state': 42
    })
    
    neural_network_params: Dict[str, Any] = Field(default={
        'hidden_layer_sizes': (100, 50),
        'activation': 'relu',
        'solver': 'adam',
        'alpha': 0.0001,
        'batch_size': 'auto',
        'learning_rate': 'constant',
        'max_iter': 500,
        'random_state': 42
    })
    
    cross_validation_folds: int = Field(default=5)
    early_stopping_patience: int = Field(default=10)
    performance_metric: str = Field(default='accuracy')


ml_config = MLConfig()
feature_config = FeatureConfig()
risk_assessment_config = RiskAssessmentConfig()
model_training_config = ModelTrainingConfig()
