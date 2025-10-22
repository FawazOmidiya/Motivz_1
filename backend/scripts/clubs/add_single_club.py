#!/usr/bin/env python3
"""
Script to add a single specific club to the database by name and address.
This is useful for adding clubs that might not be found through general search
or for adding specific venues you know about.

Usage:
    python add_single_club.py "Club Name" "Full Address"
    
Example:
    python add_single_club.py "Rebel" "11 Polson St, Toronto, ON M5A 1A4, Canada"
"""

import requests
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import List, Dict, Optional, Any

load_dotenv()

# Configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class Club:
    """Represents a club with its data and operations"""
    def __init__(self, club_data: Dict[str, Any]):
        self.raw_data = club_data
        self.name = club_data.get("displayName", {}).get("text")
        self.address = club_data.get("formattedAddress")
        self.location = club_data.get("location", {})
        self.rating = club_data.get("rating", 0.0)
        self.club_id = club_data.get("id")
        self.hours = club_data.get("regularOpeningHours")
        self.photos = club_data.get("photos", [])
        self.image_url = None
        self.website = None
        self.reviews = []

    def fetch_photo(self) -> Optional[str]:
        """Fetch the club's photo URL"""
        if not self.photos:
            return None
        
        try:
            photo_name = self.photos[0].get("name")
            if photo_name:
                self.image_url = fetch_photo_url(photo_name)
                return self.image_url
        except Exception as e:
            print(f"Error fetching photo URL: {e}")
        return None

    def fetch_details(self) -> None:
        """Fetch additional club details including website and reviews"""
        if not self.club_id:
            return

        try:
            details = fetch_place_details(self.club_id)
            if details:
                self.website = details.get("websiteUri")
                self.reviews = details.get("reviews", [])
        except Exception as e:
            print(f"Error fetching club details: {e}")

    def to_dict(self) -> Dict[str, Any]:
        """Convert club data to dictionary format for database insertion"""
        return {
            "Name": self.name,
            "Address": self.address,
            "latitude": self.location.get("latitude"),
            "longitude": self.location.get("longitude"),
            "Rating": self.rating,
            "club_ids": self.club_id,
            "id": self.club_id,
            "google_id": self.club_id,
            "Image": self.image_url,
            "hours": self.hours,
            "website": self.website or "https://example.com"  # Default website if none provided
        }

    def save(self) -> bool:
        """Save club data to the database"""
        try:
            # Fetch photo if not already fetched
            if not self.image_url:
                self.fetch_photo()

            # Fetch additional details if not already fetched
            if not self.website or not self.reviews:
                self.fetch_details()

            # Save club data
            club_dict = self.to_dict()
            result = supabase.table("Clubs").upsert(club_dict).execute()
            
            if not result.data:
                print(f"❌ Error saving club {self.name}: {result.error}")
                return False

            print(f"✅ Successfully saved club: {self.name}")
            return True

        except Exception as e:
            print(f"❌ Error saving club {self.name}: {e}")
            return False

def search_specific_club(club_name: str, address: str) -> Optional[Club]:
    """
    Search for a specific club by name and address using Google Places API (New).
    Returns a Club object if found, None otherwise.
    """
    # Try searching with the exact name and address first
    search_queries = [
        f"{club_name} {address}",
        f"{club_name}",
        address
    ]
    
    for query in search_queries:
        print(f"🔍 Searching for: '{query}'")
        
        # Use new Places API like the working populate_clubs.py script
        url = "https://places.googleapis.com/v1/places:searchText"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.regularOpeningHours,places.photos",
        }
        
        payload = {
            "textQuery": query,
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            places = data.get("places", [])
            print(f"   Found {len(places)} places")
            
            # Look for exact or close matches
            for place in places:
                place_name = place.get("displayName", {}).get("text", "").lower()
                place_address = place.get("formattedAddress", "").lower()
                
                # Check if this looks like a match
                if (club_name.lower() in place_name or place_name in club_name.lower()) and \
                   (address.lower() in place_address or place_address in address.lower()):
                    print(f"   ✅ Found match: {place.get('displayName', {}).get('text')}")
                    return Club(place)
            
            # If no exact match, show what we found for manual selection
            if places:
                print(f"   📋 Found {len(places)} places, but no exact match:")
                for i, place in enumerate(places[:3]):  # Show first 3
                    name = place.get("displayName", {}).get("text", "Unknown")
                    addr = place.get("formattedAddress", "Unknown address")
                    print(f"      {i+1}. {name} - {addr}")
                
                # For now, return the first result if it's the only one
                if len(places) == 1:
                    print(f"   ✅ Using single result: {places[0].get('displayName', {}).get('text')}")
                    return Club(places[0])
                    
        except Exception as e:
            print(f"   ❌ Error searching with query '{query}': {e}")
            continue
    
    return None

def fetch_photo_url(photo_name, max_width=400):
    """
    Retrieves the photo URL for a given photo resource name from the Google Place Photo service.
    Uses skipHttpRedirect=true to get a JSON response with the photoUri.
    """
    url = f"https://places.googleapis.com/v1/{photo_name}/media"
    params = {
        "key": GOOGLE_PLACES_API_KEY,
        "maxWidthPx": max_width,
        "skipHttpRedirect": "true"  # This ensures we get a JSON response rather than a redirect.
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    photo_uri = data.get("photoUri")
    return photo_uri

def fetch_place_details(place_id):
    """
    Retrieves detailed information for a place given its place ID.
    Adjust the field mask to include the fields you require.
    """
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "id,displayName,websiteUri,reviews"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def main():
    if len(sys.argv) != 3:
        print("❌ Usage: python add_single_club.py \"Club Name\" \"Full Address\"")
        print("\nExample:")
        print('   python add_single_club.py "Rebel" "11 Polson St, Toronto, ON M5A 1A4, Canada"')
        sys.exit(1)
    
    club_name = sys.argv[1]
    address = sys.argv[2]
    
    print(f"🎯 Adding club: {club_name}")
    print(f"📍 Address: {address}")
    print("=" * 60)
    
    # Check if API keys are configured
    if not GOOGLE_PLACES_API_KEY:
        print("❌ Error: GOOGLE_PLACES_API_KEY not found in environment variables")
        sys.exit(1)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: Supabase credentials not found in environment variables")
        sys.exit(1)
    
    # Search for the club
    club = search_specific_club(club_name, address)
    
    if not club:
        print(f"❌ Could not find club '{club_name}' at address '{address}'")
        print("\n💡 Tips:")
        print("   - Make sure the club name is spelled correctly")
        print("   - Try using the full address including city and postal code")
        print("   - The club might not be in Google Places database")
        sys.exit(1)
    
    # Display found club info
    print(f"\n📋 Found club details:")
    print(f"   Name: {club.name}")
    print(f"   Address: {club.address}")
    print(f"   Google ID: {club.club_id}")
    print(f"   Rating: {club.rating}")
    
    # Save to database
    print(f"\n💾 Saving to database...")
    success = club.save()
    
    if success:
        print(f"\n🎉 Successfully added '{club.name}' to the database!")
        print(f"   Club ID: {club.club_id}")
    else:
        print(f"\n❌ Failed to add club to database")
        sys.exit(1)

if __name__ == '__main__':
    main()