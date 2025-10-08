import requests
import json

BASE_URL = "http://localhost:8000/api"

print("🧪 Testing Book Ratings & Reviews System")
print("=" * 50)

# Test 1: Get Popular Books
print("\n1. Testing Popular Books Endpoint...")
try:
    response = requests.get(f"{BASE_URL}/books/popular/")
    print(f"✅ Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data)} popular books")
    else:
        print(f"❌ Response: {response.json()}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Get Book Ratings (for book ID 1)
print("\n2. Testing Book Ratings Endpoint...")
try:
    response = requests.get(f"{BASE_URL}/books/1/ratings/")
    print(f"✅ Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data)} ratings for book ID 1")
    else:
        print(f"⚠️  No ratings yet (expected for new system)")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Get Book Reviews (for book ID 1)
print("\n3. Testing Book Reviews Endpoint...")
try:
    response = requests.get(f"{BASE_URL}/books/1/reviews/")
    print(f"✅ Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data)} reviews for book ID 1")
    else:
        print(f"⚠️  No reviews yet (expected for new system)")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 50)
print("🎯 Backend Rating System Test Complete!")
print("\n📝 Next Steps:")
print("• If all tests show ✅, backend is working!")
print("• If you see 404 errors, check your URL patterns")
print("• If you see 500 errors, check your views logic")