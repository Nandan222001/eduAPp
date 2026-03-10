# Machine Learning Module

This module provides AI/ML infrastructure for student performance analysis and prediction in the educational platform.

## Overview

The ML module consists of several components:

1. **Data Pipeline** (`data_pipeline.py`) - Extracts student performance data from the database
2. **Feature Engineering** (`feature_engineering.py`) - Creates features from raw data
3. **Data Preparation** (`data_preparation.py`) - Prepares data for ML model training
4. **ML Service** (`ml_service.py`) - High-level service for ML operations
5. **Utilities** (`utils.py`) - Helper functions for ML operations
6. **Configuration** (`config.py`) - ML module configuration

## Features

### Data Extraction

The data pipeline extracts the following data:

- **Student Data**: Basic student information
- **Attendance Data**: Student attendance records with status
- **Assignment Data**: Assignment submissions and scores
- **Exam Data**: Exam marks and performance

### Feature Engineering

The module creates the following features:

#### Attendance Features
- Overall attendance percentage
- Subject-wise attendance percentage
- Attendance trends over time

#### Assignment Features
- Average assignment score
- Assignment submission rate
- Late submission rate
- Subject-wise assignment performance
- Chapter-wise assignment performance

#### Exam Features
- Average exam score
- Exam pass rate
- Exam count
- Exam trend slope (improving/declining)
- Recent exam average
- Subject-wise exam performance
- Exam type-wise performance (unit, mid-term, final)

#### Derived Features
- Test trends and slopes
- Chapter-wise performance metrics

### Data Validation

The module includes data validation for:

- Required columns check
- Numeric range validation
- Percentage column validation (0-100)
- Data quality reporting

### Training Data Preparation

Features include:

- Train/validation/test splits
- Missing value handling (mean, median, mode strategies)
- Feature normalization (standard, min-max scaling)
- Time-series splits for temporal data
- Rolling window splits

## Usage Examples

### Extract Student Performance Summary

```python
from src.ml.ml_service import MLService
from src.database import get_db

db = next(get_db())
ml_service = MLService(db)

summary = ml_service.get_student_performance_summary(
    institution_id=1,
    student_id=100,
    start_date=date(2024, 1, 1),
    end_date=date(2024, 12, 31)
)
```

### Identify At-Risk Students

```python
at_risk = ml_service.identify_at_risk_students(
    institution_id=1,
    attendance_threshold=75.0,
    assignment_threshold=60.0,
    exam_threshold=50.0
)
```

### Prepare Training Dataset

```python
dataset = ml_service.prepare_training_dataset(
    institution_id=1,
    test_size=0.2,
    val_size=0.1,
    normalize=True,
    normalization_method='standard',
    handle_missing=True,
    missing_strategy='mean'
)

X_train = dataset['X_train']
X_test = dataset['X_test']
y_train = dataset['y_train']
y_test = dataset['y_test']
```

### Get Feature Matrix

```python
features = ml_service.extract_and_prepare_features(
    institution_id=1,
    student_ids=[100, 101, 102],
    start_date=date(2024, 1, 1),
    end_date=date(2024, 12, 31)
)
```

## API Endpoints

The ML module exposes the following endpoints:

### POST /api/v1/ml/performance/summary
Get detailed performance summary for a student.

### POST /api/v1/ml/performance/batch
Get performance data for multiple students.

### POST /api/v1/ml/students/at-risk
Identify students at risk of poor performance.

### POST /api/v1/ml/subjects/difficulty
Analyze subject difficulty based on student performance.

### POST /api/v1/ml/training/prepare
Prepare training dataset with proper validation splits.

### POST /api/v1/ml/features/extract
Extract feature matrix for students.

## Configuration

Configuration options are available in `config.py`:

```python
ml_config = MLConfig(
    random_state=42,
    test_size=0.2,
    val_size=0.1,
    attendance_threshold=75.0,
    assignment_threshold=60.0,
    exam_threshold=50.0
)
```

## Data Quality

The module provides comprehensive data quality reporting:

- Total rows and columns
- Missing value counts and percentages
- Duplicate row detection
- Numeric and categorical column identification
- Statistical summaries for numeric columns

## Performance Metrics

Available performance metrics:

- Attendance percentage
- Assignment scores and submission rates
- Exam scores and pass rates
- Performance trends
- Consistency scores
- Improvement rates
- Performance indices

## Future Enhancements

Potential future features:

1. Predictive models for performance forecasting
2. Automated intervention recommendations
3. Personalized learning path suggestions
4. Anomaly detection for unusual patterns
5. Clustering for student grouping
6. Time series forecasting
7. Natural language processing for feedback analysis
8. Deep learning models for advanced predictions

## Dependencies

The module uses the following ML libraries:

- **scikit-learn**: Machine learning algorithms and preprocessing
- **pandas**: Data manipulation and analysis
- **numpy**: Numerical computations
- **joblib**: Model persistence

## Best Practices

1. Always validate data before feature engineering
2. Handle missing values appropriately
3. Normalize features for better model performance
4. Use proper train/validation/test splits
5. Monitor data quality metrics
6. Save preprocessing pipelines for consistency
7. Document feature engineering decisions
8. Version control ML models and pipelines
