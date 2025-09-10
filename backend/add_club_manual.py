#!/usr/bin/env python3
"""
Manual club addition script - no Google API required.
Allows you to add a club to the database by providing all the details manually.

Usage:
    python add_club_manual.py "Club Name" "Address" "Latitude" "Longitude" [Rating] [Website] [Image URL]

Example:
    python add_club_manual.py "DND" "550 Queen St W, Toronto, ON M5V 2B5" "43.6446" "-79.4094" "4.5" "https://dndtoronto.com" "https://example.com/image.jpg"
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

def add_club_manual(name: str, address: str, latitude: float, longitude: float, 
                   rating: float = 0.0, website: str = "https://example.com", 
                   image_url: str = None) -> bool:
    """
    Add a club to the database manually with provided details.
    
    Args:
        name: Club name
        address: Full address
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        rating: Rating (0.0 to 5.0, default 0.0)
        website: Website URL (default "https://example.com")
        image_url: Image URL (optional)
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Generate a unique ID for the club
        club_id = str(uuid.uuid4())
        
        # Prepare club data
        club_data = {
            "Name": name,
            "Address": address,
            "latitude": float(latitude),
            "longitude": float(longitude),
            "Rating": float(rating),
            "id": club_id,
            "google_id": club_id,  # Use our generated ID as google_id
            "Image": image_url,
            "hours": None,  # No hours data for manual entries
            "website": website
        }
        
        print(f"📋 Club data to be inserted:")
        for key, value in club_data.items():
            print(f"   {key}: {value}")
        
        # Insert into database
        print(f"\n💾 Inserting club into database...")
        result = supabase.table("Clubs").insert(club_data).execute()
        
        if result.data:
            print(f"✅ Successfully added club: {name}")
            print(f"   Club ID: {club_id}")
            return True
        else:
            print(f"❌ Error adding club: {result.error}")
            return False
            
    except Exception as e:
        print(f"❌ Exception while adding club: {e}")
        return False

def get_coordinates_interactive(address: str) -> tuple:
    """
    Interactive function to get coordinates for an address.
    Since we don't have Google API, we'll ask the user to provide them.
    """
    print(f"\n📍 For address: {address}")
    print("Since we don't have Google API access, please provide coordinates manually.")
    print("You can find coordinates on Google Maps by right-clicking on the location.")
    
    while True:
        try:
            lat_input = input("Enter latitude (e.g., 43.6446): ").strip()
            if not lat_input:
                print("❌ Latitude is required")
                continue
            latitude = float(lat_input)
            break
        except ValueError:
            print("❌ Please enter a valid number for latitude")
    
    while True:
        try:
            lng_input = input("Enter longitude (e.g., -79.4094): ").strip()
            if not lng_input:
                print("❌ Longitude is required")
                continue
            longitude = float(lng_input)
            break
        except ValueError:
            print("❌ Please enter a valid number for longitude")
    
    return latitude, longitude

def main():
    print("🎯 Manual Club Addition Tool")
    print("=" * 50)
    
    # Check if Supabase credentials are available
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: Supabase credentials not found in environment variables")
        print("Make sure SUPABASE_URL and SUPABASE_KEY are set in your .env file")
        sys.exit(1)
    
    # Parse command line arguments
    if len(sys.argv) < 4:
        print("❌ Usage: python add_club_manual.py \"Club Name\" \"Address\" \"Latitude\" \"Longitude\" [Rating] [Website] [Image URL]")
        print("\nExamples:")
        print('   python add_club_manual.py "DND" "550 Queen St W, Toronto, ON M5V 2B5" "43.6446" "-79.4094"')
        print('   python add_club_manual.py "DND" "550 Queen St W, Toronto, ON M5V 2B5" "43.6446" "-79.4094" "4.5" "https://dndtoronto.com"')
        print('   python add_club_manual.py "DND" "550 Queen St W, Toronto, ON M5V 2B5" "43.6446" "-79.4094" "4.5" "https://dndtoronto.com" "https://example.com/image.jpg"')
        print("\n💡 To find coordinates:")
        print("   1. Go to Google Maps")
        print("   2. Search for the address")
        print("   3. Right-click on the location")
        print("   4. Click on the coordinates to copy them")
        sys.exit(1)
    
    # Extract arguments
    name = sys.argv[1]
    address = sys.argv[2]
    
    # Check if coordinates are provided
    if len(sys.argv) >= 5:
        try:
            latitude = float(sys.argv[3])
            longitude = float(sys.argv[4])
        except ValueError:
            print("❌ Error: Invalid latitude or longitude values")
            print("Please provide valid numbers for coordinates")
            sys.exit(1)
    else:
        # Interactive mode to get coordinates
        latitude, longitude = get_coordinates_interactive(address)
    
    # Optional parameters
    rating = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
    website = sys.argv[6] if len(sys.argv) > 6 else "https://example.com"
    image_url = sys.argv[7] if len(sys.argv) > 7 else None
    
    print(f"\n🎯 Adding club: {name}")
    print(f"📍 Address: {address}")
    print(f"🌍 Coordinates: {latitude}, {longitude}")
    print(f"⭐ Rating: {rating}")
    print(f"🌐 Website: {website}")
    if image_url:
        print(f"🖼️  Image: {image_url}")
    print("=" * 50)
    
    # Add the club
    success = add_club_manual(name, address, latitude, longitude, rating, website, image_url)
    
    if success:
        print(f"\n🎉 Successfully added '{name}' to the database!")
        print(f"   You can now use this club in your app.")
    else:
        print(f"\n❌ Failed to add club to database")
        sys.exit(1)

if __name__ == '__main__':
    main()