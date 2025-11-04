#!/usr/bin/env python3
"""
Seven Rooms Events Scraper
Scrapes events from sevenrooms.com API and creates events in the database
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
import re

# Add the parent directory to the path to import supabase client
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

try:
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError:
    print("Please install required packages: pip install supabase python-dotenv")
    sys.exit(1)

# Load environment variables from the backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class SevenRoomsEventScraper:
    def __init__(self):
        self.base_url = "https://www.sevenrooms.com"
        self.api_endpoint = "https://www.sevenrooms.com/api-yoa/events/widget"
    
    def get_clubs_with_sevenrooms_venue(self) -> List[Dict[str, Any]]:
        """
        Get all clubs that have a sevenrooms_venue_id
        """
        try:
            # Get all clubs and filter in Python
            result = supabase.table('Clubs').select('id, Name, sevenrooms_venue_id, music_schedule, sevenrooms_referrer_id').execute()
            clubs = result.data or []
            
            # Filter clubs that have sevenrooms_venue_id
            clubs_with_venue = [club for club in clubs if club.get('sevenrooms_venue_id') is not None]
            
            print(f"Found {len(clubs_with_venue)} clubs with sevenrooms_venue_id out of {len(clubs)} total clubs")
            return clubs_with_venue
        except Exception as e:
            print(f"Error fetching clubs with sevenrooms_venue_id: {e}")
            return []
        
    def fetch_events_from_api(self, venue_id: str, club_id: str, club_music_schedule: List[str] = None, referrer_id: str = None, from_days: int = 0, to_days: int = 30) -> List[Dict[str, Any]]:
        """
        Fetch events from Seven Rooms API endpoint for a specific venue
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9'
            }
            
            # API parameters - from_days and to_days are relative to today
            params = {
                'venue': venue_id,
                'from_days': from_days,  # Days from today (0 = today)
                'to_days': to_days       # Days from today to fetch (30 = 30 days from today)
            }
            
            print(f"Fetching from: {self.api_endpoint}")
            print(f"With params: {params}")
            
            response = requests.get(self.api_endpoint, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"Successfully fetched data from API for venue {venue_id}")
                return self.parse_api_response(data, venue_id, club_id, club_music_schedule, referrer_id)
            else:
                print(f"API returned status {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                return []
            
        except Exception as e:
            print(f"Error fetching events from API: {e}")
            return []
    
    def parse_api_response(self, data: Dict[str, Any], venue_id: str, club_id: str, club_music_schedule: List[str] = None, referrer_id: str = None) -> List[Dict[str, Any]]:
        """
        Parse the Seven Rooms API response and extract event information
        """
        events = []
        
        # The API returns a nested structure with events_lookup
        if 'data' not in data or 'events_lookup' not in data['data']:
            print("No events_lookup found in API response")
            return events
        
        events_lookup = data['data']['events_lookup']
        availability_lookup = data['data'].get('availability_lookup', {})
        
        # Iterate through all events in the lookup
        for event_id, event_data in events_lookup.items():
            try:
                event = self.parse_single_event(event_data, event_id, availability_lookup, venue_id, club_id, club_music_schedule, referrer_id)
                if event:
                    events.append(event)
            except Exception as e:
                print(f"Error parsing event: {e}")
                continue
        
        return events
    
    def parse_single_event(self, event_data: Dict[str, Any], event_id: str, availability_lookup: Dict[str, Any], venue_id: str, club_id: str, club_music_schedule: List[str] = None, referrer_id: str = None) -> Dict[str, Any]:
        """
        Parse a single event from the Seven Rooms API response
        """
        try:
            # Extract basic information
            title = event_data.get('name', 'Untitled Event')
            caption = event_data.get('description', '').strip()
            
            # Clean up HTML/newlines from description
            if caption:
                caption = re.sub(r'<[^>]+>', '', caption)  # Remove HTML tags
                caption = caption.replace('\\n', '\n').strip()
            
            # Parse dates - Seven Rooms provides end_date and times for recurring events
            # For actual event dates, we check availability_lookup which has specific instances
            end_date_str = event_data.get('end_date', '')  # Last date of recurring event range
            default_start_time = event_data.get('event_start_time', '23:00:00')  # e.g., "23:00:00"
            default_end_time = event_data.get('event_end_time', '04:00:00')    # e.g., "04:00:00"
            
            # Check availability_lookup for actual event dates
            # Each event can have multiple instances (dates) in availability_lookup
            event_instances = []
            if event_id in availability_lookup:
                avail_data = availability_lookup[event_id]
                if isinstance(avail_data, list):
                    # Extract unique event dates from availability items
                    seen_dates = set()
                    for avail_item in avail_data:
                        event_date_str = avail_item.get('event_date')
                        if event_date_str and event_date_str not in seen_dates:
                            seen_dates.add(event_date_str)
                            # Extract times from availability (may be in ISO format)
                            avail_start = avail_item.get('start_time', '')
                            avail_end = avail_item.get('end_time', '')
                            
                            # Parse ISO datetime strings if present
                            if 'T' in avail_start:
                                # Extract time portion from ISO string
                                start_time = avail_start.split('T')[1].split('.')[0]  # Remove microseconds/Z
                            else:
                                start_time = avail_start or default_start_time
                            
                            if 'T' in avail_end:
                                end_time = avail_end.split('T')[1].split('.')[0]
                            else:
                                end_time = avail_end or default_end_time
                            
                            event_instances.append({
                                'date': event_date_str,
                                'start_time': start_time,
                                'end_time': end_time
                            })
            
            # If no availability instances, try to use end_date (might be a single non-recurring event)
            # Note: For recurring events, we'd need to check day_of_week pattern
            if not event_instances:
                # Check if this is a recurring event with day_of_week pattern
                day_of_week = event_data.get('day_of_week', [])  # Array of booleans [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
                if day_of_week and any(day_of_week):
                    # This is a recurring event - would need to calculate dates based on pattern
                    # For now, skip or use end_date as placeholder
                    print(f"   ⚠️ Recurring event detected for {title} - using end_date {end_date_str} as placeholder")
                    if end_date_str:
                        event_instances.append({
                            'date': end_date_str,
                            'start_time': default_start_time,
                            'end_time': default_end_time
                        })
                elif end_date_str:
                    # Single event, use end_date
                    event_instances.append({
                        'date': end_date_str,
                        'start_time': default_start_time,
                        'end_time': default_end_time
                    })
            
            if not event_instances:
                print(f"Skipping event {title} - no event dates found")
                return None
            
            # Process the first instance (for recurring events, we could create multiple event records)
            instance = event_instances[0]
            event_date_str = instance['date']
            start_time = instance['start_time']
            end_time = instance['end_time']
            
            # Combine date with start time (ensure proper format)
            start_datetime_str = f"{event_date_str} {start_time}"
            end_datetime_str = f"{event_date_str} {end_time}"
            
            # Parse datetime objects
            start_date = self.parse_datetime(start_datetime_str)
            end_date = self.parse_datetime(end_datetime_str)
            
            # Handle end time being next day (e.g., 04:00)
            if end_date and start_date and end_date < start_date:
                end_date = end_date + timedelta(days=1)
            
            if not start_date:
                print(f"Skipping event {title} - no valid start date")
                return None
            
            # If no end date, assume 4 hours duration
            if not end_date:
                end_date = start_date + timedelta(hours=4)
            
            # Extract image from photo_map
            image_url = ''
            photo_map = event_data.get('photo_map', {})
            if photo_map:
                # Try to get the first photo URL
                first_photo_key = list(photo_map.keys())[0]
                photo_data = photo_map[first_photo_key]
                # Get large or medium image URL
                photo_dict = photo_data.get('photo_dict', {})
                if 'large' in photo_dict:
                    image_url = f"https://www.sevenrooms.com{photo_dict['large']}"
                elif 'medium' in photo_dict:
                    image_url = f"https://www.sevenrooms.com{photo_dict['medium']}"
                elif 'url' in photo_data:
                    image_url = f"https://www.sevenrooms.com{photo_data['url']}"
            
            # Determine music genres - use club's music schedule for the day of the week
            day_of_week = start_date.strftime('%A') if start_date else None
            
            if club_music_schedule and isinstance(club_music_schedule, dict) and day_of_week:
                day_genres = club_music_schedule.get(day_of_week, [])
                if day_genres:
                    music_genres = day_genres
                    print(f"   🎵 Using {day_of_week} music schedule: {music_genres}")
                else:
                    music_genres = self.determine_music_genres(title, caption)
                    print(f"   🎵 No schedule for {day_of_week}, determined from title/caption: {music_genres}")
            else:
                music_genres = self.determine_music_genres(title, caption)
                print(f"   🎵 No music schedule available, determined from title/caption: {music_genres}")
            
            # Extract Seven Rooms event ID
            sevenrooms_event_id = str(event_data.get('id', ''))
            
            # Construct ticketing URL - Seven Rooms uses venue-based URLs
            # Format: https://www.sevenrooms.com/reservations/{venue_id}
            ticketing_url = f"https://www.sevenrooms.com/reservations/{venue_id}"
            
            # Check if guestlist is available from availability data
            guestlist_available = False
            if event_id in availability_lookup:
                avail = availability_lookup[event_id]
                # Check if there's a guestlist inventory type
                if isinstance(avail, list):
                    for item in avail:
                        if item.get('inventory_type') == 'GUESTLIST_TICKET_FREE':
                            guestlist_available = True
                            break
                elif isinstance(avail, dict):
                    # If availability is a dict, check inventory_type
                    if avail.get('inventory_type') == 'GUESTLIST_TICKET_FREE':
                        guestlist_available = True
            
            # Create event object matching the database schema
            event = {
                'title': title,
                'caption': caption,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'club_id': club_id,
                'poster_url': image_url,
                'music_genres': music_genres,
                'ticket_link': ticketing_url,
                'guestlist_available': guestlist_available,
                'attendees': [],  # Empty array initially
                'sevenrooms_event_id': sevenrooms_event_id
            }
            
            return event
            
        except Exception as e:
            print(f"Error parsing single event: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def parse_datetime(self, datetime_str: str) -> datetime:
        """
        Parse datetime string into datetime object
        """
        if not datetime_str:
            return None
        
        # Common datetime formats for Seven Rooms
        datetime_formats = [
            '%Y-%m-%d %H:%M:%S',   # 2025-11-15 23:00:00
            '%Y-%m-%d %H:%M',      # 2025-11-15 23:00
            '%Y-%m-%dT%H:%M:%S',   # 2025-11-15T23:00:00
            '%Y-%m-%dT%H:%M:%SZ',  # 2025-11-15T23:00:00Z
            '%Y-%m-%dT%H:%M:%S.%fZ', # 2025-11-15T23:00:00.000Z
            '%Y-%m-%d',            # 2025-11-15
        ]
        
        for fmt in datetime_formats:
            try:
                return datetime.strptime(datetime_str, fmt)
            except ValueError:
                continue
        
        print(f"Could not parse datetime: {datetime_str}")
        return None
    
    def determine_music_genres(self, title: str, caption: str) -> List[str]:
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
    
    def save_events_to_database(self, events: List[Dict[str, Any]]) -> int:
        """
        Save events to the database using upsert to prevent duplicates
        """
        if not events:
            print("No events to save")
            return 0
        
        try:
            # Remove duplicates within the batch based on sevenrooms_event_id + start_date
            seen_combinations = set()
            unique_events = []
            
            for event in events:
                sevenrooms_id = event.get('sevenrooms_event_id')
                start_date = event.get('start_date')
                
                # Create a unique key combining event ID and start date
                unique_key = f"{sevenrooms_id}_{start_date}"
                
                if sevenrooms_id and start_date and unique_key not in seen_combinations:
                    seen_combinations.add(unique_key)
                    unique_events.append(event)
                elif sevenrooms_id and start_date:
                    print(f"   ⚠️ Skipping duplicate event: {event.get('title', 'Unknown')} (ID: {sevenrooms_id}, Date: {start_date})")
            
            if not unique_events:
                print("No unique events to save after deduplication")
                return 0
            
            print(f"Processing {len(unique_events)} unique events (removed {len(events) - len(unique_events)} duplicates)")
            
            # Check which events already exist in the database
            existing_events = []
            new_events = []
            
            for event in unique_events:
                sevenrooms_id = event.get('sevenrooms_event_id')
                start_date = event.get('start_date')
                
                # Query for existing event with same sevenrooms_event_id and start_date
                existing = supabase.table('events').select('id').eq('sevenrooms_event_id', sevenrooms_id).eq('start_date', start_date).execute()
                
                if existing.data and len(existing.data) > 0:
                    # Event exists, add to update list
                    event['id'] = existing.data[0]['id']
                    existing_events.append(event)
                else:
                    # New event
                    new_events.append(event)
            
            # Insert new events
            if new_events:
                insert_result = supabase.table('events').insert(new_events).execute()
                print(f"Inserted {len(insert_result.data) if insert_result.data else 0} new events")
            
            # Update existing events
            if existing_events:
                for event in existing_events:
                    event_id = event.pop('id')
                    update_result = supabase.table('events').update(event).eq('id', event_id).execute()
                print(f"Updated {len(existing_events)} existing events")
            
            total_processed = len(new_events) + len(existing_events)
            
            if total_processed > 0:
                print(f"Successfully processed {total_processed} events to database")
                return total_processed
            else:
                print("No events were saved")
                return 0
                
        except Exception as e:
            print(f"Error saving events to database: {e}")
            import traceback
            traceback.print_exc()
            return 0
    
    def run(self, from_days: int = 0, to_days: int = 30):
        """
        Main execution method - processes all clubs with sevenrooms_venue_id
        """
        print("🎯 Starting Seven Rooms Events Scraper...")
        print(f"📅 Fetching events from {from_days} days to {to_days} days from today")
        
        # Get all clubs with sevenrooms_venue_id
        clubs = self.get_clubs_with_sevenrooms_venue()
        
        if not clubs:
            print("❌ No clubs found with sevenrooms_venue_id")
            return
        
        print(f"🏢 Found {len(clubs)} clubs with sevenrooms_venue_id")
        
        all_events = []
        
        # Process each club
        for club in clubs:
            club_id = club['id']
            club_name = club['Name']
            venue_id = club['sevenrooms_venue_id']
            club_music_schedule = club.get('music_schedule', [])
            referrer_id = club.get('sevenrooms_referrer_id')
            
            print(f"\n🏢 Processing club: {club_name} (ID: {club_id}, Seven Rooms Venue: {venue_id})")
            if referrer_id:
                print(f"   🎫 Referrer ID: {referrer_id}")
            if club_music_schedule and isinstance(club_music_schedule, dict):
                print(f"   🎵 Club music schedule: {len(club_music_schedule)} days configured")
            
            # Fetch events for this club
            events = self.fetch_events_from_api(venue_id, club_id, club_music_schedule, referrer_id, from_days, to_days)
            
            if events:
                all_events.extend(events)
                print(f"   📊 Found {len(events)} events for {club_name}")
                
                # Display events for this club
                for i, event in enumerate(events, 1):
                    print(f"\n   {i}. {event['title']}")
                    print(f"      📅 {event['start_date']} - {event['end_date']}")
                    print(f"      🏢 Club ID: {event['club_id']}")
                    print(f"      🎵 Genres: {', '.join(event['music_genres'])}")
                    print(f"      🎫 Ticket URL: {event['ticket_link']}")
                    print(f"      🆔 Seven Rooms Event ID: {event['sevenrooms_event_id']}")
            else:
                print(f"   ❌ No events found for {club_name}")
        
        if not all_events:
            print("❌ No events found for any club")
            return
        
        print(f"\n📊 Total events found: {len(all_events)}")
        
        # Ask for confirmation before saving
        save = input(f"\n💾 Save {len(all_events)} events to database? (y/N): ").lower().strip()
        
        if save == 'y':
            saved_count = self.save_events_to_database(all_events)
            print(f"✅ Successfully upserted {saved_count} events")
        else:
            print("❌ Events not saved")

def main():
    """
    Main function
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Scrape events from Seven Rooms API')
    parser.add_argument('--from-days', type=int, default=0, help='Days from today to start fetching (default: 0)')
    parser.add_argument('--to-days', type=int, default=30, help='Days from today to fetch up to (default: 30)')
    
    args = parser.parse_args()
    
    scraper = SevenRoomsEventScraper()
    scraper.run(from_days=args.from_days, to_days=args.to_days)

if __name__ == "__main__":
    main()

