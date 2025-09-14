#!/usr/bin/env python3
"""
Debug Backend Test - Check what's happening with Fiches Chantier
"""

import requests
import json
import sys

# Configuration
BASE_URL = "https://h2eaux-dashboard.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def get_admin_token():
    """Get admin token for testing"""
    admin_data = {"username": "admin", "password": "admin123"}
    try:
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json=admin_data, 
                               headers=HEADERS, 
                               timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
    except Exception as e:
        print(f"Failed to get admin token: {e}")
    return None

def debug_fiche_creation():
    """Debug fiche creation step by step"""
    token = get_admin_token()
    if not token:
        print("❌ Failed to get token")
        return
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Simple test data first
    simple_data = {
        "nom": "Test Simple",
        "client_nom": "Client Test",
        "date_rdv": "2025-01-15",
        "type_intervention": "visite_technique",
        "plan_data": '{"test": "data"}'
    }
    
    print("🔍 Testing simple fiche creation...")
    print(f"Sending data: {json.dumps(simple_data, indent=2)}")
    
    try:
        response = requests.post(f"{BASE_URL}/fiches-sdb", 
                               json=simple_data, 
                               headers=auth_headers, 
                               timeout=10)
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Response data:")
            print(json.dumps(data, indent=2))
            
            # Check specific fields
            print(f"\n🔍 Field verification:")
            print(f"date_rdv: {data.get('date_rdv', 'MISSING')}")
            print(f"type_intervention: {data.get('type_intervention', 'MISSING')}")
            print(f"plan_data: {data.get('plan_data', 'MISSING')}")
            
            return data.get("id")
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"Response text: {response.text}")
            
            # Try to parse error details
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                pass
                
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    return None

def debug_existing_fiches():
    """Check existing fiches to see their structure"""
    token = get_admin_token()
    if not token:
        print("❌ Failed to get token")
        return
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    print("🔍 Checking existing fiches...")
    
    try:
        response = requests.get(f"{BASE_URL}/fiches-sdb", 
                              headers=auth_headers, 
                              timeout=10)
        
        if response.status_code == 200:
            fiches = response.json()
            print(f"✅ Found {len(fiches)} existing fiches")
            
            if len(fiches) > 0:
                print(f"\n🔍 First fiche structure:")
                first_fiche = fiches[0]
                print(json.dumps(first_fiche, indent=2))
                
                # Check for extended fields
                extended_fields = [
                    'date_rdv', 'type_intervention', 'nb_personnes', 
                    'type_logement', 'plan_data', 'solution_recommandee'
                ]
                
                print(f"\n🔍 Extended fields check:")
                for field in extended_fields:
                    value = first_fiche.get(field, 'MISSING')
                    print(f"{field}: {value}")
            
        else:
            print(f"❌ Failed to get fiches: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("🚀 Debug Backend Test - Fiches Chantier")
    print("="*50)
    
    debug_existing_fiches()
    print("\n" + "="*50)
    debug_fiche_creation()