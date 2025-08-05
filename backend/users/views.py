from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from services.supabase_service import supabase
import json

@api_view(["GET"])
def get_user_profile_view(request, user_id):
    """Get user profile"""
    try:
        # Fetch user profile from Supabase
        response = supabase.table('profiles').select('*').eq('id', user_id).execute()
        
        if response.data and len(response.data) > 0:
            profile = response.data[0]
            return Response(profile)
        else:
            return Response({"error": "Profile not found"}, status=404)
            
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["PUT"])
def update_user_profile_view(request, user_id):
    """Update user profile"""
    try:
        # Get the update data from request body
        update_data = request.data
        
        # Update user profile in Supabase
        response = supabase.table('profiles').update(update_data).eq('id', user_id).execute()
        
        if response.data and len(response.data) > 0:
            return Response(response.data[0])
        else:
            return Response({"error": "Profile not found"}, status=404)
            
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_user_friends_view(request, user_id):
    """Get user friends"""
    try:
        # Get accepted friendships where user is either requester or receiver
        response = supabase.table('friendships').select(
            'requester_id,receiver_id,profiles!requester_id(*),profiles!receiver_id(*)'
        ).or_(f'requester_id.eq.{user_id},receiver_id.eq.{user_id}').eq('status', 'accepted').execute()
        
        friends = []
        for friendship in response.data:
            if friendship['requester_id'] == user_id:
                friends.append(friendship['profiles!receiver_id'])
            else:
                friends.append(friendship['profiles!requester_id'])
        
        return Response({"friends": friends})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_pending_friend_requests_view(request, user_id):
    """Get pending friend requests"""
    try:
        # Get pending friend requests where user is the receiver
        response = supabase.table('friendships').select(
            'requester_id,profiles!requester_id(*)'
        ).eq('receiver_id', user_id).eq('status', 'pending').execute()
        
        requests = []
        for friendship in response.data:
            requests.append(friendship['profiles!requester_id'])
        
        return Response({"requests": requests})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def send_friend_request_view(request):
    """Send friend request"""
    try:
        requester_id = request.data.get('requester_id')
        receiver_id = request.data.get('receiver_id')
        
        if not requester_id or not receiver_id:
            return Response({"error": "requester_id and receiver_id are required"}, status=400)
        
        # Check if friendship already exists
        existing = supabase.table('friendships').select('*').or_(
            f'and(requester_id.eq.{requester_id},receiver_id.eq.{receiver_id})',
            f'and(requester_id.eq.{receiver_id},receiver_id.eq.{requester_id})'
        ).execute()
        
        if existing.data:
            return Response({"error": "Friendship already exists"}, status=400)
        
        # Create new friendship request
        response = supabase.table('friendships').insert({
            'requester_id': requester_id,
            'receiver_id': receiver_id,
            'status': 'pending'
        }).execute()
        
        return Response({"message": "Friend request sent successfully"})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def accept_friend_request_view(request):
    """Accept friend request"""
    try:
        requester_id = request.data.get('requester_id')
        receiver_id = request.data.get('receiver_id')
        
        if not requester_id or not receiver_id:
            return Response({"error": "requester_id and receiver_id are required"}, status=400)
        
        # Update friendship status to accepted
        response = supabase.table('friendships').update({
            'status': 'accepted'
        }).eq('requester_id', requester_id).eq('receiver_id', receiver_id).eq('status', 'pending').execute()
        
        if response.data:
            return Response({"message": "Friend request accepted successfully"})
        else:
            return Response({"error": "Friend request not found"}, status=404)
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["DELETE"])
def cancel_friend_request_view(request):
    """Cancel friend request"""
    try:
        requester_id = request.data.get('requester_id')
        receiver_id = request.data.get('receiver_id')
        
        if not requester_id or not receiver_id:
            return Response({"error": "requester_id and receiver_id are required"}, status=400)
        
        # Delete the friendship request
        response = supabase.table('friendships').delete().eq('requester_id', requester_id).eq('receiver_id', receiver_id).eq('status', 'pending').execute()
        
        return Response({"message": "Friend request cancelled successfully"})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["DELETE"])
def unfriend_user_view(request):
    """Unfriend user"""
    try:
        user1_id = request.data.get('user1_id')
        user2_id = request.data.get('user2_id')
        
        if not user1_id or not user2_id:
            return Response({"error": "user1_id and user2_id are required"}, status=400)
        
        # Delete the friendship (either direction)
        response = supabase.table('friendships').delete().or_(
            f'and(requester_id.eq.{user1_id},receiver_id.eq.{user2_id})',
            f'and(requester_id.eq.{user2_id},receiver_id.eq.{user1_id})'
        ).execute()
        
        return Response({"message": "Unfriended successfully"})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_friendship_status_view(request, current_user_id, target_user_id):
    """Get friendship status"""
    try:
        # Check if friendship exists
        response = supabase.table('friendships').select('*').or_(
            f'and(requester_id.eq.{current_user_id},receiver_id.eq.{target_user_id})',
            f'and(requester_id.eq.{target_user_id},receiver_id.eq.{current_user_id})'
        ).execute()
        
        if not response.data:
            return Response({"status": "none", "is_requester": False})
        
        friendship = response.data[0]
        is_requester = friendship['requester_id'] == current_user_id
        
        return Response({
            "status": friendship['status'],
            "is_requester": is_requester
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_user_favourites_view(request, user_id):
    """Get user favourites"""
    try:
        # Get user's favourite clubs
        response = supabase.table('user_favourites').select(
            'club_id,clubs(*)'
        ).eq('user_id', user_id).execute()
        
        favourites = [item['clubs'] for item in response.data]
        return Response({"favourites": favourites})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def add_club_to_favourites_view(request):
    """Add club to favourites"""
    try:
        user_id = request.data.get('user_id')
        club_id = request.data.get('club_id')
        
        if not user_id or not club_id:
            return Response({"error": "user_id and club_id are required"}, status=400)
        
        # Check if already favourited
        existing = supabase.table('user_favourites').select('*').eq('user_id', user_id).eq('club_id', club_id).execute()
        
        if existing.data:
            return Response({"error": "Club already in favourites"}, status=400)
        
        # Add to favourites
        response = supabase.table('user_favourites').insert({
            'user_id': user_id,
            'club_id': club_id
        }).execute()
        
        return Response({"message": "Added to favourites successfully"})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["DELETE"])
def remove_club_from_favourites_view(request):
    """Remove club from favourites"""
    try:
        user_id = request.data.get('user_id')
        club_id = request.data.get('club_id')
        
        if not user_id or not club_id:
            return Response({"error": "user_id and club_id are required"}, status=400)
        
        # Remove from favourites
        response = supabase.table('user_favourites').delete().eq('user_id', user_id).eq('club_id', club_id).execute()
        
        return Response({"message": "Removed from favourites successfully"})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def check_favourite_exists_view(request, user_id, club_id):
    """Check if favourite exists"""
    try:
        # Check if club is in user's favourites
        response = supabase.table('user_favourites').select('*').eq('user_id', user_id).eq('club_id', club_id).execute()
        
        exists = len(response.data) > 0
        return Response({"exists": exists})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["PUT"])
def update_user_active_club_view(request, user_id):
    """Update user active club"""
    try:
        club_id = request.data.get('club_id')
        expires_at = request.data.get('expires_at')
        
        if not club_id:
            return Response({"error": "club_id is required"}, status=400)
        
        # Update user's active club
        response = supabase.table('profiles').update({
            'active_club_id': club_id,
            'active_club_expires_at': expires_at
        }).eq('id', user_id).execute()
        
        if response.data:
            return Response(response.data[0])
        else:
            return Response({"error": "Profile not found"}, status=404)
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def check_and_clear_expired_attendance_view(request, user_id):
    """Check and clear expired attendance"""
    try:
        from datetime import datetime
        
        # Get current time
        now = datetime.utcnow().isoformat()
        
        # Update profiles where active_club_closed is in the past
        response = supabase.table('profiles').update({
            'active_club_id': None,
             'active_club_closed': None
        }).eq('id', user_id).lt('active_club_closed', now).execute()
        
        cleared = len(response.data) > 0
        return Response({"cleared": cleared})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_friends_active_clubs_view(request, user_id):
    """Get friends active clubs"""
    try:
        # Get user's friends
        friends_response = supabase.table('friendships').select(
            'requester_id,receiver_id'
        ).or_(f'requester_id.eq.{user_id},receiver_id.eq.{user_id}').eq('status', 'accepted').execute()
        
        friend_ids = []
        for friendship in friends_response.data:
            if friendship['requester_id'] == user_id:
                friend_ids.append(friendship['receiver_id'])
            else:
                friend_ids.append(friendship['requester_id'])
        
        if not friend_ids:
            return Response({"active_clubs": []})
        
        # Get friends' active clubs
        active_clubs_response = supabase.table('profiles').select(
            'id,username,avatar_url,active_club_id,active_club_closed,clubs(*)'
        ).in_('id', friend_ids).not_.is_('active_club_id', 'null').execute()
        
        active_clubs = []
        for profile in active_clubs_response.data:
            if profile['clubs']:
                active_clubs.append({
                    'user_id': profile['id'],
                    'username': profile['username'],
                    'avatar_url': profile['avatar_url'],
                    'club': profile['clubs'],
                    'expires_at': profile['active_club_closed']
                })
        
        return Response({"active_clubs": active_clubs})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["DELETE"])
def delete_user_account_view(request, user_id):
    """Delete user account"""
    try:
        # Delete user's profile
        response = supabase.table('profiles').delete().eq('id', user_id).execute()
        
        # Note: In a real implementation, you might also want to delete related data
        # like friendships, favourites, etc. This is a simplified version.
        
        return Response({"message": "Account deleted successfully"})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def search_users_view(request):
    """Search users"""
    try:
        search_term = request.GET.get('q', '')
        
        if not search_term:
            return Response({"users": []})
        
        # Search users by username (simplified query)
        response = supabase.table('profiles').select('*').ilike('username', f'%{search_term}%').limit(20).execute()
        
        return Response({"users": response.data})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)
