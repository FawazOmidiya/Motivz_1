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
    """Fetch trending clubs based on recent reviews and ratings"""
    try:
        # Get clubs with their recent review data
        # We'll look at reviews from the last 7 days
        from datetime import datetime, timedelta
        seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        
        # Query to get clubs with recent reviews and calculate trending metrics
        response = supabase.rpc('get_trending_clubs', {
            'days_back': 7,
            'min_reviews': 3,  # Minimum reviews to be considered trending
            'min_rating': 3.5   # Minimum average rating to be considered trending
        }).execute()
        
        if response.data:
            return response.data
        else:
            # Fallback: if RPC doesn't exist, use a simpler query
            return get_trending_clubs_fallback(seven_days_ago)
            
    except Exception as e:
        print(f"Error fetching trending clubs: {e}")
        return []

def get_trending_clubs_fallback(seven_days_ago):
    """Fallback method to get trending clubs without RPC"""
    try:
        # Get all clubs first
        clubs_response = supabase.table("Clubs").select("*").execute()
        clubs = clubs_response.data or []
        
        trending_clubs = []
        
        for club in clubs:
            # Get recent reviews for this club
            reviews_response = supabase.table("club_reviews").select(
                "rating, created_at"
            ).eq("club_id", club["id"]).gte("created_at", seven_days_ago).execute()
            
            recent_reviews = reviews_response.data or []
            
            if len(recent_reviews) >= 3:  # Minimum 3 reviews in last 7 days
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
        
        return trending_clubs[:10]  # Return top 10 trending clubs
        
    except Exception as e:
        print(f"Error in fallback trending clubs: {e}")
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