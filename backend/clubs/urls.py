from django.urls import path
from .views import get_all_clubs, create_club, get_trending_clubs_view, get_club_by_id_view, get_clubs_json

urlpatterns = [
    path("all/", get_all_clubs, name="get_all_clubs"),
    path("json/", get_clubs_json, name="get_clubs_json"),
    path("trending/", get_trending_clubs_view, name="get_trending_clubs"),
    path("<str:club_id>/", get_club_by_id_view, name="get_club_by_id"),
    path("add/", create_club, name="create_club"),
]
