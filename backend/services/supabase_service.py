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

def add_club(data):
    """Add a new club to Supabase"""
    response = supabase.table("clubs").insert(data).execute()
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