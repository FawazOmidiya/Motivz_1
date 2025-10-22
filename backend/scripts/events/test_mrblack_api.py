#!/usr/bin/env python3
"""
Test script to debug Mr Black API endpoints
"""

import requests
import json
from datetime import datetime, timedelta

def create_event_structure(event_data, event_date):
    """
    Create the event structure that would be saved to the database
    """
    try:
        # Extract basic information
        title = event_data.get('name', 'Untitled Event')
        caption = event_data.get('description', '')
        
        # Parse dates - combine date with time
        event_date_str = event_date  # e.g., "2025-10-21"
        start_time = event_data.get('startsAt', '23:00')  # e.g., "23:00"
        end_time = event_data.get('endsAt', '04:45')  # e.g., "04:45"
        
        # Create datetime strings
        start_date_str = f"{event_date_str} {start_time}"
        end_date_str = f"{event_date_str} {end_time}"
        
        # Handle end time being next day (e.g., 04:45)
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d %H:%M')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d %H:%M')
            if end_date < start_date:
                end_date = end_date + timedelta(days=1)
        except:
            start_date = datetime.now()
            end_date = start_date + timedelta(hours=4)
        
        # Extract location and address
        location = "Mr Black"
        address = event_data.get('address', '1096 Queen Street West')
        
        # Extract image
        image_url = event_data.get('pictureUrl', '')
        
        # Determine music genres based on title/caption
        music_genres = determine_music_genres(title, caption)
        
        # Extract Mr Black event ID
        mr_black_event_id = str(event_data.get('id', ''))
        
        # Construct ticketing URL
        ticketing_url = f"https://themrblack.com/embed/3877/form?date={event_date}&eventId={mr_black_event_id}"
        
        # Create event structure matching the database schema
        event_structure = {
            'title': title,
            'caption': caption,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'club_id': 'mr-black-club-id',  # You'll need to set this to the actual Mr Black club ID
            'poster_url': image_url,
            'music_genres': music_genres,
            'ticket_link': ticketing_url,
            'guestlist_available': False,
            'attendees': [],
            'mr_black_event_id': mr_black_event_id
        }
        
        return event_structure
        
    except Exception as e:
        return {'error': f"Failed to create event structure: {e}"}

def determine_music_genres(title, caption):
    """
    Determine music genres based on title and caption
    Returns an array of genres that match
    """
    text = f"{title} {caption}".lower()
    matched_genres = []
    
    # Genre keywords
    genre_keywords = {
        'House': ['house', 'deep house', 'tech house', 'progressive house'],
        'Techno': ['techno', 'minimal', 'industrial'],
        'Electronic': ['electronic', 'edm', 'electronic dance'],
        'Hip Hop': ['hip hop', 'rap', 'hip-hop'],
        'Pop': ['pop', 'top 40', 'mainstream'],
        'R&B': ['r&b', 'rnb', 'soul'],
        'Jazz': ['jazz', 'blues', 'smooth jazz'],
        'Latin': ['latin', 'reggaeton', 'salsa', 'bachata'],
        'Rock': ['rock', 'alternative', 'indie rock']
    }
    
    for genre, keywords in genre_keywords.items():
        if any(keyword in text for keyword in keywords):
            matched_genres.append(genre)
    
    # If no genres matched, return default
    if not matched_genres:
        matched_genres = ['Electronic']
    
    return matched_genres

def test_endpoints():
    """
    Test the specific Mr Black API endpoint
    """
    # Test the specific API endpoint you mentioned
    url = "https://api.themrblack.com/api/v1/events/calendarPage"
    params = {
        'date': '2025-10-21',
        'venueShortName': '3877'
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://themrblack.com/calendar/3877',
        'Origin': 'https://themrblack.com'
    }
    
    print("🔍 Testing Mr Black API Endpoint...")
    print("=" * 50)
    print(f"📡 URL: {url}")
    print(f"📋 Params: {params}")
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type', 'Unknown')}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   ✅ JSON Response received!")
                
                # Analyze the data structure
                if isinstance(data, list):
                    print(f"   🎉 Found {len(data)} days in calendar!")
                    
                    # Count total events
                    total_events = 0
                    for day in data:
                        if 'events' in day and isinstance(day['events'], list):
                            total_events += len(day['events'])
                    
                    print(f"   📊 Total events found: {total_events}")
                    
                    # Show sample events with full structure
                    for day in data:
                        if day.get('events') and len(day['events']) > 0:
                            print(f"   📅 {day['eventDate']}: {len(day['events'])} events")
                            for event in day['events']:
                                print(f"      🎵 {event.get('name', 'Unknown')} - {event.get('startsAt', 'Unknown time')}")
                                
                                # Show the complete event structure that would be created
                                print(f"      📋 Event Structure:")
                                event_structure = create_event_structure(event, day['eventDate'])
                                for key, value in event_structure.items():
                                    print(f"         {key}: {value}")
                                print()  # Add spacing between events
                                break  # Just show first event per day
                else:
                    print(f"   📊 Response type: {type(data)}")
                    print(f"   🔍 Keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
                    
            except json.JSONDecodeError:
                print(f"   📄 Text Response (first 500 chars):")
                print(f"   {response.text[:500]}...")
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   📄 Response: {response.text[:200]}...")
            
    except requests.exceptions.Timeout:
        print(f"   ⏰ Timeout")
    except requests.exceptions.ConnectionError:
        print(f"   🔌 Connection Error")
    except Exception as e:
        print(f"   💥 Error: {e}")

def test_calendar_page():
    """
    Test the main calendar page to see what data is loaded
    """
    print("\n🌐 Testing Calendar Page...")
    print("=" * 50)
    
    url = "https://themrblack.com/calendar/3877"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'Unknown')}")
        
        if response.status_code == 200:
            # Look for JSON data in script tags
            content = response.text
            if 'application/json' in content or 'JSON.parse' in content:
                print("✅ Found JSON data in page content")
                
                # Try to extract JSON from script tags
                import re
                json_pattern = r'<script[^>]*>(.*?)</script>'
                scripts = re.findall(json_pattern, content, re.DOTALL)
                
                for i, script in enumerate(scripts):
                    if 'events' in script.lower() or 'calendar' in script.lower():
                        print(f"📜 Script {i} contains event-related data")
                        print(f"   First 200 chars: {script[:200]}...")
            else:
                print("❌ No JSON data found in page")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Error: {e}")

def main():
    """
    Main function
    """
    print(f"🕐 Starting API test at {datetime.now()}")
    test_endpoints()
    test_calendar_page()
    print(f"\n✅ Test completed at {datetime.now()}")

if __name__ == "__main__":
    main()
