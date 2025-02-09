from django.shortcuts import render
from services.supabase_service import get_clubs, add_club
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
def create_club(request):
    """Create a new club entry in Supabase"""
    data = request.data
    club = add_club(data)
    return Response({"club": club})
