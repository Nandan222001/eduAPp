#!/usr/bin/env python3
"""
Validate migration files for MySQL compatibility issues.

This script scans all Alembic migration files and warns about:
- Boolean columns using string defaults ('true'/'false') instead of numeric (0/1)
- Other MySQL compatibility issues

This ensures migrations work correctly with MySQL's TINYINT(1) boolean representation.
"""
import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict


class MigrationIssue:
    """Represents an issue found in a migration file."""
    
    def __init__(
        self,
        file_path: str,
        line_num: int,
        severity: str,
        issue_type: str,
        description: str,
        line_content: str,
        suggestion: str = "",
    ):
        self.file_path = file_path
        self.line_num = line_num
        self.severity = severity
        self.issue_type = issue_type
        self.description = description
        self.line_content = line_content
        self.suggestion = suggestion


# Patterns to detect Boolean columns with string defaults
BOOLEAN_STRING_DEFAULT_PATTERNS = [
    # server_default with string true/false
    (
        r'sa\.Boolean\([^)]*\).*server_default\s*=\s*["\'](?:true|false|True|False|TRUE|FALSE)["\']',
        "Boolean column using string server_default",
        "Use server_default=sa.text('0') or server_default=sa.text('1') for MySQL compatibility",
    ),
    # server_default with text() containing string true/false
    (
        r'sa\.Boolean\([^)]*\).*server_default\s*=\s*sa\.text\(["\'](?:true|false|True|False|TRUE|FALSE)["\']\)',
        "Boolean column using text() with string server_default",
        "Use server_default=sa.text('0') or server_default=sa.text('1') for MySQL compatibility",
    ),
    # default parameter with string true/false
    (
        r'sa\.Boolean\([^)]*default\s*=\s*["\'](?:true|false|True|False|TRUE|FALSE)["\']',
        "Boolean column using string default parameter",
        "Use default=False or default=True (Python bool), or server_default=sa.text('0')/sa.text('1')",
    ),
    # Column() with Boolean type and string defaults
    (
        r'sa\.Column\([^,]+,\s*sa\.Boolean\([^)]*\).*server_default\s*=\s*["\'](?:true|false|True|False|TRUE|FALSE)["\']',
        "Boolean column using string server_default",
        "Use server_default=sa.text('0') or server_default=sa.text('1') for MySQL compatibility",
    ),
]

# Additional MySQL compatibility patterns
MYSQL_COMPATIBILITY_PATTERNS = [
    # PostgreSQL-specific boolean literals
    (
        r'server_default\s*=\s*sa\.text\(["\'](?:TRUE|FALSE)["\']\)',
        "PostgreSQL-specific boolean literal",
        "Use server_default=sa.text('0') or server_default=sa.text('1') for MySQL compatibility",
    ),
]


def find_migration_files(migrations_dir: Path) -> List[Path]:
    """Find all Python migration files in the versions directory."""
    versions_dir = migrations_dir / "versions"
    if not versions_dir.exists():
        return []
    
    return sorted(versions_dir.glob("*.py"))


def scan_migration_file(file_path: Path) -> List[MigrationIssue]:
    """Scan a migration file for compatibility issues."""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            
            for line_num, line in enumerate(lines, start=1):
                # Skip comments and blank lines
                stripped = line.strip()
                if not stripped or stripped.startswith('#'):
                    continue
                
                # Check for Boolean string default patterns
                for pattern, issue_type, suggestion in BOOLEAN_STRING_DEFAULT_PATTERNS:
                    if re.search(pattern, line, re.IGNORECASE):
                        issues.append(MigrationIssue(
                            file_path=str(file_path),
                            line_num=line_num,
                            severity="ERROR",
                            issue_type=issue_type,
                            description="Boolean columns must use numeric defaults (0/1) for MySQL",
                            line_content=line.strip(),
                            suggestion=suggestion,
                        ))
                
                # Check for other MySQL compatibility issues
                for pattern, issue_type, suggestion in MYSQL_COMPATIBILITY_PATTERNS:
                    if re.search(pattern, line, re.IGNORECASE):
                        issues.append(MigrationIssue(
                            file_path=str(file_path),
                            line_num=line_num,
                            severity="WARNING",
                            issue_type=issue_type,
                            description="Use MySQL-compatible boolean representation",
                            line_content=line.strip(),
                            suggestion=suggestion,
                        ))
    
    except Exception as e:
        print(f"Warning: Could not scan {file_path}: {e}", file=sys.stderr)
    
    return issues


def group_issues_by_file(issues: List[MigrationIssue]) -> Dict[str, List[MigrationIssue]]:
    """Group issues by file path."""
    grouped = {}
    for issue in issues:
        if issue.file_path not in grouped:
            grouped[issue.file_path] = []
        grouped[issue.file_path].append(issue)
    return grouped


def print_report(issues: List[MigrationIssue], verbose: bool = False) -> None:
    """Print a formatted report of all issues found."""
    if not issues:
        print("\n" + "=" * 80)
        print("✓ MIGRATION VALIDATION PASSED")
        print("=" * 80)
        print("\nNo MySQL compatibility issues found in migration files.")
        print()
        return
    
    errors = [i for i in issues if i.severity == "ERROR"]
    warnings = [i for i in issues if i.severity == "WARNING"]
    
    print("\n" + "=" * 80)
    print("✗ MIGRATION VALIDATION FAILED")
    print("=" * 80)
    print(f"\nFound {len(errors)} error(s) and {len(warnings)} warning(s)\n")
    
    # Group issues by file
    grouped = group_issues_by_file(issues)
    
    for file_path in sorted(grouped.keys()):
        file_issues = grouped[file_path]
        print(f"\n📄 {file_path}")
        print("-" * 80)
        
        for issue in file_issues:
            severity_icon = "❌" if issue.severity == "ERROR" else "⚠️"
            print(f"\n{severity_icon} Line {issue.line_num}: {issue.issue_type}")
            print(f"   {issue.description}")
            
            if verbose or issue.severity == "ERROR":
                print(f"   Code: {issue.line_content[:100]}")
                if len(issue.line_content) > 100:
                    print("          ...")
                
                if issue.suggestion:
                    print(f"   💡 Suggestion: {issue.suggestion}")
    
    print("\n" + "=" * 80)
    print("\nMYSQL BOOLEAN COLUMN BEST PRACTICES:")
    print("-" * 80)
    print("✓ Use server_default=sa.text('0') or sa.text('1') for boolean columns")
    print("✓ Use Python bool (True/False) for default parameter (application-level default)")
    print("✗ Avoid string literals like 'true', 'false', 'TRUE', 'FALSE'")
    print("\nExample:")
    print("  sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1'))")
    print("=" * 80)
    print()


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Validate Alembic migrations for MySQL compatibility"
    )
    parser.add_argument(
        "--migrations-dir",
        type=Path,
        default=Path("alembic"),
        help="Path to Alembic migrations directory (default: alembic)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show verbose output including all code snippets",
    )
    parser.add_argument(
        "--file",
        type=Path,
        help="Validate a specific migration file",
    )
    
    args = parser.parse_args()
    
    all_issues = []
    
    if args.file:
        # Validate a specific file
        if not args.file.exists():
            print(f"Error: File not found: {args.file}", file=sys.stderr)
            return 1
        
        print(f"Validating migration file: {args.file}")
        issues = scan_migration_file(args.file)
        all_issues.extend(issues)
    else:
        # Validate all migration files
        migration_files = find_migration_files(args.migrations_dir)
        
        if not migration_files:
            print(f"No migration files found in {args.migrations_dir}/versions/")
            return 0
        
        print(f"Scanning {len(migration_files)} migration file(s)...")
        
        for migration_file in migration_files:
            issues = scan_migration_file(migration_file)
            all_issues.extend(issues)
    
    # Print report
    print_report(all_issues, verbose=args.verbose)
    
    # Return exit code
    errors = [i for i in all_issues if i.severity == "ERROR"]
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
