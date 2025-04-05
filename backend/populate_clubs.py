import requests
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import time


load_dotenv()

# Configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_club(club_data):
    """
    Inserts a single club record into Supabase.
    Adjust the mapping based on the response structure.
    """
    
    image_url = None
    if "photos" in club_data and club_data["photos"]:
        try:
            # Use the first photo from the list.
            photo_name = club_data["photos"][0].get("name")
            if photo_name:
                image_url = fetch_photo_url(photo_name)
                print(f"Fetched photo URL: {image_url}")
        except Exception as e:
            print("Error fetching photo URL:", e)
            
    
    club = {
        "Name": club_data.get("displayName")['text'],  # assuming this is a string
        "Address": club_data.get("formattedAddress"),
        "latitude": club_data.get("location", {}).get("latitude"),
        "longitude": club_data.get("location", {}).get("longitude"),
        "Rating": club_data.get("rating"),
        "club_ids": club_data.get("id"),
        "id": club_data.get("id"),
        "google_id": club_data.get("id"),
        "Image": image_url,  # New field to store the image URL.
        "hours": club_data.get("regularOpeningHours")


    }
    try:
        res = supabase.table("Clubs").upsert(club).execute()
    except Exception as e:
        print("Error inserting record:", e)

def search_clubs():
    """
    Searches for nightclubs in Toronto using the Google Places API with pagination.
    Returns a list of club records.
    """
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.regularOpeningHours,places.photos,nextPageToken",
    }
    
    # Initial payload using the text query.
    payload = {
        "textQuery": "nightclubs in Toronto",
    }
    
    all_clubs = []
    
    while True:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()  # Raise exception if there's an HTTP error
        data = response.json()
        
        places = data.get("places", [])
        print(f"Found {len(places)} clubs on this page...")
        all_clubs.extend(places)
        
        # Check for a next page token
        next_page_token = data.get("nextPageToken")
        if next_page_token:
            print("Next page token found, waiting 2 seconds to fetch the next page...")
            time.sleep(2)  # Wait before using the token
            payload = {
                "textQuery": "nightclubs in Toronto",
                "pageToken": next_page_token
            }        
        else:
            break
    
    return all_clubs

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
        "X-Goog-FieldMask": "id,displayName,reviews"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    print(response.json())
    return response.json()

def main():
    clubs = search_clubs()
    # print(clubs[0])
    print(f"Total clubs found: {len(clubs)}")
    for club_data in clubs:
        insert_club(club_data)
    try:
        # Fetch detailed information for the club using its place id.
        details = fetch_place_details("ChIJSRmVLjXL1IkRQHFvgpujO7Y")
        print(f"Fetched details for place ID: {details}")
    except Exception as e:
        print(f"Error fetching details for club: {e}")
    
    print("Finished processing nightclubs.")

if __name__ == '__main__':
    main()