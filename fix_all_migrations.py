#!/usr/bin/env python
"""
Fix all Alembic migration files to use MySQL-compatible datetime defaults.

This script:
1. Finds all migration files with 'now()' server defaults
2. Replaces them with 'CURRENT_TIMESTAMP'
3. Adds timezone=False to DateTime columns
4. Handles ON UPDATE CURRENT_TIMESTAMP for updated_at columns
"""

import re
from pathlib import Path

def fix_migration_file(file_path):
    """Fix a single migration file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes_made = []
    
    # Pattern 1: Fix DateTime() without timezone=False
    # Replace sa.DateTime() with sa.DateTime(timezone=False)
    pattern1 = r'sa\.DateTime\(\)'
    replacement1 = r'sa.DateTime(timezone=False)'
    if re.search(pattern1, content):
        content = re.sub(pattern1, replacement1, content)
        changes_made.append("Added timezone=False to DateTime columns")
    
    # Pattern 2: Fix server_default=sa.text('now()')
    # Replace with server_default=sa.text('CURRENT_TIMESTAMP')
    pattern2 = r"server_default=sa\.text\('now\(\)'\)"
    replacement2 = r"server_default=sa.text('CURRENT_TIMESTAMP')"
    if re.search(pattern2, content):
        content = re.sub(pattern2, replacement2, content)
        changes_made.append("Replaced now() with CURRENT_TIMESTAMP")
    
    # Pattern 3: Handle updated_at columns specially
    # For updated_at, we want CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    pattern3 = r"sa\.Column\('updated_at',\s*sa\.DateTime\(timezone=False\),\s*nullable=False,\s*server_default=sa\.text\('CURRENT_TIMESTAMP'\)\)"
    replacement3 = r"sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))"
    if re.search(pattern3, content):
        content = re.sub(pattern3, replacement3, content)
        changes_made.append("Added ON UPDATE CURRENT_TIMESTAMP to updated_at")
    
    # Pattern 4: Handle cases where DateTime(timezone=False) is already there but needs now() fix
    pattern4 = r"sa\.DateTime\(timezone=False\),\s*nullable=(True|False),\s*server_default=sa\.text\('now\(\)'\)"
    replacement4 = r"sa.DateTime(timezone=False), nullable=\1, server_default=sa.text('CURRENT_TIMESTAMP')"
    if re.search(pattern4, content):
        content = re.sub(pattern4, replacement4, content)
        if "Replaced now() with CURRENT_TIMESTAMP" not in changes_made:
            changes_made.append("Replaced now() with CURRENT_TIMESTAMP")
    
    # Write back if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, changes_made
    
    return False, []

def main():
    """Main execution function."""
    print("=" * 80)
    print("MySQL Migration Fixer")
    print("=" * 80)
    print()
    
    versions_dir = Path("alembic/versions")
    
    if not versions_dir.exists():
        print("ERROR: alembic/versions directory not found!")
        return 1
    
    # Get all Python files except __pycache__
    migration_files = sorted([f for f in versions_dir.glob("*.py") if not f.name.startswith("__")])
    
    print(f"Found {len(migration_files)} migration files to check")
    print()
    
    fixed_count = 0
    skipped_count = 0
    
    for file_path in migration_files:
        was_fixed, changes = fix_migration_file(file_path)
        
        if was_fixed:
            fixed_count += 1
            print(f"✓ FIXED: {file_path.name}")
            for change in changes:
                print(f"    - {change}")
        else:
            skipped_count += 1
            print(f"  SKIPPED: {file_path.name} (no changes needed)")
    
    print()
    print("=" * 80)
    print(f"Summary:")
    print(f"  Fixed: {fixed_count} files")
    print(f"  Skipped: {skipped_count} files")
    print("=" * 80)
    
    if fixed_count > 0:
        print()
        print("✓ All migration files have been fixed!")
        print("  Next steps:")
        print("  1. Review the changes to ensure they're correct")
        print("  2. Run: alembic downgrade base")
        print("  3. Run: alembic upgrade head")
        print("  4. Verify tables are created without errors")
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
