from django.urls import path
from . import views

urlpatterns = [
    # User profile endpoints
    path('<str:user_id>/profile/', views.get_user_profile_view, name='get_user_profile'),
    path('<str:user_id>/profile/update/', views.update_user_profile_view, name='update_user_profile'),
    
    # Friends endpoints
    path('<str:user_id>/friends/', views.get_user_friends_view, name='get_user_friends'),
    path('<str:user_id>/pending-requests/', views.get_pending_friend_requests_view, name='get_pending_requests'),
    path('friendships/send-request/', views.send_friend_request_view, name='send_friend_request'),
    path('friendships/accept-request/', views.accept_friend_request_view, name='accept_friend_request'),
    path('friendships/cancel-request/', views.cancel_friend_request_view, name='cancel_friend_request'),
    path('friendships/unfriend/', views.unfriend_user_view, name='unfriend_user'),
    path('<str:current_user_id>/friendship-status/<str:target_user_id>/', views.get_friendship_status_view, name='get_friendship_status'),
    
    # Favourites endpoints
    path('<str:user_id>/favourites/', views.get_user_favourites_view, name='get_user_favourites'),
    path('favourites/add/', views.add_club_to_favourites_view, name='add_club_to_favourites'),
    path('favourites/remove/', views.remove_club_from_favourites_view, name='remove_club_from_favourites'),
    path('<str:user_id>/favourites/<str:club_id>/', views.check_favourite_exists_view, name='check_favourite_exists'),
    
    # User activity endpoints
    path('<str:user_id>/active-club/', views.update_user_active_club_view, name='update_user_active_club'),
    path('<str:user_id>/clear-attendance/', views.check_and_clear_expired_attendance_view, name='clear_expired_attendance'),
    path('<str:user_id>/friends-active-clubs/', views.get_friends_active_clubs_view, name='get_friends_active_clubs'),
    
    # User management endpoints
    path('<str:user_id>/delete-account/', views.delete_user_account_view, name='delete_user_account'),
    path('search/', views.search_users_view, name='search_users'),
] 