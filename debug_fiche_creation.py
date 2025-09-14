#!/usr/bin/env python3
"""
Debug script to see what's actually being returned when creating a fiche
"""

import requests
import json
import sys

# Configuration
BASE_URL = "https://h2eaux-dashboard.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def get_admin_token():
    """Get admin authentication token"""
    admin_data = {"username": "admin", "password": "admin123"}
    try:
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json=admin_data, 
                               headers=HEADERS, 
                               timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def debug_fiche_creation():
    """Debug fiche creation to see actual response"""
    token = get_admin_token()
    if not token:
        return
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Simple test data first
    simple_data = {
        "nom": "Debug Test",
        "client_nom": "Debug Client",
        "type_intervention": "visite_technique"
    }
    
    print("🔍 Creating fiche with simple data:")
    print(json.dumps(simple_data, indent=2))
    
    try:
        response = requests.post(f"{BASE_URL}/fiches-sdb", 
                               json=simple_data, 
                               headers=auth_headers, 
                               timeout=10)
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            fiche = response.json()
            print(f"\n✅ Fiche created successfully!")
            print("📋 Full response data:")
            print(json.dumps(fiche, indent=2, default=str))
            
            # Check what fields are actually present
            print(f"\n🔍 Available fields in response:")
            for key, value in fiche.items():
                print(f"  {key}: {value}")
                
            return fiche.get("id")
        else:
            print(f"❌ Failed to create fiche")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def test_existing_fiches():
    """Check existing fiches to see their structure"""
    token = get_admin_token()
    if not token:
        return
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    print("\n🔍 Checking existing fiches:")
    try:
        response = requests.get(f"{BASE_URL}/fiches-sdb", 
                              headers=auth_headers, 
                              timeout=10)
        
        if response.status_code == 200:
            fiches = response.json()
            print(f"Found {len(fiches)} existing fiches")
            
            if fiches:
                print("\n📋 First fiche structure:")
                print(json.dumps(fiches[0], indent=2, default=str))
                
                print(f"\n🔍 Available fields in existing fiche:")
                for key, value in fiches[0].items():
                    print(f"  {key}: {value}")
            else:
                print("No existing fiches found")
        else:
            print(f"❌ Failed to get fiches: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error getting fiches: {str(e)}")

if __name__ == "__main__":
    debug_fiche_creation()
    test_existing_fiches()