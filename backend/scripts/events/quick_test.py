#!/usr/bin/env python3
"""
Quick test for Mr Black API
"""

import requests
import json

def test_api():
    url = "https://api.themrblack.com/api/v1/events/calendarPage"
    params = {
        'date': '2025-10-21',
        'venueShortName': '3877'
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://themrblack.com/calendar/3877'
    }
    
    print("🔍 Testing Mr Black API...")
    print(f"URL: {url}")
    print(f"Params: {params}")
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {len(data)} days")
            
            # Count events
            total_events = 0
            for day in data:
                if 'events' in day and day['events']:
                    total_events += len(day['events'])
                    print(f"📅 {day['eventDate']}: {len(day['events'])} events")
                    for event in day['events']:
                        print(f"   🎵 {event['name']} - {event['startsAt']} (ID: {event.get('id', 'N/A')})")
            
            print(f"📊 Total events: {total_events}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"💥 Error: {e}")
        return False

if __name__ == "__main__":
    test_api()
