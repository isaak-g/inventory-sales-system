import requests

# Replace with a valid JWT token from your system (copy from localStorage or Postman)
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc0MTUzOTg2NywianRpIjoiYzIwYzAxM2QtMGY4NS00ZWQ5LWE2NGQtNDRjN2IzMmExNDc2IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3NDE1Mzk4NjcsImNzcmYiOiI1YzQ4MDc1MC1jZmE5LTRmNDAtYTBkMS02NGQxMmE2N2JiYTQiLCJleHAiOjE3NDE1NDM0NjcsInJvbGUiOiJhZG1pbiJ9.uyiDrcJ8uHgHG-bvhgIivBcB5j8Kq5jCnxldJpepaB4"
# API endpoint to test
API_URL = "http://127.0.0.1:5000/add_product"

# Ensure the token is valid before proceeding
if not JWT_TOKEN or JWT_TOKEN.count('.') != 2:
    print("❌ Invalid JWT Token! It must have 3 parts (header.payload.signature).")
    exit()

# Set up headers with JWT
headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

# Product payload to test the API
payload = {
    "name": "Test Product",
    "brand": "Test Brand",
    "category": "Test Category",
    "price": 100,
    "stock_quantity": 10,
    "image": "test_image_url"
}

try:
    # Make the API request
    response = requests.post(API_URL, headers=headers, json=payload)

    # Print the response
    print("\n🔍 Response Status Code:", response.status_code)
    try:
        response_json = response.json()
        print("📩 Response JSON:", response_json)

        # Specific JWT error handling
        if response_json.get("msg") == "Not enough segments":
            print("⚠️ Possible cause: Invalid or missing JWT token.")
        elif response_json.get("msg") == "Signature verification failed":
            print("⚠️ Possible cause: JWT token is expired or incorrect.")
        elif response_json.get("msg") == "Token has expired":
            print("⚠️ Possible cause: JWT token is expired. Please log in again.")
    except Exception:
        print("⚠️ Response is not in JSON format:", response.text)

except requests.exceptions.RequestException as e:
    print("❌ Request Error:", e)
