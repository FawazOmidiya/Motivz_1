import requests
import time
from supabase import create_client, Client

# Configuration
GOOGLE_MAPS_API_KEY = "AIzaSyCJPh0xQdW7gkD2Zr275Bq8R8hmE758M80"  # Replace with your Google API key
GOOGLE_PLACES_API_KEY = "AIzaSyABpe3jczV_UkLredPyrOFZLxk0Pc1aVP4"
SUPABASE_URL = "https://htercrqcpdnpiifpufuo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZXJjcnFjcGRucGlpZnB1ZnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzNTcyNjcsImV4cCI6MjAzNDkzMzI2N30.XtB1qfAzrIMWC3N1GaGDb8_vJ8br8EbC3gRLTxK0eRY"
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
        "key": GOOGLE_API_KEY,
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
    response = requests.get("https://maps.googleapis.com/maps/api/place/textsearch/json?query=nightclubs%20in%20Toronto&key=AIzaSyABpe3jczV_UkLredPyrOFZLxk0Pc1aVP4")
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
    
"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=AUy1YQ3Xke8yD44EXl3u_fakmk8FxeMR2oWaH85as4wxmR3RdPBmPr7XTtEURwkEG0LXht045u1LYMV2y-0jvH6GWu-EwdkJeHOfDGeBZTC-_ubOlazAqyvx0sghj4iZRiywjmS0-byHMOPKh9N6TzLapNcq3MQODg7p_pCmiTSGxMbqV8mhi-usu8GT&key=AIzaSyABpe3jczV_UkLredPyrOFZLxk0Pc1aVP4"