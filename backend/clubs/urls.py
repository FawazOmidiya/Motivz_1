from django.urls import path
from .views import get_all_clubs, create_club, get_trending_clubs_view, get_club_by_id_view, get_club_trending_status_view, get_filtered_clubs_view, search_clubs_view, get_friends_attending_view, get_club_music_schedule_view, get_club_reviews_view, add_club_review_view, get_user_profile_view, update_user_profile_view, get_user_friends_view, get_pending_friend_requests_view, send_friend_request_view, accept_friend_request_view, unfriend_user_view, get_user_favourites_view, add_club_to_favourites_view, remove_club_from_favourites_view, check_favourite_exists_view, get_clubs_json

urlpatterns = [
    path("all/", get_all_clubs, name="get_all_clubs"),
    path("json/", get_clubs_json, name="get_clubs_json"),
    path("trending/", get_trending_clubs_view, name="get_trending_clubs"),
    path("filtered/", get_filtered_clubs_view, name="get_filtered_clubs"),
    path("search/", search_clubs_view, name="search_clubs"),
    path("<str:club_id>/", get_club_by_id_view, name="get_club_by_id"),
    path("<str:club_id>/friends-attending/", get_friends_attending_view, name="get_friends_attending"),
    path("<str:club_id>/trending-status/", get_club_trending_status_view, name="get_club_trending_status"),
    path("<str:club_id>/music-schedule/", get_club_music_schedule_view, name="get_club_music_schedule"),
    path("<str:club_id>/reviews/", get_club_reviews_view, name="get_club_reviews"),
    path("<str:club_id>/add-review/", add_club_review_view, name="add_club_review"),
    path("add/", create_club, name="create_club"),
    # User profile endpoints
    path("users/<str:user_id>/profile/", get_user_profile_view, name="get_user_profile"),
    path("users/<str:user_id>/profile/update/", update_user_profile_view, name="update_user_profile"),
    path("users/<str:user_id>/friends/", get_user_friends_view, name="get_user_friends"),
    path("users/<str:user_id>/pending-requests/", get_pending_friend_requests_view, name="get_pending_friend_requests"),
    path("users/<str:user_id>/favourites/", get_user_favourites_view, name="get_user_favourites"),
    path("users/<str:user_id>/favourites/<str:club_id>/", check_favourite_exists_view, name="check_favourite_exists"),
    # Friendship management endpoints
    path("friendships/send-request/", send_friend_request_view, name="send_friend_request"),
    path("friendships/accept-request/", accept_friend_request_view, name="accept_friend_request"),
    path("friendships/unfriend/", unfriend_user_view, name="unfriend_user"),
    # Favourites management endpoints
    path("favourites/add/", add_club_to_favourites_view, name="add_club_to_favourites"),
    path("favourites/remove/", remove_club_from_favourites_view, name="remove_club_from_favourites"),
]
