# Performance Thresholds Documentation

## Overview

This document describes the performance thresholds used in benchmark tests, their rationale, and how to adjust them.

## Current Thresholds

| Operation | Threshold | Data Size | Queries | Rationale |
|-----------|-----------|-----------|---------|-----------|
| Dashboard Aggregation | 200ms | 500 students | < 20 | User expects instant feedback on dashboard load |
| Attendance Marking | 150ms | 40 students | < 50 | Teacher marks attendance at start of class |
| Assignment Submission | 250ms | 10MB file | < 15 | Student waits during submission, some delay acceptable |
| AI Prediction | 100ms | 1 student | < 10 | Real-time prediction display |
| Leaderboard Generation | 300ms | 1000 students | < 1100 | Batch process, can run in background |

## Threshold Justification

### Dashboard Aggregation (200ms)

**Context**: Student opens their dashboard to view:
- Personal information
- Attendance summary (last 30 days)
- Assigned work
- Points/gamification stats
- Recent submissions

**User Experience**: Students check dashboard multiple times daily. Response must feel instant.

**Technical Considerations**:
- Multiple table joins
- Aggregation queries
- Date-based filtering
- Real-time data

**Acceptable Range**: 50-200ms
- < 100ms: Excellent (imperceptible)
- 100-200ms: Good (acceptable)
- > 200ms: Poor (noticeable delay)

### Attendance Marking (150ms)

**Context**: Teacher marks attendance for entire class at once:
- 40 students typical
- Section-based marking
- Subject-specific attendance
- Bulk insert operation

**User Experience**: Teacher waits while attendance is recorded. Should be quick to avoid class time waste.

**Technical Considerations**:
- Bulk insert optimization
- Index lookups
- Transaction handling
- Validation checks

**Acceptable Range**: 50-150ms
- < 50ms: Excellent (instant)
- 50-150ms: Good (quick feedback)
- > 150ms: Poor (frustrating delay)

### Assignment Submission (250ms)

**Context**: Student submits assignment with file:
- File upload (10MB typical)
- Database record creation
- File metadata storage
- S3 upload (mocked in tests)

**User Experience**: Student expects some delay during file upload. Tolerance is higher than other operations.

**Technical Considerations**:
- File I/O operations
- S3 upload latency
- Transaction atomicity
- Rollback handling

**Acceptable Range**: 100-250ms (excluding actual S3 upload)
- < 100ms: Excellent (fast upload)
- 100-250ms: Good (acceptable wait)
- > 250ms: Poor (impatient students)

**Note**: Actual S3 upload time not included in benchmark as it's network-dependent.

### AI Prediction (100ms)

**Context**: Generate ML prediction for student:
- Fetch recent performance data
- Calculate features
- Run prediction model
- Store result

**User Experience**: Predictions shown in real-time dashboards and reports. Must be fast to feel responsive.

**Technical Considerations**:
- Feature calculation
- Model inference (mocked in tests)
- Database reads/writes
- Feature caching potential

**Acceptable Range**: 20-100ms
- < 50ms: Excellent (real-time)
- 50-100ms: Good (responsive)
- > 100ms: Poor (noticeable lag)

### Leaderboard Generation (300ms)

**Context**: Calculate and update leaderboard:
- 1000+ students
- Point aggregation
- Rank calculation
- Bulk entry creation

**User Experience**: Typically a background process. Users don't wait directly for leaderboard updates.

**Technical Considerations**:
- Large dataset sorting
- Rank assignment
- Bulk inserts
- Index maintenance

**Acceptable Range**: 100-300ms
- < 100ms: Excellent (fast batch)
- 100-300ms: Good (acceptable batch)
- > 300ms: Poor (consider optimization)

## Query Count Limits

### Why Query Counts Matter

High query counts often indicate:
- N+1 query problems
- Missing eager loading
- Inefficient ORM usage
- Missing indexes

### Per-Operation Limits

| Operation | Limit | Explanation |
|-----------|-------|-------------|
| Dashboard | 20 | 5 main queries + some joins |
| Attendance (individual) | 50 | 1 query per student + validation |
| Attendance (bulk) | 10 | Bulk insert + minimal validation |
| Assignment | 15 | Create submission + file + checks |
| AI Prediction | 10 | Fetch data + calculate + store |
| Leaderboard (write) | 1100 | 1 query + 1 per entry (consider bulk) |
| Leaderboard (read) | 5 | Single query with sort + limit |

### Optimizing Query Counts

1. **Use Eager Loading**:
   ```python
   # Bad: N+1 queries
   students = session.query(Student).all()
   for student in students:
       print(student.section.name)  # Separate query each time
   
   # Good: Single query with join
   students = session.query(Student).options(
       joinedload(Student.section)
   ).all()
   ```

2. **Use Bulk Operations**:
   ```python
   # Bad: N inserts
   for record in records:
       session.add(record)
       session.flush()
   
   # Good: Single bulk insert
   session.bulk_save_objects(records)
   session.flush()
   ```

3. **Use Database Aggregations**:
   ```python
   # Bad: Fetch all, count in Python
   students = session.query(Student).all()
   count = len(students)
   
   # Good: Database count
   count = session.query(Student).count()
   ```

## Adjusting Thresholds

### When to Adjust

Consider adjusting thresholds when:
1. **Hardware changes**: Faster/slower test environment
2. **Data model changes**: Added relationships or complexity
3. **Scale changes**: Supporting larger institutions
4. **Requirements change**: New feature expectations

### How to Adjust

Edit `PERFORMANCE_THRESHOLDS` in `test_performance.py`:

```python
PERFORMANCE_THRESHOLDS = {
    'dashboard_aggregation': 0.200,  # seconds
    'attendance_marking': 0.150,
    'assignment_submission': 0.250,
    'ai_prediction': 0.100,
    'leaderboard_generation': 0.300,
}
```

### Process for Adjustment

1. **Establish Baseline**:
   ```bash
   pytest tests/benchmark/ --benchmark-save=baseline
   ```

2. **Analyze Results**:
   - Review mean, median, stddev
   - Check query counts
   - Identify bottlenecks

3. **Optimize First**:
   - Try to meet existing thresholds
   - Add indexes
   - Optimize queries
   - Use caching

4. **Adjust if Necessary**:
   - Only if optimization exhausted
   - Document reason for change
   - Update this document

5. **Set New Baseline**:
   ```bash
   pytest tests/benchmark/ --benchmark-save=new_baseline
   ```

## Threshold Monitoring

### CI/CD Integration

Fail build if thresholds exceeded:

```yaml
- name: Run Benchmarks
  run: |
    pytest tests/benchmark/ \
      --benchmark-compare=baseline \
      --benchmark-compare-fail=mean:10%
```

This fails if performance degrades by more than 10%.

### Alerting

Set up alerts for:
- Mean time > threshold
- Query count > limit
- 10% regression from baseline
- Standard deviation > 50% of mean (inconsistent performance)

### Tracking Over Time

Store benchmark results in database:
- Commit hash
- Date/time
- Environment info
- All timing statistics
- Query counts

Use for:
- Historical analysis
- Performance trending
- Regression detection
- Capacity planning

## Environment Considerations

### Test Environment

Thresholds assume:
- SQLite in-memory database
- No network latency
- Minimal system load
- Standard test hardware

### Production Environment

Production will differ:
- PostgreSQL (may be faster/slower)
- Network latency to database
- Concurrent users
- Caching layers

**Rule of Thumb**: Production should be within 2x of test thresholds under normal load.

## Per-Environment Thresholds

Consider different thresholds per environment:

```python
import os

ENV = os.getenv('TEST_ENV', 'ci')

PERFORMANCE_THRESHOLDS = {
    'ci': {  # CI/CD environment
        'dashboard_aggregation': 0.200,
        'attendance_marking': 0.150,
        # ...
    },
    'local': {  # Developer machine
        'dashboard_aggregation': 0.300,  # More lenient
        'attendance_marking': 0.200,
        # ...
    },
    'staging': {  # Staging environment
        'dashboard_aggregation': 0.250,
        'attendance_marking': 0.175,
        # ...
    }
}

# Use environment-specific thresholds
thresholds = PERFORMANCE_THRESHOLDS[ENV]
```

## Benchmarking Different Scales

### Small School (< 200 students)
All operations should be well under thresholds.

### Medium School (200-500 students)
Current thresholds are appropriate.

### Large School (500-1000 students)
May need to adjust:
- Dashboard: 250ms
- Leaderboard: 400ms

### District Level (1000+ students)
Significant adjustments needed:
- Dashboard: 300ms
- Leaderboard: 500-800ms
- Consider sharding/partitioning

### Scale Testing

Add scale-specific tests:

```python
@pytest.mark.parametrize("student_count", [100, 500, 1000, 5000])
def test_benchmark_leaderboard_scale(benchmark, student_count):
    # Test with different scales
    # Observe how performance degrades
    pass
```

## Performance Budget

Think of thresholds as a performance budget:
- Total page load: 1000ms
- Dashboard queries: 200ms (20%)
- Rendering: 300ms (30%)
- Network: 400ms (40%)
- Other: 100ms (10%)

Every operation must fit within its budget.

## Reporting Violations

When threshold is exceeded:

1. **Don't immediately adjust** - investigate first
2. **Profile the operation** - find the bottleneck
3. **Review queries** - check for N+1 problems
4. **Check indexes** - ensure proper indexing
5. **Consider caching** - can we cache results?
6. **Optimize algorithm** - better approach?
7. **Only then adjust** - if truly necessary

## Conclusion

Thresholds are:
- **Guidelines** not absolute rules
- **Living values** that evolve with the system
- **Quality gates** ensuring consistent performance
- **Documentation** of expected behavior

Review and update this document when thresholds change.
