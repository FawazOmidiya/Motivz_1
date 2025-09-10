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

def get_user_profile(user_id: str):
    """Get user profile by ID"""
    try:
        response = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        
        if response.data:
            return response.data[0]
        else:
            return None
            
    except Exception as e:
        print(f"Error getting user profile: {e}")
        return None

def update_user_profile(user_id: str, updates: dict):
    """Update user profile"""
    try:
        response = supabase.table("user_profiles").update(updates).eq("id", user_id).execute()
        
        if response.data:
            return response.data[0]
        else:
            raise Exception("Failed to update profile")
            
    except Exception as e:
        print(f"Error updating user profile: {e}")
        raise e

def get_user_friends(user_id: str):
    """Get user's friends"""
    try:
        # Get friends where user is the requester
        requester_response = supabase.table("friendships").select(
            "receiver:user_profiles!receiver_id(*)"
        ).eq("requester_id", user_id).eq("status", "friends").execute()
        
        # Get friends where user is the receiver
        receiver_response = supabase.table("friendships").select(
            "requester:user_profiles!requester_id(*)"
        ).eq("receiver_id", user_id).eq("status", "friends").execute()
        
        friends = []
        
        if requester_response.data:
            friends.extend([item["receiver"] for item in requester_response.data])
        
        if receiver_response.data:
            friends.extend([item["requester"] for item in receiver_response.data])
        
        return friends
        
    except Exception as e:
        print(f"Error getting user friends: {e}")
        return []

def get_pending_friend_requests(user_id: str):
    """Get pending friend requests for a user"""
    try:
        response = supabase.table("friendships").select(
            "requester:user_profiles!requester_id(*)"
        ).eq("receiver_id", user_id).eq("status", "pending").execute()
        
        if response.data:
            return [item["requester"] for item in response.data]
        else:
            return []
            
    except Exception as e:
        print(f"Error getting pending friend requests: {e}")
        return []

def send_friend_request(requester_id: str, receiver_id: str):
    """Send a friend request"""
    try:
        response = supabase.table("friendships").insert({
            "requester_id": requester_id,
            "receiver_id": receiver_id,
            "status": "pending"
        }).execute()
        
        if response.data:
            return response.data[0]
        else:
            raise Exception("Failed to send friend request")
            
    except Exception as e:
        print(f"Error sending friend request: {e}")
        raise e

def accept_friend_request(requester_id: str, receiver_id: str):
    """Accept a friend request"""
    try:
        response = supabase.table("friendships").update({
            "status": "friends"
        }).eq("requester_id", requester_id).eq("receiver_id", receiver_id).execute()
        
        if response.data:
            return response.data[0]
        else:
            raise Exception("Failed to accept friend request")
            
    except Exception as e:
        print(f"Error accepting friend request: {e}")
        raise e

def unfriend_user(user_id_1: str, user_id_2: str):
    """Unfriend a user (delete friendship)"""
    try:
        # Delete friendship in both directions - try both combinations
        try:
            response1 = supabase.table("friendships").delete().eq("requester_id", user_id_1).eq("receiver_id", user_id_2).execute()
        except:
            pass
            
        try:
            response2 = supabase.table("friendships").delete().eq("requester_id", user_id_2).eq("receiver_id", user_id_1).execute()
        except:
            pass
        
        return True
        
    except Exception as e:
        print(f"Error unfriending user: {e}")
        raise e

def get_user_favourites(user_id: str):
    """Get user's favourite clubs"""
    try:
        response = supabase.table("user_favourites").select(
            "club:Clubs(*)"
        ).eq("user_id", user_id).execute()
        
        if response.data:
            return [item["club"] for item in response.data]
        else:
            return []
            
    except Exception as e:
        print(f"Error getting user favourites: {e}")
        return []

def add_club_to_favourites(user_id: str, club_id: str):
    """Add a club to user's favourites"""
    try:
        response = supabase.table("user_favourites").insert({
            "user_id": user_id,
            "club_id": club_id
        }).execute()
        
        if response.data:
            return response.data[0]
        else:
            raise Exception("Failed to add club to favourites")
            
    except Exception as e:
        print(f"Error adding club to favourites: {e}")
        raise e

def remove_club_from_favourites(user_id: str, club_id: str):
    """Remove a club from user's favourites"""
    try:
        response = supabase.table("user_favourites").delete().eq("user_id", user_id).eq("club_id", club_id).execute()
        
        return True
        
    except Exception as e:
        print(f"Error removing club from favourites: {e}")
        raise e

def check_favourite_exists(user_id: str, club_id: str):
    """Check if a club is in user's favourites"""
    try:
        response = supabase.table("user_favourites").select("*").eq("user_id", user_id).eq("club_id", club_id).execute()
        
        return len(response.data) > 0
        
    except Exception as e:
        print(f"Error checking favourite exists: {e}")
        return False

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

# ===== RECURRING EVENTS FUNCTIONS =====
def create_recurring_event(
    title: str,
    caption: str,
    club_id: str,
    poster_url: str,
    music_genres: list,
    start_date,
    end_date,
    recurring_config: dict,
    created_by: str = None
):
    """Create an event with recurring config"""
    from datetime import datetime, timedelta
    
    # Calculate the proper start date based on recurring pattern
    if recurring_config and recurring_config.get("type") in ["weekly", "monthly"]:
        proper_start_date = _calculate_proper_start_date(recurring_config)
        if proper_start_date:
            start_date = proper_start_date.isoformat()
            # Calculate end date based on duration
            start_time = datetime.strptime(recurring_config.get("start_time", "00:00"), "%H:%M").time()
            end_time = datetime.strptime(recurring_config.get("end_time", "02:00"), "%H:%M").time()
            
            # Handle end time that goes past midnight
            if end_time < start_time:
                # End time is next day
                end_date = (proper_start_date + timedelta(days=1)).replace(
                    hour=end_time.hour, 
                    minute=end_time.minute
                ).isoformat()
            else:
                end_date = proper_start_date.replace(
                    hour=end_time.hour, 
                    minute=end_time.minute
                ).isoformat()
    
    event_data = {
        "title": title,
        "caption": caption,
        "club_id": club_id,
        "poster_url": poster_url,
        "music_genres": music_genres,
        "start_date": start_date,
        "end_date": end_date,
        "recurring_config": recurring_config,
        "created_by": created_by
    }
    response = supabase.table("events").insert(event_data).execute()
    return response.data[0] if response.data else None

def _calculate_proper_start_date(recurring_config: dict):
    """Calculate the proper start date based on recurring pattern"""
    from datetime import datetime, timedelta
    
    current_date = datetime.now().date()
    
    if recurring_config["type"] == "weekly":
        weekday = recurring_config["weekday"]
        start_time = datetime.strptime(recurring_config["start_time"], "%H:%M").time()
        
        # Find next occurrence of this weekday
        days_ahead = weekday - current_date.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        
        next_date = current_date + timedelta(days=days_ahead)
        return datetime.combine(next_date, start_time)
        
    elif recurring_config["type"] == "monthly":
        month_day = recurring_config.get("month_day", 1)
        weekday = recurring_config.get("weekday")
        start_time = datetime.strptime(recurring_config["start_time"], "%H:%M").time()
        
        # Find next month with this day
        try:
            if current_date.month == 12:
                next_date = current_date.replace(year=current_date.year + 1, month=1, day=month_day)
            else:
                next_date = current_date.replace(month=current_date.month + 1, day=month_day)
            
            # Adjust for weekday if specified
            if weekday is not None:
                while next_date.weekday() != weekday:
                    next_date += timedelta(days=1)
            
            return datetime.combine(next_date, start_time)
            
        except ValueError:
            # Handle invalid dates (e.g., Feb 30)
            return datetime.combine(current_date, start_time)
    
    return datetime.now()

def smart_generate_recurring_events(weeks_ahead: int = 4):
    """
    Smart weekly generation that tracks last generation and avoids duplicates.
    Only generates events that are actually needed.
    """
    from datetime import datetime, timedelta
    
    print(f"🔄 Starting smart recurring event generation for next {weeks_ahead} weeks...")
    
    # Get all active recurring events
    response = supabase.table("events").select("*").not_.is_("recurring_config", "null").execute()
    recurring_events = response.data or []
    
    if not recurring_events:
        print("ℹ️  No recurring events found")
        return []
    
    print(f"📅 Found {len(recurring_events)} recurring events to process")
    
    # Group events by title to prevent duplicates across templates
    events_by_title = {}
    for event in recurring_events:
        title = event["title"]
        if title not in events_by_title:
            events_by_title[title] = []
        events_by_title[title].append(event)
    
    print(f"📝 Processing {len(events_by_title)} unique event titles")
    
    generated_events = []
    total_generated = 0
    
    # Process each unique title only once
    for title, events_with_same_title in events_by_title.items():
        print(f"🎯 Processing title: '{title}' ({len(events_with_same_title)} templates)")
        
        # Use the first template for generation (they should be identical)
        primary_event = events_with_same_title[0]
        config = primary_event["recurring_config"]
        
        # Skip inactive events
        if not config.get("active", True):
            print(f"⏭️  Skipping inactive event: {title}")
            continue
        
        # Check if this event needs new instances
        events_needed = _calculate_events_needed(primary_event, config, weeks_ahead)
        
        if events_needed:
            print(f"🎯 Generating {len(events_needed)} instances for: {title}")
            generated_events.extend(events_needed)
            total_generated += len(events_needed)
        else:
            print(f"✅ No new instances needed for: {title}")
    
    # Insert all generated events at once
    if generated_events:
        print(f"💾 Inserting {total_generated} new events into database...")
        try:
            supabase.table("events").insert(generated_events).execute()
            print(f"✅ Successfully generated {total_generated} recurring events")
        except Exception as e:
            print(f"❌ Error inserting events: {e}")
            raise e
    else:
        print("ℹ️  No new events needed to be generated")
    
    return generated_events

def _calculate_events_needed(event: dict, config: dict, weeks_ahead: int) -> list:
    """
    Calculate which events need to be generated based on existing instances
    and the recurring pattern.
    """
    from datetime import datetime, timedelta
    
    # Get existing instances for this recurring event
    existing_instances = _get_existing_instances(event["id"])
    
    # Calculate what dates we need events for
    needed_dates = _calculate_needed_dates(config, weeks_ahead)
    
    # Filter out dates that already have events
    missing_dates = _find_missing_dates(needed_dates, existing_instances)
    
    if not missing_dates:
        return []
    
    # Generate events for missing dates
    events = []
    for event_date in missing_dates:
        instance = _create_event_instance(event, config, event_date)
        events.append(instance)
    
    return events

def _get_existing_instances(recurring_event_id: str) -> list:
    """Get existing instances of a recurring event"""
    try:
        # Get the recurring event template to find its title
        template_response = supabase.table("events").select("title").eq("id", recurring_event_id).execute()
        if not template_response.data:
            return []
        
        template_title = template_response.data[0]["title"]
        
        # Look for events with the same title (excluding the recurring template itself)
        # Use is_() for NULL check instead of eq()
        response = supabase.table("events").select("start_date, title").is_("recurring_config", "null").eq("title", template_title).execute()
        existing_instances = response.data or []
        
        print(f"🔍 Found {len(existing_instances)} existing instances for '{template_title}'")
        return existing_instances
    except Exception as e:
        print(f"Warning: Could not fetch existing instances: {e}")
        return []

def _calculate_needed_dates(config: dict, weeks_ahead: int) -> list:
    """Calculate all the dates where events should exist"""
    from datetime import datetime, timedelta
    
    needed_dates = []
    start_date = datetime.now().date()
    
    if config["type"] == "weekly":
        weekday = config["weekday"]
        start_time = datetime.strptime(config["start_time"], "%H:%M").time()
        
        for week in range(weeks_ahead):
            # Calculate next occurrence of this weekday
            days_ahead = weekday - start_date.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            
            event_date = start_date + timedelta(days=days_ahead + (week * 7))
            needed_dates.append(event_date)
            
    elif config["type"] == "monthly":
        month_day = config.get("month_day", 1)
        weekday = config.get("weekday")
        
        for month in range(weeks_ahead // 4 + 1):
            try:
                if start_date.month == 12:
                    event_date = start_date.replace(year=start_date.year + 1, month=1, day=month_day)
                else:
                    event_date = start_date.replace(month=start_date.month + month, day=month_day)
                
                if weekday is not None:
                    while event_date.weekday() != weekday:
                        event_date += timedelta(days=1)
                
                if event_date >= start_date:
                    needed_dates.append(event_date)
            except ValueError:
                continue
    
    return needed_dates

def _find_missing_dates(needed_dates: list, existing_instances: list) -> list:
    """Find which dates don't have events yet"""
    from datetime import datetime
    
    if not existing_instances:
        print(f"   📅 No existing instances found, generating all {len(needed_dates)} dates")
        return needed_dates
    
    # Extract dates from existing instances
    existing_dates = set()
    for instance in existing_instances:
        start_date = instance["start_date"]
        if isinstance(start_date, str):
            # Parse ISO string to date
            try:
                parsed_date = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
                existing_dates.add(parsed_date)
            except ValueError:
                continue
        else:
            # Already a datetime object
            existing_dates.add(start_date.date())
    
    # Find missing dates
    missing_dates = []
    for needed_date in needed_dates:
        if needed_date not in existing_dates:
            missing_dates.append(needed_date)
    
    print(f"   📅 Found {len(existing_dates)} existing dates, {len(missing_dates)} dates need generation")
    return missing_dates

def _create_event_instance(event: dict, config: dict, event_date) -> dict:
    """Create a single event instance for a specific date"""
    from datetime import datetime
    
    start_time = datetime.strptime(config["start_time"], "%H:%M").time()
    end_time = datetime.strptime(config["end_time"], "%H:%M").time()
    
    instance = {
        "title": event["title"],
        "caption": event["caption"],
        "club_id": event["club_id"],
        "poster_url": event["poster_url"],
        "music_genres": event["music_genres"],
        "start_date": datetime.combine(event_date, start_time).isoformat(),
        "end_date": datetime.combine(event_date, end_time).isoformat(),
        "created_by": event["created_by"],
        "recurring_config": None  # Individual instances don't need config
    }
    
    return instance

def generate_recurring_events(weeks_ahead: int = 4):
    """Generate events for all active recurring events"""
    from datetime import datetime, timedelta
    
    # Get all events with recurring config
    response = supabase.table("events").select("*").not_.is_("recurring_config", "null").execute()
    recurring_events = response.data or []
    
    generated_events = []
    
    for event in recurring_events:
        config = event["recurring_config"]
        if not config.get("active", True):
            continue
            
        if config["type"] == "weekly":
            events = _generate_weekly_events(event, config, weeks_ahead)
            generated_events.extend(events)
            
        elif config["type"] == "monthly":
            events = _generate_monthly_events(event, config, weeks_ahead)
            generated_events.extend(events)
    
    # Insert all generated events
    if generated_events:
        supabase.table("events").insert(generated_events).execute()
    
    return generated_events

def _generate_weekly_events(event: dict, config: dict, weeks_ahead: int) -> list:
    """Generate weekly recurring events"""
    from datetime import datetime, timedelta
    events = []
    start_date = datetime.now().date()
    weekday = config["weekday"]
    start_time = datetime.strptime(config["start_time"], "%H:%M").time()
    end_time = datetime.strptime(config["end_time"], "%H:%M").time()
    
    for week in range(weeks_ahead):
        # Calculate next occurrence of this weekday
        days_ahead = weekday - start_date.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        
        event_date = start_date + timedelta(days=days_ahead + (week * 7))
        
        # Create event instance
        instance = {
            "title": event["title"],
            "caption": event["caption"],
            "club_id": event["club_id"],
            "poster_url": event["poster_url"],
            "music_genres": event["music_genres"],
            "start_date": datetime.combine(event_date, start_time).isoformat(),
            "end_date": datetime.combine(event_date, end_time).isoformat(),
            "created_by": event["created_by"],
            "recurring_config": None  # Individual instances don't need config
        }
        events.append(instance)
    
    return events

def _generate_monthly_events(event: dict, config: dict, weeks_ahead: int) -> list:
    """Generate monthly recurring events"""
    from datetime import datetime, timedelta
    events = []
    start_date = datetime.now().date()
    month_day = config.get("month_day", 1)
    weekday = config.get("weekday")
    start_time = datetime.strptime(config["start_time"], "%H:%M").time()
    end_time = datetime.strptime(config["end_time"], "%H:%M").time()
    
    for month in range(weeks_ahead // 4 + 1):
        try:
            # Calculate next month's date
            if start_date.month == 12:
                event_date = start_date.replace(year=start_date.year + 1, month=1, day=month_day)
            else:
                event_date = start_date.replace(month=start_date.month + month, day=month_day)
            
            # Adjust for weekday if specified
            if weekday is not None:
                while event_date.weekday() != weekday:
                    event_date += timedelta(days=1)
            
            if event_date >= start_date:
                instance = {
                    "title": event["title"],
                    "caption": event["caption"],
                    "club_id": event["club_id"],
                    "poster_url": event["poster_url"],
                    "music_genres": event["music_genres"],
                    "start_date": datetime.combine(event_date, start_time).isoformat(),
                    "end_date": datetime.combine(event_date, end_time).isoformat(),
                    "created_by": event["created_by"],
                    "recurring_config": None
                }
                events.append(instance)
                
        except ValueError:
            continue  # Skip invalid dates
    
    return events