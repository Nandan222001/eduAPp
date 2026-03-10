from datetime import date
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from src.database import get_db
from src.ml.ml_service import MLService
from src.ml.data_pipeline import StudentPerformanceDataPipeline
from src.ml.feature_engineering import StudentFeatureEngineering
from src.ml.data_preparation import TrainingDataPreparation


def example_extract_student_data(db: Session, institution_id: int, student_id: int) -> None:
    print("=" * 80)
    print("Example 1: Extract Student Performance Data")
    print("=" * 80)
    
    ml_service = MLService(db)
    
    summary = ml_service.get_student_performance_summary(
        institution_id=institution_id,
        student_id=student_id,
        start_date=date(2024, 1, 1),
        end_date=date(2024, 12, 31)
    )
    
    print(f"\nStudent ID: {summary['student_id']}")
    
    if 'attendance_percentage' in summary:
        print(f"Attendance Percentage: {summary['attendance_percentage']:.2f}%")
    
    if 'assignment_stats' in summary:
        print("\nAssignment Statistics:")
        stats = summary['assignment_stats']
        print(f"  Average Score: {stats.get('avg_assignment_score', 0):.2f}%")
        print(f"  Submission Rate: {stats.get('assignment_submission_rate', 0):.2f}%")
        print(f"  Late Submission Rate: {stats.get('late_submission_rate', 0):.2f}%")
        print(f"  Total Assignments: {stats.get('assignment_count', 0)}")
    
    if 'exam_stats' in summary:
        print("\nExam Statistics:")
        stats = summary['exam_stats']
        print(f"  Average Score: {stats.get('avg_exam_score', 0):.2f}%")
        print(f"  Exam Pass Rate: {stats.get('exam_pass_rate', 0):.2f}%")
        print(f"  Total Exams: {stats.get('exam_count', 0)}")
    
    if 'exam_trends' in summary:
        print("\nPerformance Trends:")
        trends = summary['exam_trends']
        print(f"  Trend Slope: {trends.get('exam_trend_slope', 0):.2f}")
        print(f"  Recent Exam Average: {trends.get('recent_exam_avg', 0):.2f}%")


def example_identify_at_risk_students(db: Session, institution_id: int) -> None:
    print("\n" + "=" * 80)
    print("Example 2: Identify At-Risk Students")
    print("=" * 80)
    
    ml_service = MLService(db)
    
    at_risk_students = ml_service.identify_at_risk_students(
        institution_id=institution_id,
        attendance_threshold=75.0,
        assignment_threshold=60.0,
        exam_threshold=50.0
    )
    
    print(f"\nTotal At-Risk Students: {len(at_risk_students)}")
    
    for i, student in enumerate(at_risk_students[:5], 1):
        print(f"\n{i}. Student ID: {student['student_id']}")
        print(f"   Risk Score: {student['risk_score']}/4")
        print(f"   Risk Factors: {', '.join(student['risk_factors'])}")
        print(f"   Attendance: {student['attendance_percentage']:.2f}%")
        print(f"   Assignment Score: {student['avg_assignment_score']:.2f}%")
        print(f"   Exam Score: {student['avg_exam_score']:.2f}%")


def example_subject_difficulty_analysis(db: Session, institution_id: int) -> None:
    print("\n" + "=" * 80)
    print("Example 3: Subject Difficulty Analysis")
    print("=" * 80)
    
    ml_service = MLService(db)
    
    subjects = ml_service.get_subject_difficulty_analysis(
        institution_id=institution_id
    )
    
    print(f"\nTotal Subjects Analyzed: {len(subjects)}")
    
    for subject in subjects:
        print(f"\nSubject ID: {subject['subject_id']}")
        print(f"  Difficulty Level: {subject['difficulty_level'].upper()}")
        if 'avg_assignment_score' in subject:
            print(f"  Avg Assignment Score: {subject['avg_assignment_score']:.2f}%")
        if 'avg_exam_score' in subject:
            print(f"  Avg Exam Score: {subject['avg_exam_score']:.2f}%")


def example_prepare_training_data(db: Session, institution_id: int) -> None:
    print("\n" + "=" * 80)
    print("Example 4: Prepare Training Dataset")
    print("=" * 80)
    
    ml_service = MLService(db)
    
    dataset = ml_service.prepare_training_dataset(
        institution_id=institution_id,
        test_size=0.2,
        val_size=0.1,
        normalize=True,
        normalization_method='standard',
        handle_missing=True,
        missing_strategy='mean'
    )
    
    print(f"\nDataset Prepared Successfully!")
    print(f"Training Samples: {len(dataset['X_train'])}")
    print(f"Validation Samples: {len(dataset.get('X_val', []))}")
    print(f"Test Samples: {len(dataset['X_test'])}")
    print(f"Number of Features: {len(dataset['feature_names'])}")
    
    print(f"\nFirst 10 Features:")
    for i, feature in enumerate(dataset['feature_names'][:10], 1):
        print(f"  {i}. {feature}")
    
    quality_report = dataset['quality_report']
    print(f"\nData Quality Report:")
    print(f"  Total Rows: {quality_report['total_rows']}")
    print(f"  Total Columns: {quality_report['total_columns']}")
    print(f"  Duplicate Rows: {quality_report['duplicate_rows']}")
    print(f"  Numeric Columns: {len(quality_report['numeric_columns'])}")


def example_batch_performance(db: Session, institution_id: int, student_ids: List[int]) -> None:
    print("\n" + "=" * 80)
    print("Example 5: Batch Performance Analysis")
    print("=" * 80)
    
    ml_service = MLService(db)
    
    features = ml_service.get_batch_performance_summary(
        institution_id=institution_id,
        student_ids=student_ids
    )
    
    print(f"\nAnalyzed {len(features)} students")
    
    if not features.empty:
        print(f"\nFeature Matrix Shape: {features.shape}")
        print(f"Columns: {features.columns.tolist()[:10]}...")
        
        if 'attendance_percentage' in features.columns:
            avg_attendance = features['attendance_percentage'].mean()
            print(f"\nAverage Attendance: {avg_attendance:.2f}%")
        
        if 'avg_assignment_score' in features.columns:
            avg_assignment = features['avg_assignment_score'].mean()
            print(f"Average Assignment Score: {avg_assignment:.2f}%")
        
        if 'avg_exam_score' in features.columns:
            avg_exam = features['avg_exam_score'].mean()
            print(f"Average Exam Score: {avg_exam:.2f}%")


def example_feature_engineering(db: Session, institution_id: int) -> None:
    print("\n" + "=" * 80)
    print("Example 6: Custom Feature Engineering")
    print("=" * 80)
    
    pipeline = StudentPerformanceDataPipeline(db)
    
    raw_data = pipeline.extract_all_data(
        institution_id=institution_id,
        start_date=date(2024, 1, 1),
        end_date=date(2024, 12, 31)
    )
    
    print(f"\nRaw Data Extracted:")
    print(f"  Students: {len(raw_data['students'])} records")
    print(f"  Attendance: {len(raw_data['attendance'])} records")
    print(f"  Assignments: {len(raw_data['assignments'])} records")
    print(f"  Exams: {len(raw_data['exams'])} records")
    
    feature_engineer = StudentFeatureEngineering()
    
    if not raw_data['attendance'].empty:
        attendance_features = feature_engineer.calculate_attendance_percentage(
            raw_data['attendance']
        )
        print(f"\nAttendance Features: {len(attendance_features)} students")
    
    if not raw_data['assignments'].empty:
        assignment_features = feature_engineer.calculate_assignment_scores(
            raw_data['assignments']
        )
        print(f"Assignment Features: {len(assignment_features)} students")
    
    if not raw_data['exams'].empty:
        exam_features = feature_engineer.calculate_exam_performance(
            raw_data['exams']
        )
        print(f"Exam Features: {len(exam_features)} students")
    
    feature_matrix = feature_engineer.build_feature_matrix(raw_data)
    print(f"\nFull Feature Matrix: {feature_matrix.shape}")


def example_data_validation(db: Session, institution_id: int) -> None:
    print("\n" + "=" * 80)
    print("Example 7: Data Validation and Quality Check")
    print("=" * 80)
    
    ml_service = MLService(db)
    
    features = ml_service.extract_and_prepare_features(
        institution_id=institution_id
    )
    
    from src.ml.data_preparation import DataValidator
    
    validator = DataValidator()
    quality_report = validator.check_data_quality(features)
    
    print(f"\nData Quality Report:")
    print(f"  Total Rows: {quality_report['total_rows']}")
    print(f"  Total Columns: {quality_report['total_columns']}")
    print(f"  Duplicate Rows: {quality_report['duplicate_rows']}")
    
    print(f"\nMissing Values (Top 5):")
    missing = quality_report['missing_values']
    sorted_missing = sorted(missing.items(), key=lambda x: x[1], reverse=True)[:5]
    for col, count in sorted_missing:
        pct = quality_report['missing_percentage'][col]
        print(f"  {col}: {count} ({pct:.2f}%)")
    
    print(f"\nNumeric Columns: {len(quality_report['numeric_columns'])}")
    print(f"Categorical Columns: {len(quality_report['categorical_columns'])}")


def main() -> None:
    print("ML Infrastructure Usage Examples")
    print("=" * 80)
    
    db = next(get_db())
    
    institution_id = 1
    student_id = 100
    student_ids = [100, 101, 102, 103, 104]
    
    try:
        example_extract_student_data(db, institution_id, student_id)
        example_identify_at_risk_students(db, institution_id)
        example_subject_difficulty_analysis(db, institution_id)
        example_prepare_training_data(db, institution_id)
        example_batch_performance(db, institution_id, student_ids)
        example_feature_engineering(db, institution_id)
        example_data_validation(db, institution_id)
        
        print("\n" + "=" * 80)
        print("All examples completed successfully!")
        print("=" * 80)
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()
