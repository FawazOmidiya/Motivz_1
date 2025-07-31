#!/usr/bin/env python3

# Edit these variables and run the script
CLUB_ID = "ChIJZwbJIEY1K4gRbkaK6Ycu4uE"  # Change this to your club ID
DAY_OF_WEEK = "Friday"  # Change this to the day you want
GENRES = ["HipHop"]  # List of genres to set
GENRE_VALUE = 10 # Standard Value for all genres

# ===========================================
# Don't edit below this line
# ===========================================

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Set SUPABASE_URL and SUPABASE_KEY in your environment.")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# List of all possible genres
ALL_GENRES = [
    "HipHop", "Pop", "Soul", "Rap", "House", "Latin", "EDM", "Jazz",
    "Country", "Blues", "DanceHall", "Afrobeats", "Top 40", "Amapiano",
    "90's", "2000's", "2010's", "R&B"
]

# Day mapping
DAY_TO_NUMBER = {
    "Sunday": 0,
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6
}

def update_music_schedule(club_id: str, day_of_week: str, genres: list, genre_value: int) -> bool:
    try:
        # Validate inputs
        if day_of_week not in DAY_TO_NUMBER:
            print(f"Invalid day of week: {day_of_week}")
            print(f"Valid days: {', '.join(DAY_TO_NUMBER.keys())}")
            return False
            
        # Validate all genres
        invalid_genres = [g for g in genres if g not in ALL_GENRES]
        if invalid_genres:
            print(f"Invalid genres: {', '.join(invalid_genres)}")
            print(f"Valid genres: {', '.join(ALL_GENRES)}")
            return False
            
        day_number = DAY_TO_NUMBER[day_of_week]
        
        # Check if record exists
        response = supabase.table('ClubMusicSchedules').select('*').eq('club_id', club_id).eq('day_of_week', str(day_number)).execute()
        if response.data:
            # Update existing record
            print(f"Updating existing record for club {club_id} on {day_of_week}")
            
            # Prepare update data with all genres
            update_data = {}
            for genre in genres:
                update_data[genre] = genre_value
            
            # Update the record
            result = supabase.table('ClubMusicSchedules').update(update_data).eq('club_id', club_id).eq('day_of_week', str(day_number)).execute()
            
            if result.data:
                print(f"✅ Successfully updated {', '.join(genres)} to {genre_value} for club {club_id} on {day_of_week}")
                return True
            else:
                print("❌ Failed to update record")
                return False
        else:
            # Create new record
            print(f"Creating new record for club {club_id} on {day_of_week}")
            
            # Prepare new record data
            new_record = {
                'club_id': club_id,
                'day_of_week': str(day_number),
                'music_genres': {},
                'live_music': '',
                'created_at': datetime.utcnow().isoformat()
            }
            
            # Set all genres to 0 initially
            for g in ALL_GENRES:
                new_record[g] = 0
            
            # Set the specified genres to the value
            for genre in genres:
                new_record[genre] = genre_value
            
            # Insert the new record
            result = supabase.table('ClubMusicSchedules').insert(new_record).execute()
            
            if result.data:
                print(f"✅ Successfully created new record with {', '.join(genres)} set to {genre_value} for club {club_id} on {day_of_week}")
                return True
            else:
                print("❌ Failed to create new record")
                return False
                
    except Exception as e:
        print(f"❌ Error updating music schedule: {str(e)}")
        return False

if __name__ == "__main__":
    print(f"Updating music schedule for club {CLUB_ID} on {DAY_OF_WEEK} with genres {', '.join(GENRES)} = {GENRE_VALUE}")
    success = update_music_schedule(CLUB_ID, DAY_OF_WEEK, GENRES, GENRE_VALUE)
    
    if not success:
        sys.exit(1) 