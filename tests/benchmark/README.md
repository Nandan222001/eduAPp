# Performance Benchmark Tests

This directory contains performance benchmark tests for the education management system using `pytest-benchmark`.

## Overview

The benchmark tests measure and validate the performance of critical operations with realistic data volumes:

1. **Student Dashboard Data Aggregation** (500+ students)
   - Measures query performance for loading student dashboard data
   - Tests with 500+ students to simulate realistic school sizes
   - Threshold: < 200ms

2. **Attendance Marking** (40 students in a class)
   - Benchmarks bulk attendance marking for a classroom
   - Tests with 40 students (typical class size)
   - Threshold: < 150ms

3. **Assignment Submission with File Upload** (10MB file)
   - Measures performance of assignment submission with large file
   - Mocked file upload to S3
   - Threshold: < 250ms

4. **AI Prediction Calculation**
   - Benchmarks ML prediction generation for student performance
   - Tests feature extraction and prediction storage
   - Threshold: < 100ms

5. **Leaderboard Generation** (1000+ students)
   - Tests leaderboard calculation and ranking for large student populations
   - Simulates school-wide or district-level leaderboards
   - Threshold: < 300ms

## Running Benchmark Tests

### Install Dependencies

First, ensure pytest-benchmark is installed:

```bash
poetry install --with dev
```

Or if using pip:

```bash
pip install pytest-benchmark
```

### Run All Benchmark Tests

```bash
pytest tests/benchmark/ -v
```

### Run Specific Benchmark Groups

```bash
# Dashboard benchmarks only
pytest tests/benchmark/ -v -k "dashboard"

# Attendance benchmarks only
pytest tests/benchmark/ -v -k "attendance"

# AI prediction benchmarks only
pytest tests/benchmark/ -v -k "ai_prediction"

# Leaderboard benchmarks only
pytest tests/benchmark/ -v -k "leaderboard"

# Assignment benchmarks only
pytest tests/benchmark/ -v -k "assignment"
```

### Generate Benchmark Comparison

Compare benchmark results across runs:

```bash
# Save baseline
pytest tests/benchmark/ --benchmark-save=baseline

# Compare with baseline
pytest tests/benchmark/ --benchmark-compare=baseline

# Compare only (don't run tests)
pytest tests/benchmark/ --benchmark-compare=baseline --benchmark-compare-fail=mean:10%
```

### Generate Benchmark Reports

```bash
# Generate histogram
pytest tests/benchmark/ --benchmark-histogram

# JSON output
pytest tests/benchmark/ --benchmark-json=output.json

# Disable benchmark tests
pytest tests/benchmark/ --benchmark-disable
```

## Performance Thresholds

The following performance thresholds are enforced:

| Operation | Threshold | Description |
|-----------|-----------|-------------|
| Dashboard Aggregation | 200ms | Loading student dashboard with 500+ students |
| Attendance Marking | 150ms | Marking attendance for 40 students |
| Assignment Submission | 250ms | Submitting assignment with 10MB file |
| AI Prediction | 100ms | Calculating ML prediction for student |
| Leaderboard Generation | 300ms | Generating leaderboard with 1000+ students |

Tests will **fail** if these thresholds are exceeded.

## Query Count Monitoring

Each benchmark test includes query count monitoring using SQLAlchemy event listeners:

- Dashboard queries: < 20 queries
- Attendance bulk insert: < 50 queries (or < 10 with bulk_save_objects)
- Assignment submission: < 15 queries
- AI prediction: < 10 queries
- Leaderboard generation: < 1100 queries (or < 5 for read-only)

## Database Query Counter

The tests use a custom `QueryCounter` class that hooks into SQLAlchemy's event system to track:

- Total number of queries executed
- SQL statements
- Query parameters
- Whether queries use executemany

This helps identify N+1 query problems and optimize database access patterns.

## Test Structure

Each benchmark test follows this pattern:

```python
@pytest.mark.benchmark(
    group="operation_name",
    min_rounds=5,
    timer=lambda: __import__('time').perf_counter,
    disable_gc=True,
    warmup=True
)
def test_benchmark_operation(benchmark, benchmark_db_session, fixtures):
    def operation_to_benchmark():
        # Reset query counter
        benchmark_db_session.query_counter.reset()
        
        # Perform operation
        result = do_operation()
        
        # Return results including query count
        return {
            'result': result,
            'query_count': benchmark_db_session.query_counter.count
        }
    
    # Run benchmark
    result = benchmark(operation_to_benchmark)
    
    # Assertions
    assert result['query_count'] < THRESHOLD
    assert benchmark.stats['mean'] < PERFORMANCE_THRESHOLD
```

## Fixtures

- `benchmark_db_session`: Isolated SQLite in-memory database with query counting
- `setup_institution_data`: Basic institution setup with roles, academic year, etc.
- `setup_students_40`: 40 students for classroom-size tests
- `setup_students_500`: 500 students with attendance and points data
- `setup_students_1000`: 1000 students for large-scale tests

## Best Practices

1. **Warmup**: All benchmarks include warmup runs to ensure consistent timing
2. **GC Disabled**: Garbage collection is disabled during timing for accuracy
3. **Multiple Rounds**: Each test runs at least 5 rounds (configurable)
4. **Isolated DB**: Each test uses a fresh in-memory database
5. **Query Tracking**: All database queries are monitored and counted
6. **Realistic Data**: Tests use factories to generate realistic test data

## Troubleshooting

### Tests are Slow

If benchmark tests take too long:

```bash
# Reduce number of rounds
pytest tests/benchmark/ --benchmark-min-rounds=1

# Skip warmup
pytest tests/benchmark/ --benchmark-warmup=off
```

### Threshold Failures

If tests fail due to performance thresholds:

1. Check the query count - may indicate N+1 query problems
2. Review the SQL queries in the query counter output
3. Consider adding indexes or optimizing queries
4. Adjust thresholds in `PERFORMANCE_THRESHOLDS` if baseline has changed

### Memory Issues

For tests with large datasets (1000+ students):

1. Monitor memory usage during tests
2. Consider reducing dataset sizes in fixtures if needed
3. Ensure proper cleanup with `benchmark_db_session.rollback()`

## CI/CD Integration

To integrate benchmark tests in CI/CD:

```yaml
# GitHub Actions example
- name: Run Benchmark Tests
  run: |
    pytest tests/benchmark/ \
      --benchmark-only \
      --benchmark-json=benchmark-results.json
      
- name: Compare with Baseline
  run: |
    pytest tests/benchmark/ \
      --benchmark-compare=baseline \
      --benchmark-compare-fail=mean:10%
```

## Additional Resources

- [pytest-benchmark documentation](https://pytest-benchmark.readthedocs.io/)
- [SQLAlchemy event system](https://docs.sqlalchemy.org/en/14/core/event.html)
- [Performance testing best practices](https://pytest-benchmark.readthedocs.io/en/latest/usage.html)
