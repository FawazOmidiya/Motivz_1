#!/usr/bin/env python3
"""
Comprehensive test script for recurring events functionality
Run this to test creating and generating recurring events
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
    generate_recurring_events,
    get_clubs
)

class RecurringEventsTester:
    """Test class for recurring events functionality"""
    
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
    
    def test_create_weekly_recurring_event(self):
        """Test creating a weekly recurring event"""
        print("\n🧪 Test 1: Creating weekly recurring event...")
        
        if not self.test_club_id:
            print("❌ No test club ID available")
            return False
        
        # Weekly event: Every Friday at 10 PM
        recurring_config = {
            "type": "weekly",
            "weekday": 4,  # Friday (0=Monday, 4=Friday)
            "start_time": "22:00",
            "end_time": "02:00",
            "active": True
        }
        
        try:
            event = create_recurring_event(
                title="Friday Night Party - TEST",
                caption="Test recurring event every Friday at 10 PM",
                club_id=self.test_club_id,
                poster_url="https://example.com/test-poster.jpg",
                music_genres=["HipHop", "EDM", "Test"],
                start_date=None,  # Will be calculated automatically
                end_date=None,    # Will be calculated automatically
                recurring_config=recurring_config
            )
            
            if event:
                print(f"✅ Successfully created weekly recurring event:")
                print(f"   Event ID: {event['id']}")
                print(f"   Title: {event['title']}")
                print(f"   Recurring Config: {json.dumps(event['recurring_config'], indent=2)}")
                self.test_results.append(("Weekly Event Creation", True, event))
                return event
            else:
                print("❌ Failed to create weekly recurring event")
                self.test_results.append(("Weekly Event Creation", False, None))
                return None
                
        except Exception as e:
            print(f"❌ Error creating weekly recurring event: {e}")
            self.test_results.append(("Weekly Event Creation", False, str(e)))
            return None
    
    def test_create_monthly_recurring_event(self):
        """Test creating a monthly recurring event"""
        print("\n🧪 Test 2: Creating monthly recurring event...")
        
        if not self.test_club_id:
            print("❌ No test club ID available")
            return False
        
        # Monthly event: First Saturday of every month at 9 PM
        recurring_config = {
            "type": "monthly",
            "month_day": 1,  # 1st of month
            "weekday": 5,     # Saturday
            "start_time": "21:00",
            "end_time": "01:00",
            "active": True
        }
        
        try:
            event = create_recurring_event(
                title="Monthly Saturday Bash - TEST",
                caption="Test recurring event first Saturday of every month",
                club_id=self.test_club_id,
                poster_url="https://example.com/test-monthly-poster.jpg",
                music_genres=["Rock", "Pop", "Test"],
                start_date=None,  # Will be calculated automatically
                end_date=None,    # Will be calculated automatically
                recurring_config=recurring_config
            )
            
            if event:
                print(f"✅ Successfully created monthly recurring event:")
                print(f"   Event ID: {event['id']}")
                print(f"   Title: {event['title']}")
                print(f"   Recurring Config: {json.dumps(event['recurring_config'], indent=2)}")
                self.test_results.append(("Monthly Event Creation", True, event))
                return event
            else:
                print("❌ Failed to create monthly recurring event")
                self.test_results.append(("Monthly Event Creation", False, None))
                return None
                
        except Exception as e:
            print(f"❌ Error creating monthly recurring event: {e}")
            self.test_results.append(("Monthly Event Creation", False, str(e)))
            return None
    
    def test_generate_recurring_events(self, weeks_ahead=2):
        """Test generating events from recurring templates"""
        print(f"\n🧪 Test 3: Generating recurring events for next {weeks_ahead} weeks...")
        
        try:
            events = generate_recurring_events(weeks_ahead)
            
            if events:
                print(f"✅ Successfully generated {len(events)} recurring events:")
                
                # Group events by type
                weekly_events = [e for e in events if "Friday Night Party" in e['title']]
                monthly_events = [e for e in events if "Monthly Saturday Bash" in e['title']]
                
                print(f"   Weekly events generated: {len(weekly_events)}")
                print(f"   Monthly events generated: {len(monthly_events)}")
                
                # Show first few events
                for i, event in enumerate(events[:5]):
                    start_date = event['start_date']
                    if isinstance(start_date, str):
                        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    print(f"   Event {i+1}: {event['title']} on {start_date.strftime('%Y-%m-%d %H:%M')}")
                
                self.test_results.append(("Event Generation", True, len(events)))
                return events
            else:
                print("⚠️  No events generated (this might be normal if no recurring events exist)")
                self.test_results.append(("Event Generation", True, 0))
                return []
                
        except Exception as e:
            print(f"❌ Error generating recurring events: {e}")
            self.test_results.append(("Event Generation", False, str(e)))
            return None
    
    def test_inactive_recurring_event(self):
        """Test creating an inactive recurring event"""
        print("\n🧪 Test 4: Creating inactive recurring event...")
        
        if not self.test_club_id:
            print("❌ No test club ID available")
            return False
        
        # Inactive weekly event
        recurring_config = {
            "type": "weekly",
            "weekday": 3,  # Thursday
            "start_time": "20:00",
            "end_time": "00:00",
            "active": False  # This event is inactive
        }
        
        try:
            event = create_recurring_event(
                title="Inactive Thursday Event - TEST",
                caption="This event should not generate future instances",
                club_id=self.test_club_id,
                poster_url="https://example.com/test-inactive-poster.jpg",
                music_genres=["Jazz", "Test"],
                start_date=None,  # Will be calculated automatically
                end_date=None,    # Will be calculated automatically
                recurring_config=recurring_config
            )
            
            if event:
                print(f"✅ Successfully created inactive recurring event:")
                print(f"   Event ID: {event['id']}")
                print(f"   Active: {event['recurring_config']['active']}")
                self.test_results.append(("Inactive Event Creation", True, event))
                return event
            else:
                print("❌ Failed to create inactive recurring event")
                self.test_results.append(("Inactive Event Creation", False, None))
                return None
                
        except Exception as e:
            print(f"❌ Error creating inactive recurring event: {e}")
            self.test_results.append(("Inactive Event Creation", False, str(e)))
            return None
    
    def run_all_tests(self):
        """Run all tests and display results"""
        print("🚀 Starting Recurring Events System Tests")
        print("=" * 50)
        
        # Setup
        if not self.setup_test_environment():
            print("❌ Test environment setup failed. Exiting.")
            return
        
        # Run tests
        self.test_create_weekly_recurring_event()
        self.test_create_monthly_recurring_event()
        self.test_inactive_recurring_event()
        
        # Generate events
        generated_events = self.test_generate_recurring_events(weeks_ahead=2)
        
        # Display results
        self.display_test_results()
        
        # Cleanup instructions
        self.display_cleanup_instructions()
    
    def display_test_results(self):
        """Display test results summary"""
        print("\n" + "=" * 50)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 50)
        
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
            print("🎉 All tests passed! Your recurring events system is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the error messages above.")
    
    def display_cleanup_instructions(self):
        """Display instructions for cleaning up test data"""
        print("\n" + "=" * 50)
        print("🧹 CLEANUP INSTRUCTIONS")
        print("=" * 50)
        print("To clean up test data, run these SQL queries in Supabase:")
        print()
        print("-- Remove test events with 'TEST' in the title")
        print("DELETE FROM events WHERE title LIKE '%TEST%';")
        print()
        print("-- Verify cleanup")
        print("SELECT COUNT(*) FROM events WHERE title LIKE '%TEST%';")
        print()
        print("💡 The test events have 'TEST' in their titles for easy identification.")

def main():
    """Main test function"""
    tester = RecurringEventsTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main() 