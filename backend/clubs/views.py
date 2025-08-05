from django.shortcuts import render
from services.supabase_service import get_clubs, add_club, get_trending_clubs, get_club_by_id, get_club_trending_status, get_filtered_clubs, search_clubs, get_friends_attending, get_club_music_schedule, get_club_reviews, add_club_review, get_user_profile, update_user_profile, get_user_friends, get_pending_friend_requests, send_friend_request, accept_friend_request, unfriend_user, get_user_favourites, add_club_to_favourites, remove_club_from_favourites, check_favourite_exists, print_all_clubs_json
from .models import Club
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes


# Create your views here.

# Requires user authentication
@api_view(["GET"])
def get_all_clubs(request):
    """Fetch all clubs from Supabase"""
    clubs = get_clubs()
    return Response({"clubs": clubs})

@api_view(["GET"])
def get_clubs_json(request):
    """Fetch all clubs and return them in JSON format"""
    clubs = get_clubs()
    return Response(clubs)  # Returns raw JSON array

@api_view(["GET"])
def get_club_by_id_view(request, club_id):
    """Fetch a single club by ID from Supabase"""
    club = get_club_by_id(club_id)
    if club:
        return Response({"club": club})
    else:
        return Response({"error": "Club not found"}, status=404)

@api_view(["GET"])
def get_trending_clubs_view(request):
    """Fetch trending clubs based on recent reviews and ratings"""
    trending_clubs = get_trending_clubs()
    return Response({"trending_clubs": trending_clubs})

@api_view(["GET"])
def create_club(request):
    """Create a new club entry in Supabase"""
    # Implementation here
    pass

@api_view(["GET"])
def get_club_trending_status_view(request, club_id):
    """Get trending status for a single club"""
    try:
        trending_status = get_club_trending_status(club_id)
        return Response(trending_status)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_friends_attending_view(request, club_id):
    """Get friends of a user who are attending a specific club"""
    try:
        # Get user_id from query parameters
        user_id = request.GET.get('user_id', '').strip()
        
        if not user_id:
            return Response({"error": "user_id parameter is required"}, status=400)
        
        friends_attending = get_friends_attending(club_id, user_id)
        return Response({"friends": friends_attending})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def search_clubs_view(request):
    """Search clubs by name or address"""
    try:
        # Get query parameters
        query = request.GET.get('q', '').strip()
        limit = int(request.GET.get('limit', 20))
        
        if not query:
            return Response({"clubs": []})
        
        search_results = search_clubs(query, limit)
        return Response({"clubs": search_results})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_filtered_clubs_view(request):
    """Get filtered and sorted clubs with trending status"""
    try:
        # Get query parameters
        filter_open = request.GET.get('filter_open', 'false').lower() == 'true'
        selected_genres = request.GET.get('selected_genres', '').split(',') if request.GET.get('selected_genres') else []
        min_rating = float(request.GET.get('min_rating', 0))
        
        # Remove empty strings from genres
        selected_genres = [genre for genre in selected_genres if genre.strip()]
        
        filtered_clubs = get_filtered_clubs(
            filter_open=filter_open,
            selected_genres=selected_genres,
            min_rating=min_rating
        )
        
        return Response({"clubs": filtered_clubs})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_club_music_schedule_view(request, club_id):
    """Get music schedule for a club on a specific day"""
    try:
        day_number = int(request.GET.get('day', 0))
        music_schedule = get_club_music_schedule(club_id, day_number)
        return Response({"music_schedule": music_schedule})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_club_reviews_view(request, club_id):
    """Get reviews for a club"""
    try:
        review_type = request.GET.get('type', 'app')  # 'app' or 'google'
        reviews = get_club_reviews(club_id, review_type)
        return Response({"reviews": reviews})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def add_club_review_view(request, club_id):
    """Add a review for a club"""
    try:
        user_id = request.data.get('user_id')
        rating = int(request.data.get('rating'))
        music_genre = request.data.get('music_genre', '')
        review_text = request.data.get('review_text', '')
        
        if not user_id or not rating:
            return Response({"error": "user_id and rating are required"}, status=400)
        
        review = add_club_review(club_id, user_id, rating, music_genre, review_text)
        return Response({"review": review})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_user_profile_view(request, user_id):
    """Get user profile by ID"""
    try:
        profile = get_user_profile(user_id)
        if profile:
            return Response({"profile": profile})
        else:
            return Response({"error": "User not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["PUT"])
def update_user_profile_view(request, user_id):
    """Update user profile"""
    try:
        updates = request.data
        profile = update_user_profile(user_id, updates)
        return Response({"profile": profile})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_user_friends_view(request, user_id):
    """Get user's friends"""
    try:
        friends = get_user_friends(user_id)
        return Response({"friends": friends})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_pending_friend_requests_view(request, user_id):
    """Get pending friend requests for a user"""
    try:
        requests = get_pending_friend_requests(user_id)
        return Response({"requests": requests})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def send_friend_request_view(request):
    """Send a friend request"""
    try:
        requester_id = request.data.get('requester_id')
        receiver_id = request.data.get('receiver_id')
        
        if not requester_id or not receiver_id:
            return Response({"error": "requester_id and receiver_id are required"}, status=400)
        
        friendship = send_friend_request(requester_id, receiver_id)
        return Response({"friendship": friendship})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def accept_friend_request_view(request):
    """Accept a friend request"""
    try:
        requester_id = request.data.get('requester_id')
        receiver_id = request.data.get('receiver_id')
        
        if not requester_id or not receiver_id:
            return Response({"error": "requester_id and receiver_id are required"}, status=400)
        
        friendship = accept_friend_request(requester_id, receiver_id)
        return Response({"friendship": friendship})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["DELETE"])
def unfriend_user_view(request):
    """Unfriend a user"""
    try:
        user_id_1 = request.data.get('user_id_1')
        user_id_2 = request.data.get('user_id_2')
        
        if not user_id_1 or not user_id_2:
            return Response({"error": "user_id_1 and user_id_2 are required"}, status=400)
        
        unfriend_user(user_id_1, user_id_2)
        return Response({"success": True})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_user_favourites_view(request, user_id):
    """Get user's favourite clubs"""
    try:
        favourites = get_user_favourites(user_id)
        return Response({"favourites": favourites})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def add_club_to_favourites_view(request):
    """Add a club to user's favourites"""
    try:
        user_id = request.data.get('user_id')
        club_id = request.data.get('club_id')
        
        if not user_id or not club_id:
            return Response({"error": "user_id and club_id are required"}, status=400)
        
        favourite = add_club_to_favourites(user_id, club_id)
        return Response({"favourite": favourite})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["DELETE"])
def remove_club_from_favourites_view(request):
    """Remove a club from user's favourites"""
    try:
        user_id = request.data.get('user_id')
        club_id = request.data.get('club_id')
        
        if not user_id or not club_id:
            return Response({"error": "user_id and club_id are required"}, status=400)
        
        remove_club_from_favourites(user_id, club_id)
        return Response({"success": True})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def check_favourite_exists_view(request, user_id, club_id):
    """Check if a club is in user's favourites"""
    try:
        exists = check_favourite_exists(user_id, club_id)
        return Response({"exists": exists})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
