#!/usr/bin/env python3
"""
Test other endpoints to see if database saving works for them
"""

import requests
import json
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

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

async def check_all_collections():
    """Check all collections in database"""
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['h2eaux_gestion']
    
    # List all collections
    collections = await db.list_collection_names()
    print(f'=== ALL COLLECTIONS ===')
    for collection_name in collections:
        count = await db[collection_name].count_documents({})
        print(f'{collection_name}: {count} documents')
        
        if count > 0 and collection_name != 'users':
            print(f'\n--- Sample from {collection_name} ---')
            docs = await db[collection_name].find().limit(1).to_list(1)
            if docs:
                print(json.dumps(docs[0], indent=2, default=str))
    
    client.close()

def test_client_creation():
    """Test client creation to see if it saves to database"""
    token = get_admin_token()
    if not token:
        return
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    client_data = {
        "nom": "Test Client DB",
        "prenom": "Database Test",
        "telephone": "06 12 34 56 78",
        "email": "testdb@example.com",
        "adresse": "123 Test DB Street",
        "ville": "Test City",
        "code_postal": "12345",
        "type_chauffage": "Test Heating",
        "notes": "Test client for database verification"
    }
    
    print("🔍 Creating client to test database saving:")
    
    try:
        response = requests.post(f"{BASE_URL}/clients", 
                               json=client_data, 
                               headers=auth_headers, 
                               timeout=10)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            client = response.json()
            print(f"✅ Client created successfully!")
            print(f"Client ID: {client.get('id')}")
            
            # Check database after client creation
            print(f"\n🔍 Checking database after client creation...")
            asyncio.run(check_all_collections())
            
            # Clean up - delete the test client
            client_id = client.get('id')
            if client_id:
                delete_response = requests.delete(f"{BASE_URL}/clients/{client_id}", 
                                                headers=auth_headers, 
                                                timeout=10)
                print(f"🧹 Cleanup: Delete response {delete_response.status_code}")
            
            return client_id
        else:
            print(f"❌ Failed to create client")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def test_chantier_creation():
    """Test chantier creation to see if it saves to database"""
    token = get_admin_token()
    if not token:
        return
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    chantier_data = {
        "nom": "Test Chantier DB",
        "adresse": "123 Test Chantier Street",
        "ville": "Test City",
        "code_postal": "12345",
        "client_nom": "Test Client",
        "client_telephone": "06 12 34 56 78",
        "type_travaux": "test_installation",
        "statut": "en_attente",
        "date_debut": "2025-02-01",
        "date_fin_prevue": "2025-02-15",
        "budget_estime": "10000",
        "description": "Test chantier for database verification"
    }
    
    print("\n🔍 Creating chantier to test database saving:")
    
    try:
        response = requests.post(f"{BASE_URL}/chantiers", 
                               json=chantier_data, 
                               headers=auth_headers, 
                               timeout=10)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            chantier = response.json()
            print(f"✅ Chantier created successfully!")
            print(f"Chantier ID: {chantier.get('id')}")
            
            # Check database after chantier creation
            print(f"\n🔍 Checking database after chantier creation...")
            asyncio.run(check_all_collections())
            
            # Clean up - delete the test chantier
            chantier_id = chantier.get('id')
            if chantier_id:
                delete_response = requests.delete(f"{BASE_URL}/chantiers/{chantier_id}", 
                                                headers=auth_headers, 
                                                timeout=10)
                print(f"🧹 Cleanup: Delete response {delete_response.status_code}")
            
            return chantier_id
        else:
            print(f"❌ Failed to create chantier")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

if __name__ == "__main__":
    print("🚀 Testing Database Saving for Different Endpoints")
    
    # Test client creation
    test_client_creation()
    
    # Test chantier creation
    test_chantier_creation()
    
    print("\n🔍 Final database state:")
    asyncio.run(check_all_collections())