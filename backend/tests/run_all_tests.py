#!/usr/bin/env python3
"""
Test runner script for all recurring events tests
Run this to execute all tests in the tests folder
"""

import os
import sys
import importlib.util
import glob

def run_test_file(test_file_path):
    """Run a single test file"""
    print(f"\n{'='*60}")
    print(f"🧪 Running: {os.path.basename(test_file_path)}")
    print(f"{'='*60}")
    
    try:
        # Import and run the test module
        spec = importlib.util.spec_from_file_location("test_module", test_file_path)
        test_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(test_module)
        
        # If the module has a main function, run it
        if hasattr(test_module, 'main'):
            test_module.main()
        else:
            print(f"⚠️  No main() function found in {test_file_path}")
            
    except Exception as e:
        print(f"❌ Error running {test_file_path}: {e}")
        return False
    
    return True

def main():
    """Run all test files in the tests folder"""
    print("🚀 Starting All Recurring Events Tests")
    print("=" * 60)
    
    # Get the tests directory
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Find all test files
    test_files = glob.glob(os.path.join(tests_dir, "test_*.py"))
    
    if not test_files:
        print("❌ No test files found in tests folder")
        return
    
    print(f"📁 Found {len(test_files)} test files:")
    for test_file in test_files:
        print(f"   📄 {os.path.basename(test_file)}")
    
    print(f"\n🎯 Running {len(test_files)} tests...")
    
    # Run each test file
    successful_tests = 0
    total_tests = len(test_files)
    
    for test_file in test_files:
        if run_test_file(test_file):
            successful_tests += 1
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 ALL TESTS COMPLETED")
    print(f"{'='*60}")
    print(f"✅ Successful: {successful_tests}/{total_tests}")
    
    if successful_tests == total_tests:
        print("🎉 All tests passed successfully!")
    else:
        print(f"⚠️  {total_tests - successful_tests} tests had issues")
    
    print(f"\n💡 To run individual tests:")
    for test_file in test_files:
        basename = os.path.basename(test_file)
        print(f"   python tests/{basename}")

if __name__ == "__main__":
    main() 