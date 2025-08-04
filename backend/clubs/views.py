from django.shortcuts import render
from services.supabase_service import get_clubs, add_club, get_trending_clubs, get_club_by_id, print_all_clubs_json
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
