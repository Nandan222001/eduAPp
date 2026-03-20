# Performance Benchmark Test Runner (PowerShell)
# Run this script to execute benchmark tests and generate reports

param(
    [string]$Mode = "all",
    [switch]$SaveBaseline
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Running Performance Benchmarks" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if pytest-benchmark is installed
try {
    python -c "import pytest_benchmark" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw
    }
} catch {
    Write-Host "Error: pytest-benchmark is not installed" -ForegroundColor Red
    Write-Host "Install it with: pip install pytest-benchmark" -ForegroundColor Yellow
    exit 1
}

$TestPath = "tests\benchmark\test_performance.py"

switch ($Mode) {
    "all" {
        Write-Host "Running all benchmark tests..." -ForegroundColor Green
        if ($SaveBaseline) {
            pytest $TestPath -v --benchmark-save=baseline
        } else {
            pytest $TestPath -v
        }
    }
    
    "dashboard" {
        Write-Host "Running dashboard benchmarks..." -ForegroundColor Green
        pytest $TestPath -v -k "dashboard"
    }
    
    "attendance" {
        Write-Host "Running attendance benchmarks..." -ForegroundColor Green
        pytest $TestPath -v -k "attendance"
    }
    
    "assignment" {
        Write-Host "Running assignment benchmarks..." -ForegroundColor Green
        pytest $TestPath -v -k "assignment"
    }
    
    "ai_prediction" {
        Write-Host "Running AI prediction benchmarks..." -ForegroundColor Green
        pytest $TestPath -v -k "ai_prediction"
    }
    
    "leaderboard" {
        Write-Host "Running leaderboard benchmarks..." -ForegroundColor Green
        pytest $TestPath -v -k "leaderboard"
    }
    
    "compare" {
        Write-Host "Comparing with baseline..." -ForegroundColor Green
        pytest $TestPath -v --benchmark-compare=baseline
    }
    
    "histogram" {
        Write-Host "Generating histogram..." -ForegroundColor Green
        pytest $TestPath -v --benchmark-histogram
    }
    
    "json" {
        Write-Host "Generating JSON report..." -ForegroundColor Green
        pytest $TestPath -v --benchmark-json=benchmark_results.json
    }
    
    default {
        Write-Host "Usage: .\run_benchmarks.ps1 [-Mode MODE] [-SaveBaseline]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Modes:" -ForegroundColor Cyan
        Write-Host "  all            - Run all benchmarks (default)"
        Write-Host "  dashboard      - Run dashboard benchmarks"
        Write-Host "  attendance     - Run attendance benchmarks"
        Write-Host "  assignment     - Run assignment benchmarks"
        Write-Host "  ai_prediction  - Run AI prediction benchmarks"
        Write-Host "  leaderboard    - Run leaderboard benchmarks"
        Write-Host "  compare        - Compare with baseline"
        Write-Host "  histogram      - Generate histogram"
        Write-Host "  json          - Generate JSON report"
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Cyan
        Write-Host "  -SaveBaseline  - Save results as baseline (use with 'all' mode)"
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\run_benchmarks.ps1 -Mode all -SaveBaseline  # Save baseline"
        Write-Host "  .\run_benchmarks.ps1 -Mode dashboard          # Run dashboard tests"
        Write-Host "  .\run_benchmarks.ps1 -Mode compare            # Compare with baseline"
        exit 1
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Benchmark tests completed!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
