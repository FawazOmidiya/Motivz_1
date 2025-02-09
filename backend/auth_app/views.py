import os
import json
import requests
from dotenv import load_dotenv
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from auth0.authentication import Database
from auth0.authentication import GetToken
import supabase

# ✅ Load environment variables
load_dotenv()

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# ✅ Validate environment variables
if not all([AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, SUPABASE_URL, SUPABASE_KEY]):
    raise ValueError("Missing required environment variables")


# Initialize Supabase client
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

@csrf_exempt
def register_user(request):
    """Registers a user in Auth0 and then creates a corresponding record in Supabase."""
    if request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")

        # Register user in Auth0
        db = Database(AUTH0_DOMAIN, AUTH0_CLIENT_ID)
        
        auth0_user = db.signup(
        email=email,
        password=password,
        connection="Username-Password-Authentication"
        )
        if "_id" in auth0_user:
            auth0_user_id = auth0_user["_id"]

            # Create user in Supabase
            supabase_client.table("Users").insert({
                "_id": auth0_user_id,
                "email": email
            }).execute()

            return JsonResponse({"_id": auth0_user_id, "message": "User registered successfully!"}, status=201)
        else:
            return JsonResponse({"error": "Failed to register user"}, status=400)
    """
    #FIXME:Currently, this method is incomplete, it bypasses the auth0 authentication and 
    # directly validates in the supabase database using the email, which is less secure. Fix this Later.
    """
    
@csrf_exempt
def login_user(request):
    """Authenticates a user using Auth0 SDK and returns a JWT token along with the Supabase user object."""
    if request.method != "POST":
        return JsonResponse({"error": "Only POST requests allowed"}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return JsonResponse({"error": "Email and password are required"}, status=400)

        # ✅ Authenticate user with Auth0
        auth0_token = GetToken(AUTH0_DOMAIN, AUTH0_CLIENT_ID, client_secret=AUTH0_CLIENT_SECRET)
        auth0_response = auth0_token.login(username=email, password=password, realm="Username-Password-Authentication")

        if "access_token" not in auth0_response:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        # ✅ Get user info from Auth0 token
        access_token = auth0_response["access_token"]
        id_token = auth0_response["id_token"]
        expires_in = auth0_response["expires_in"]
        token_type = auth0_response["token_type"]

        # ✅ Retrieve user from Supabase using email
        response = supabase_client.table("Users").select("*").eq("email", email).execute()
        if response.data:
            supabase_user = response.data[0]  # Get the first user record
        else:
            return JsonResponse({"error": "User not found in Supabase"}, status=404)

        return JsonResponse({
            "access_token": access_token,
            "id_token": id_token,
            "expires_in": expires_in,
            "token_type": token_type,
            "user": supabase_user  # ✅ Include Supabase user data
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": "Internal Server Error", "details": str(e)}, status=500)