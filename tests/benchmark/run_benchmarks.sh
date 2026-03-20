#!/bin/bash

# Performance Benchmark Test Runner
# Run this script to execute benchmark tests and generate reports

echo "=================================="
echo "Running Performance Benchmarks"
echo "=================================="
echo ""

# Check if pytest-benchmark is installed
if ! python -c "import pytest_benchmark" 2>/dev/null; then
    echo "Error: pytest-benchmark is not installed"
    echo "Install it with: pip install pytest-benchmark"
    exit 1
fi

# Parse command line arguments
MODE=${1:-all}
SAVE_BASELINE=${2:-}

case $MODE in
    all)
        echo "Running all benchmark tests..."
        if [ "$SAVE_BASELINE" == "--save-baseline" ]; then
            pytest tests/benchmark/test_performance.py -v --benchmark-save=baseline
        else
            pytest tests/benchmark/test_performance.py -v
        fi
        ;;
    
    dashboard)
        echo "Running dashboard benchmarks..."
        pytest tests/benchmark/test_performance.py -v -k "dashboard"
        ;;
    
    attendance)
        echo "Running attendance benchmarks..."
        pytest tests/benchmark/test_performance.py -v -k "attendance"
        ;;
    
    assignment)
        echo "Running assignment benchmarks..."
        pytest tests/benchmark/test_performance.py -v -k "assignment"
        ;;
    
    ai_prediction)
        echo "Running AI prediction benchmarks..."
        pytest tests/benchmark/test_performance.py -v -k "ai_prediction"
        ;;
    
    leaderboard)
        echo "Running leaderboard benchmarks..."
        pytest tests/benchmark/test_performance.py -v -k "leaderboard"
        ;;
    
    compare)
        echo "Comparing with baseline..."
        pytest tests/benchmark/test_performance.py -v --benchmark-compare=baseline
        ;;
    
    histogram)
        echo "Generating histogram..."
        pytest tests/benchmark/test_performance.py -v --benchmark-histogram
        ;;
    
    json)
        echo "Generating JSON report..."
        pytest tests/benchmark/test_performance.py -v --benchmark-json=benchmark_results.json
        ;;
    
    *)
        echo "Usage: $0 [MODE] [OPTIONS]"
        echo ""
        echo "Modes:"
        echo "  all            - Run all benchmarks (default)"
        echo "  dashboard      - Run dashboard benchmarks"
        echo "  attendance     - Run attendance benchmarks"
        echo "  assignment     - Run assignment benchmarks"
        echo "  ai_prediction  - Run AI prediction benchmarks"
        echo "  leaderboard    - Run leaderboard benchmarks"
        echo "  compare        - Compare with baseline"
        echo "  histogram      - Generate histogram"
        echo "  json          - Generate JSON report"
        echo ""
        echo "Options:"
        echo "  --save-baseline - Save results as baseline (use with 'all' mode)"
        echo ""
        echo "Examples:"
        echo "  $0 all --save-baseline     # Save baseline"
        echo "  $0 dashboard               # Run dashboard tests"
        echo "  $0 compare                 # Compare with baseline"
        exit 1
        ;;
esac

echo ""
echo "=================================="
echo "Benchmark tests completed!"
echo "=================================="
