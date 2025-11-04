#!/usr/bin/env python3
"""
Mr Black Events Scraper
Scrapes events from themrblack.com calendar and creates events in the database
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

class MrBlackEventScraper:
    def __init__(self):
        self.base_url = "https://api.themrblack.com"
        self.api_endpoint = "https://api.themrblack.com/api/v1/events/calendarPage"
    
    def get_clubs_with_mr_black_id(self) -> List[Dict[str, Any]]:
        """
        Get all clubs that have a mr_black_id
        """
        try:
            # First, let's try to get all clubs and filter in Python
            result = supabase.table('Clubs').not('mr_black_id', 'is', None).select('id, Name, mr_black_id, music_schedule, mr_black_referrer_id').execute()
            clubs = result.data or []
            
            # Filter clubs that have mr_black_id
            clubs_with_mr_black_id = [club for club in clubs if club.get('mr_black_id') is not None]
            
            print(f"Found {len(clubs_with_mr_black_id)} clubs with mr_black_id out of {len(clubs)} total clubs")
            return clubs_with_mr_black_id
        except Exception as e:
            print(f"Error fetching clubs with mr_black_id: {e}")
            return []
        
    def fetch_events_from_api(self, mr_black_id: str, club_id: str, club_music_schedule: List[str] = None, referrer_id: str = None) -> List[Dict[str, Any]]:
        """
        Fetch events from Mr Black API endpoint for a specific club
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': f'https://themrblack.com/calendar/{mr_black_id}'
            }
            
            # Use the correct API endpoint with parameters
            # Use today's date for dynamic fetching
            today = datetime.now().strftime('%Y-%m-%d')
            params = {
                'date': today,
                'venueShortName': mr_black_id
            }
            
            print(f"Fetching from: {self.api_endpoint}")
            print(f"With params: {params}")
            
            response = requests.get(self.api_endpoint, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"Successfully fetched data from API for club {mr_black_id}")
                return self.parse_api_response(data, mr_black_id, club_id, club_music_schedule, referrer_id)
            else:
                print(f"API returned status {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                return []
            
        except Exception as e:
            print(f"Error fetching events from API: {e}")
            return []
    
    def scrape_events_from_html(self) -> List[Dict[str, Any]]:
        """
        Fallback: Scrape events from HTML page
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(self.calendar_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # This would need to be implemented based on the actual HTML structure
            # For now, return empty list
            print("HTML scraping not implemented yet - would need to analyze page structure")
            return []
            
        except Exception as e:
            print(f"Error scraping HTML: {e}")
            return []
    
    def parse_api_response(self, data: List[Dict[str, Any]], mr_black_id: str, club_id: str, club_music_schedule: List[str] = None, referrer_id: str = None) -> List[Dict[str, Any]]:
        """
        Parse the API response and extract event information
        """
        events = []
        
        # The API returns a list of days, each with events
        for day_data in data:
            if 'events' in day_data and isinstance(day_data['events'], list):
                for event_data in day_data['events']:
                    try:
                        event = self.parse_single_event(event_data, day_data['eventDate'], mr_black_id, club_id, club_music_schedule, referrer_id)
                        if event:
                            events.append(event)
                    except Exception as e:
                        print(f"Error parsing event: {e}")
                        continue
        
        return events
    
    def parse_single_event(self, event_data: Dict[str, Any], event_date: str, mr_black_id: str, club_id: str, club_music_schedule: List[str] = None, referrer_id: str = None) -> Dict[str, Any]:
        """
        Parse a single event from the API response
        """
        try:
            # Extract basic information from the API response structure
            title = event_data.get('name', 'Untitled Event')
            caption = event_data.get('description', '')
            
            # Parse dates - combine date with time
            event_date_str = event_date  # e.g., "2025-10-21"
            start_time = event_data.get('startsAt', '23:00')  # e.g., "23:00"
            end_time = event_data.get('endsAt', '04:45')  # e.g., "04:45"
            
            # Create datetime objects with timezone handling
            start_date = self.parse_date_with_timezone(f"{event_date_str} {start_time}")
            end_date = self.parse_date_with_timezone(f"{event_date_str} {end_time}")
            
            # Handle end time being next day (e.g., 04:45)
            if end_date and end_date < start_date:
                end_date = end_date + timedelta(days=1)
            
            if not start_date:
                print(f"Skipping event {title} - no valid start date")
                return None
            
            # If no end date, assume 4 hours duration
            if not end_date:
                end_date = start_date + timedelta(hours=4)
            
            # Extract location and address
            location = "Mr Black"  # Based on the API response
            address = event_data.get('address', '1096 Queen Street West')
            
            # Extract image
            image_url = event_data.get('pictureUrl', '')
            
            # Determine music genres - use club's music schedule for the day of the week, otherwise fallback to title/caption analysis
            if club_music_schedule and isinstance(club_music_schedule, dict):
                # Get the day of the week from the event date
                event_datetime = datetime.strptime(event_date, '%Y-%m-%d')
                day_of_week = event_datetime.strftime('%A')  # Monday, Tuesday, etc.
                
                # Get genres for this day of the week
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
            
            # Extract Mr Black event ID
            mr_black_event_id = str(event_data.get('id', ''))
            
            # Construct ticketing URL using the club's mr_black_id
            ticketing_url = f"https://themrblack.com/embed/{mr_black_id}/form?date={event_date}&eventId={mr_black_event_id}"
            
            # Add referrer_id if available (Motivz specific tracking)
            if referrer_id:
                ticketing_url += f"&referrerId={referrer_id}"
            
            # Create event object matching the database schema
            event = {
                'title': title,
                'caption': caption,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'club_id': club_id,  # Use the actual club ID
                'poster_url': image_url,
                'music_genres': music_genres,
                'ticket_link': ticketing_url,
                'guestlist_available': False,  # Default to False, can be updated later
                'attendees': [],  # Empty array initially
                'mr_black_event_id': mr_black_event_id
            }
            
            return event
            
        except Exception as e:
            print(f"Error parsing single event: {e}")
            return None
    
    def parse_date(self, date_str: str) -> datetime:
        """
        Parse date string into datetime object
        """
        if not date_str:
            return None
        
        # Common date formats - updated for Mr Black API format
        date_formats = [
            '%Y-%m-%d %H:%M',      # 2025-10-21 23:00
            '%Y-%m-%d %H:%M:%S',   # 2025-10-21 23:00:00
            '%Y-%m-%dT%H:%M:%S',   # 2025-10-21T23:00:00
            '%Y-%m-%dT%H:%M:%SZ',  # 2025-10-21T23:00:00Z
            '%Y-%m-%dT%H:%M:%S.%fZ', # 2025-10-21T23:00:00.000Z
            '%Y-%m-%d',            # 2025-10-21
            '%m/%d/%Y %H:%M',      # 10/21/2025 23:00
            '%m/%d/%Y',            # 10/21/2025
            '%d/%m/%Y %H:%M',      # 21/10/2025 23:00
            '%d/%m/%Y'             # 21/10/2025
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        print(f"Could not parse date: {date_str}")
        return None
    
    def parse_date_with_timezone(self, date_str: str) -> datetime:
        """
        Parse date string with timezone conversion
        Mr Black times need to be adjusted by 4 hours to match database expectations
        """
        if not date_str:
            return None
        
        try:
            # Parse the date string
            dt = self.parse_date(date_str)
            if not dt:
                return None
            
            # Mr Black times appear to be 4 hours behind what we expect
            # Adjust by adding 4 hours to get the correct time #TODO: make this consider timezone differences
            adjusted_dt = dt + timedelta(hours=4)
            
            print(f"   🕐 Time adjustment: {dt} → {adjusted_dt} (adjusted +4 hours)")
            return adjusted_dt
            
        except Exception as e:
            print(f"   ⚠️ Time adjustment failed: {e}, using original datetime")
            return self.parse_date(date_str)
    
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
            # Remove duplicates within the batch based on mr_black_event_id + start_date
            seen_combinations = set()
            unique_events = []
            
            for event in events:
                mr_black_id = event.get('mr_black_event_id')
                start_date = event.get('start_date')
                
                # Create a unique key combining event ID and start date
                unique_key = f"{mr_black_id}_{start_date}"
                
                if mr_black_id and start_date and unique_key not in seen_combinations:
                    seen_combinations.add(unique_key)
                    unique_events.append(event)
                elif mr_black_id and start_date:
                    print(f"   ⚠️ Skipping duplicate event: {event.get('title', 'Unknown')} (ID: {mr_black_id}, Date: {start_date})")
            
            if not unique_events:
                print("No unique events to save after deduplication")
                return 0
            
            print(f"Processing {len(unique_events)} unique events (removed {len(events) - len(unique_events)} duplicates)")
            
            # Since we need to handle duplicates based on mr_black_event_id + start_date,
            # we'll need to check for existing events first and then insert/update accordingly
            existing_events = []
            new_events = []
            
            # Check which events already exist in the database
            for event in unique_events:
                mr_black_id = event.get('mr_black_event_id')
                start_date = event.get('start_date')
                
                # Query for existing event with same mr_black_event_id and start_date
                existing = supabase.table('events').select('id').eq('mr_black_event_id', mr_black_id).eq('start_date', start_date).execute()
                
                if existing.data and len(existing.data) > 0:
                    # Event exists, add to update list
                    event['id'] = existing.data[0]['id']  # Add the existing ID for update
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
                    event_id = event.pop('id')  # Remove ID from data for update
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
            return 0
    
    def run(self):
        """
        Main execution method - processes all clubs with mr_black_id
        """
        print("🎯 Starting Mr Black Events Scraper...")
        
        # Get all clubs with mr_black_id
        clubs = self.get_clubs_with_mr_black_id()
        
        if not clubs:
            print("❌ No clubs found with mr_black_id")
            return
        
        print(f"🏢 Found {len(clubs)} clubs with mr_black_id")
        
        all_events = []
        
        # Process each club
        for club in clubs:
            club_id = club['id']
            club_name = club['Name']
            mr_black_id = club['mr_black_id']
            club_music_schedule = club.get('music_schedule', [])
            referrer_id = club.get('mr_black_referrer_id')
            
            print(f"\n🏢 Processing club: {club_name} (ID: {club_id}, Mr Black ID: {mr_black_id})")
            if referrer_id:
                print(f"   🎫 Referrer ID: {referrer_id}")
            if club_music_schedule and isinstance(club_music_schedule, dict):
                print(f"   🎵 Club music schedule: {len(club_music_schedule)} days configured")
                for day, genres in club_music_schedule.items():
                    print(f"      {day}: {', '.join(genres)}")
            else:
                print(f"   🎵 Club music schedule: {club_music_schedule}")
            
            # Fetch events for this club
            events = self.fetch_events_from_api(mr_black_id, club_id, club_music_schedule, referrer_id)
            
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
                    print(f"      🆔 Mr Black Event ID: {event['mr_black_event_id']}")
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
    scraper = MrBlackEventScraper()
    scraper.run()

if __name__ == "__main__":
    main()
