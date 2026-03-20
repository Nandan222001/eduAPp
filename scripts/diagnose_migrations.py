#!/usr/bin/env python3
"""
Alembic Migration Diagnostic Script

This script performs comprehensive diagnostics on Alembic migrations to identify:
- Migration chain gaps and conflicts
- Database version state verification
- Duplicate revision IDs
- Syntax errors in migration files
- Orphaned migrations without proper down_revision links
- Circular dependencies
- Missing dependencies

All issues are logged to migration_audit_report.txt
"""

import ast
import os
import re
import subprocess
import sys
from pathlib import Path
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Set, Tuple, Optional


class MigrationDiagnostics:
    def __init__(self, alembic_dir: Path = Path("alembic")):
        self.alembic_dir = alembic_dir
        self.versions_dir = alembic_dir / "versions"
        self.issues: List[str] = []
        self.warnings: List[str] = []
        self.info: List[str] = []
        self.migrations: Dict[str, Dict] = {}
        
    def log_issue(self, message: str):
        """Log a critical issue"""
        self.issues.append(f"[ISSUE] {message}")
        
    def log_warning(self, message: str):
        """Log a warning"""
        self.warnings.append(f"[WARNING] {message}")
        
    def log_info(self, message: str):
        """Log informational message"""
        self.info.append(f"[INFO] {message}")
    
    def run_alembic_history(self) -> Tuple[bool, str]:
        """Execute 'alembic history' to view migration chain"""
        self.log_info("Running 'alembic history' command...")
        try:
            result = subprocess.run(
                ["alembic", "history"],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                self.log_info(f"Alembic history retrieved successfully")
                return True, result.stdout
            else:
                self.log_issue(f"Alembic history command failed with code {result.returncode}")
                self.log_issue(f"Error output: {result.stderr}")
                return False, result.stderr
        except subprocess.TimeoutExpired:
            self.log_issue("Alembic history command timed out")
            return False, "Timeout"
        except FileNotFoundError:
            self.log_warning("Alembic command not found. Skipping alembic history check.")
            return False, "Alembic not found"
        except Exception as e:
            self.log_issue(f"Error running alembic history: {str(e)}")
            return False, str(e)
    
    def run_alembic_current(self) -> Tuple[bool, str]:
        """Execute 'alembic current' to verify database version state"""
        self.log_info("Running 'alembic current' command...")
        try:
            result = subprocess.run(
                ["alembic", "current"],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                self.log_info(f"Current database version retrieved successfully")
                return True, result.stdout
            else:
                self.log_warning(f"Alembic current command failed with code {result.returncode}")
                self.log_warning(f"This may indicate no database connection or uninitialized database")
                return False, result.stderr
        except subprocess.TimeoutExpired:
            self.log_warning("Alembic current command timed out")
            return False, "Timeout"
        except FileNotFoundError:
            self.log_warning("Alembic command not found. Skipping alembic current check.")
            return False, "Alembic not found"
        except Exception as e:
            self.log_warning(f"Error running alembic current: {str(e)}")
            return False, str(e)
    
    def parse_migration_file(self, file_path: Path) -> Optional[Dict]:
        """Parse a migration file to extract metadata"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Try to parse as Python AST for syntax validation
            try:
                tree = ast.parse(content, filename=str(file_path))
                syntax_valid = True
            except SyntaxError as e:
                self.log_issue(f"Syntax error in {file_path.name}: {e}")
                syntax_valid = False
                tree = None
            
            # Extract metadata using regex (more reliable than AST for this)
            revision = None
            down_revision = None
            branch_labels = None
            depends_on = None
            
            # Match revision patterns
            revision_match = re.search(r"revision\s*[:=]\s*['\"]([^'\"]+)['\"]", content)
            if revision_match:
                revision = revision_match.group(1)
            
            # Match down_revision patterns
            down_revision_match = re.search(
                r"down_revision\s*[:=]\s*(?:['\"]([^'\"]+)['\"]|None)", 
                content
            )
            if down_revision_match:
                down_revision = down_revision_match.group(1) if down_revision_match.group(1) else None
            
            # Match branch_labels
            branch_labels_match = re.search(
                r"branch_labels\s*[:=]\s*(?:['\"]([^'\"]+)['\"]|None|\[.*?\])", 
                content
            )
            if branch_labels_match:
                branch_labels = branch_labels_match.group(1)
            
            # Match depends_on
            depends_on_match = re.search(
                r"depends_on\s*[:=]\s*(?:['\"]([^'\"]+)['\"]|None|\[.*?\])", 
                content
            )
            if depends_on_match:
                depends_on = depends_on_match.group(1)
            
            # Check for upgrade and downgrade functions
            has_upgrade = 'def upgrade' in content
            has_downgrade = 'def downgrade' in content
            
            if not revision:
                self.log_issue(f"No revision ID found in {file_path.name}")
            
            if not has_upgrade:
                self.log_warning(f"No upgrade() function found in {file_path.name}")
            
            if not has_downgrade:
                self.log_warning(f"No downgrade() function found in {file_path.name}")
            
            return {
                'file_path': file_path,
                'file_name': file_path.name,
                'revision': revision,
                'down_revision': down_revision,
                'branch_labels': branch_labels,
                'depends_on': depends_on,
                'has_upgrade': has_upgrade,
                'has_downgrade': has_downgrade,
                'syntax_valid': syntax_valid,
                'content_length': len(content)
            }
            
        except Exception as e:
            self.log_issue(f"Error parsing {file_path.name}: {str(e)}")
            return None
    
    def scan_migration_files(self):
        """Scan all migration files in the versions directory"""
        self.log_info(f"Scanning migration files in {self.versions_dir}")
        
        if not self.versions_dir.exists():
            self.log_issue(f"Versions directory does not exist: {self.versions_dir}")
            return
        
        python_files = list(self.versions_dir.glob("*.py"))
        self.log_info(f"Found {len(python_files)} Python files")
        
        for file_path in sorted(python_files):
            if file_path.name == "__init__.py":
                continue
                
            migration_data = self.parse_migration_file(file_path)
            if migration_data and migration_data['revision']:
                self.migrations[migration_data['revision']] = migration_data
    
    def check_duplicate_revisions(self):
        """Check for duplicate revision IDs"""
        self.log_info("Checking for duplicate revision IDs...")
        
        revision_to_files = defaultdict(list)
        for rev_id, data in self.migrations.items():
            revision_to_files[rev_id].append(data['file_name'])
        
        duplicates_found = False
        for rev_id, files in revision_to_files.items():
            if len(files) > 1:
                duplicates_found = True
                self.log_issue(
                    f"Duplicate revision ID '{rev_id}' found in files: {', '.join(files)}"
                )
        
        if not duplicates_found:
            self.log_info("No duplicate revision IDs found")
    
    def check_orphaned_migrations(self):
        """Check for orphaned migrations without proper down_revision links"""
        self.log_info("Checking for orphaned migrations...")
        
        all_revisions = set(self.migrations.keys())
        root_migrations = []
        orphaned_migrations = []
        
        for rev_id, data in self.migrations.items():
            down_rev = data['down_revision']
            
            # Track root migrations (no parent)
            if down_rev is None:
                root_migrations.append(rev_id)
                continue
            
            # Check if down_revision exists
            if down_rev not in all_revisions:
                orphaned_migrations.append({
                    'revision': rev_id,
                    'file': data['file_name'],
                    'missing_parent': down_rev
                })
        
        if len(root_migrations) > 1:
            self.log_warning(
                f"Multiple root migrations found (down_revision=None): "
                f"{', '.join(root_migrations)}"
            )
            self.log_warning("This may indicate separate migration branches")
        elif len(root_migrations) == 0:
            self.log_warning("No root migration found (all have down_revision set)")
        else:
            self.log_info(f"Single root migration found: {root_migrations[0]}")
        
        if orphaned_migrations:
            for orphan in orphaned_migrations:
                self.log_issue(
                    f"Orphaned migration '{orphan['revision']}' in {orphan['file']}: "
                    f"references non-existent down_revision '{orphan['missing_parent']}'"
                )
        else:
            self.log_info("No orphaned migrations found")
    
    def check_circular_dependencies(self):
        """Check for circular dependencies in migration chain"""
        self.log_info("Checking for circular dependencies...")
        
        def has_cycle(node: str, visited: Set[str], rec_stack: Set[str]) -> Optional[List[str]]:
            """DFS to detect cycles, returns cycle path if found"""
            visited.add(node)
            rec_stack.add(node)
            
            if node in self.migrations:
                down_rev = self.migrations[node]['down_revision']
                if down_rev:
                    if down_rev not in visited:
                        cycle = has_cycle(down_rev, visited, rec_stack)
                        if cycle:
                            cycle.append(node)
                            return cycle
                    elif down_rev in rec_stack:
                        return [down_rev, node]
            
            rec_stack.remove(node)
            return None
        
        visited = set()
        cycles_found = []
        
        for rev_id in self.migrations.keys():
            if rev_id not in visited:
                cycle = has_cycle(rev_id, visited, set())
                if cycle:
                    cycles_found.append(cycle)
        
        if cycles_found:
            for cycle in cycles_found:
                cycle_str = " -> ".join(reversed(cycle))
                self.log_issue(f"Circular dependency detected: {cycle_str}")
        else:
            self.log_info("No circular dependencies found")
    
    def check_migration_chain_integrity(self):
        """Check the integrity of the migration chain"""
        self.log_info("Checking migration chain integrity...")
        
        # Build adjacency map (child -> parent)
        chain_map = {}
        for rev_id, data in self.migrations.items():
            chain_map[rev_id] = data['down_revision']
        
        # Find all leaf nodes (migrations with no children)
        all_revisions = set(chain_map.keys())
        referenced_revisions = set(v for v in chain_map.values() if v is not None)
        leaf_nodes = all_revisions - referenced_revisions
        
        if len(leaf_nodes) > 1:
            self.log_warning(
                f"Multiple leaf nodes (latest migrations) found: {', '.join(leaf_nodes)}"
            )
            self.log_warning("This may indicate parallel migration branches")
        elif len(leaf_nodes) == 1:
            self.log_info(f"Single leaf node (latest migration): {list(leaf_nodes)[0]}")
        else:
            self.log_warning("No leaf nodes found - possible circular reference")
        
        # Check for gaps in the chain
        visited = set()
        for leaf in leaf_nodes:
            current = leaf
            path_length = 0
            while current is not None and current in chain_map:
                if current in visited:
                    break  # Already traversed this path
                visited.add(current)
                current = chain_map[current]
                path_length += 1
                if path_length > len(all_revisions):
                    self.log_issue(f"Infinite loop detected starting from {leaf}")
                    break
        
        unreachable = all_revisions - visited
        if unreachable:
            self.log_warning(
                f"Unreachable migrations (not in main chain): {', '.join(unreachable)}"
            )
    
    def check_syntax_errors(self):
        """Report on any syntax errors found during scanning"""
        self.log_info("Checking for syntax errors...")
        
        syntax_errors = [
            data for data in self.migrations.values() 
            if not data.get('syntax_valid', True)
        ]
        
        if syntax_errors:
            self.log_issue(f"Found {len(syntax_errors)} files with syntax errors")
        else:
            self.log_info("No syntax errors found in migration files")
    
    def generate_migration_graph(self) -> str:
        """Generate a text-based migration graph"""
        lines = ["Migration Chain Visualization:", "=" * 50]
        
        # Find root(s)
        roots = [
            rev_id for rev_id, data in self.migrations.items()
            if data['down_revision'] is None
        ]
        
        def traverse(node: str, indent: int = 0, visited: Set[str] = None):
            if visited is None:
                visited = set()
            
            if node in visited:
                return ["  " * indent + f"[{node}] (circular reference)"]
            
            visited.add(node)
            result = []
            
            if node in self.migrations:
                data = self.migrations[node]
                result.append("  " * indent + f"[{node}] ({data['file_name']})")
                
                # Find children
                children = [
                    rev_id for rev_id, child_data in self.migrations.items()
                    if child_data['down_revision'] == node
                ]
                
                for child in sorted(children):
                    result.extend(traverse(child, indent + 1, visited.copy()))
            else:
                result.append("  " * indent + f"[{node}] (MISSING)")
            
            return result
        
        for root in sorted(roots):
            lines.extend(traverse(root))
        
        # Handle orphaned nodes not connected to any root
        all_nodes = set(self.migrations.keys())
        connected_nodes = set()
        
        def collect_connected(node: str):
            if node in self.migrations:
                connected_nodes.add(node)
                children = [
                    rev_id for rev_id, data in self.migrations.items()
                    if data['down_revision'] == node
                ]
                for child in children:
                    collect_connected(child)
        
        for root in roots:
            collect_connected(root)
        
        disconnected = all_nodes - connected_nodes
        if disconnected:
            lines.append("\nDisconnected migrations:")
            for node in sorted(disconnected):
                lines.append(f"  [{node}] ({self.migrations[node]['file_name']})")
        
        return "\n".join(lines)
    
    def run_diagnostics(self):
        """Run all diagnostic checks"""
        print("Starting Alembic Migration Diagnostics...")
        print("=" * 70)
        
        # Scan migration files
        self.scan_migration_files()
        
        if not self.migrations:
            self.log_issue("No migration files found!")
            return
        
        self.log_info(f"Total migrations found: {len(self.migrations)}")
        
        # Run all checks
        self.check_duplicate_revisions()
        self.check_orphaned_migrations()
        self.check_circular_dependencies()
        self.check_migration_chain_integrity()
        self.check_syntax_errors()
        
        # Run alembic commands
        success, output = self.run_alembic_history()
        if success:
            self.log_info("Alembic history output captured successfully")
        
        success, output = self.run_alembic_current()
        if success:
            self.log_info(f"Current database version: {output.strip()}")
        
        # Generate report
        self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive audit report"""
        report_path = Path("migration_audit_report.txt")
        
        with open(report_path, 'w', encoding='utf-8') as f:
            # Header
            f.write("=" * 70 + "\n")
            f.write("ALEMBIC MIGRATION DIAGNOSTIC REPORT\n")
            f.write("=" * 70 + "\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Alembic Directory: {self.alembic_dir.absolute()}\n")
            f.write(f"Total Migrations: {len(self.migrations)}\n")
            f.write("=" * 70 + "\n\n")
            
            # Summary
            f.write("SUMMARY\n")
            f.write("-" * 70 + "\n")
            f.write(f"Critical Issues: {len(self.issues)}\n")
            f.write(f"Warnings: {len(self.warnings)}\n")
            f.write(f"Info Messages: {len(self.info)}\n")
            f.write("\n")
            
            # Critical Issues
            if self.issues:
                f.write("CRITICAL ISSUES\n")
                f.write("-" * 70 + "\n")
                for issue in self.issues:
                    f.write(f"{issue}\n")
                f.write("\n")
            
            # Warnings
            if self.warnings:
                f.write("WARNINGS\n")
                f.write("-" * 70 + "\n")
                for warning in self.warnings:
                    f.write(f"{warning}\n")
                f.write("\n")
            
            # Info
            if self.info:
                f.write("INFORMATION\n")
                f.write("-" * 70 + "\n")
                for info in self.info:
                    f.write(f"{info}\n")
                f.write("\n")
            
            # Migration Details
            f.write("MIGRATION DETAILS\n")
            f.write("-" * 70 + "\n")
            for rev_id in sorted(self.migrations.keys()):
                data = self.migrations[rev_id]
                f.write(f"\nRevision: {rev_id}\n")
                f.write(f"  File: {data['file_name']}\n")
                f.write(f"  Down Revision: {data['down_revision']}\n")
                f.write(f"  Branch Labels: {data['branch_labels']}\n")
                f.write(f"  Depends On: {data['depends_on']}\n")
                f.write(f"  Has Upgrade: {data['has_upgrade']}\n")
                f.write(f"  Has Downgrade: {data['has_downgrade']}\n")
                f.write(f"  Syntax Valid: {data['syntax_valid']}\n")
            f.write("\n")
            
            # Migration Graph
            f.write("MIGRATION CHAIN GRAPH\n")
            f.write("-" * 70 + "\n")
            f.write(self.generate_migration_graph())
            f.write("\n\n")
            
            # Alembic History
            f.write("ALEMBIC HISTORY OUTPUT\n")
            f.write("-" * 70 + "\n")
            success, output = self.run_alembic_history()
            if success:
                f.write(output)
            else:
                f.write(f"Failed to retrieve alembic history: {output}\n")
            f.write("\n")
            
            # Alembic Current
            f.write("ALEMBIC CURRENT OUTPUT\n")
            f.write("-" * 70 + "\n")
            success, output = self.run_alembic_current()
            if success:
                f.write(output)
            else:
                f.write(f"Failed to retrieve current version: {output}\n")
            f.write("\n")
            
            # Footer
            f.write("=" * 70 + "\n")
            f.write("END OF REPORT\n")
            f.write("=" * 70 + "\n")
        
        print(f"\nReport generated: {report_path.absolute()}")
        
        # Print summary to console
        print("\n" + "=" * 70)
        print("DIAGNOSTIC SUMMARY")
        print("=" * 70)
        print(f"Critical Issues: {len(self.issues)}")
        print(f"Warnings: {len(self.warnings)}")
        print(f"Total Migrations: {len(self.migrations)}")
        
        if self.issues:
            print("\nCritical Issues Found:")
            for issue in self.issues[:10]:  # Show first 10
                print(f"  - {issue}")
            if len(self.issues) > 10:
                print(f"  ... and {len(self.issues) - 10} more (see report)")
        
        if self.warnings:
            print("\nWarnings Found:")
            for warning in self.warnings[:5]:  # Show first 5
                print(f"  - {warning}")
            if len(self.warnings) > 5:
                print(f"  ... and {len(self.warnings) - 5} more (see report)")
        
        print("\n" + "=" * 70)


def main():
    """Main entry point"""
    # Change to repo root if script is run from scripts directory
    script_dir = Path(__file__).parent
    if script_dir.name == "scripts":
        os.chdir(script_dir.parent)
    
    diagnostics = MigrationDiagnostics()
    diagnostics.run_diagnostics()
    
    # Exit with error code if critical issues found
    if diagnostics.issues:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
