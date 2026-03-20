import pytest
from datetime import datetime, timedelta, date
from decimal import Decimal
from sqlalchemy import event, create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from io import BytesIO
from unittest.mock import MagicMock, patch
import random

from src.database import Base
from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.attendance import Attendance, AttendanceStatus
from src.models.assignment import Assignment, Submission, SubmissionFile, AssignmentStatus, SubmissionStatus
from src.models.gamification import UserPoints, LeaderboardEntry, Leaderboard, LeaderboardType, LeaderboardPeriod
from src.models.ml_prediction import PerformancePrediction, MLModel, MLModelVersion, ModelType, PredictionType, ModelStatus
from src.models.academic import AcademicYear, Grade, Section, Subject
from src.models.institution import Institution
from src.models.role import Role
from tests.factories import (
    create_test_institution,
    create_test_role,
    create_test_user,
    create_test_academic_year,
    create_test_grade,
    create_test_section,
    create_test_subject,
    create_test_student,
    create_test_teacher,
    create_test_attendance,
    create_test_assignment,
    create_bulk_students,
)


PERFORMANCE_THRESHOLDS = {
    'dashboard_aggregation': 0.200,
    'attendance_marking': 0.150,
    'assignment_submission': 0.250,
    'ai_prediction': 0.100,
    'leaderboard_generation': 0.300,
}


class QueryCounter:
    def __init__(self):
        self.count = 0
        self.queries = []
    
    def reset(self):
        self.count = 0
        self.queries = []
    
    def callback(self, conn, cursor, statement, parameters, context, executemany):
        self.count += 1
        self.queries.append({
            'statement': statement,
            'parameters': parameters,
            'executemany': executemany
        })


@pytest.fixture(scope='function')
def benchmark_db_session():
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    
    from sqlalchemy.orm import sessionmaker
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    query_counter = QueryCounter()
    event.listen(engine, "before_cursor_execute", query_counter.callback)
    
    session.query_counter = query_counter
    
    yield session
    
    event.remove(engine, "before_cursor_execute", query_counter.callback)
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def setup_institution_data(benchmark_db_session):
    institution = create_test_institution(benchmark_db_session, name="Benchmark School")
    
    admin_role = create_test_role(benchmark_db_session, name="Admin")
    student_role = create_test_role(benchmark_db_session, name="Student")
    teacher_role = create_test_role(benchmark_db_session, name="Teacher")
    
    academic_year = create_test_academic_year(benchmark_db_session, institution.id)
    grade = create_test_grade(benchmark_db_session, institution.id, academic_year.id, name="Grade 10")
    section = create_test_section(benchmark_db_session, institution.id, grade.id, name="Section A", capacity=50)
    subject = create_test_subject(benchmark_db_session, institution.id, name="Mathematics")
    
    teacher_user = create_test_user(
        benchmark_db_session,
        institution.id,
        teacher_role.id,
        username="teacher_benchmark",
        email="teacher@benchmark.com"
    )
    teacher = create_test_teacher(benchmark_db_session, institution.id, teacher_user.id)
    
    return {
        'institution': institution,
        'admin_role': admin_role,
        'student_role': student_role,
        'teacher_role': teacher_role,
        'academic_year': academic_year,
        'grade': grade,
        'section': section,
        'subject': subject,
        'teacher': teacher,
        'teacher_user': teacher_user,
    }


@pytest.fixture
def setup_students_500(benchmark_db_session, setup_institution_data):
    data = setup_institution_data
    students = create_bulk_students(
        benchmark_db_session,
        data['institution'].id,
        data['section'].id,
        count=500
    )
    
    for i, student in enumerate(students):
        user_points = UserPoints(
            institution_id=data['institution'].id,
            user_id=student.user_id if student.user_id else None,
            total_points=random.randint(100, 5000),
            level=random.randint(1, 20),
            experience_points=random.randint(0, 10000),
            current_streak=random.randint(0, 30),
            longest_streak=random.randint(0, 50),
            last_activity_date=datetime.utcnow() - timedelta(days=random.randint(0, 30))
        )
        benchmark_db_session.add(user_points)
        
        for j in range(random.randint(5, 15)):
            attendance_date = date.today() - timedelta(days=j)
            attendance = Attendance(
                institution_id=data['institution'].id,
                student_id=student.id,
                section_id=data['section'].id,
                subject_id=data['subject'].id,
                date=attendance_date,
                status=random.choice([AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE])
            )
            benchmark_db_session.add(attendance)
    
    benchmark_db_session.commit()
    data['students'] = students
    return data


@pytest.fixture
def setup_students_40(benchmark_db_session, setup_institution_data):
    data = setup_institution_data
    students = create_bulk_students(
        benchmark_db_session,
        data['institution'].id,
        data['section'].id,
        count=40
    )
    data['students'] = students
    return data


@pytest.fixture
def setup_students_1000(benchmark_db_session, setup_institution_data):
    data = setup_institution_data
    students = create_bulk_students(
        benchmark_db_session,
        data['institution'].id,
        data['section'].id,
        count=1000
    )
    
    for student in students:
        user_points = UserPoints(
            institution_id=data['institution'].id,
            user_id=student.user_id if student.user_id else None,
            total_points=random.randint(100, 10000),
            level=random.randint(1, 25),
            experience_points=random.randint(0, 15000),
            current_streak=random.randint(0, 50),
            longest_streak=random.randint(0, 100)
        )
        benchmark_db_session.add(user_points)
    
    benchmark_db_session.commit()
    data['students'] = students
    return data


@pytest.mark.benchmark(
    group="dashboard",
    min_rounds=5,
    timer=lambda: __import__('time').perf_counter,
    disable_gc=True,
    warmup=True
)
def test_benchmark_student_dashboard_data_aggregation(benchmark, benchmark_db_session, setup_students_500):
    data = setup_students_500
    student = data['students'][0]
    
    def dashboard_query():
        benchmark_db_session.query_counter.reset()
        
        student_data = benchmark_db_session.query(Student).filter(
            Student.id == student.id
        ).first()
        
        attendance_data = benchmark_db_session.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.date >= date.today() - timedelta(days=30)
        ).all()
        
        assignment_count = benchmark_db_session.query(Assignment).join(Grade).filter(
            Grade.id == data['grade'].id,
            Assignment.status == AssignmentStatus.PUBLISHED
        ).count()
        
        user_points = benchmark_db_session.query(UserPoints).filter(
            UserPoints.user_id == student.user_id
        ).first()
        
        recent_submissions = benchmark_db_session.query(Submission).filter(
            Submission.student_id == student.id
        ).limit(10).all()
        
        return {
            'student': student_data,
            'attendance_count': len(attendance_data),
            'assignment_count': assignment_count,
            'user_points': user_points,
            'recent_submissions': recent_submissions,
            'query_count': benchmark_db_session.query_counter.count
        }
    
    result = benchmark(dashboard_query)
    
    assert result is not None
    assert result['query_count'] > 0
    assert result['query_count'] < 20, f"Too many queries: {result['query_count']}"
    assert benchmark.stats['mean'] < PERFORMANCE_THRESHOLDS['dashboard_aggregation'], \
        f"Dashboard aggregation took {benchmark.stats['mean']:.3f}s, threshold is {PERFORMANCE_THRESHOLDS['dashboard_aggregation']:.3f}s"


@pytest.mark.benchmark(
    group="attendance",
    min_rounds=5,
    timer=lambda: __import__('time').perf_counter,
    disable_gc=True,
    warmup=True
)
def test_benchmark_attendance_marking_40_students(benchmark, benchmark_db_session, setup_students_40):
    data = setup_students_40
    students = data['students']
    today = date.today()
    
    def mark_attendance():
        benchmark_db_session.query_counter.reset()
        
        attendance_records = []
        for student in students:
            attendance = Attendance(
                institution_id=data['institution'].id,
                student_id=student.id,
                section_id=data['section'].id,
                subject_id=data['subject'].id,
                date=today,
                status=AttendanceStatus.PRESENT
            )
            attendance_records.append(attendance)
            benchmark_db_session.add(attendance)
        
        benchmark_db_session.flush()
        
        return {
            'records_created': len(attendance_records),
            'query_count': benchmark_db_session.query_counter.count
        }
    
    result = benchmark(mark_attendance)
    benchmark_db_session.rollback()
    
    assert result['records_created'] == 40
    assert result['query_count'] < 50, f"Too many queries: {result['query_count']}"
    assert benchmark.stats['mean'] < PERFORMANCE_THRESHOLDS['attendance_marking'], \
        f"Attendance marking took {benchmark.stats['mean']:.3f}s, threshold is {PERFORMANCE_THRESHOLDS['attendance_marking']:.3f}s"


@pytest.mark.benchmark(
    group="assignment",
    min_rounds=5,
    timer=lambda: __import__('time').perf_counter,
    disable_gc=True,
    warmup=True
)
def test_benchmark_assignment_submission_with_10mb_file(benchmark, benchmark_db_session, setup_students_40):
    data = setup_students_40
    student = data['students'][0]
    
    assignment = Assignment(
        institution_id=data['institution'].id,
        teacher_id=data['teacher'].id,
        grade_id=data['grade'].id,
        section_id=data['section'].id,
        subject_id=data['subject'].id,
        title="Benchmark Assignment",
        description="Test assignment for benchmarking",
        max_marks=Decimal('100.00'),
        status=AssignmentStatus.PUBLISHED,
        due_date=datetime.utcnow() + timedelta(days=7)
    )
    benchmark_db_session.add(assignment)
    benchmark_db_session.commit()
    
    mock_file_content = b'0' * (10 * 1024 * 1024)
    
    def submit_assignment_with_file():
        benchmark_db_session.query_counter.reset()
        
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            content="Benchmark submission content",
            submission_text="This is a test submission for benchmarking purposes.",
            submitted_at=datetime.utcnow(),
            is_late=False,
            status=SubmissionStatus.SUBMITTED
        )
        benchmark_db_session.add(submission)
        benchmark_db_session.flush()
        
        with patch('boto3.client') as mock_s3:
            mock_s3_client = MagicMock()
            mock_s3.return_value = mock_s3_client
            mock_s3_client.upload_fileobj.return_value = None
            mock_s3_client.generate_presigned_url.return_value = "https://s3.example.com/test-file.pdf"
            
            file_obj = BytesIO(mock_file_content[:1024])
            mock_s3_client.upload_fileobj(file_obj, 'test-bucket', 'test-key')
            
            submission_file = SubmissionFile(
                submission_id=submission.id,
                file_name="test_document.pdf",
                file_size=len(mock_file_content),
                file_type="application/pdf",
                file_url="https://s3.example.com/test-file.pdf",
                s3_key="submissions/test-file.pdf",
                uploaded_at=datetime.utcnow()
            )
            benchmark_db_session.add(submission_file)
            benchmark_db_session.flush()
        
        return {
            'submission_id': submission.id,
            'file_size': len(mock_file_content),
            'query_count': benchmark_db_session.query_counter.count
        }
    
    result = benchmark(submit_assignment_with_file)
    benchmark_db_session.rollback()
    
    assert result['file_size'] == 10 * 1024 * 1024
    assert result['query_count'] < 15, f"Too many queries: {result['query_count']}"
    assert benchmark.stats['mean'] < PERFORMANCE_THRESHOLDS['assignment_submission'], \
        f"Assignment submission took {benchmark.stats['mean']:.3f}s, threshold is {PERFORMANCE_THRESHOLDS['assignment_submission']:.3f}s"


@pytest.mark.benchmark(
    group="ai_prediction",
    min_rounds=5,
    timer=lambda: __import__('time').perf_counter,
    disable_gc=True,
    warmup=True
)
def test_benchmark_ai_prediction_calculation(benchmark, benchmark_db_session, setup_students_40):
    data = setup_students_40
    student = data['students'][0]
    
    ml_model = MLModel(
        institution_id=data['institution'].id,
        name="Performance Prediction Model",
        description="Test ML model for benchmarking",
        model_type=ModelType.REGRESSION,
        prediction_type=PredictionType.EXAM_PERFORMANCE,
        algorithm="RandomForest",
        hyperparameters={'n_estimators': 100, 'max_depth': 10},
        feature_names=['attendance_rate', 'assignment_avg', 'previous_exam_score', 'study_hours'],
        target_column='exam_score',
        status=ModelStatus.ACTIVE,
        is_active=True
    )
    benchmark_db_session.add(ml_model)
    benchmark_db_session.commit()
    
    model_version = MLModelVersion(
        model_id=ml_model.id,
        version="1.0.0",
        model_path="/models/performance_v1.pkl",
        s3_key="ml-models/performance_v1.pkl",
        training_metrics={'accuracy': 0.92, 'r2_score': 0.88},
        validation_metrics={'accuracy': 0.90, 'r2_score': 0.86},
        training_samples=1000,
        training_date=datetime.utcnow(),
        is_deployed=True,
        deployed_at=datetime.utcnow()
    )
    benchmark_db_session.add(model_version)
    benchmark_db_session.commit()
    
    def calculate_prediction():
        benchmark_db_session.query_counter.reset()
        
        student_attendance = benchmark_db_session.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.date >= date.today() - timedelta(days=90)
        ).all()
        
        attendance_rate = len([a for a in student_attendance if a.status == AttendanceStatus.PRESENT]) / max(len(student_attendance), 1) * 100
        
        input_features = {
            'attendance_rate': attendance_rate,
            'assignment_avg': 75.5,
            'previous_exam_score': 82.0,
            'study_hours': 4.5
        }
        
        predicted_value = (
            input_features['attendance_rate'] * 0.3 +
            input_features['assignment_avg'] * 0.3 +
            input_features['previous_exam_score'] * 0.3 +
            input_features['study_hours'] * 2.0
        )
        
        prediction = PerformancePrediction(
            institution_id=data['institution'].id,
            model_id=ml_model.id,
            model_version_id=model_version.id,
            student_id=student.id,
            predicted_value=predicted_value,
            confidence_lower=predicted_value - 5.0,
            confidence_upper=predicted_value + 5.0,
            confidence_level=0.95,
            input_features=input_features,
            feature_contributions={
                'attendance_rate': 0.25,
                'assignment_avg': 0.30,
                'previous_exam_score': 0.35,
                'study_hours': 0.10
            },
            prediction_context={'model_version': '1.0.0'},
            is_scenario=False,
            predicted_at=datetime.utcnow()
        )
        benchmark_db_session.add(prediction)
        benchmark_db_session.flush()
        
        return {
            'prediction_id': prediction.id,
            'predicted_value': predicted_value,
            'query_count': benchmark_db_session.query_counter.count
        }
    
    result = benchmark(calculate_prediction)
    benchmark_db_session.rollback()
    
    assert result['predicted_value'] > 0
    assert result['query_count'] < 10, f"Too many queries: {result['query_count']}"
    assert benchmark.stats['mean'] < PERFORMANCE_THRESHOLDS['ai_prediction'], \
        f"AI prediction took {benchmark.stats['mean']:.3f}s, threshold is {PERFORMANCE_THRESHOLDS['ai_prediction']:.3f}s"


@pytest.mark.benchmark(
    group="leaderboard",
    min_rounds=5,
    timer=lambda: __import__('time').perf_counter,
    disable_gc=True,
    warmup=True
)
def test_benchmark_leaderboard_generation_1000_students(benchmark, benchmark_db_session, setup_students_1000):
    data = setup_students_1000
    
    leaderboard = Leaderboard(
        institution_id=data['institution'].id,
        name="Benchmark Global Leaderboard",
        description="Test leaderboard for benchmarking",
        leaderboard_type=LeaderboardType.GLOBAL,
        period=LeaderboardPeriod.MONTHLY,
        is_public=True,
        show_full_names=True,
        max_entries=1000,
        is_active=True
    )
    benchmark_db_session.add(leaderboard)
    benchmark_db_session.commit()
    
    def generate_leaderboard():
        benchmark_db_session.query_counter.reset()
        
        user_points_data = benchmark_db_session.query(
            UserPoints.user_id,
            UserPoints.total_points
        ).filter(
            UserPoints.institution_id == data['institution'].id
        ).order_by(UserPoints.total_points.desc()).limit(1000).all()
        
        entries = []
        for rank, (user_id, score) in enumerate(user_points_data, 1):
            if user_id:
                entry = LeaderboardEntry(
                    institution_id=data['institution'].id,
                    leaderboard_id=leaderboard.id,
                    user_id=user_id,
                    rank=rank,
                    score=score,
                    previous_rank=None,
                    metadata_json={'month': datetime.utcnow().month, 'year': datetime.utcnow().year}
                )
                entries.append(entry)
                benchmark_db_session.add(entry)
        
        benchmark_db_session.flush()
        
        return {
            'entries_created': len(entries),
            'query_count': benchmark_db_session.query_counter.count
        }
    
    result = benchmark(generate_leaderboard)
    benchmark_db_session.rollback()
    
    assert result['entries_created'] > 0
    assert result['entries_created'] <= 1000
    assert result['query_count'] < 1100, f"Too many queries: {result['query_count']}"
    assert benchmark.stats['mean'] < PERFORMANCE_THRESHOLDS['leaderboard_generation'], \
        f"Leaderboard generation took {benchmark.stats['mean']:.3f}s, threshold is {PERFORMANCE_THRESHOLDS['leaderboard_generation']:.3f}s"


@pytest.mark.benchmark(
    group="dashboard",
    min_rounds=3,
)
def test_benchmark_dashboard_query_count(benchmark, benchmark_db_session, setup_students_500):
    data = setup_students_500
    student = data['students'][0]
    
    def dashboard_with_query_tracking():
        benchmark_db_session.query_counter.reset()
        
        student_data = benchmark_db_session.query(Student).filter(
            Student.id == student.id
        ).first()
        
        attendance_count = benchmark_db_session.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.date >= date.today() - timedelta(days=30)
        ).count()
        
        assignment_count = benchmark_db_session.query(Assignment).join(Grade).filter(
            Grade.id == data['grade'].id,
            Assignment.status == AssignmentStatus.PUBLISHED
        ).count()
        
        return benchmark_db_session.query_counter.count
    
    query_count = benchmark(dashboard_with_query_tracking)
    
    assert query_count > 0
    assert query_count < 15, f"Dashboard uses {query_count} queries, should be less than 15"


@pytest.mark.benchmark(
    group="attendance",
    min_rounds=3,
)
def test_benchmark_attendance_bulk_insert_query_count(benchmark, benchmark_db_session, setup_students_40):
    data = setup_students_40
    students = data['students']
    today = date.today()
    
    def bulk_attendance_with_query_tracking():
        benchmark_db_session.query_counter.reset()
        
        attendance_records = []
        for student in students:
            attendance = Attendance(
                institution_id=data['institution'].id,
                student_id=student.id,
                section_id=data['section'].id,
                subject_id=data['subject'].id,
                date=today,
                status=AttendanceStatus.PRESENT
            )
            attendance_records.append(attendance)
        
        benchmark_db_session.bulk_save_objects(attendance_records)
        benchmark_db_session.flush()
        
        return benchmark_db_session.query_counter.count
    
    query_count = benchmark(bulk_attendance_with_query_tracking)
    benchmark_db_session.rollback()
    
    assert query_count > 0
    assert query_count < 10, f"Bulk attendance insert uses {query_count} queries, should be less than 10"


@pytest.mark.benchmark(
    group="leaderboard",
    min_rounds=3,
)
def test_benchmark_leaderboard_query_count(benchmark, benchmark_db_session, setup_students_1000):
    data = setup_students_1000
    
    def leaderboard_with_query_tracking():
        benchmark_db_session.query_counter.reset()
        
        user_points_data = benchmark_db_session.query(
            UserPoints.user_id,
            UserPoints.total_points
        ).filter(
            UserPoints.institution_id == data['institution'].id
        ).order_by(UserPoints.total_points.desc()).limit(100).all()
        
        return benchmark_db_session.query_counter.count
    
    query_count = benchmark(leaderboard_with_query_tracking)
    
    assert query_count > 0
    assert query_count < 5, f"Leaderboard query uses {query_count} queries, should be less than 5"


@pytest.mark.benchmark(
    group="assignment",
    min_rounds=3,
)
def test_benchmark_submission_with_file_query_count(benchmark, benchmark_db_session, setup_students_40):
    data = setup_students_40
    student = data['students'][0]
    
    assignment = Assignment(
        institution_id=data['institution'].id,
        teacher_id=data['teacher'].id,
        grade_id=data['grade'].id,
        section_id=data['section'].id,
        subject_id=data['subject'].id,
        title="Query Count Test Assignment",
        description="Test assignment",
        max_marks=Decimal('100.00'),
        status=AssignmentStatus.PUBLISHED,
        due_date=datetime.utcnow() + timedelta(days=7)
    )
    benchmark_db_session.add(assignment)
    benchmark_db_session.commit()
    
    def submission_with_query_tracking():
        benchmark_db_session.query_counter.reset()
        
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            content="Test submission",
            submission_text="Query count test submission",
            submitted_at=datetime.utcnow(),
            is_late=False,
            status=SubmissionStatus.SUBMITTED
        )
        benchmark_db_session.add(submission)
        benchmark_db_session.flush()
        
        submission_file = SubmissionFile(
            submission_id=submission.id,
            file_name="test_file.pdf",
            file_size=1024,
            file_type="application/pdf",
            file_url="https://s3.example.com/test.pdf",
            s3_key="submissions/test.pdf",
            uploaded_at=datetime.utcnow()
        )
        benchmark_db_session.add(submission_file)
        benchmark_db_session.flush()
        
        return benchmark_db_session.query_counter.count
    
    query_count = benchmark(submission_with_query_tracking)
    benchmark_db_session.rollback()
    
    assert query_count > 0
    assert query_count < 10, f"Submission with file uses {query_count} queries, should be less than 10"
