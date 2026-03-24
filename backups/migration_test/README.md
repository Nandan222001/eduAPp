# Migration Test Results Directory

This directory contains test results and reports from migration testing.

## Generated Files

### MySQL Migration Testing

When running `python scripts/test_mysql_migrations_comprehensive.py`:

#### 1. `mysql_migration_test_results.json`
**Format**: JSON  
**Purpose**: Machine-readable test results

**Contents**:
- Test execution metadata (timestamps, duration)
- MySQL version and database info
- Test results for each phase
- Tables, indexes, and foreign keys created
- MySQL-specific behaviors documented
- MySQL limitations found
- Complete error messages if any

**Use Cases**:
- CI/CD pipeline parsing
- Automated validation
- Historical comparison
- Programmatic analysis

**Example**:
```json
{
  "start_time": "2024-01-20T10:00:00.000000",
  "mysql_version": "8.0.35",
  "success": true,
  "tests": [...]
}
```

#### 2. `mysql_migration_test_report.md`
**Format**: Markdown  
**Purpose**: Human-readable test report

**Contents**:
- Formatted test summary
- Environment details
- Test results with status indicators
- MySQL behaviors explained
- Limitations and workarounds
- Overall assessment

**Use Cases**:
- Manual review
- Documentation
- Team communication
- Version control

### PostgreSQL Migration Testing (If Applicable)

Similar files may exist for PostgreSQL testing:
- `postgresql_migration_test_results.json`
- `postgresql_migration_test_report.md`

### Historical Test Data

Old test results may be archived in subdirectories:
- `archive/YYYY-MM-DD/` - Test results by date
- `archive/version-X.Y.Z/` - Test results by migration version

## File Lifecycle

### Creation
Files are created/overwritten each time tests run:
```bash
python scripts/test_mysql_migrations_comprehensive.py
```

### Retention
- Current test results: Kept in root directory
- Historical results: Move to archive/ if needed
- Failed tests: Keep for debugging

### Cleanup
Old test results can be safely deleted:
```bash
# Keep only latest results
rm mysql_migration_test_results.json.old
rm mysql_migration_test_report.md.old
```

## Reading Test Results

### Quick Check
```bash
# Check if tests passed
jq '.success' mysql_migration_test_results.json

# View test summary
head -20 mysql_migration_test_report.md
```

### Detailed Analysis
```bash
# View all test phases
jq '.tests' mysql_migration_test_results.json

# Count tables created
jq '.tests[0].tables_created' mysql_migration_test_results.json

# List MySQL behaviors
jq '.mysql_behaviors[].category' mysql_migration_test_results.json

# Check for errors
jq '.tests[] | select(.success == false)' mysql_migration_test_results.json
```

### Compare Results
```bash
# Compare two test runs
diff mysql_migration_test_results.json.old mysql_migration_test_results.json

# View changes in markdown
diff mysql_migration_test_report.md.old mysql_migration_test_report.md
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run MySQL Migration Tests
  run: python scripts/test_mysql_migrations_comprehensive.py

- name: Upload Test Results
  uses: actions/upload-artifact@v2
  with:
    name: migration-test-results
    path: backups/migration_test/*.json

- name: Check Test Success
  run: |
    SUCCESS=$(jq -r '.success' backups/migration_test/mysql_migration_test_results.json)
    if [ "$SUCCESS" != "true" ]; then
      echo "Migration tests failed"
      exit 1
    fi
```

### Jenkins Example
```groovy
stage('Migration Tests') {
    steps {
        sh 'python scripts/test_mysql_migrations_comprehensive.py'
        archiveArtifacts 'backups/migration_test/*.json'
        
        script {
            def results = readJSON file: 'backups/migration_test/mysql_migration_test_results.json'
            if (!results.success) {
                error("Migration tests failed")
            }
        }
    }
}
```

## Troubleshooting

### No Files Generated
**Issue**: Test results files not created

**Causes**:
- Test script crashed before completion
- No write permissions on directory
- Disk full

**Solutions**:
```bash
# Check directory permissions
ls -la backups/migration_test/

# Create directory if missing
mkdir -p backups/migration_test

# Check disk space
df -h

# Run test with verbose output
python scripts/test_mysql_migrations_comprehensive.py -v
```

### Incomplete Results
**Issue**: JSON file is incomplete or invalid

**Causes**:
- Test interrupted mid-execution
- Python crash during save
- Disk write error

**Solutions**:
```bash
# Validate JSON
jq '.' mysql_migration_test_results.json

# Check for Python errors
python scripts/test_mysql_migrations_comprehensive.py 2>&1 | tee test.log

# Run with exception handling
python -u scripts/test_mysql_migrations_comprehensive.py
```

### Old Results Persist
**Issue**: Test results show old data

**Causes**:
- Looking at wrong file
- Test didn't run successfully
- File permissions prevent overwrite

**Solutions**:
```bash
# Check file timestamp
ls -la mysql_migration_test_results.json

# Force overwrite
rm mysql_migration_test_results.json
python scripts/test_mysql_migrations_comprehensive.py

# Check file contents
jq '.start_time' mysql_migration_test_results.json
```

## Best Practices

### Version Control
```bash
# Don't commit test results to git
echo "backups/migration_test/*.json" >> .gitignore
echo "backups/migration_test/*.md" >> .gitignore

# Do commit the README
git add backups/migration_test/README.md
```

### Archiving
```bash
# Archive before major changes
DATE=$(date +%Y-%m-%d)
mkdir -p backups/migration_test/archive/$DATE
cp mysql_migration_test_results.json backups/migration_test/archive/$DATE/
cp mysql_migration_test_report.md backups/migration_test/archive/$DATE/
```

### Documentation
```bash
# Add test results to documentation
cp mysql_migration_test_report.md docs/migration/latest-test-report.md

# Include in release notes
cat mysql_migration_test_report.md >> RELEASE_NOTES.md
```

## Related Documentation

- [Alembic README](../../alembic/README.md) - Main migration documentation
- [MySQL Quick Start](../../alembic/MYSQL_MIGRATION_QUICK_START.md) - Quick testing guide
- [MySQL Testing Summary](../../alembic/MYSQL_MIGRATION_TESTING_SUMMARY.md) - Complete overview
- [Test Report Template](../../alembic/MYSQL_TEST_REPORT_TEMPLATE.md) - Report format

## Support

For issues with test results:
1. Check test output and error messages
2. Validate JSON files with `jq`
3. Review test script logs
4. Check database connectivity
5. Verify MySQL version compatibility

---

**Last Updated**: 2024-01-20
