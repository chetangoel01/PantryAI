#!/usr/bin/env python3

import requests
import json

def test_deployed_api():
    # Test with the device ID that has pantry items
    device_id = "b044c657-c467-4c66-95da-35e427ea122a"
    
    print("Testing deployed API at pantryai.dragonchetan.com")
    print(f"Device ID: {device_id}")
    print("-" * 50)
    
    # Test 1: Check pantry endpoint
    print("1. Testing pantry endpoint...")
    try:
        pantry_url = f"https://pantryai.dragonchetan.com/pantry"
        headers = {'X-Device-ID': device_id}
        response = requests.get(pantry_url, headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            pantry_data = response.json()
            print(f"   Found {len(pantry_data)} pantry items")
            for item in pantry_data:
                print(f"   - {item['name']} ({item['quantity']} {item['unit']})")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test 2: Check recipes endpoint
    print("2. Testing recipes endpoint...")
    try:
        recipes_url = f"https://pantryai.dragonchetan.com/recipes/match?user_id={device_id}&k=5"
        response = requests.get(recipes_url)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            recipes_data = response.json()
            print(f"   Response: {json.dumps(recipes_data, indent=2)}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_deployed_api() 