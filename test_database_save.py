#!/usr/bin/env python3
"""
Test to verify if data is actually being saved to the database
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

async def check_database_after_creation():
    """Check database after creating a fiche"""
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['h2eaux_gestion']
    
    # List all collections
    collections = await db.list_collection_names()
    print(f'=== ALL COLLECTIONS AFTER CREATION ===')
    for collection_name in collections:
        count = await db[collection_name].count_documents({})
        print(f'{collection_name}: {count} documents')
    
    # Check fiches_chantier specifically
    if 'fiches_chantier' in collections:
        print(f'\n=== FICHES_CHANTIER COLLECTION ===')
        fiches = await db.fiches_chantier.find().to_list(10)
        for i, fiche in enumerate(fiches):
            print(f'Fiche {i+1}:')
            print(json.dumps(fiche, indent=2, default=str))
    
    client.close()

def test_fiche_creation_and_db():
    """Test fiche creation and check database"""
    token = get_admin_token()
    if not token:
        return
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Create a fiche with full 8-tab data
    full_data = {
        "nom": "Test Database Save",
        "client_nom": "Test Client DB",
        "adresse": "123 Test Street",
        "telephone": "06 12 34 56 78",
        "email": "test@db.com",
        
        # Onglet 1: Général
        "date_rdv": "2025-01-15",
        "type_intervention": "visite_technique",
        "statut": "planifie",
        
        # Onglet 2: Client
        "nb_personnes": 4,
        "budget_estime": "15000€",
        
        # Onglet 3: Logement
        "type_logement": "maison",
        "annee_construction": 2010,
        "surface": "120",
        "isolation": "moyenne",
        "menuiseries": "double",
        
        # Onglet 4: Existant
        "chauffage_actuel": "Chaudière gaz ancienne",
        "etat_general": "moyen",
        "production_ecs": "chaudiere",
        "observations_existant": "Installation vétuste à remplacer",
        
        # Onglet 5: Besoins
        "besoins": '["chauffage", "ecs", "economie"]',
        "priorite": "haute",
        "delai_souhaite": "court",
        "contraintes": "Budget limité",
        
        # Onglet 6: Technique
        "compteur_electrique": "12kVA triphasé",
        "arrivee_gaz": "oui",
        "evacuation_eaux": "Tout à l'égout",
        "acces_materiel": "facile",
        "contraintes_techniques": "Aucune contrainte particulière",
        
        # Onglet 7: Plan 2D
        "plan_data": '{"elements":[],"measurements":[],"rooms":[],"scale":100,"gridSize":20,"currentTool":"select"}',
        
        # Onglet 8: Notes
        "solution_recommandee": "PAC Air/Eau 12kW avec plancher chauffant",
        "points_attention": "Vérifier isolation avant installation",
        "budget_final": "18500€",
        "delai_realisation": "3 semaines",
        "notes": "Client très motivé, projet prioritaire"
    }
    
    print("🔍 Creating fiche with full 8-tab data:")
    print(f"Data keys: {list(full_data.keys())}")
    
    try:
        response = requests.post(f"{BASE_URL}/fiches-sdb", 
                               json=full_data, 
                               headers=auth_headers, 
                               timeout=10)
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            fiche = response.json()
            print(f"✅ Fiche created successfully!")
            print(f"Response keys: {list(fiche.keys())}")
            
            # Check database immediately after creation
            print(f"\n🔍 Checking database after creation...")
            asyncio.run(check_database_after_creation())
            
            return fiche.get("id")
        else:
            print(f"❌ Failed to create fiche")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

if __name__ == "__main__":
    test_fiche_creation_and_db()