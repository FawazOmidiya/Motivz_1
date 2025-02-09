from django.urls import path
from .views import get_all_clubs, create_club

urlpatterns = [
    path("all/", get_all_clubs, name="get_all_clubs"),
    path("add/", create_club, name="create_club"),
]
