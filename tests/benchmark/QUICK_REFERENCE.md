# Performance Benchmarks - Quick Reference

## Installation

```bash
# Install pytest-benchmark
pip install pytest-benchmark

# Or with poetry
poetry add --group dev pytest-benchmark
```

## Basic Commands

```bash
# Run all benchmarks
pytest tests/benchmark/

# Run specific benchmark group
pytest tests/benchmark/ -k "dashboard"
pytest tests/benchmark/ -k "attendance"
pytest tests/benchmark/ -k "assignment"
pytest tests/benchmark/ -k "ai_prediction"
pytest tests/benchmark/ -k "leaderboard"

# Verbose output
pytest tests/benchmark/ -v

# Show query details
pytest tests/benchmark/ -v -s
```

## Using Run Scripts

### Linux/Mac
```bash
cd tests/benchmark

# Run all tests
./run_benchmarks.sh all

# Run specific group
./run_benchmarks.sh dashboard
./run_benchmarks.sh attendance

# Save baseline
./run_benchmarks.sh all --save-baseline

# Compare with baseline
./run_benchmarks.sh compare

# Generate histogram
./run_benchmarks.sh histogram

# Generate JSON report
./run_benchmarks.sh json
```

### Windows PowerShell
```powershell
cd tests\benchmark

# Run all tests
.\run_benchmarks.ps1 -Mode all

# Run specific group
.\run_benchmarks.ps1 -Mode dashboard
.\run_benchmarks.ps1 -Mode attendance

# Save baseline
.\run_benchmarks.ps1 -Mode all -SaveBaseline

# Compare with baseline
.\run_benchmarks.ps1 -Mode compare

# Generate histogram
.\run_benchmarks.ps1 -Mode histogram

# Generate JSON report
.\run_benchmarks.ps1 -Mode json
```

## Baseline Management

```bash
# Save current results as baseline
pytest tests/benchmark/ --benchmark-save=baseline

# Compare with baseline
pytest tests/benchmark/ --benchmark-compare=baseline

# Show only comparison
pytest tests/benchmark/ --benchmark-compare=baseline --benchmark-only

# Fail if 10% slower than baseline
pytest tests/benchmark/ --benchmark-compare=baseline --benchmark-compare-fail=mean:10%
```

## Output Formats

```bash
# Console table (default)
pytest tests/benchmark/

# JSON output
pytest tests/benchmark/ --benchmark-json=results.json

# Histogram (requires matplotlib)
pytest tests/benchmark/ --benchmark-histogram

# Save to specific directory
pytest tests/benchmark/ --benchmark-json=.benchmarks/$(date +%Y%m%d_%H%M%S).json
```

## Performance Thresholds

| Operation | Threshold | Data Volume |
|-----------|-----------|-------------|
| Dashboard Aggregation | 200ms | 500 students |
| Attendance Marking | 150ms | 40 students |
| Assignment Submission | 250ms | 10MB file |
| AI Prediction | 100ms | 1 student |
| Leaderboard Generation | 300ms | 1000 students |

## Query Count Limits

| Operation | Limit |
|-----------|-------|
| Dashboard | < 20 queries |
| Attendance (bulk) | < 50 queries |
| Assignment | < 15 queries |
| AI Prediction | < 10 queries |
| Leaderboard (read) | < 5 queries |

## Understanding Results

### Timing Statistics

```
Name (time in ms)                Min      Max     Mean   Median   StdDev
test_dashboard                 180.2    195.4    187.3    186.1     5.2
```

- **Min/Max**: Range of execution times
- **Mean**: Average time (what we compare to threshold)
- **Median**: Middle value (resistant to outliers)
- **StdDev**: Consistency (lower is better)

### Good vs Bad Performance

**Good**:
- Mean < threshold ✓
- Low standard deviation (< 20% of mean)
- Query count within limits
- Min and Max close together

**Bad**:
- Mean > threshold ✗
- High standard deviation (> 50% of mean)
- Query count exceeds limits
- Large gap between Min and Max

## Troubleshooting

### Tests Fail Due to Threshold

```bash
# Run with verbose output to see query details
pytest tests/benchmark/ -v -s

# Save current results for comparison
pytest tests/benchmark/ --benchmark-save=current

# Analyze queries (look for N+1 problems)
# Check tests/benchmark/test_performance.py query counter output
```

### Tests are Too Slow

```bash
# Reduce rounds for quick check
pytest tests/benchmark/ --benchmark-min-rounds=1

# Skip warmup
pytest tests/benchmark/ --benchmark-warmup=off

# Run only fast tests
pytest tests/benchmark/ -k "not leaderboard"
```

### Inconsistent Results

```bash
# Increase warmup rounds
pytest tests/benchmark/ --benchmark-warmup-iterations=10

# Increase min rounds for better statistics
pytest tests/benchmark/ --benchmark-min-rounds=10

# Ensure no background processes are running
```

## Common pytest-benchmark Options

| Option | Description |
|--------|-------------|
| `--benchmark-only` | Run benchmarks only, skip regular tests |
| `--benchmark-skip` | Skip benchmarks, run regular tests |
| `--benchmark-disable` | Completely disable benchmarks |
| `--benchmark-save=NAME` | Save results with NAME |
| `--benchmark-compare=NAME` | Compare with saved results |
| `--benchmark-compare-fail=EXPR` | Fail if comparison doesn't pass |
| `--benchmark-sort=COL` | Sort by column (name, min, max, mean, etc.) |
| `--benchmark-group-by=GROUP` | Group results by group, name, func, etc. |
| `--benchmark-columns=COLS` | Choose columns to display |
| `--benchmark-histogram[=FILE]` | Generate histogram |
| `--benchmark-json=FILE` | Save results as JSON |
| `--benchmark-min-rounds=N` | Minimum rounds to run |
| `--benchmark-warmup=on|off` | Enable/disable warmup |
| `--benchmark-warmup-iterations=N` | Number of warmup iterations |

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Run Benchmarks
  run: pytest tests/benchmark/ --benchmark-json=benchmark.json

- name: Compare with Baseline
  run: |
    pytest tests/benchmark/ \
      --benchmark-compare=baseline \
      --benchmark-compare-fail=mean:10%
```

### GitLab CI

```yaml
benchmark:
  script:
    - pytest tests/benchmark/ --benchmark-json=benchmark.json
  artifacts:
    reports:
      junit: benchmark.json
```

## Query Optimization Tips

### N+1 Query Problem

```python
# Bad: N+1 queries
students = session.query(Student).all()
for student in students:
    print(student.section.name)  # Extra query per student

# Good: Single query with join
students = session.query(Student).options(
    joinedload(Student.section)
).all()
```

### Bulk Operations

```python
# Bad: Individual inserts
for record in records:
    session.add(record)
    session.flush()

# Good: Bulk insert
session.bulk_save_objects(records)
session.flush()
```

### Use Database Aggregations

```python
# Bad: Fetch all, aggregate in Python
all_students = session.query(Student).all()
count = len(all_students)

# Good: Database count
count = session.query(Student).count()
```

## Files

- `test_performance.py` - Main benchmark tests
- `README.md` - Comprehensive documentation
- `IMPLEMENTATION.md` - Technical implementation details
- `THRESHOLDS.md` - Threshold documentation and rationale
- `QUICK_REFERENCE.md` - This quick reference (you are here)
- `run_benchmarks.sh` - Bash runner script
- `run_benchmarks.ps1` - PowerShell runner script

## Getting Help

1. Read `README.md` for detailed information
2. Check `IMPLEMENTATION.md` for technical details
3. Review `THRESHOLDS.md` for threshold rationale
4. Look at test code in `test_performance.py`
5. Check [pytest-benchmark docs](https://pytest-benchmark.readthedocs.io/)

## Examples

### Check if Dashboard is Fast Enough

```bash
pytest tests/benchmark/ -k "dashboard" -v
# Look for: mean < 200ms
```

### Find Query Count Issues

```bash
pytest tests/benchmark/ -v -s
# Look in output for: query_count values
# Should be: dashboard < 20, attendance < 50, etc.
```

### Compare Before/After Optimization

```bash
# Before optimization
pytest tests/benchmark/ --benchmark-save=before

# Make your changes...

# After optimization
pytest tests/benchmark/ --benchmark-compare=before
# Should show improvement!
```

### Generate Report for Review

```bash
pytest tests/benchmark/ --benchmark-json=report.json
pytest tests/benchmark/ --benchmark-histogram=report.svg

# Share report.json and report.svg with team
```
