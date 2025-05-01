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
        
    # Now, fetch detailed data (including reviews) for the club:
    details = fetch_place_details(club_data.get("id"))
    if details and "reviews" in details:
        reviews = details.get("reviews")
        result = populate_club_google_reviews(club_data.get("id"), reviews)
    else:
        print("No reviews found in the details.")

def search_clubs(searchInput: str):
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
        "textQuery": searchInput,
    }
    
    all_clubs = []
    
    while True:
        response = requests.post(url, headers=headers, json=payload)
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
                "textQuery": searchInput,
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
    return response.json()

def populate_club_google_reviews(club_id: str, reviews: list) -> dict:
    """
    Inserts an array of Google reviews for a given club into the 'google_reviews' table.
    
    Parameters:
      - club_id: The ID of the club for which the reviews are associated.
      - reviews: An array of review objects from the Google Places API.
      
    Returns:
      - A dictionary containing the result of the insertion (data and error).
    """
    if not reviews or len(reviews) == 0:
        print("No reviews to insert.")
        return {"data": None, "error": None}

    # Map each review to the row format expected by the google_reviews table.
    rows = []
    for review in reviews:
        row = {
            "review_id": review.get("name"),  # Unique identifier (e.g. "places/CLUB_ID/reviews/REVIEW_ID")
            "club_id": club_id,
            "rating": review.get("rating"),
            # Prefer originalText if available; fallback to text.
            "text": review.get("originalText", {}).get("text") or review.get("text", {}).get("text"),
            "relative_publish_time_description": review.get("relativePublishTimeDescription"),
            "author_display_name": review.get("authorAttribution", {}).get("displayName"),
            "author_photo_uri": review.get("authorAttribution", {}).get("photoUri"),
            "publish_time": review.get("publishTime"),  # Ensure your DB can parse this timestamp
            "google_maps_uri": review.get("googleMapsUri")
        }
        rows.append(row)
    
    # Insert all rows into the google_reviews table
    try:
        result = supabase.table("google_reviews").insert(rows).execute()
        if result.error:
            print("Error inserting Google reviews:", result.error)
        else:
            print("Successfully inserted Google reviews")
        return {"data": result.data, "error": result.error}
    except Exception as e:
        print("Exception during insertion:", e)
        return {"data": None, "error": e}


def main():
    searchInput = "Toop Lounge Toronto"

    clubs = search_clubs(searchInput)
    # print(clubs[0])
    print(f"Total clubs found: {len(clubs)}")
    for club_data in clubs:
        insert_club(club_data)
    try:
        # Fetch detailed information for the club using its place id.
        details = fetch_place_details("ChIJSRmVLjXL1IkRQHFvgpujO7Y")
        # print(f"Fetched details for place ID: {details}")
    except Exception as e:
        print(f"Error fetching details for club: {e}")
    
    print("Finished processing nightclubs.")

if __name__ == '__main__':
    main()