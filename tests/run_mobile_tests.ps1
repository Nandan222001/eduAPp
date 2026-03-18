# Mobile API Test Runner Script (PowerShell)
# This script runs the mobile API integration tests

param(
    [string]$TestSuite = "all"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mobile API Integration Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if poetry is available
$poetryExists = Get-Command poetry -ErrorAction SilentlyContinue
if (-not $poetryExists) {
    Write-Host "Error: Poetry is not installed" -ForegroundColor Red
    Write-Host "Please install poetry: pip install poetry"
    exit 1
}

# Function to run tests
function Run-Tests {
    param(
        [string]$TestPath,
        [string]$TestName
    )
    
    Write-Host "Running: $TestName" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    poetry run pytest $TestPath -v --tb=short
    Write-Host ""
}

# Run tests based on suite selection
switch ($TestSuite) {
    "all" {
        Write-Host "Running all mobile API tests..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/test_mobile_api_integration.py" "All Mobile API Tests"
        Run-Tests "tests/test_parent_multi_child.py" "Parent Multi-Child Tests"
    }
    "devices" {
        Run-Tests "tests/test_mobile_api_integration.py::TestNotificationDeviceRegistrationAPI" "Device Registration Tests"
    }
    "study-buddy" {
        Run-Tests "tests/test_mobile_api_integration.py::TestStudyBuddyAPI" "Study Buddy Tests"
    }
    "homework" {
        Run-Tests "tests/test_mobile_api_integration.py::TestHomeworkScannerAPI" "Homework Scanner Tests"
    }
    "auth" {
        Run-Tests "tests/test_mobile_api_integration.py::TestAuthenticationFlowAPI" "Authentication Tests"
    }
    "student" {
        Run-Tests "tests/test_mobile_api_integration.py::TestStudentDashboardAPI" "Student Dashboard Tests"
    }
    "parent" {
        Run-Tests "tests/test_mobile_api_integration.py::TestParentMultiChildAPI" "Parent Dashboard Tests"
        Run-Tests "tests/test_parent_multi_child.py" "Parent Multi-Child Integration Tests"
    }
    "coverage" {
        Write-Host "Running tests with coverage report..." -ForegroundColor Green
        Write-Host ""
        poetry run pytest tests/test_mobile_api_integration.py tests/test_parent_multi_child.py `
            --cov=src/api/v1 `
            --cov=src/services `
            --cov-report=term-missing `
            --cov-report=html `
            -v
        Write-Host ""
        Write-Host "Coverage report generated in htmlcov/index.html" -ForegroundColor Green
    }
    default {
        Write-Host "Usage: .\run_mobile_tests.ps1 [all|devices|study-buddy|homework|auth|student|parent|coverage]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Cyan
        Write-Host "  .\run_mobile_tests.ps1              # Run all tests"
        Write-Host "  .\run_mobile_tests.ps1 all          # Run all tests"
        Write-Host "  .\run_mobile_tests.ps1 devices      # Run device registration tests"
        Write-Host "  .\run_mobile_tests.ps1 study-buddy  # Run study buddy tests"
        Write-Host "  .\run_mobile_tests.ps1 parent       # Run parent multi-child tests"
        Write-Host "  .\run_mobile_tests.ps1 coverage     # Run all tests with coverage report"
        exit 1
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test execution completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
