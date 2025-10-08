import requests
import json

print("🔐 Testing Password Reset API Endpoints...")
print("=" * 50)

# Test Endpoint 1: Request Password Reset
print("\n1. Testing Password Reset Request...")
try:
    response1 = requests.post(
        "http://localhost:8000/api/password-reset/request/",
        json={"email": "lighteningblade.256@gmail.com"}
    )
    print(f"✅ Status Code: {response1.status_code}")
    print(f"✅ Response: {json.dumps(response1.json(), indent=2)}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "-" * 50)

# Test Endpoint 2: Verify Token
print("\n2. Testing Token Verification...")
try:
    response2 = requests.post(
        "http://localhost:8000/api/password-reset/verify-token/",
        json={"token": "Y9oRpoV4eySA2KD2en75iGIbcKUzydCd"}
    )
    print(f"✅ Status Code: {response2.status_code}")
    print(f"✅ Response: {json.dumps(response2.json(), indent=2)}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 50)
print("🎯 Test completed!")