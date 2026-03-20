# Performance Benchmark Tests Implementation

## Overview

This document describes the implementation of performance benchmark tests for the education management system using `pytest-benchmark`.

## Architecture

### Query Counter Implementation

The `QueryCounter` class uses SQLAlchemy's event listener system to track all database queries:

```python
class QueryCounter:
    def __init__(self):
        self.count = 0
        self.queries = []
    
    def callback(self, conn, cursor, statement, parameters, context, executemany):
        self.count += 1
        self.queries.append({
            'statement': statement,
            'parameters': parameters,
            'executemany': executemany
        })
```

The counter is attached to the SQLAlchemy engine using:
```python
event.listen(engine, "before_cursor_execute", query_counter.callback)
```

This provides detailed insights into:
- Total number of queries
- SQL statements executed
- Query parameters
- Batch execution status

### Database Session Fixture

The `benchmark_db_session` fixture creates an isolated test environment:

```python
@pytest.fixture(scope='function')
def benchmark_db_session():
    # Create in-memory SQLite database
    engine = create_engine("sqlite:///:memory:", ...)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session with query counter
    session = TestingSessionLocal(bind=connection)
    query_counter = QueryCounter()
    event.listen(engine, "before_cursor_execute", query_counter.callback)
    
    session.query_counter = query_counter
    yield session
    
    # Cleanup
    event.remove(engine, "before_cursor_execute", query_counter.callback)
    session.close()
```

Benefits:
- Isolated environment per test
- No test interference
- Query tracking built-in
- Fast in-memory operations

## Test Scenarios

### 1. Student Dashboard Data Aggregation (500+ Students)

**Purpose**: Measure the performance of loading a student dashboard with multiple data sources.

**Test Data**:
- 500 students
- User points for each student
- 5-15 attendance records per student
- Published assignments

**Queries Measured**:
- Student profile fetch
- Attendance history (last 30 days)
- Assignment count
- User points/gamification data
- Recent submissions

**Performance Threshold**: 200ms

**Query Optimization Strategies**:
- Use `joinedload()` for related data
- Limit attendance queries with date filters
- Use count() instead of fetching all records
- Cache frequently accessed data

### 2. Attendance Marking (40 Students)

**Purpose**: Benchmark bulk attendance marking for a classroom.

**Test Data**:
- 40 students (typical class size)
- Section and subject associations
- Attendance records for current date

**Operations**:
- Create attendance records for all students
- Batch insert with SQLAlchemy
- Track query count

**Performance Threshold**: 150ms

**Optimization Strategies**:
- Use `bulk_save_objects()` for batch inserts
- Minimize per-record queries
- Use database transactions efficiently

### 3. Assignment Submission with File Upload (10MB)

**Purpose**: Measure performance of assignment submission including file handling.

**Test Data**:
- 40 students
- Published assignment
- 10MB mock file

**Operations**:
- Create submission record
- Mock S3 file upload
- Create submission file record
- Database transactions

**Performance Threshold**: 250ms

**Optimization Strategies**:
- Async file uploads
- Database operations in single transaction
- Efficient file size handling

### 4. AI Prediction Calculation

**Purpose**: Benchmark ML prediction generation for student performance.

**Test Data**:
- Student with attendance history
- ML model and version
- Feature data

**Operations**:
- Fetch student attendance
- Calculate features
- Generate prediction
- Store prediction result

**Performance Threshold**: 100ms

**Optimization Strategies**:
- Cache frequently used features
- Optimize attendance queries
- Use efficient calculation methods
- Minimize database writes

### 5. Leaderboard Generation (1000+ Students)

**Purpose**: Test leaderboard calculation for large student populations.

**Test Data**:
- 1000 students
- User points for each
- Ranking calculations

**Operations**:
- Query user points with ordering
- Calculate ranks
- Create leaderboard entries
- Batch insert entries

**Performance Threshold**: 300ms

**Optimization Strategies**:
- Use database sorting (ORDER BY)
- Limit results (TOP N)
- Batch insert leaderboard entries
- Consider pagination

## Performance Thresholds

Thresholds are defined in the `PERFORMANCE_THRESHOLDS` dictionary:

```python
PERFORMANCE_THRESHOLDS = {
    'dashboard_aggregation': 0.200,  # 200ms
    'attendance_marking': 0.150,     # 150ms
    'assignment_submission': 0.250,  # 250ms
    'ai_prediction': 0.100,          # 100ms
    'leaderboard_generation': 0.300, # 300ms
}
```

These thresholds are enforced in each test:

```python
assert benchmark.stats['mean'] < PERFORMANCE_THRESHOLDS['operation_name'], \
    f"Operation took {benchmark.stats['mean']:.3f}s, threshold is {PERFORMANCE_THRESHOLDS['operation_name']:.3f}s"
```

## Query Count Monitoring

Each test includes query count assertions to catch N+1 query problems:

```python
assert result['query_count'] < MAX_QUERIES, \
    f"Too many queries: {result['query_count']}"
```

Query count limits:
- Dashboard: < 20 queries
- Attendance (bulk): < 50 queries (< 10 with bulk_save_objects)
- Assignment submission: < 15 queries
- AI prediction: < 10 queries
- Leaderboard (read): < 5 queries

## Benchmark Configuration

Tests use pytest-benchmark decorators:

```python
@pytest.mark.benchmark(
    group="operation_name",  # Groups related tests
    min_rounds=5,            # Minimum iterations
    timer=lambda: __import__('time').perf_counter,  # High-precision timer
    disable_gc=True,         # Disable GC during timing
    warmup=True              # Warmup before timing
)
```

## Data Fixtures

### setup_institution_data
Creates basic institution structure:
- Institution
- Roles (Admin, Student, Teacher)
- Academic year
- Grade
- Section
- Subject
- Teacher

### setup_students_40
Creates 40 students for classroom-size tests.

### setup_students_500
Creates 500 students with:
- User points
- 5-15 attendance records each
- Gamification data

### setup_students_1000
Creates 1000 students with:
- User points
- Leaderboard-ready data

## Test Results Interpretation

### Timing Statistics

pytest-benchmark provides detailed statistics:
- **mean**: Average execution time
- **median**: Middle value
- **stddev**: Standard deviation
- **min**: Fastest execution
- **max**: Slowest execution
- **rounds**: Number of iterations

### Query Analysis

Query counter provides:
- Total query count
- Individual SQL statements
- Parameter values
- Batch execution flags

Use this data to:
- Identify N+1 query problems
- Find missing indexes
- Optimize joins
- Reduce query complexity

## Best Practices

1. **Isolated Tests**: Each test uses fresh database
2. **Realistic Data**: Use factories for realistic test data
3. **Warmup Runs**: Ensure consistent timing with warmup
4. **GC Control**: Disable GC during timing for accuracy
5. **Multiple Rounds**: Run at least 5 rounds for statistical validity
6. **Query Tracking**: Always monitor query counts
7. **Thresholds**: Set and enforce performance thresholds
8. **Documentation**: Document expected behavior and optimization strategies

## Continuous Integration

### Running in CI/CD

```yaml
# Example GitHub Actions workflow
jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest-benchmark
      
      - name: Run benchmarks
        run: |
          pytest tests/benchmark/ \
            --benchmark-only \
            --benchmark-json=benchmark-results.json
      
      - name: Compare with baseline
        run: |
          pytest tests/benchmark/ \
            --benchmark-compare=baseline \
            --benchmark-compare-fail=mean:10%
      
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: benchmark-results
          path: benchmark-results.json
```

### Setting Baselines

1. Run tests on known-good commit:
   ```bash
   pytest tests/benchmark/ --benchmark-save=baseline
   ```

2. Compare future runs:
   ```bash
   pytest tests/benchmark/ --benchmark-compare=baseline
   ```

3. Fail on regression:
   ```bash
   pytest tests/benchmark/ --benchmark-compare=baseline --benchmark-compare-fail=mean:10%
   ```

## Troubleshooting

### High Query Counts

**Symptoms**: Query count exceeds threshold
**Solutions**:
- Use `joinedload()` for eager loading
- Implement `subqueryload()` for collections
- Use `select_in()` loading strategy
- Add database indexes
- Batch operations with `bulk_save_objects()`

### Slow Performance

**Symptoms**: Execution time exceeds threshold
**Solutions**:
- Review SQL queries for optimization
- Add database indexes
- Use database-level aggregations
- Implement caching
- Consider pagination

### Inconsistent Results

**Symptoms**: High standard deviation in timing
**Solutions**:
- Increase warmup rounds
- Check for system load during tests
- Ensure GC is disabled
- Use dedicated test environment

### Memory Issues

**Symptoms**: Out of memory with large datasets
**Solutions**:
- Use pagination in queries
- Clear session cache between operations
- Reduce test data size
- Use `yield_per()` for large result sets

## Future Improvements

1. **Distributed Testing**: Run benchmarks across multiple workers
2. **Historical Tracking**: Store benchmark results over time
3. **Automated Alerts**: Notify on performance regressions
4. **Profiling Integration**: Add CPU/memory profiling
5. **Database Variants**: Test with PostgreSQL, MySQL
6. **Load Testing**: Add concurrent request benchmarks
7. **API Benchmarks**: Benchmark HTTP endpoints
8. **Caching Benchmarks**: Test Redis/cache performance

## References

- [pytest-benchmark documentation](https://pytest-benchmark.readthedocs.io/)
- [SQLAlchemy performance tips](https://docs.sqlalchemy.org/en/14/faq/performance.html)
- [Database query optimization](https://use-the-index-luke.com/)
- [Python profiling tools](https://docs.python.org/3/library/profile.html)
