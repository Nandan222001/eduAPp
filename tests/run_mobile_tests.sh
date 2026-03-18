#!/bin/bash

# Mobile API Test Runner Script
# This script runs the mobile API integration tests

set -e

echo "========================================"
echo "Mobile API Integration Test Suite"
echo "========================================"
echo ""

# Check if poetry is available
if ! command -v poetry &> /dev/null; then
    echo "Error: Poetry is not installed"
    echo "Please install poetry: pip install poetry"
    exit 1
fi

# Function to run tests
run_tests() {
    local test_path=$1
    local test_name=$2
    
    echo "Running: $test_name"
    echo "----------------------------------------"
    poetry run pytest "$test_path" -v --tb=short
    echo ""
}

# Parse command line arguments
case "${1:-all}" in
    all)
        echo "Running all mobile API tests..."
        echo ""
        run_tests "tests/test_mobile_api_integration.py" "All Mobile API Tests"
        run_tests "tests/test_parent_multi_child.py" "Parent Multi-Child Tests"
        ;;
    devices)
        run_tests "tests/test_mobile_api_integration.py::TestNotificationDeviceRegistrationAPI" "Device Registration Tests"
        ;;
    study-buddy)
        run_tests "tests/test_mobile_api_integration.py::TestStudyBuddyAPI" "Study Buddy Tests"
        ;;
    homework)
        run_tests "tests/test_mobile_api_integration.py::TestHomeworkScannerAPI" "Homework Scanner Tests"
        ;;
    auth)
        run_tests "tests/test_mobile_api_integration.py::TestAuthenticationFlowAPI" "Authentication Tests"
        ;;
    student)
        run_tests "tests/test_mobile_api_integration.py::TestStudentDashboardAPI" "Student Dashboard Tests"
        ;;
    parent)
        run_tests "tests/test_mobile_api_integration.py::TestParentMultiChildAPI" "Parent Dashboard Tests"
        run_tests "tests/test_parent_multi_child.py" "Parent Multi-Child Integration Tests"
        ;;
    coverage)
        echo "Running tests with coverage report..."
        echo ""
        poetry run pytest tests/test_mobile_api_integration.py tests/test_parent_multi_child.py \
            --cov=src/api/v1 \
            --cov=src/services \
            --cov-report=term-missing \
            --cov-report=html \
            -v
        echo ""
        echo "Coverage report generated in htmlcov/index.html"
        ;;
    *)
        echo "Usage: $0 [all|devices|study-buddy|homework|auth|student|parent|coverage]"
        echo ""
        echo "Examples:"
        echo "  $0              # Run all tests"
        echo "  $0 all          # Run all tests"
        echo "  $0 devices      # Run device registration tests"
        echo "  $0 study-buddy  # Run study buddy tests"
        echo "  $0 parent       # Run parent multi-child tests"
        echo "  $0 coverage     # Run all tests with coverage report"
        exit 1
        ;;
esac

echo "========================================"
echo "Test execution completed!"
echo "========================================"
