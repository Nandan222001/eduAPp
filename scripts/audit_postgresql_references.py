#!/usr/bin/env python3
"""
Comprehensive audit script to find PostgreSQL references in the codebase.

This script searches for:
- postgresql, postgres keywords
- psycopg, psycopg2, psycopg3 references
- pg_ prefixed identifiers
- PostgreSQL-specific types (ARRAY, JSONB, etc.)
- postgresql_using dialect hints
- Other PostgreSQL-specific patterns

Usage:
    python scripts/audit_postgresql_references.py
    python scripts/audit_postgresql_references.py --verbose
    python scripts/audit_postgresql_references.py --output report.txt
"""
import argparse
import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Set, Tuple
from collections import defaultdict


class PostgreSQLAuditor:
    """Audit codebase for PostgreSQL references."""
    
    POSTGRESQL_KEYWORDS = [
        r'\bpostgresql\b',
        r'\bpostgres\b',
        r'\bpsycopg\b',
        r'\bpsycopg2\b',
        r'\bpsycopg3\b',
        r'\bpg_',
        r'\bARRAY\b',
        r'\bJSONB\b',
        r'\bpostgresql_using\b',
        r'\bTSVECTOR\b',
        r'\bTSQUERY\b',
        r'\bHSTORE\b',
        r'\bUUID\b',
        r'\bINET\b',
        r'\bCIDR\b',
        r'\bMACADDR\b',
        r'\bINTERVAL\b',
        r'\bBIGSERIAL\b',
        r'\bSERIAL\b',
        r'\bpostgres://',
        r'\bpostgresql://',
        r'\.pg\b',
        r'_pg\b',
        r'pg\.',
        r'Pg[A-Z]',
        r'PG[A-Z]',
    ]
    
    EXCLUDED_DIRS = {
        '.git',
        '__pycache__',
        'node_modules',
        '.venv',
        'venv',
        'env',
        '.pytest_cache',
        '.mypy_cache',
        '.tox',
        'dist',
        'build',
        '.eggs',
        '*.egg-info',
        'logs',
        'backups',
    }
    
    EXCLUDED_FILES = {
        '.pyc',
        '.pyo',
        '.pyd',
        '.so',
        '.dll',
        '.dylib',
        '.exe',
        '.bin',
        '.lock',
        '.log',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.ico',
        '.svg',
        '.pdf',
        '.zip',
        '.tar',
        '.gz',
        '.bz2',
    }
    
    INCLUDED_EXTENSIONS = {
        '.py',
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.sql',
        '.md',
        '.txt',
        '.yml',
        '.yaml',
        '.json',
        '.toml',
        '.ini',
        '.cfg',
        '.conf',
        '.sh',
        '.bash',
        '.ps1',
        '.env',
        '.example',
        '.template',
        '.dockerfile',
        'Dockerfile',
        'Makefile',
    }
    
    def __init__(self, root_dir: str = '.', verbose: bool = False):
        """Initialize auditor."""
        self.root_dir = Path(root_dir).resolve()
        self.verbose = verbose
        self.findings: Dict[str, List[Tuple[int, str, str]]] = defaultdict(list)
        self.patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.POSTGRESQL_KEYWORDS]
        self.files_scanned = 0
        self.total_matches = 0
    
    def should_scan_file(self, file_path: Path) -> bool:
        """Determine if file should be scanned."""
        if any(excluded in file_path.parts for excluded in self.EXCLUDED_DIRS):
            return False
        
        if any(file_path.name.endswith(ext) for ext in self.EXCLUDED_FILES):
            return False
        
        if file_path.suffix in self.INCLUDED_EXTENSIONS:
            return True
        
        if file_path.name in ['Dockerfile', 'Makefile', 'Dockerfile.prod']:
            return True
        
        if file_path.suffix == '' and file_path.stat().st_size < 1000000:
            try:
                with open(file_path, 'rb') as f:
                    chunk = f.read(512)
                    return b'\x00' not in chunk
            except:
                return False
        
        return False
    
    def scan_file(self, file_path: Path) -> None:
        """Scan a single file for PostgreSQL references."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            
            for line_num, line in enumerate(lines, start=1):
                for pattern in self.patterns:
                    matches = pattern.finditer(line)
                    for match in matches:
                        matched_text = match.group(0)
                        relative_path = file_path.relative_to(self.root_dir)
                        self.findings[str(relative_path)].append(
                            (line_num, line.rstrip(), matched_text)
                        )
                        self.total_matches += 1
                        
                        if self.verbose:
                            print(f"  Found '{matched_text}' at {relative_path}:{line_num}")
        
        except Exception as e:
            if self.verbose:
                print(f"  Error scanning {file_path}: {e}")
    
    def scan_directory(self) -> None:
        """Recursively scan directory for PostgreSQL references."""
        print(f"\nScanning directory: {self.root_dir}")
        print(f"Looking for PostgreSQL references...\n")
        
        for root, dirs, files in os.walk(self.root_dir):
            dirs[:] = [d for d in dirs if d not in self.EXCLUDED_DIRS]
            
            for file in files:
                file_path = Path(root) / file
                
                if self.should_scan_file(file_path):
                    self.files_scanned += 1
                    
                    if self.verbose and self.files_scanned % 100 == 0:
                        print(f"Scanned {self.files_scanned} files...")
                    
                    self.scan_file(file_path)
    
    def generate_report(self, output_file: str = None) -> str:
        """Generate audit report."""
        report_lines = []
        
        report_lines.append("=" * 80)
        report_lines.append("PostgreSQL References Audit Report")
        report_lines.append("=" * 80)
        report_lines.append("")
        
        report_lines.append(f"Root Directory: {self.root_dir}")
        report_lines.append(f"Files Scanned: {self.files_scanned}")
        report_lines.append(f"Files with Matches: {len(self.findings)}")
        report_lines.append(f"Total Matches: {self.total_matches}")
        report_lines.append("")
        
        if not self.findings:
            report_lines.append("✓ SUCCESS: No PostgreSQL references found!")
            report_lines.append("")
            report_lines.append("The codebase appears to be clean of PostgreSQL-specific code.")
        else:
            report_lines.append("✗ FOUND POSTGRESQL REFERENCES")
            report_lines.append("")
            report_lines.append(f"PostgreSQL references found in {len(self.findings)} files:")
            report_lines.append("")
            
            keyword_counts = defaultdict(int)
            
            for file_path in sorted(self.findings.keys()):
                matches = self.findings[file_path]
                report_lines.append("-" * 80)
                report_lines.append(f"File: {file_path}")
                report_lines.append(f"Matches: {len(matches)}")
                report_lines.append("-" * 80)
                
                for line_num, line, matched_text in matches:
                    keyword_counts[matched_text.lower()] += 1
                    report_lines.append(f"  Line {line_num}: {matched_text}")
                    report_lines.append(f"    {line.strip()}")
                    report_lines.append("")
            
            report_lines.append("=" * 80)
            report_lines.append("Summary by Keyword")
            report_lines.append("=" * 80)
            report_lines.append("")
            
            for keyword, count in sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True):
                report_lines.append(f"  {keyword}: {count} occurrences")
            
            report_lines.append("")
        
        report_lines.append("=" * 80)
        report_lines.append("Audit Complete")
        report_lines.append("=" * 80)
        report_lines.append("")
        
        report = "\n".join(report_lines)
        
        if output_file:
            output_path = Path(output_file)
            output_path.write_text(report, encoding='utf-8')
            print(f"\nReport saved to: {output_path}")
        
        return report
    
    def print_summary(self) -> None:
        """Print summary to console."""
        print("\n" + "=" * 80)
        print("AUDIT SUMMARY")
        print("=" * 80)
        print(f"Files Scanned: {self.files_scanned}")
        print(f"Files with PostgreSQL References: {len(self.findings)}")
        print(f"Total Matches: {self.total_matches}")
        print("=" * 80)
        
        if self.total_matches == 0:
            print("\n✓ SUCCESS: No PostgreSQL references found!")
            print("The codebase is clean of PostgreSQL-specific code.\n")
        else:
            print(f"\n✗ FOUND: {self.total_matches} PostgreSQL references in {len(self.findings)} files")
            print("\nFiles with references:")
            for file_path in sorted(self.findings.keys())[:20]:
                count = len(self.findings[file_path])
                print(f"  - {file_path} ({count} matches)")
            
            if len(self.findings) > 20:
                print(f"  ... and {len(self.findings) - 20} more files")
            
            print("\nRun with --output to save full report to file.\n")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Audit codebase for PostgreSQL references",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/audit_postgresql_references.py
  python scripts/audit_postgresql_references.py --verbose
  python scripts/audit_postgresql_references.py --output postgresql_audit.txt
  python scripts/audit_postgresql_references.py --root-dir /path/to/project
        """
    )
    
    parser.add_argument(
        '--root-dir',
        default='.',
        help='Root directory to scan (default: current directory)'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output during scanning'
    )
    
    parser.add_argument(
        '-o', '--output',
        help='Output file for detailed report'
    )
    
    args = parser.parse_args()
    
    auditor = PostgreSQLAuditor(
        root_dir=args.root_dir,
        verbose=args.verbose
    )
    
    auditor.scan_directory()
    
    if args.output:
        auditor.generate_report(output_file=args.output)
    
    auditor.print_summary()
    
    sys.exit(0 if auditor.total_matches == 0 else 1)


if __name__ == "__main__":
    main()
