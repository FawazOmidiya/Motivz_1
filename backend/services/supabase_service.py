from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test function to fetch data
def test_supabase():
    response = supabase.table("Clubs").select("*").execute()
    print("hello")

def get_clubs():
    """Fetch all clubs from Supabase"""
    response = supabase.table("Clubs").select("*").execute()
    return response.data

def get_club_by_id(club_id: str):
    """Fetch a single club by ID from Supabase"""
    try:
        response = supabase.table("Clubs").select("*").eq("id", club_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error fetching club by ID: {e}")
        return None

def get_club_trending_status(club_id: str):
    """Get trending status for a single club"""
    try:
        from datetime import datetime, timedelta
        five_hours_ago = (datetime.utcnow() - timedelta(hours=5)).isoformat()
        
        # Get recent reviews for this club (last 5 hours)
        reviews_response = supabase.table("club_reviews").select(
            "rating, created_at"
        ).eq("club_id", club_id).gte("created_at", five_hours_ago).execute()
        
        recent_reviews = reviews_response.data or []
        
        if len(recent_reviews) >= 3:  # Minimum 3 reviews in last 5 hours
            # Calculate average rating
            total_rating = sum(review["rating"] for review in recent_reviews)
            avg_rating = total_rating / len(recent_reviews)
            
            if avg_rating >= 3.5:  # Minimum 3.5 average rating
                trending_score = len(recent_reviews) * avg_rating
                return {
                    "is_trending": True,
                    "trending_score": trending_score,
                    "recent_reviews_count": len(recent_reviews),
                    "avg_rating": round(avg_rating, 1)
                }
        
        return {
            "is_trending": False,
            "trending_score": 0,
            "recent_reviews_count": len(recent_reviews),
            "avg_rating": 0
        }
        
    except Exception as e:
        print(f"Error getting club trending status: {e}")
        return {
            "is_trending": False,
            "trending_score": 0,
            "recent_reviews_count": 0,
            "avg_rating": 0
        }

def get_filtered_clubs(filter_open=False, selected_genres=None, min_rating=0):
    """Get filtered and sorted clubs with trending status"""
    try:
        from datetime import datetime, timedelta
        five_hours_ago = (datetime.utcnow() - timedelta(hours=5)).isoformat()
        
        # Get all clubs first
        clubs_response = supabase.table("Clubs").select("*").execute()
        clubs = clubs_response.data or []
        
        filtered_clubs = []
        
        for club in clubs:
            # Apply filters
            if filter_open:
                # Check if club is open (simplified logic for now)
                # TODO: Implement proper opening hours logic
                pass
            
            if min_rating > 0 and club.get("Rating", 0) < min_rating:
                continue
                
            if selected_genres and selected_genres:
                # TODO: Implement genre filtering logic
                pass
            
            # Get trending status for this club
            reviews_response = supabase.table("club_reviews").select(
                "rating, created_at"
            ).eq("club_id", club["id"]).gte("created_at", five_hours_ago).execute()
            
            recent_reviews = reviews_response.data or []
            
            # Calculate trending status
            is_trending = False
            trending_score = 0
            recent_reviews_count = len(recent_reviews)
            avg_rating = 0
            
            if len(recent_reviews) >= 3:
                total_rating = sum(review["rating"] for review in recent_reviews)
                avg_rating = total_rating / len(recent_reviews)
                
                if avg_rating >= 3.5:
                    is_trending = True
                    trending_score = len(recent_reviews) * avg_rating
            
            # Add trending data to club
            club["is_trending"] = is_trending
            club["trending_score"] = trending_score
            club["recent_reviews_count"] = recent_reviews_count
            club["avg_rating"] = round(avg_rating, 1)
            
            filtered_clubs.append(club)
        
        # Sort: trending first (by score), then alphabetically
        filtered_clubs.sort(key=lambda x: (
            not x["is_trending"],  # False sorts before True
            -x["trending_score"],  # Higher scores first
            x["Name"].lower()      # Alphabetical
        ))
        
        return filtered_clubs
        
    except Exception as e:
        print(f"Error getting filtered clubs: {e}")
        return []

def search_clubs(query: str, limit: int = 20):
    """Search clubs by name or address"""
    try:
        # Get all clubs first
        clubs_response = supabase.table("Clubs").select("*").execute()
        clubs = clubs_response.data or []
        
        # Convert query to lowercase for case-insensitive search
        query_lower = query.lower()
        
        # Filter clubs that match the query in name or address
        matching_clubs = []
        for club in clubs:
            club_name = club.get("Name", "").lower()
            club_address = club.get("Address", "").lower()
            
            if query_lower in club_name or query_lower in club_address:
                matching_clubs.append(club)
        
        # Sort by relevance (exact name matches first, then partial matches)
        matching_clubs.sort(key=lambda x: (
            not x.get("Name", "").lower().startswith(query_lower),  # Exact matches first
            x.get("Name", "").lower()  # Then alphabetically
        ))
        
        # Limit results
        return matching_clubs[:limit]
        
    except Exception as e:
        print(f"Error searching clubs: {e}")
        return []

def get_friends_attending(club_id: str, user_id: str):
    """Get friends of a user who are attending a specific club"""
    try:
        # First, get all friends of the user
        friends_response = supabase.table("user_profiles").select(
            "id, avatar_url, active_club_id"
        ).eq("id", user_id).execute()
        
        if not friends_response.data:
            return []
        
        # Get the user's friends (this would need to be implemented based on your friends system)
        # For now, let's get all users who have the same active_club_id
        friends_attending_response = supabase.table("user_profiles").select(
            "id, avatar_url"
        ).eq("active_club_id", club_id).execute()
        
        friends_attending = friends_attending_response.data or []
        
        # Filter out the current user
        friends_attending = [friend for friend in friends_attending if friend["id"] != user_id]
        
        return friends_attending
        
    except Exception as e:
        print(f"Error getting friends attending: {e}")
        return []

def get_club_music_schedule(club_id: str, day_number: int):
    """Get music schedule for a club on a specific day"""
    try:
        # Get the club's music schedule
        club_response = supabase.table("Clubs").select(
            "current_music"
        ).eq("id", club_id).execute()
        
        if not club_response.data:
            return None
        
        club = club_response.data[0]
        music_schedule = club.get("current_music")
        
        if not music_schedule:
            return None
        
        # Return the music schedule for the specific day
        # This assumes the music schedule is stored as a daily schedule
        return music_schedule
        
    except Exception as e:
        print(f"Error getting club music schedule: {e}")
        return None

def get_club_reviews(club_id: str, review_type: str = "app"):
    """Get reviews for a club (app reviews or Google reviews)"""
    try:
        if review_type == "google":
            # Get Google reviews
            reviews_response = supabase.table("club_reviews").select(
                "*"
            ).eq("club_id", club_id).eq("source", "google").order("created_at", desc=True).execute()
        else:
            # Get app reviews
            reviews_response = supabase.table("club_reviews").select(
                "*"
            ).eq("club_id", club_id).eq("source", "app").order("created_at", desc=True).execute()
        
        reviews = reviews_response.data or []
        return reviews
        
    except Exception as e:
        print(f"Error getting club reviews: {e}")
        return []

def add_club_review(club_id: str, user_id: str, rating: int, music_genre: str, review_text: str = ""):
    """Add a review for a club"""
    try:
        review_data = {
            "club_id": club_id,
            "user_id": user_id,
            "rating": rating,
            "genres": [music_genre] if music_genre else [],
            "review_text": review_text,
            "source": "app",
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("club_reviews").insert(review_data).execute()
        
        if response.data:
            return response.data[0]
        else:
            raise Exception("Failed to add review")
            
    except Exception as e:
        print(f"Error adding club review: {e}")
        raise e

def print_all_clubs_json():
    """Fetch all clubs and print them in JSON format"""
    import json
    try:
        clubs = get_clubs()
        if clubs:
            print(json.dumps(clubs, indent=2))
            print(f"\nTotal clubs found: {len(clubs)}")
        else:
            print("No clubs found")
    except Exception as e:
        print(f"Error printing clubs: {e}")

def get_trending_clubs():
    """Fetch trending clubs based on recent reviews and ratings (last 5 hours)"""
    try:
        # Calculate the timestamp for 5 hours ago
        from datetime import datetime, timedelta
        five_hours_ago = (datetime.utcnow() - timedelta(hours=5)).isoformat()
        
        # Get all clubs first
        clubs_response = supabase.table("Clubs").select("*").execute()
        clubs = clubs_response.data or []
        
        trending_clubs = []
        
        for club in clubs:
            # Get recent reviews for this club (last 5 hours)
            reviews_response = supabase.table("club_reviews").select(
                "rating, created_at"
            ).eq("club_id", club["id"]).gte("created_at", five_hours_ago).execute()
            
            recent_reviews = reviews_response.data or []
            
            if len(recent_reviews) >= 3:  # Minimum 3 reviews in last 5 hours
                # Calculate average rating
                total_rating = sum(review["rating"] for review in recent_reviews)
                avg_rating = total_rating / len(recent_reviews)
                
                if avg_rating >= 3.5:  # Minimum 3.5 average rating
                    club["trending_score"] = len(recent_reviews) * avg_rating
                    club["recent_reviews_count"] = len(recent_reviews)
                    club["avg_rating"] = round(avg_rating, 1)
                    club["is_trending"] = True
                    trending_clubs.append(club)
        
        # Sort by trending score (reviews count * average rating)
        trending_clubs.sort(key=lambda x: x["trending_score"], reverse=True)
        
        return trending_clubs
        
    except Exception as e:
        print(f"Error fetching trending clubs: {e}")
        return []

def add_club(data):
    """Add a new club to Supabase"""
    response = supabase.table("Clubs").insert(data).execute()
    return response.data

def create_new_user(user):
    """
    Create a new user in the database.

    Args:
        user (dict): A dictionary containing the user's details.
    """
    new_user = {
        '_id': user['_id'],
        'email': user['email'],
    }
    try:
        resp = supabase.table('Users').insert(new_user).execute()
    except Exception as e:
        print(f'Error creating user: {e}')
        
    return resp

def get_user_by_id(user_id):
    """Retrieve a user from the database by their ID.

    Args:
        user_id (str): The ID of the user.

    Returns:
        dict: A dictionary containing the user's details.
    """
    try:
        query = f"""
            SELECT * FROM Users WHERE _id = '{user_id}'
        """
        result = supabase.table('Users').select('*').eq('_id', user_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f'Error retrieving user by ID: {e}')
        return None