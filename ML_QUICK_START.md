# ML Infrastructure Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
# Using Poetry (recommended)
poetry install

# The following ML packages will be installed:
# - scikit-learn ^1.4.0
# - pandas ^2.2.0
# - numpy ^1.26.0
# - joblib ^1.3.2
```

### 2. Verify Installation

```bash
# Start Python shell
poetry run python

# Test imports
>>> from src.ml.ml_service import MLService
>>> from src.ml.data_pipeline import StudentPerformanceDataPipeline
>>> from src.ml.feature_engineering import StudentFeatureEngineering
>>> print("ML infrastructure ready!")
```

## Basic Usage

### 1. Student Performance Summary

```python
from src.database import get_db
from src.ml.ml_service import MLService
from datetime import date

db = next(get_db())
ml_service = MLService(db)

summary = ml_service.get_student_performance_summary(
    institution_id=1,
    student_id=100,
    start_date=date(2024, 1, 1),
    end_date=date(2024, 12, 31)
)

print(f"Attendance: {summary.get('attendance_percentage', 0)}%")
print(f"Assignment Stats: {summary.get('assignment_stats', {})}")
print(f"Exam Stats: {summary.get('exam_stats', {})}")
```

### 2. Identify At-Risk Students

```python
at_risk = ml_service.identify_at_risk_students(
    institution_id=1,
    attendance_threshold=75.0,
    assignment_threshold=60.0,
    exam_threshold=50.0
)

for student in at_risk:
    print(f"Student {student['student_id']}: Risk Score {student['risk_score']}")
    print(f"Factors: {student['risk_factors']}")
```

### 3. Prepare Training Data

```python
dataset = ml_service.prepare_training_dataset(
    institution_id=1,
    test_size=0.2,
    val_size=0.1,
    normalize=True
)

print(f"Training samples: {len(dataset['X_train'])}")
print(f"Features: {len(dataset['feature_names'])}")
```

## API Usage

### 1. Start the Server

```bash
poetry run uvicorn src.main:app --reload
```

### 2. Access API Documentation

Open browser: http://localhost:8000/docs

### 3. Example API Calls

**Get Student Performance Summary:**

```bash
curl -X POST "http://localhost:8000/api/v1/ml/performance/summary" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "student_id": 100,
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }'
```

**Identify At-Risk Students:**

```bash
curl -X POST "http://localhost:8000/api/v1/ml/students/at-risk" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "attendance_threshold": 75.0,
    "assignment_threshold": 60.0,
    "exam_threshold": 50.0
  }'
```

**Extract Feature Matrix:**

```bash
curl -X POST "http://localhost:8000/api/v1/ml/features/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "student_ids": [100, 101, 102]
  }'
```

## Available Features

### Attendance Features
- Overall attendance percentage
- Subject-wise attendance percentages
- Attendance trends

### Assignment Features
- Average assignment scores
- Submission rates
- Late submission rates
- Subject-wise and chapter-wise performance

### Exam Features
- Average exam scores
- Pass rates
- Performance trends (improving/declining)
- Subject-wise and exam-type performance

## Configuration

Edit `src/ml/config.py` to customize:

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

## Common Operations

### Extract All Student Data

```python
from src.ml.data_pipeline import StudentPerformanceDataPipeline

pipeline = StudentPerformanceDataPipeline(db)
data = pipeline.extract_all_data(institution_id=1)

print(f"Students: {len(data['students'])}")
print(f"Attendance: {len(data['attendance'])}")
print(f"Assignments: {len(data['assignments'])}")
print(f"Exams: {len(data['exams'])}")
```

### Build Feature Matrix

```python
from src.ml.feature_engineering import StudentFeatureEngineering

engineer = StudentFeatureEngineering()
features = engineer.build_feature_matrix(data)

print(f"Feature matrix shape: {features.shape}")
print(f"Columns: {features.columns.tolist()}")
```

### Validate Data Quality

```python
from src.ml.data_preparation import DataValidator

validator = DataValidator()
report = validator.check_data_quality(features)

print(f"Total rows: {report['total_rows']}")
print(f"Missing values: {report['missing_values']}")
```

## Run Examples

```bash
# Run the usage examples script
poetry run python examples/ml_usage_examples.py
```

## Troubleshooting

### Import Errors

```bash
# Ensure dependencies are installed
poetry install

# Verify Python path
poetry run python -c "import sys; print(sys.path)"
```

### Database Connection Issues

```bash
# Check database configuration
poetry run python -c "from src.config import settings; print(settings.database_url)"

# Test database connection
poetry run python -c "from src.database import get_db; db = next(get_db()); print('Connected')"
```

### No Data Available

```bash
# Ensure you have data in the database
# Run migrations if needed
poetry run alembic upgrade head

# Check data exists
poetry run python -c "from src.database import get_db; from src.models.student import Student; db = next(get_db()); print(db.query(Student).count())"
```

## Next Steps

1. Explore the full documentation: `src/ml/README.md`
2. Review implementation details: `ML_IMPLEMENTATION.md`
3. Run example scripts: `examples/ml_usage_examples.py`
4. Build custom ML models using the prepared data
5. Integrate predictions into the application

## Support

For questions or issues:
1. Check the documentation files
2. Review example code
3. Examine test cases (when available)
4. Consult the API documentation at `/docs`
