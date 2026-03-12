#!/usr/bin/env python3
"""
Test script for database maintenance features.

Usage:
    python scripts/test_db_maintenance.py --token YOUR_SUPER_ADMIN_TOKEN

This script tests all database maintenance endpoints to ensure they're working correctly.
"""

import argparse
import requests
import json
import sys
from typing import Dict, Any


BASE_URL = "http://localhost:8000/api/v1/database-maintenance"


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'


def print_success(message: str):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")


def print_error(message: str):
    print(f"{Colors.RED}✗ {message}{Colors.END}")


def print_info(message: str):
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")


def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")


def make_request(method: str, endpoint: str, token: str, **kwargs) -> Dict[str, Any]:
    """Make HTTP request to API."""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.request(method, url, headers=headers, **kwargs)
        return {
            "success": True,
            "status_code": response.status_code,
            "data": response.json() if response.content else None
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def test_stats_endpoint(token: str) -> bool:
    """Test database stats endpoint."""
    print_info("Testing database stats endpoint...")
    result = make_request("GET", "/stats", token)
    
    if result["success"] and result["status_code"] == 200:
        data = result["data"]
        print_success(f"Database stats retrieved successfully")
        print(f"  Database size: {data.get('database', {}).get('size', 'N/A')}")
        print(f"  Active connections: {data.get('connections', {}).get('active', 'N/A')}")
        print(f"  Cache hit ratio: {data.get('cache', {}).get('cache_hit_ratio', 'N/A')}%")
        return True
    else:
        print_error(f"Failed to get database stats: {result.get('error', 'Unknown error')}")
        return False


def test_table_sizes_endpoint(token: str) -> bool:
    """Test table sizes endpoint."""
    print_info("Testing table sizes endpoint...")
    result = make_request("GET", "/table-sizes?limit=5", token)
    
    if result["success"] and result["status_code"] == 200:
        data = result["data"]
        print_success(f"Table sizes retrieved successfully")
        print(f"  Found {data.get('count', 0)} tables")
        return True
    else:
        print_error(f"Failed to get table sizes: {result.get('error', 'Unknown error')}")
        return False


def test_index_stats_endpoint(token: str) -> bool:
    """Test index stats endpoint."""
    print_info("Testing index stats endpoint...")
    result = make_request("GET", "/index-stats", token)
    
    if result["success"] and result["status_code"] == 200:
        data = result["data"]
        print_success(f"Index stats retrieved successfully")
        print(f"  Found {data.get('count', 0)} indexes")
        return True
    else:
        print_error(f"Failed to get index stats: {result.get('error', 'Unknown error')}")
        return False


def test_partitions_endpoint(token: str) -> bool:
    """Test partitions endpoint."""
    print_info("Testing partitions endpoint...")
    result = make_request("GET", "/partitions", token)
    
    if result["success"] and result["status_code"] == 200:
        data = result["data"]
        print_success(f"Partitions retrieved successfully")
        print(f"  Found {data.get('partition_count', 0)} partitions")
        return True
    else:
        print_error(f"Failed to get partitions: {result.get('error', 'Unknown error')}")
        return False


def test_schedule_endpoint(token: str) -> bool:
    """Test maintenance schedule endpoint."""
    print_info("Testing maintenance schedule endpoint...")
    result = make_request("GET", "/schedule", token)
    
    if result["success"] and result["status_code"] == 200:
        data = result["data"]
        print_success(f"Maintenance schedule retrieved successfully")
        print(f"  Found {len(data.get('tasks', {}))} scheduled tasks")
        return True
    else:
        print_error(f"Failed to get schedule: {result.get('error', 'Unknown error')}")
        return False


def test_vacuum_trigger(token: str) -> bool:
    """Test vacuum analyze trigger."""
    print_info("Testing VACUUM ANALYZE trigger...")
    result = make_request("POST", "/vacuum-analyze", token)
    
    if result["success"] and result["status_code"] == 202:
        data = result["data"]
        print_success(f"VACUUM ANALYZE task queued successfully")
        print(f"  Task ID: {data.get('task_id', 'N/A')}")
        return True
    else:
        print_error(f"Failed to queue VACUUM ANALYZE: {result.get('error', 'Unknown error')}")
        return False


def test_update_statistics_trigger(token: str) -> bool:
    """Test statistics update trigger."""
    print_info("Testing statistics update trigger...")
    result = make_request("POST", "/update-statistics", token)
    
    if result["success"] and result["status_code"] == 202:
        data = result["data"]
        print_success(f"Statistics update task queued successfully")
        print(f"  Task ID: {data.get('task_id', 'N/A')}")
        return True
    else:
        print_error(f"Failed to queue statistics update: {result.get('error', 'Unknown error')}")
        return False


def test_create_partitions_trigger(token: str) -> bool:
    """Test partition creation trigger."""
    print_info("Testing partition creation trigger...")
    result = make_request("POST", "/create-partitions", token)
    
    if result["success"] and result["status_code"] == 202:
        data = result["data"]
        print_success(f"Partition creation task queued successfully")
        print(f"  Task ID: {data.get('task_id', 'N/A')}")
        return True
    else:
        print_error(f"Failed to queue partition creation: {result.get('error', 'Unknown error')}")
        return False


def test_table_stats(token: str, table_name: str = "attendances") -> bool:
    """Test specific table stats."""
    print_info(f"Testing table stats for {table_name}...")
    result = make_request("GET", f"/table-stats/{table_name}", token)
    
    if result["success"] and result["status_code"] == 200:
        data = result["data"].get('data', {})
        print_success(f"Table stats retrieved successfully")
        print(f"  Live tuples: {data.get('live_tuples', 'N/A')}")
        print(f"  Dead tuples: {data.get('dead_tuples', 'N/A')}")
        return True
    elif result["status_code"] == 404:
        print_warning(f"Table {table_name} not found (may not exist yet)")
        return True
    else:
        print_error(f"Failed to get table stats: {result.get('error', 'Unknown error')}")
        return False


def test_autovacuum_progress(token: str) -> bool:
    """Test autovacuum progress endpoint."""
    print_info("Testing autovacuum progress endpoint...")
    result = make_request("GET", "/autovacuum-progress", token)
    
    if result["success"] and result["status_code"] == 200:
        data = result["data"]
        count = data.get('count', 0)
        print_success(f"Autovacuum progress retrieved successfully")
        print(f"  Currently {count} autovacuum process(es) running")
        return True
    else:
        print_error(f"Failed to get autovacuum progress: {result.get('error', 'Unknown error')}")
        return False


def run_all_tests(token: str):
    """Run all tests."""
    print("\n" + "="*70)
    print("DATABASE MAINTENANCE TEST SUITE")
    print("="*70 + "\n")
    
    tests = [
        ("Database Stats", lambda: test_stats_endpoint(token)),
        ("Table Sizes", lambda: test_table_sizes_endpoint(token)),
        ("Index Stats", lambda: test_index_stats_endpoint(token)),
        ("Partitions", lambda: test_partitions_endpoint(token)),
        ("Maintenance Schedule", lambda: test_schedule_endpoint(token)),
        ("Table Stats (attendances)", lambda: test_table_stats(token)),
        ("Autovacuum Progress", lambda: test_autovacuum_progress(token)),
        ("Trigger VACUUM ANALYZE", lambda: test_vacuum_trigger(token)),
        ("Trigger Statistics Update", lambda: test_update_statistics_trigger(token)),
        ("Trigger Partition Creation", lambda: test_create_partitions_trigger(token)),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Test '{test_name}' crashed: {str(e)}")
            results.append((test_name, False))
        print()
    
    print("="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{status:6}{Colors.END} | {test_name}")
    
    print("\n" + "="*70)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print_success("All tests passed! ✨")
        return 0
    else:
        print_error(f"{total - passed} test(s) failed")
        return 1


def main():
    parser = argparse.ArgumentParser(
        description="Test database maintenance endpoints",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/test_db_maintenance.py --token YOUR_TOKEN
  python scripts/test_db_maintenance.py --token YOUR_TOKEN --base-url http://api.example.com
        """
    )
    parser.add_argument(
        "--token",
        required=True,
        help="Super admin authentication token"
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000/api/v1/database-maintenance",
        help="Base URL for API (default: http://localhost:8000/api/v1/database-maintenance)"
    )
    
    args = parser.parse_args()
    
    global BASE_URL
    BASE_URL = args.base_url
    
    return run_all_tests(args.token)


if __name__ == "__main__":
    sys.exit(main())
