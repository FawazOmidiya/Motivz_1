#!/bin/bash

# Simple script to run recurring events tests
# Usage: ./run_tests.sh [test_name]

echo "🧪 Recurring Events Test Runner"
echo "================================"

if [ $# -eq 0 ]; then
    echo "Running all tests..."
    echo ""
    venv/bin/python tests/run_all_tests.py
elif [ "$1" = "basic" ]; then
    echo "Running basic recurring events tests..."
    echo ""
    venv/bin/python tests/test_recurring_events.py
elif [ "$1" = "smart" ]; then
    echo "Running smart generation tests..."
    echo ""
    venv/bin/python tests/test_smart_recurring_events.py
elif [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage:"
    echo "  ./run_tests.sh          - Run all tests"
    echo "  ./run_tests.sh basic    - Run basic recurring events tests"
    echo "  ./run_tests.sh smart    - Run smart generation tests"
    echo "  ./run_tests.sh help     - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run_tests.sh"
    echo "  ./run_tests.sh basic"
    echo "  ./run_tests.sh smart"
else
    echo "Unknown test: $1"
    echo "Use './run_tests.sh help' for usage information"
    exit 1
fi 