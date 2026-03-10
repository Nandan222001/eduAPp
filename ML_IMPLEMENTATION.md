# AI/ML Infrastructure Implementation

## Overview

This document describes the implementation of the AI/ML infrastructure foundation for the educational platform. The implementation focuses on student performance analysis, feature engineering, and data preparation for machine learning models.

## Implementation Summary

### 1. Module Structure

Created a comprehensive ML module under `src/ml/` with the following components:

```
src/ml/
├── __init__.py
├── data_pipeline.py          # Data extraction from database
├── feature_engineering.py     # Feature creation and transformation
├── data_preparation.py        # Data validation and preparation
├── ml_service.py             # High-level ML service
├── utils.py                  # ML utility functions
├── config.py                 # ML configuration
└── README.md                 # Module documentation
```

### 2. Dependencies Added

Updated `pyproject.toml` with ML dependencies:

- **scikit-learn** (^1.4.0) - Machine learning algorithms and preprocessing
- **pandas** (^2.2.0) - Data manipulation and analysis
- **numpy** (^1.26.0) - Numerical computations
- **joblib** (^1.3.2) - Model persistence

### 3. Data Pipeline (`data_pipeline.py`)

#### StudentPerformanceDataPipeline Class

Extracts student performance data from the database:

**Methods:**
- `extract_student_data()` - Basic student information
- `extract_attendance_data()` - Attendance records with status
- `extract_assignment_data()` - Assignment submissions and scores
- `extract_exam_data()` - Exam marks and performance
- `extract_all_data()` - All data in one call

**Features:**
- Supports date range filtering
- Supports student ID filtering
- Returns pandas DataFrames for easy manipulation
- Handles multiple subjects, chapters, and exam types

### 4. Feature Engineering (`feature_engineering.py`)

#### StudentFeatureEngineering Class

Creates features from raw performance data:

**Attendance Features:**
- `calculate_attendance_percentage()` - Overall attendance
- `calculate_subject_wise_attendance()` - Per subject attendance

**Assignment Features:**
- `calculate_assignment_scores()` - Average scores, submission rates
- `calculate_subject_wise_assignment_scores()` - Per subject performance
- `calculate_chapter_wise_performance()` - Per chapter performance

**Exam Features:**
- `calculate_exam_performance()` - Average scores, pass rates
- `calculate_subject_wise_exam_performance()` - Per subject exam scores
- `calculate_test_trends()` - Trend analysis with slope calculation
- `calculate_exam_type_performance()` - Performance by exam type

**Feature Matrix:**
- `build_feature_matrix()` - Combines all features into a single DataFrame

### 5. Data Preparation (`data_preparation.py`)

#### DataValidator Class

Validates data quality:

- `validate_dataframe()` - Check required columns
- `validate_numeric_range()` - Validate numeric ranges
- `validate_percentage_columns()` - Ensure 0-100 range
- `check_data_quality()` - Comprehensive quality report

#### TrainingDataPreparation Class

Prepares data for ML model training:

**Features:**
- Missing value handling (mean, median, mode strategies)
- Feature normalization (standard scaling, min-max scaling)
- Train/validation/test splits
- Feature selection and filtering
- Pipeline persistence (save/load preprocessing steps)

**Methods:**
- `prepare_features()` - Extract features and target
- `handle_missing_values()` - Impute missing data
- `normalize_features()` - Scale features
- `create_validation_splits()` - Create train/val/test sets
- `prepare_training_data()` - Complete preparation pipeline
- `prepare_inference_data()` - Prepare new data for predictions

#### TimeSeriesSplit Class

Temporal data splitting:

- `create_temporal_split()` - Split based on time periods
- `create_rolling_window_split()` - Rolling window splits

### 6. ML Service (`ml_service.py`)

#### MLService Class

High-level service orchestrating ML operations:

**Core Methods:**
- `extract_and_prepare_features()` - Extract and engineer features
- `prepare_training_dataset()` - Complete training data preparation
- `get_student_performance_summary()` - Individual student analysis
- `get_batch_performance_summary()` - Batch student analysis
- `identify_at_risk_students()` - Risk assessment
- `get_subject_difficulty_analysis()` - Subject difficulty analysis

### 7. Utilities (`utils.py`)

#### MLUtils Class

General ML utility functions:

- `safe_divide()` - Safe division with default values
- `calculate_percentile()` - Percentile calculations
- `calculate_z_score()` - Z-score normalization
- `categorize_score()` - Score categorization
- `detect_outliers_iqr()` - IQR-based outlier detection
- `detect_outliers_zscore()` - Z-score outlier detection
- `smooth_time_series()` - Time series smoothing
- `calculate_moving_average()` - Moving average calculation
- `calculate_trend()` - Trend analysis with linear regression

#### ModelPersistence Class

Model and prediction persistence:

- `save_model()` - Save ML models with metadata
- `load_model()` - Load saved models
- `save_predictions()` - Save predictions to CSV

#### FeatureImportanceAnalyzer Class

Feature importance analysis:

- `calculate_feature_importance()` - Extract feature importance
- `get_top_features()` - Get top N important features

#### DataAggregator Class

Data aggregation utilities:

- `aggregate_by_time_period()` - Temporal aggregation
- `aggregate_by_group()` - Group-based aggregation
- `pivot_performance_data()` - Pivot table creation

#### PerformanceMetrics Class

Performance metric calculations:

- `calculate_improvement_rate()` - Score improvement rate
- `calculate_consistency_score()` - Performance consistency
- `calculate_performance_index()` - Weighted performance index

### 8. Configuration (`config.py`)

#### MLConfig

General ML configuration:

- Random state, test/validation sizes
- Normalization methods
- Thresholds for attendance, assignments, exams
- Storage paths for models and predictions

#### FeatureConfig

Feature selection configuration:

- Enable/disable specific feature groups
- Attendance, assignment, exam features
- Derived features

#### RiskAssessmentConfig

Risk assessment configuration:

- Risk factor weights
- Risk level definitions

#### ModelTrainingConfig

Model training parameters:

- Model types (Random Forest, Gradient Boosting, etc.)
- Hyperparameters for each model type
- Cross-validation settings

### 9. API Integration

#### Schemas (`src/schemas/ml_schemas.py`)

Pydantic models for API requests/responses:

- `PerformanceSummaryRequest/Response`
- `BatchPerformanceRequest`
- `AtRiskStudentsRequest/Response`
- `SubjectDifficultyRequest/Response`
- `TrainingDataRequest/Response`
- `FeatureMatrixRequest/Response`

#### Repository (`src/repositories/ml_repository.py`)

MLRepository class providing data access layer:

- `get_student_performance_summary()`
- `get_batch_performance()`
- `identify_at_risk_students()`
- `get_subject_difficulty_analysis()`
- `prepare_training_dataset()`
- `get_feature_matrix()`

#### API Endpoints (`src/api/ml.py`)

RESTful endpoints for ML operations:

- `POST /api/v1/ml/performance/summary` - Student performance summary
- `POST /api/v1/ml/performance/batch` - Batch performance analysis
- `POST /api/v1/ml/students/at-risk` - Identify at-risk students
- `POST /api/v1/ml/subjects/difficulty` - Subject difficulty analysis
- `POST /api/v1/ml/training/prepare` - Prepare training dataset
- `POST /api/v1/ml/features/extract` - Extract feature matrix

### 10. Git Configuration

Updated `.gitignore` to exclude ML artifacts:

```gitignore
# ML/AI models and artifacts
models/
*.pkl
*.joblib
*.h5
*.pt
*.pth
*.onnx
predictions/
feature_importance/
model_checkpoints/
*.npy
*.npz
```

## Key Features

### 1. Data Extraction Pipeline

- Extracts data from SQLAlchemy models
- Supports filtering by date range and student IDs
- Returns clean pandas DataFrames
- Handles all performance metrics (attendance, assignments, exams)

### 2. Feature Engineering

- **Attendance Features:**
  - Overall percentage: Total attendance across all subjects
  - Subject-wise: Individual subject attendance tracking
  
- **Assignment Features:**
  - Average scores: Performance across assignments
  - Submission rate: Percentage of assignments submitted
  - Late submission rate: Timeliness tracking
  - Subject-wise and chapter-wise breakdowns

- **Exam Features:**
  - Average scores: Overall exam performance
  - Pass rate: Percentage of exams passed
  - Trend analysis: Performance trajectory
  - Subject-wise and exam-type breakdowns

- **Chapter-wise Performance:**
  - Granular tracking of performance by chapter
  - Identifies weak areas for targeted intervention

### 3. Data Validation

- Comprehensive quality checks
- Missing value detection and reporting
- Duplicate detection
- Statistical summaries
- Range validation for percentages

### 4. Training Data Preparation

- **Train/Validation/Test Splits:**
  - Configurable split ratios
  - Stratified splitting support
  - Temporal splitting for time-series data

- **Data Preprocessing:**
  - Missing value imputation (mean, median, mode)
  - Feature normalization (standard, min-max)
  - Feature selection and filtering

- **Pipeline Persistence:**
  - Save preprocessing pipelines
  - Ensure consistency between training and inference

### 5. Risk Assessment

Identifies at-risk students based on:

- Low attendance (< 75% configurable)
- Low assignment scores (< 60% configurable)
- Low exam scores (< 50% configurable)
- Declining performance trends

Risk scoring system with multiple factors.

### 6. Subject Difficulty Analysis

Analyzes subject difficulty based on:

- Average assignment scores per subject
- Average exam scores per subject
- Categorization: high, medium, low difficulty

## Usage Examples

### Installation

```bash
# Install dependencies
poetry install

# Or with pip
pip install scikit-learn pandas numpy joblib
```

### Extract Student Performance

```python
from src.database import get_db
from src.ml.ml_service import MLService
from datetime import date

db = next(get_db())
ml_service = MLService(db)

# Get individual student summary
summary = ml_service.get_student_performance_summary(
    institution_id=1,
    student_id=100,
    start_date=date(2024, 1, 1),
    end_date=date(2024, 12, 31)
)

print(f"Attendance: {summary['attendance_percentage']}%")
print(f"Assignment Stats: {summary['assignment_stats']}")
print(f"Exam Stats: {summary['exam_stats']}")
```

### Identify At-Risk Students

```python
at_risk = ml_service.identify_at_risk_students(
    institution_id=1,
    attendance_threshold=75.0,
    assignment_threshold=60.0,
    exam_threshold=50.0
)

for student in at_risk:
    print(f"Student {student['student_id']}: Risk Score {student['risk_score']}")
    print(f"Risk Factors: {student['risk_factors']}")
```

### Prepare Training Dataset

```python
dataset = ml_service.prepare_training_dataset(
    institution_id=1,
    test_size=0.2,
    val_size=0.1,
    normalize=True,
    normalization_method='standard'
)

X_train = dataset['X_train']
X_val = dataset['X_val']
X_test = dataset['X_test']
y_train = dataset['y_train']
y_val = dataset['y_val']
y_test = dataset['y_test']

print(f"Training samples: {len(X_train)}")
print(f"Validation samples: {len(X_val)}")
print(f"Test samples: {len(X_test)}")
print(f"Features: {dataset['feature_names']}")
```

### API Usage

```bash
# Get student performance summary
curl -X POST "http://localhost:8000/api/v1/ml/performance/summary" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "student_id": 100,
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }'

# Identify at-risk students
curl -X POST "http://localhost:8000/api/v1/ml/students/at-risk" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "attendance_threshold": 75.0,
    "assignment_threshold": 60.0,
    "exam_threshold": 50.0
  }'

# Prepare training dataset
curl -X POST "http://localhost:8000/api/v1/ml/training/prepare" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "test_size": 0.2,
    "val_size": 0.1,
    "normalize": true
  }'
```

## Data Flow

```
Database (SQLAlchemy Models)
    ↓
Data Pipeline (StudentPerformanceDataPipeline)
    ↓
Raw Data (pandas DataFrames)
    ↓
Feature Engineering (StudentFeatureEngineering)
    ↓
Feature Matrix (Combined Features)
    ↓
Data Validation (DataValidator)
    ↓
Data Preparation (TrainingDataPreparation)
    ↓
Training Data (X_train, X_val, X_test, y_train, y_val, y_test)
    ↓
ML Models (Future: Training & Prediction)
```

## Future Enhancements

1. **Predictive Models:**
   - Student performance prediction
   - Dropout risk prediction
   - Grade prediction
   - Course recommendation

2. **Advanced Analytics:**
   - Clustering for student grouping
   - Anomaly detection
   - Learning style identification
   - Personalized learning paths

3. **Deep Learning:**
   - Neural networks for complex patterns
   - LSTM for time series prediction
   - Attention mechanisms for feature importance

4. **Natural Language Processing:**
   - Feedback sentiment analysis
   - Essay grading
   - Question difficulty estimation

5. **Recommendation Systems:**
   - Study material recommendations
   - Tutor recommendations
   - Course recommendations

6. **Real-time Predictions:**
   - Live performance monitoring
   - Early warning system
   - Intervention triggers

## Testing

To test the ML infrastructure:

```bash
# Run tests (when implemented)
poetry run pytest tests/ml/

# Test individual components
python -c "from src.ml.data_pipeline import StudentPerformanceDataPipeline; print('Pipeline imported successfully')"
python -c "from src.ml.feature_engineering import StudentFeatureEngineering; print('Feature engineering imported successfully')"
python -c "from src.ml.data_preparation import TrainingDataPreparation; print('Data preparation imported successfully')"
```

## Documentation

- Module README: `src/ml/README.md`
- API Documentation: Available at `/docs` when server is running
- This Implementation Guide: `ML_IMPLEMENTATION.md`

## Conclusion

This implementation provides a solid foundation for AI/ML capabilities in the educational platform. The modular design allows for easy extension and integration of additional ML models and features. The data pipeline, feature engineering, and preparation components are production-ready and can be used to build sophisticated prediction and analysis systems.
