from django.shortcuts import render
from services.supabase_service import get_clubs, add_club, get_trending_clubs, get_club_by_id, get_club_trending_status, get_filtered_clubs, search_clubs, get_friends_attending, get_club_music_schedule, get_club_reviews, add_club_review, print_all_clubs_json
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
