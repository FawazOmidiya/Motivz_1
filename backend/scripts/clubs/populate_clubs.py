import requests
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import time
from typing import List, Dict, Optional, Any
from dataclasses import dataclass


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
        hours = self.hours or {
  "openNow": false,
  "periods": [
    {
      "open": {
        "day": 0,
        "hour": 23,
        "minute": 0
      },
      "close": {
        "day": 1,
        "hour": 3,
        "minute": 0
      }
    },
    {
      "open": {
        "day": 3,
        "hour": 22,
        "minute": 0
      },
      "close": {
        "day": 4,
        "hour": 3,
        "minute": 0
      }
    },
    {
      "open": {
        "day": 4,
        "hour": 22,
        "minute": 0
      },
      "close": {
        "day": 5,
        "hour": 3,
        "minute": 0
      }
    },
    {
      "open": {
        "day": 5,
        "hour": 22,
        "minute": 0
      },
      "close": {
        "day": 6,
        "hour": 3,
        "minute": 0
      }
    },
    {
      "open": {
        "day": 6,
        "hour": 22,
        "minute": 0
      },
      "close": {
        "day": 0,
        "hour": 3,
        "minute": 0
      }
    }
  ],
  "nextOpenTime": "2025-05-19T03:00:00Z",
  "weekdayDescriptions": [
    "Monday: Closed",
    "Tuesday: Closed",
    "Wednesday: 10:00 PM – 3:00 AM",
    "Thursday: 10:00 PM – 3:00 AM",
    "Friday: 10:00 PM – 3:00 AM",
    "Saturday: 10:00 PM – 3:00 AM",
    "Sunday: 11:00 PM – 3:00 AM"
  ]
}
        return {
            "Name": self.name,
            "Address": self.address,
            "latitude": self.location.get("latitude"),
            "longitude": self.location.get("longitude"),
            "Rating": self.rating,
            "id": self.club_id,
            "google_id": self.club_id,
            "Image": self.image_url,
            "hours": self.hours or hours,
            "website": self.website or "https://example.com"  # Default website if none provided
        }

    def save(self) -> None:
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
                print(f"Error saving club {self.name}: {result.error}")
                return

            # # Save reviews if available
            # if self.reviews:
            #     populate_club_google_reviews(self.club_id, self.reviews)

        except Exception as e:
            print(f"Error saving club {self.name}: {e}")

def search_clubs(searchInput: str) -> List[Club]:
    """
    Searches for nightclubs in Toronto using the Google Places API with pagination.
    Returns a list of Club objects.
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
        print(f"Response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            break
            
        data = response.json()
        
        places = data.get("places", [])
        print(f"Found {len(places)} clubs on this page...")
        # Convert each place to a Club object
        all_clubs.extend([Club(place) for place in places])
        
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
    searchInput = "The Mod Club"

    clubs = search_clubs(searchInput)
    print(f"Total clubs found: {len(clubs)}")
    
    for club in clubs:
        club.save()
    
    print("Finished processing nightclubs.")

if __name__ == '__main__':
    main()