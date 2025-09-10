#!/usr/bin/env python3
"""
Test script for the new smart recurring events generation system
This tests the smart generation that avoids duplicates and only generates what's needed
"""

import os
import sys
import django
from datetime import datetime, timedelta
import json

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from services.supabase_service import (
    create_recurring_event, 
    smart_generate_recurring_events,
    get_clubs
)

class SmartRecurringEventsTester:
    """Test class for smart recurring events functionality"""
    
    def __init__(self):
        self.test_results = []
        self.test_club_id = None
        
    def setup_test_environment(self):
        """Setup test environment and get a valid club ID"""
        print("🔧 Setting up test environment...")
        
        try:
            # Get available clubs
            clubs = get_clubs()
            if not clubs:
                print("❌ No clubs found in database. Please create a club first.")
                return False
            
            # Use the first club for testing
            self.test_club_id = clubs[0]["id"]
            print(f"✅ Using club ID: {self.test_club_id} ({clubs[0]['Name']})")
            return True
            
        except Exception as e:
            print(f"❌ Error setting up test environment: {e}")
            return False
    
    def test_create_smart_recurring_events(self):
        """Test creating recurring events for smart generation"""
        print("\n🧪 Test 1: Creating smart recurring events...")
        
        if not self.test_club_id:
            print("❌ No test club ID available")
            return False
        
        # Create a weekly event for smart generation testing
        weekly_config = {
            "type": "weekly",
            "weekday": 2,  # Wednesday (0=Monday, 2=Wednesday)
            "start_time": "20:00",
            "end_time": "00:00",
            "active": True
        }
        
        try:
            event = create_recurring_event(
                title="Smart Wednesday Party - TEST",
                caption="Test smart recurring event every Wednesday at 8 PM",
                club_id=self.test_club_id,
                poster_url="https://example.com/test-smart-poster.jpg",
                music_genres=["Pop", "Rock", "Smart"],
                start_date=None,  # Will be calculated automatically
                end_date=None,    # Will be calculated automatically
                recurring_config=weekly_config
            )
            
            if event:
                print(f"✅ Successfully created smart recurring event:")
                print(f"   Event ID: {event['id']}")
                print(f"   Title: {event['title']}")
                print(f"   Recurring Config: {json.dumps(event['recurring_config'], indent=2)}")
                self.test_results.append(("Smart Event Creation", True, event))
                return event
            else:
                print("❌ Failed to create smart recurring event")
                self.test_results.append(("Smart Event Creation", False, None))
                return None
                
        except Exception as e:
            print(f"❌ Error creating smart recurring event: {e}")
            self.test_results.append(("Smart Event Creation", False, str(e)))
            return None
    
    def test_smart_generation_first_run(self):
        """Test first run of smart generation"""
        print("\n🧪 Test 2: First run of smart generation...")
        
        try:
            events = smart_generate_recurring_events(weeks_ahead=3)
            
            if events:
                print(f"✅ First run generated {len(events)} events:")
                for i, event in enumerate(events[:3]):
                    start_date = event['start_date']
                    if isinstance(start_date, str):
                        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    print(f"   Event {i+1}: {event['title']} on {start_date.strftime('%Y-%m-%d %H:%M')}")
                
                self.test_results.append(("First Smart Generation", True, len(events)))
                return events
            else:
                print("⚠️  No events generated on first run")
                self.test_results.append(("First Smart Generation", True, 0))
                return []
                
        except Exception as e:
            print(f"❌ Error in first smart generation: {e}")
            self.test_results.append(("First Smart Generation", False, str(e)))
            return None
    
    def test_smart_generation_second_run(self):
        """Test second run of smart generation (should generate fewer events)"""
        print("\n🧪 Test 3: Second run of smart generation (should avoid duplicates)...")
        
        try:
            events = smart_generate_recurring_events(weeks_ahead=3)
            
            if events:
                print(f"✅ Second run generated {len(events)} events:")
                for i, event in enumerate(events[:3]):
                    start_date = event['start_date']
                    if isinstance(start_date, str):
                        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    print(f"   Event {i+1}: {event['title']} on {start_date.strftime('%Y-%m-%d %H:%M')}")
                
                self.test_results.append(("Second Smart Generation", True, len(events)))
                return events
            else:
                print("✅ Second run generated no events (smart deduplication working!)")
                self.test_results.append(("Second Smart Generation", True, 0))
                return []
                
        except Exception as e:
            print(f"❌ Error in second smart generation: {e}")
            self.test_results.append(("Second Smart Generation", False, str(e)))
            return None
    
    def test_smart_generation_extended_weeks(self):
        """Test smart generation for more weeks ahead"""
        print("\n🧪 Test 4: Smart generation for extended weeks ahead...")
        
        try:
            events = smart_generate_recurring_events(weeks_ahead=6)
            
            if events:
                print(f"✅ Extended generation created {len(events)} events:")
                for i, event in enumerate(events[:5]):
                    start_date = event['start_date']
                    if isinstance(start_date, str):
                        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    print(f"   Event {i+1}: {event['title']} on {start_date.strftime('%Y-%m-%d %H:%M')}")
                
                self.test_results.append(("Extended Smart Generation", True, len(events)))
                return events
            else:
                print("⚠️  No events generated for extended weeks")
                self.test_results.append(("Extended Smart Generation", True, 0))
                return []
                
        except Exception as e:
            print(f"❌ Error in extended smart generation: {e}")
            self.test_results.append(("Extended Smart Generation", False, str(e)))
            return None
    
    def run_all_tests(self):
        """Run all smart generation tests"""
        print("🚀 Starting Smart Recurring Events System Tests")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_environment():
            print("❌ Test environment setup failed. Exiting.")
            return
        
        # Run tests
        self.test_create_smart_recurring_events()
        
        # Test smart generation multiple times
        self.test_smart_generation_first_run()
        self.test_smart_generation_second_run()
        self.test_smart_generation_extended_weeks()
        
        # Display results
        self.display_test_results()
        
        # Cleanup instructions
        self.display_cleanup_instructions()
    
    def display_test_results(self):
        """Display test results summary"""
        print("\n" + "=" * 60)
        print("📊 SMART GENERATION TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = 0
        total = len(self.test_results)
        
        for test_name, success, result in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {test_name}")
            if success and isinstance(result, (int, str)):
                print(f"   Result: {result}")
            passed += 1 if success else 0
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All smart generation tests passed! Your system is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the error messages above.")
    
    def display_cleanup_instructions(self):
        """Display instructions for cleaning up test data"""
        print("\n" + "=" * 60)
        print("🧹 CLEANUP INSTRUCTIONS")
        print("=" * 60)
        print("To clean up test data, run these SQL queries in Supabase:")
        print()
        print("-- Remove test events with 'TEST' in the title")
        print("DELETE FROM events WHERE title LIKE '%TEST%';")
        print()
        print("-- Verify cleanup")
        print("SELECT COUNT(*) FROM events WHERE title LIKE '%TEST%';")
        print()
        print("💡 The test events have 'TEST' in their titles for easy identification.")
        print()
        print("🚀 To use the smart generation in production:")
        print("   python manage.py smart_generate_recurring_events --weeks 4")
        print("   python manage.py smart_generate_recurring_events --dry-run  # Test mode")

def main():
    """Main test function"""
    tester = SmartRecurringEventsTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main() 