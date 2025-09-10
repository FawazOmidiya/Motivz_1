#!/usr/bin/env python3
"""
Complete club addition script - collects all required information upfront.
No Google API required - all data provided manually.

Usage:
    python add_club_complete.py

This script will prompt you for all required information step by step.
"""

import os
import sys
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_user_input(prompt: str, required: bool = True, input_type: str = "str") -> any:
    """
    Get user input with validation.
    
    Args:
        prompt: The prompt to show the user
        required: Whether the input is required
        input_type: Type of input expected ("str", "float", "int")
    
    Returns:
        The validated user input
    """
    while True:
        try:
            if required:
                user_input = input(f"{prompt} (required): ").strip()
                if not user_input:
                    print("❌ This field is required. Please provide a value.")
                    continue
            else:
                user_input = input(f"{prompt} (optional): ").strip()
                if not user_input:
                    return None
            
            # Type conversion
            if input_type == "float":
                return float(user_input)
            elif input_type == "int":
                return int(user_input)
            else:
                return user_input
                
        except ValueError:
            print(f"❌ Please enter a valid {input_type}")
        except KeyboardInterrupt:
            print("\n\n❌ Operation cancelled by user")
            sys.exit(1)

def validate_coordinates(latitude: float, longitude: float) -> bool:
    """Validate that coordinates are reasonable for Toronto area"""
    # Toronto area bounds (approximate)
    min_lat, max_lat = 43.5, 43.9
    min_lng, max_lng = -79.8, -79.0
    
    if not (min_lat <= latitude <= max_lat):
        print(f"❌ Latitude {latitude} seems outside Toronto area (should be between {min_lat} and {max_lat})")
        return False
    
    if not (min_lng <= longitude <= max_lng):
        print(f"❌ Longitude {longitude} seems outside Toronto area (should be between {min_lng} and {max_lng})")
        return False
    
    return True

def validate_rating(rating: float) -> bool:
    """Validate rating is between 0 and 5"""
    if not (0.0 <= rating <= 5.0):
        print(f"❌ Rating must be between 0.0 and 5.0, got {rating}")
        return False
    return True

def validate_url(url: str) -> bool:
    """Basic URL validation"""
    if not url:
        return True  # Optional field
    
    if not (url.startswith("http://") or url.startswith("https://")):
        print(f"❌ URL should start with http:// or https://, got: {url}")
        return False
    return True

def parse_hours_input(hours_input: str) -> dict:
    """
    Parse hours input and convert to proper JSON format.
    
    Expected input format examples:
    - "Thu-Sun: 11PM-4AM"
    - "Fri-Sat: 11PM-2:30AM"
    - "Mon-Fri: 9AM-5PM, Sat: 10AM-3PM"
    - "Daily: 9AM-5PM"
    """
    if not hours_input:
        return None
    
    # Day mapping
    day_map = {
        'monday': 0, 'mon': 0,
        'tuesday': 1, 'tue': 1, 'tues': 1,
        'wednesday': 2, 'wed': 2,
        'thursday': 3, 'thu': 3, 'thur': 3, 'thurs': 3,
        'friday': 4, 'fri': 4,
        'saturday': 5, 'sat': 5,
        'sunday': 6, 'sun': 6
    }
    
    periods = []
    weekday_descriptions = []
    
    # Initialize all days as closed
    for day_name in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
        weekday_descriptions.append(f"{day_name}: Closed")
    
    try:
        # Split by comma for multiple time ranges
        time_ranges = [t.strip() for t in hours_input.split(',')]
        
        for time_range in time_ranges:
            if ':' not in time_range:
                continue
                
            # Parse day and time
            day_part, time_part = time_range.split(':', 1)
            day_part = day_part.strip().lower()
            time_part = time_part.strip()
            
            # Parse time (e.g., "11PM-4AM" or "11:30PM-2:30AM")
            if '-' not in time_part:
                continue
                
            open_time, close_time = time_part.split('-', 1)
            open_time = open_time.strip()
            close_time = close_time.strip()
            
            # Convert time to 24-hour format
            open_hour, open_minute = parse_time_to_24h(open_time)
            close_hour, close_minute = parse_time_to_24h(close_time)
            
            # Parse days
            if '-' in day_part:
                # Range like "thu-sun"
                start_day, end_day = day_part.split('-', 1)
                start_day_num = day_map.get(start_day.strip())
                end_day_num = day_map.get(end_day.strip())
                
                if start_day_num is None or end_day_num is None:
                    continue
                    
                # Handle week wrap-around
                if start_day_num <= end_day_num:
                    days = list(range(start_day_num, end_day_num + 1))
                else:
                    # Wrap around (e.g., fri-mon)
                    days = list(range(start_day_num, 7)) + list(range(0, end_day_num + 1))
            else:
                # Single day
                day_num = day_map.get(day_part)
                if day_num is None:
                    continue
                days = [day_num]
            
            # Create periods for each day
            for day in days:
                close_day = day
                if close_hour < open_hour or (close_hour == open_hour and close_minute < open_minute):
                    # Time goes past midnight
                    close_day = (day + 1) % 7
                
                period = {
                    "open": {
                        "day": day,
                        "hour": open_hour,
                        "minute": open_minute
                    },
                    "close": {
                        "day": close_day,
                        "hour": close_hour,
                        "minute": close_minute
                    }
                }
                periods.append(period)
                
                # Update weekday description
                day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day]
                time_str = f"{format_time_12h(open_hour, open_minute)} – {format_time_12h(close_hour, close_minute)}"
                weekday_descriptions[day] = f"{day_name}: {time_str}"
        
        if not periods:
            return None
            
        return {
            "openNow": False,  # We don't know current time, so set to False
            "periods": periods,
            "nextOpenTime": None,  # We don't calculate this
            "weekdayDescriptions": weekday_descriptions
        }
        
    except Exception as e:
        print(f"❌ Error parsing hours: {e}")
        return None

def parse_time_to_24h(time_str: str) -> tuple:
    """Parse time string like '11PM' or '11:30PM' to (hour, minute) in 24h format"""
    time_str = time_str.strip().upper()
    
    # Check for AM/PM
    is_pm = 'PM' in time_str
    is_am = 'AM' in time_str
    
    # Remove AM/PM
    time_str = time_str.replace('AM', '').replace('PM', '').strip()
    
    # Parse hour and minute
    if ':' in time_str:
        hour_str, minute_str = time_str.split(':', 1)
        hour = int(hour_str)
        minute = int(minute_str)
    else:
        hour = int(time_str)
        minute = 0
    
    # Convert to 24-hour format
    if is_pm and hour != 12:
        hour += 12
    elif is_am and hour == 12:
        hour = 0
    
    return hour, minute

def format_time_12h(hour: int, minute: int) -> str:
    """Format 24-hour time to 12-hour format"""
    if hour == 0:
        display_hour = 12
        period = "AM"
    elif hour < 12:
        display_hour = hour
        period = "AM"
    elif hour == 12:
        display_hour = 12
        period = "PM"
    else:
        display_hour = hour - 12
        period = "PM"
    
    if minute == 0:
        return f"{display_hour}{period}"
    else:
        return f"{display_hour}:{minute:02d}{period}"

def collect_club_information() -> dict:
    """Collect all club information from user"""
    print("🎯 Complete Club Information Collection")
    print("=" * 50)
    print("Please provide the following information for the club:")
    print()
    
    # Basic information
    name = get_user_input("🏢 Club Name")
    address = get_user_input("📍 Full Address")
    
    # Coordinates
    print("\n🌍 Coordinates:")
    print("💡 To find coordinates:")
    print("   1. Go to Google Maps")
    print("   2. Search for the address")
    print("   3. Right-click on the location")
    print("   4. Click on the coordinates to copy them")
    print()
    
    latitude = get_user_input("   Latitude (e.g., 43.6446)", input_type="float")
    longitude = get_user_input("   Longitude (e.g., -79.4094)", input_type="float")
    
    # Rating
    rating = get_user_input("⭐ Rating (0.0 to 5.0)", input_type="float")
    
    # Optional information
    print("\n📋 Optional Information:")
    website = get_user_input("🌐 Website URL", required=False)
    image_url = get_user_input("🖼️  Image URL", required=False)
    
    # Hours (optional)
    print("\n🕒 Operating Hours (optional):")
    print("   Examples:")
    print("   - Thu-Sun: 11PM-4AM")
    print("   - Fri-Sat: 11PM-2:30AM")
    print("   - Mon-Fri: 9AM-5PM, Sat: 10AM-3PM")
    print("   - Daily: 9AM-5PM")
    print("   - Leave blank if no hours available")
    hours_input = get_user_input("   Hours", required=False)
    
    return {
        "name": name,
        "address": address,
        "latitude": latitude,
        "longitude": longitude,
        "rating": rating,
        "website": website,
        "image_url": image_url,
        "hours_input": hours_input
    }

def validate_club_data(data: dict) -> bool:
    """Validate all collected club data"""
    print("\n🔍 Validating collected information...")
    
    # Validate coordinates
    if not validate_coordinates(data["latitude"], data["longitude"]):
        return False
    
    # Validate rating
    if not validate_rating(data["rating"]):
        return False
    
    # Validate URLs
    if data["website"] and not validate_url(data["website"]):
        return False
    
    if data["image_url"] and not validate_url(data["image_url"]):
        return False
    
    # Parse and validate hours
    if data["hours_input"]:
        parsed_hours = parse_hours_input(data["hours_input"])
        if parsed_hours is None:
            print("❌ Invalid hours format. Please use format like 'Thu-Sun: 11PM-4AM'")
            return False
        data["hours"] = parsed_hours
        print("✅ Hours parsed successfully")
    else:
        data["hours"] = None
    
    print("✅ All validation checks passed!")
    return True

def add_club_to_database(data: dict) -> bool:
    """Add the club to the database"""
    try:
        # Generate a unique ID for the club
        club_id = str(uuid.uuid4())
        
        # Prepare club data for database
        club_data = {
            "Name": data["name"],
            "Address": data["address"],
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "Rating": data["rating"],
            "id": club_id,
            "google_id": club_id,
            "Image": data["image_url"],
            "hours": data["hours"],
            "website": data["website"] or "https://example.com"
        }
        
        print(f"\n📋 Final club data to be inserted:")
        print("=" * 40)
        for key, value in club_data.items():
            print(f"   {key}: {value}")
        print("=" * 40)
        
        # Confirm before inserting
        confirm = input("\n❓ Do you want to insert this club into the database? (y/N): ").strip().lower()
        if confirm not in ['y', 'yes']:
            print("❌ Operation cancelled by user")
            return False
        
        # Insert into database
        print(f"\n💾 Inserting club into database...")
        result = supabase.table("Clubs").insert(club_data).execute()
        
        if result.data:
            print(f"✅ Successfully added club: {data['name']}")
            print(f"   Club ID: {club_id}")
            return True
        else:
            print(f"❌ Error adding club: {result.error}")
            return False
            
    except Exception as e:
        print(f"❌ Exception while adding club: {e}")
        return False

def main():
    print("🎯 Complete Club Addition Tool")
    print("=" * 50)
    print("This tool will help you add a club to the database")
    print("with all required information collected upfront.")
    print()
    
    # Check if Supabase credentials are available
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: Supabase credentials not found in environment variables")
        print("Make sure SUPABASE_URL and SUPABASE_KEY are set in your .env file")
        sys.exit(1)
    
    try:
        # Collect all information
        club_data = collect_club_information()
        
        # Validate the data
        if not validate_club_data(club_data):
            print("\n❌ Validation failed. Please correct the errors and try again.")
            sys.exit(1)
        
        # Add to database
        success = add_club_to_database(club_data)
        
        if success:
            print(f"\n🎉 Successfully added '{club_data['name']}' to the database!")
            print(f"   The club is now available in your app.")
        else:
            print(f"\n❌ Failed to add club to database")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()