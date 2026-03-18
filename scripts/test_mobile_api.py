#!/usr/bin/env python3
"""
Mobile API Testing Script
Run specific mobile API integration tests with detailed output.
"""

import sys
import subprocess
import argparse
from pathlib import Path


def run_test(test_path: str, verbose: bool = True, coverage: bool = False):
    """Run pytest with specified test path."""
    cmd = ["poetry", "run", "pytest", test_path]
    
    if verbose:
        cmd.append("-v")
    
    if coverage:
        cmd.extend(["--cov=src/api/v1", "--cov-report=term-missing"])
    
    print(f"Running: {' '.join(cmd)}\n")
    result = subprocess.run(cmd)
    return result.returncode


def main():
    parser = argparse.ArgumentParser(
        description="Run mobile API integration tests",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run all mobile API tests
  python scripts/test_mobile_api.py all
  
  # Run device registration tests
  python scripts/test_mobile_api.py devices
  
  # Run study buddy tests with coverage
  python scripts/test_mobile_api.py study-buddy --coverage
  
  # Run authentication tests
  python scripts/test_mobile_api.py auth
        """
    )
    
    parser.add_argument(
        "test_suite",
        choices=[
            "all",
            "devices",
            "study-buddy",
            "homework",
            "auth",
            "student",
            "parent"
        ],
        help="Test suite to run"
    )
    
    parser.add_argument(
        "--coverage",
        "-c",
        action="store_true",
        help="Run with coverage report"
    )
    
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Run with minimal output"
    )
    
    args = parser.parse_args()
    
    test_mapping = {
        "all": "tests/test_mobile_api_integration.py",
        "devices": "tests/test_mobile_api_integration.py::TestNotificationDeviceRegistrationAPI",
        "study-buddy": "tests/test_mobile_api_integration.py::TestStudyBuddyAPI",
        "homework": "tests/test_mobile_api_integration.py::TestHomeworkScannerAPI",
        "auth": "tests/test_mobile_api_integration.py::TestAuthenticationFlowAPI",
        "student": "tests/test_mobile_api_integration.py::TestStudentDashboardAPI",
        "parent": "tests/test_mobile_api_integration.py::TestParentMultiChildAPI",
    }
    
    test_path = test_mapping[args.test_suite]
    verbose = not args.quiet
    
    print("=" * 70)
    print(f"Mobile API Testing - {args.test_suite.upper()}")
    print("=" * 70)
    print()
    
    exit_code = run_test(test_path, verbose=verbose, coverage=args.coverage)
    
    print()
    print("=" * 70)
    if exit_code == 0:
        print("✓ Tests passed successfully!")
    else:
        print("✗ Tests failed!")
    print("=" * 70)
    
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
