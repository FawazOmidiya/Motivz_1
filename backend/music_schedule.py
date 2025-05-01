#!/usr/bin/env python3
"""
music_schedule.py
Process and format music schedule data and upsert to Supabase.

Usage:
    pip install supabase python-dotenv
    export SUPABASE_URL=your_supabase_url
    export SUPABASE_KEY=your_supabase_key
    python music_schedule.py
"""

import os
import json
import logging
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Error: Set SUPABASE_URL and SUPABASE_KEY in your environment.")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# List of all possible genres
ALL_GENRES = [
    "HipHop", "Pop", "Soul", "Rap", "House", "Latin", "EDM", "Jazz",
    "Country", "Blues", "DanceHall", "Afrobeats", "Top 40", "Amapiano",
    "90's", "2000's", "2010's", "R&B"
]

def load_music_schedule(file_path):
    """Load music schedule data from JSON file"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading music schedule file: {str(e)}")
        return None

def process_schedule_data(schedule_data):
    """Process schedule data into the required format"""
    processed_data = []
    
    # Map day names to their 0-indexed numbers
    day_to_number = {
        "Sunday": 0,
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6
    }
    
    # Process each club entry
    for club in schedule_data:
        club_id = club["id"]
        for day, genres in club["genres_by_day"].items():
            # Create base record with all genres set to 0
            record = {
                "club_id": club_id,
                "day_of_week": str(day_to_number[day]),
                "music_genres": json.dumps(genres),
                "live_music": "",
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Set all genre columns to 0 initially
            for genre in ALL_GENRES:
                record[genre] = 0
            
            # Set the genres that are present to 10
            for genre in genres:
                # Map input genres to column names
                genre_map = {
                    "Hip Hop": "HipHop",
                    "Top 40": "Top 40",
                    "R&B": "R&B",
                    "House": "House",
                    "EDM": "EDM",
                    "Afro-pop": "Pop",
                    "Afrobeats": "Afrobeats",
                    "Reggae": "DanceHall",
                    "Rock": "Rock",
                    "Swing": "Jazz",
                    "Techno": "EDM",
                    "Dubstep": "EDM",
                    "Arabic": "Latin",
                    "Soca": "Latin",
                    "Reggaeton": "Latin",
                    "Latino": "Latin",
                    "Alternative": "Rock",
                    "New Wave": "Rock",
                    "Bass": "EDM",
                    "Lounge": "Jazz",
                    "Upbeat": "Pop",
                    "Jazz-Fusion": "Jazz"
                }
                supabase_genre = genre_map.get(genre, genre)
                if supabase_genre in ALL_GENRES:
                    record[supabase_genre] = 10
            
            processed_data.append(record)
    
    return processed_data

def upsert_to_supabase(data):
    """Insert data to Supabase ClubMusicSchedules table"""
    try:
        for record in data:
            # Check if record exists
            response = supabase.table('ClubMusicSchedules').select('id').eq('club_id', record['club_id']).eq('day_of_week', record['day_of_week']).execute()
            
            if response.data:
                # Update existing record
                logger.info(f"Updating record for club_id {record['club_id']} and day {record['day_of_week']}")
                supabase.table('ClubMusicSchedules').update(record).eq('club_id', record['club_id']).eq('day_of_week', record['day_of_week']).execute()
            else:
                # Insert new record
                logger.info(f"Inserting new record for club_id {record['club_id']} and day {record['day_of_week']}")
                supabase.table('ClubMusicSchedules').insert(record).execute()
                
        return True
            
    except Exception as e:
        logger.error(f"Error inserting data to Supabase: {str(e)}")
        return False

def main():
    # Path to your music schedule JSON file
    schedule_file = "music_schedule.json"
    
    # Load and process the schedule data
    schedule_data = load_music_schedule(schedule_file)
    if not schedule_data:
        logger.error("Failed to load schedule data")
        return
        
    processed_data = process_schedule_data(schedule_data)
    if not processed_data:
        logger.error("No valid data to process")
        return
        
    # Upsert to Supabase
    if upsert_to_supabase(processed_data):
        print   ("Successfully upserted music schedules to Supabase")
    else:
        print("Failed to upsert music schedules to Supabase")

if __name__ == "__main__":
    main() 