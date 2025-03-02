import requests
import time
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")  # Replace with your Google API key
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_nightclubs(next_page_token=None):
    """
    Fetches nightclubs from Google Places Text Search API restricted to Toronto.
    """
    base_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    # Toronto coordinates and a radius of 30 km
    params = {
        "query": "nightclubs in Toronto",  
        "key": GOOGLE_MAPS_API_KEY,
        "location": "43.6532,-79.3832",  
        "radius": "30000"
    }
    if next_page_token:
        params["pagetoken"] = next_page_token
    response = requests.get(base_url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print("Error fetching from Google Places:", response.status_code, response.text)
        return None

def insert_club(club_data):
    """
    Inserts a single club record into Supabase.
    """
    club = {
        "Name": club_data.get("name"),
        "Address": club_data.get("formatted_address"),
        "latitude": club_data["geometry"]["location"]["lat"],
        "longitude": club_data["geometry"]["location"]["lng"],
        "Rating": club_data.get("rating"),
        "club_id": club_data.get("place_id")
    }
    try:
        res = supabase.table("Clubs").insert(club).execute()
    except Exception as e:
        print("Error inserting record:", res.error)
    else:
        print("Inserted club:", res.data)

def main():
    next_page_token = None
    response = requests.get("https://maps.googleapis.com/maps/api/place/textsearch/json?query=nightclubs%20in%20Toronto&key=" + GOOGLE_MAPS_API_KEY)
    data = response.json()
    if not data:
        return
    print(data.get("results", {})[0])
    results = data.get("results", [])
    print(f"Found {len(results)} clubs...")
    for club in results:
        insert_club(club)
    print("Finished processing nightclubs.")

if __name__ == "__main__":
    main()
    