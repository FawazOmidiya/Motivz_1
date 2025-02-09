from django.test import TestCase

# Create your tests here.
import requests

url = "http://127.0.0.1:8000/auth_app/login/"
data = {
    "email": "testuser1@example.com",
    "password": "SecurePass123"
}

response = requests.post(url, json=data)

print("Status Code:", response.status_code)
print("Response:", response)