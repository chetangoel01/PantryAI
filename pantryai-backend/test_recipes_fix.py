#!/usr/bin/env python3

import requests
import json

def test_recipes_endpoint():
    # Test with one of the device IDs from the pantry
    device_id = "b044c657-c467-4c66-95da-35e427ea122a"
    
    url = f"https://pantryai.dragonchetan.com/recipes/match?user_id={device_id}&k=5"
    
    print(f"Testing URL: {url}")
    
    try:
        response = requests.get(url)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if 'matched_recipes' in data:
                print(f"Found {len(data['matched_recipes'])} recipes")
                for i, recipe in enumerate(data['matched_recipes'][:3]):  # Show first 3
                    print(f"  {i+1}. {recipe.get('name', 'Unknown')} (Score: {recipe.get('score', 'N/A')})")
            else:
                print("No matched_recipes in response")
        else:
            print(f"Error response: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_recipes_endpoint() 