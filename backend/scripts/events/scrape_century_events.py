#!/usr/bin/env python3
"""
Century Events Scraper
Scrapes events from wearecentury.ca/events/ and creates events in the database
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import re
from bs4 import BeautifulSoup

# Add the parent directory to the path to import supabase client
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

try:
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError:
    print("Please install required packages: pip install supabase python-dotenv beautifulsoup4")
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

class CenturyEventScraper:
    def __init__(self):
        self.base_url = "https://wearecentury.ca"
        self.events_page_url = "https://wearecentury.ca/events/"
        self.sevenrooms_url = "https://www.sevenrooms.com/events/century"
    
    def get_century_club(self) -> Optional[Dict[str, Any]]:
        """
        Get the Century club from the database
        """
        try:
            # Search for Century club by name or address
            result = supabase.table('Clubs').select('id, Name, music_schedule, sevenrooms_venue_id').or_('Name.ilike.%Century%,Address.ilike.%580 King Street West%').execute()
            clubs = result.data or []
            
            # Find the best match
            for club in clubs:
                if 'Century' in club.get('Name', '') or '580 King Street West' in club.get('Address', ''):
                    print(f"Found Century club: {club.get('Name')} (ID: {club.get('id')})")
                    return club
            
            print("⚠️ Century club not found in database")
            print("   Please add Century to the database first with:")
            print("   - Name: 'Century'")
            print("   - Address: '580 King Street West, Toronto, Ontario M5V1T1'")
            return None
        except Exception as e:
            print(f"Error fetching Century club: {e}")
            return None
    
    def fetch_events_page(self) -> Optional[str]:
        """
        Fetch the events page HTML
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
            
            response = requests.get(self.events_page_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            return response.text
        except Exception as e:
            print(f"Error fetching events page: {e}")
            return None
    
    def parse_date_from_filename(self, filename: str) -> Optional[Tuple[datetime, str]]:
        """
        Parse date from image filename
        Examples:
        - century_fridays_oct-03.png -> Friday, October 3rd
        - 2CENTURY_SATURDAYS_sept_2025.png -> Saturday, September (year 2025)
        - century_fridays_dec-01.jpeg -> Friday, December 1st
        - CENTURY_SATURDAYS_dec2025-02.jpeg -> Saturday, December 2nd, 2025
        """
        filename_lower = filename.lower()
        
        # Extract day of week (Friday or Saturday)
        day_of_week = None
        if 'friday' in filename_lower or 'fridays' in filename_lower:
            day_of_week = 'Friday'
        elif 'saturday' in filename_lower or 'saturdays' in filename_lower:
            day_of_week = 'Saturday'
        
        if not day_of_week:
            return None
        
        # Try to extract month and day/date
        # Pattern 1: month-day (e.g., oct-03, dec-01)
        month_day_match = re.search(r'([a-z]+)-?(\d{1,2})', filename_lower)
        if month_day_match:
            month_str = month_day_match.group(1)
            day_str = month_day_match.group(2)
            
            # Map month abbreviations
            month_map = {
                'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                'jul': 7, 'aug': 8, 'sep': 9, 'sept': 9, 'oct': 10, 'nov': 11, 'dec': 12
            }
            
            month = month_map.get(month_str, None)
            if month:
                day = int(day_str)
                
                # Try to find year (default to current year or next year)
                year_match = re.search(r'(\d{4})', filename)
                if year_match:
                    year = int(year_match.group(1))
                else:
                    # Default to current year, but if the date has passed, use next year
                    now = datetime.now()
                    year = now.year
                    try:
                        test_date = datetime(year, month, day)
                        if test_date < now:
                            year = year + 1
                    except ValueError:
                        # Invalid date (e.g., Feb 30), try next year
                        year = year + 1
                
                # Find the next occurrence of this day of week on or after the date
                target_date = self.find_next_day_of_week(year, month, day, day_of_week)
                return target_date, day_of_week
        
        # Pattern 2: Just month name (e.g., sept_2025)
        month_year_match = re.search(r'([a-z]+)_?(\d{4})', filename_lower)
        if month_year_match:
            month_str = month_year_match.group(1)
            year = int(month_year_match.group(2))
            
            month_map = {
                'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                'jul': 7, 'aug': 8, 'sep': 9, 'sept': 9, 'oct': 10, 'nov': 11, 'dec': 12
            }
            
            month = month_map.get(month_str, None)
            if month:
                # Find the first occurrence of this day of week in the month
                target_date = self.find_first_day_of_week_in_month(year, month, day_of_week)
                return target_date, day_of_week
        
        return None
    
    def find_next_day_of_week(self, year: int, month: int, day: int, target_day: str) -> datetime:
        """
        Find the next occurrence of target_day (Friday/Saturday) on or after the given date
        """
        # Start from the given date
        current_date = datetime(year, month, day)
        
        # Map day names to weekday numbers (Monday=0, Friday=4, Saturday=5)
        day_map = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
        target_weekday = day_map.get(target_day)
        
        if target_weekday is None:
            return current_date
        
        # Find the next occurrence
        days_ahead = target_weekday - current_date.weekday()
        if days_ahead < 0:  # Target day already passed this week
            days_ahead += 7
        
        target_date = current_date + timedelta(days=days_ahead)
        
        # If the date is in the past, move to next week
        if target_date < datetime.now():
            target_date += timedelta(days=7)
        
        return target_date
    
    def find_first_day_of_week_in_month(self, year: int, month: int, target_day: str) -> datetime:
        """
        Find the first occurrence of target_day in the given month
        """
        # Start from the first day of the month
        current_date = datetime(year, month, 1)
        
        # Map day names to weekday numbers
        day_map = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
        target_weekday = day_map.get(target_day)
        
        if target_weekday is None:
            return current_date
        
        # Find the first occurrence
        days_ahead = target_weekday - current_date.weekday()
        if days_ahead < 0:
            days_ahead += 7
        
        return current_date + timedelta(days=days_ahead)
    
    def parse_html_for_events(self, html: str, club_id: str, club_music_schedule: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Parse HTML to extract event information
        """
        events = []
        soup = BeautifulSoup(html, 'html.parser')
        
        # Find all images that might be event posters
        images = soup.find_all('img', src=True)
        
        for img in images:
            src = img.get('src', '')
            if not src:
                continue
            
            # Look for event-related images
            if 'century' not in src.lower():
                continue
            
            # Extract filename from URL
            filename = os.path.basename(src.split('?')[0])  # Remove query params
            
            # Try to parse date from filename
            date_result = self.parse_date_from_filename(filename)
            if not date_result:
                continue
            
            event_date, day_of_week = date_result
            
            # Determine if this is a Friday or Saturday event
            is_friday = day_of_week == 'Friday'
            is_saturday = day_of_week == 'Saturday'
            
            # Find associated ticket link
            # Look for the button/link that follows this image
            ticket_link = None
            parent = img.parent
            if parent:
                # Look for Eventbrite links nearby
                eventbrite_links = parent.find_all('a', href=re.compile(r'eventbrite'))
                if eventbrite_links:
                    ticket_link = eventbrite_links[0].get('href')
                else:
                    # Check siblings
                    for sibling in parent.find_next_siblings():
                        links = sibling.find_all('a', href=re.compile(r'eventbrite'))
                        if links:
                            ticket_link = links[0].get('href')
                            break
            
            # If no Eventbrite link found, use Seven Rooms as fallback
            if not ticket_link:
                ticket_link = self.sevenrooms_url
            
            # Determine title based on day of week
            title = f"Century {day_of_week}s"
            
            # Set default times based on day of week
            if is_friday:
                start_time = datetime.combine(event_date.date(), datetime.strptime('23:00', '%H:%M').time())
                end_time = start_time + timedelta(hours=5)  # 5 hours duration
            else:  # Saturday
                start_time = datetime.combine(event_date.date(), datetime.strptime('22:00', '%H:%M').time())
                end_time = start_time + timedelta(hours=6)  # 6 hours duration
            
            # Determine music genres from club schedule
            music_genres = ['Electronic', 'House', 'Hip Hop']  # Default
            if club_music_schedule and isinstance(club_music_schedule, dict):
                day_genres = club_music_schedule.get(day_of_week, [])
                if day_genres:
                    music_genres = day_genres
                    print(f"   🎵 Using {day_of_week} music schedule: {music_genres}")
            
            # Get full image URL
            if not src.startswith('http'):
                image_url = f"{self.base_url}{src}" if src.startswith('/') else f"{self.base_url}/{src}"
            else:
                image_url = src
            
            # Create event object
            event = {
                'title': title,
                'caption': f"Join us at Century for an unforgettable {day_of_week} night!",
                'start_date': start_time.isoformat(),
                'end_date': end_time.isoformat(),
                'club_id': club_id,
                'poster_url': image_url,
                'music_genres': music_genres,
                'ticket_link': ticket_link,
                'guestlist_available': True,  # Century has guestlist via Seven Rooms
                'attendees': [],
                # Store filename internally for deduplication (not saved to DB)
                '_century_filename': filename
            }
            
            events.append(event)
            print(f"   📅 Found {day_of_week} event: {title} on {event_date.strftime('%Y-%m-%d')}")
        
        return events
    
    def save_events_to_database(self, events: List[Dict[str, Any]]) -> int:
        """
        Save events to the database using upsert to prevent duplicates
        """
        if not events:
            print("No events to save")
            return 0
        
        try:
            # Remove duplicates within the batch based on club_id + start_date + title
            seen_combinations = set()
            unique_events = []
            
            for event in events:
                club_id = event.get('club_id')
                start_date = event.get('start_date')
                title = event.get('title')
                
                # Create a unique key combining club_id, start_date, and title
                unique_key = f"{club_id}_{start_date}_{title}"
                
                if club_id and start_date and title and unique_key not in seen_combinations:
                    seen_combinations.add(unique_key)
                    # Remove internal tracking field before saving
                    event.pop('_century_filename', None)
                    unique_events.append(event)
                elif club_id and start_date and title:
                    print(f"   ⚠️ Skipping duplicate event: {title} (Club: {club_id}, Date: {start_date})")
            
            if not unique_events:
                print("No unique events to save after deduplication")
                return 0
            
            print(f"Processing {len(unique_events)} unique events (removed {len(events) - len(unique_events)} duplicates)")
            
            # Check which events already exist in the database
            existing_events = []
            new_events = []
            
            for event in unique_events:
                # Ensure internal field is removed
                event.pop('_century_filename', None)
                
                club_id = event.get('club_id')
                start_date = event.get('start_date')
                title = event.get('title')
                
                # Query for existing event with same club_id, start_date, and title
                existing = supabase.table('events').select('id').eq('club_id', club_id).eq('start_date', start_date).eq('title', title).execute()
                
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
    
    def run(self):
        """
        Main execution method
        """
        print("🎯 Starting Century Events Scraper...")
        
        # Get Century club from database
        club = self.get_century_club()
        if not club:
            print("❌ Cannot proceed without Century club in database")
            return
        
        club_id = club['id']
        club_name = club['Name']
        club_music_schedule = club.get('music_schedule', [])
        
        print(f"🏢 Processing club: {club_name} (ID: {club_id})")
        
        # Fetch events page
        print(f"📄 Fetching events page from {self.events_page_url}")
        html = self.fetch_events_page()
        
        if not html:
            print("❌ Failed to fetch events page")
            return
        
        # Parse HTML for events
        print("🔍 Parsing HTML for events...")
        events = self.parse_html_for_events(html, club_id, club_music_schedule)
        
        if not events:
            print("❌ No events found")
            return
        
        print(f"\n📊 Total events found: {len(events)}")
        
        # Display events
        for i, event in enumerate(events, 1):
            print(f"\n   {i}. {event['title']}")
            print(f"      📅 {event['start_date']} - {event['end_date']}")
            print(f"      🎵 Genres: {', '.join(event['music_genres'])}")
            print(f"      🎫 Ticket URL: {event['ticket_link']}")
            print(f"      🖼️ Poster: {event['poster_url']}")
        
        # Ask for confirmation before saving
        save = input(f"\n💾 Save {len(events)} events to database? (y/N): ").lower().strip()
        
        if save == 'y':
            saved_count = self.save_events_to_database(events)
            print(f"✅ Successfully upserted {saved_count} events")
        else:
            print("❌ Events not saved")

def main():
    """
    Main function
    """
    scraper = CenturyEventScraper()
    scraper.run()

if __name__ == "__main__":
    main()

