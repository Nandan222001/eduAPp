# Quick Start: Migration Diagnostic Tool

## Run the Diagnostic Script

```bash
# From the repository root
python scripts/diagnose_migrations.py
```

## What It Does

The script will automatically:

1. ✅ Scan all migration files in `alembic/versions/`
2. ✅ Execute `alembic history` to view migration chain
3. ✅ Execute `alembic current` to check database state
4. ✅ Detect duplicate revision IDs
5. ✅ Find orphaned migrations
6. ✅ Check for circular dependencies
7. ✅ Validate Python syntax
8. ✅ Generate comprehensive report

## Output

### Console Output
Shows a summary of findings:
- Number of critical issues
- Number of warnings
- Total migrations scanned
- First 10 critical issues
- First 5 warnings

### Report File
Detailed report saved to: **`migration_audit_report.txt`**

Contains:
- Executive summary
- Complete list of all issues and warnings
- Detailed migration metadata for each file
- Visual migration chain graph
- Alembic history output
- Current database version

## Understanding Results

### Exit Codes
- **0**: All checks passed (warnings may exist but are non-critical)
- **1**: Critical issues found that need fixing

### Issue Severity

#### 🔴 Critical Issues (Must Fix)
- Duplicate revision IDs
- Orphaned migrations (broken parent links)
- Circular dependencies
- Syntax errors

#### 🟡 Warnings (Should Review)
- Multiple root migrations (parallel branches)
- Multiple leaf nodes
- Missing upgrade() or downgrade() functions
- Unreachable migrations

#### 🔵 Information
- General status messages
- Successful checks
- Migration counts

## Common Issues & Solutions

### Duplicate Revision IDs
**Problem**: Multiple files have the same revision ID
```
[ISSUE] Duplicate revision ID '014' found in files: 
  014_add_institution_logo.py, 014_create_assignment_rubric_tables.py
```

**Solution**: 
1. Rename one migration file with unique revision ID
2. Update the `revision` variable in the file
3. Update `down_revision` in any child migrations

### Orphaned Migrations
**Problem**: Migration references non-existent parent
```
[ISSUE] Orphaned migration '001_dashboard_widgets' in 001_add_dashboard_widgets.py: 
  references non-existent down_revision '005'
```

**Solution**:
1. Find the correct parent migration
2. Update `down_revision` to point to existing migration
3. Verify the migration chain is now connected

### Multiple Root Migrations
**Problem**: Multiple migrations with `down_revision = None`
```
[WARNING] Multiple root migrations found (down_revision=None): 
  001, 001_dashboard_widgets
```

**Solution**:
1. Determine which should be the true root
2. Update others to reference appropriate parent
3. Consider if parallel branches are intentional

## Example Session

```bash
$ python scripts/diagnose_migrations.py

Starting Alembic Migration Diagnostics...
======================================================================

Report generated: C:\path\to\migration_audit_report.txt

======================================================================
DIAGNOSTIC SUMMARY
======================================================================
Critical Issues: 5
Warnings: 3
Total Migrations: 67

Critical Issues Found:
  - [ISSUE] Duplicate revision ID '001' found in files: ...
  - [ISSUE] Duplicate revision ID '014' found in files: ...
  - [ISSUE] Duplicate revision ID '015' found in files: ...
  - [ISSUE] Duplicate revision ID '018' found in files: ...
  - [ISSUE] Orphaned migration '001_dashboard_widgets' in ...

Warnings Found:
  - [WARNING] Multiple root migrations found ...
  - [WARNING] Multiple leaf nodes (latest migrations) found ...
  - [WARNING] Unreachable migrations (not in main chain) ...

======================================================================
```

## Next Steps After Running

1. **Review the Report**
   - Open `migration_audit_report.txt`
   - Read through all critical issues
   - Review warnings

2. **Fix Critical Issues First**
   - Resolve duplicate revision IDs
   - Fix orphaned migrations
   - Address syntax errors
   - Break circular dependencies

3. **Address Warnings**
   - Review multiple roots/branches
   - Check for unreachable migrations
   - Verify missing functions

4. **Re-run Diagnostic**
   - Verify all fixes
   - Ensure clean results
   - Document any remaining warnings

5. **Test Migration Chain**
   ```bash
   alembic upgrade head
   ```

## Tips

- Run diagnostic before committing new migrations
- Include in CI/CD pipeline
- Review report after resolving conflicts
- Keep migration chain linear when possible
- Document intentional branches in comments

## Need Help?

1. Check the detailed report in `migration_audit_report.txt`
2. Review the migration graph visualization in the report
3. Look at the "MIGRATION DETAILS" section for specific file info
4. Check "ALEMBIC HISTORY OUTPUT" to see how Alembic views the chain

## Files Created

- ✅ `scripts/diagnose_migrations.py` - The diagnostic script
- ✅ `migration_audit_report.txt` - Generated report (in .gitignore)
- ✅ `scripts/README.md` - Updated with documentation
- ✅ `MIGRATION_DIAGNOSTIC_SUMMARY.md` - Implementation details
- ✅ `QUICK_START_DIAGNOSTIC.md` - This quick reference
