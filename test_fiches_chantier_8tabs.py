#!/usr/bin/env python3
"""
H2EAUX GESTION API - Fiches Chantier 8-Tab Support Test
Comprehensive test for the Fiches Chantier module with all 8 tabs functionality.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://h2eaux-dashboard.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test data for Fiches Chantier (8-tab support)
TEST_FICHE_CHANTIER_DATA = {
    "nom": "Test Final",
    "client_nom": "Client Test Final",
    "adresse": "123 Rue de Test",
    "telephone": "06 12 34 56 78",
    "email": "test@example.com",
    
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
    "plan_data": '{"elements":[{"type":"room","name":"Salon"}],"measurements":[],"rooms":[{"name":"Salon","x":100,"y":100,"width":200,"height":150}],"scale":100,"gridSize":20,"currentTool":"select"}',
    
    # Onglet 8: Notes
    "solution_recommandee": "PAC Air/Eau 12kW avec plancher chauffant",
    "points_attention": "Vérifier isolation avant installation",
    "budget_final": "18500€",
    "delai_realisation": "3 semaines",
    "notes": "Client très motivé, projet prioritaire"
}

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

def test_fiches_chantier_8tabs():
    """Test Fiches Chantier with 8-tab support"""
    print("🚀 Testing Fiches Chantier 8-Tab Support")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Get authentication token
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without authentication token")
        return False
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Test 1: Create Fiche with 8-tab data
    print("\n🔍 Test 1: Creating Fiche with 8-tab data")
    try:
        response = requests.post(f"{BASE_URL}/fiches-sdb", 
                               json=TEST_FICHE_CHANTIER_DATA, 
                               headers=auth_headers, 
                               timeout=10)
        
        if response.status_code == 200:
            fiche = response.json()
            created_fiche_id = fiche.get("id")
            print(f"✅ Fiche created successfully: {fiche.get('nom')}")
            
            # Verify all 8-tab data is saved
            tab_verifications = [
                ("Onglet 1 - Général", fiche.get("type_intervention") == "visite_technique" and fiche.get("statut") == "planifie"),
                ("Onglet 2 - Client", fiche.get("nb_personnes") == 4 and fiche.get("budget_estime") == "15000€"),
                ("Onglet 3 - Logement", fiche.get("type_logement") == "maison" and fiche.get("annee_construction") == 2010),
                ("Onglet 4 - Existant", fiche.get("etat_general") == "moyen" and fiche.get("production_ecs") == "chaudiere"),
                ("Onglet 5 - Besoins", fiche.get("priorite") == "haute" and fiche.get("delai_souhaite") == "court"),
                ("Onglet 6 - Technique", fiche.get("arrivee_gaz") == "oui" and fiche.get("acces_materiel") == "facile"),
                ("Onglet 7 - Plan 2D", fiche.get("plan_data") is not None and "Salon" in fiche.get("plan_data", "")),
                ("Onglet 8 - Notes", fiche.get("solution_recommandee") is not None and fiche.get("budget_final") == "18500€")
            ]
            
            all_tabs_verified = True
            for tab_name, verification in tab_verifications:
                if verification:
                    print(f"  ✅ {tab_name}: Data saved correctly")
                else:
                    print(f"  ❌ {tab_name}: Data not saved correctly")
                    all_tabs_verified = False
            
            if not all_tabs_verified:
                print("❌ Test 1 FAILED: Not all 8-tab data was saved correctly")
                return False
            
        else:
            print(f"❌ Test 1 FAILED: HTTP {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test 1 FAILED: {str(e)}")
        return False
    
    # Test 2: Retrieve and verify 8-tab data persistence
    print("\n🔍 Test 2: Retrieving and verifying 8-tab data persistence")
    try:
        response = requests.get(f"{BASE_URL}/fiches-sdb/{created_fiche_id}", 
                              headers=auth_headers, 
                              timeout=10)
        
        if response.status_code == 200:
            retrieved_fiche = response.json()
            print(f"✅ Fiche retrieved successfully: {retrieved_fiche.get('nom')}")
            
            # Verify all essential fields from 8 tabs are present
            essential_fields = [
                # Onglet 1: Général
                "nom", "date_rdv", "type_intervention", "statut",
                # Onglet 2: Client
                "client_nom", "nb_personnes", "budget_estime",
                # Onglet 3: Logement
                "type_logement", "annee_construction", "surface", "isolation", "menuiseries",
                # Onglet 4: Existant
                "chauffage_actuel", "etat_general", "production_ecs", "observations_existant",
                # Onglet 5: Besoins
                "besoins", "priorite", "delai_souhaite", "contraintes",
                # Onglet 6: Technique
                "compteur_electrique", "arrivee_gaz", "evacuation_eaux", "acces_materiel", "contraintes_techniques",
                # Onglet 7: Plan 2D
                "plan_data",
                # Onglet 8: Notes
                "solution_recommandee", "points_attention", "budget_final", "delai_realisation", "notes"
            ]
            
            missing_fields = []
            for field in essential_fields:
                if retrieved_fiche.get(field) is None:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"❌ Test 2 FAILED: Missing fields: {missing_fields}")
                return False
            else:
                print("✅ All 8-tab fields are present and persistent")
                
        else:
            print(f"❌ Test 2 FAILED: HTTP {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test 2 FAILED: {str(e)}")
        return False
    
    # Test 3: Update 8-tab data
    print("\n🔍 Test 3: Updating 8-tab data")
    update_data = {
        "statut": "en_cours",
        "budget_final": "19000€",
        "notes": "Fiche mise à jour - test complet",
        "plan_data": '{"elements":[{"type":"line","points":[{"x":100,"y":100},{"x":200,"y":100}]}],"measurements":[{"x1":100,"y1":100,"x2":200,"y2":100,"value":"3.5"}],"rooms":[{"name":"Salon","x":50,"y":50,"width":300,"height":200},{"name":"Cuisine","x":350,"y":50,"width":200,"height":150}],"scale":100,"gridSize":20,"currentTool":"select"}',
        "priorite": "moyenne",
        "isolation": "bonne"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/fiches-sdb/{created_fiche_id}", 
                              json=update_data, 
                              headers=auth_headers, 
                              timeout=10)
        
        if response.status_code == 200:
            updated_fiche = response.json()
            print(f"✅ Fiche updated successfully")
            
            # Verify updates
            update_verifications = [
                ("Statut", updated_fiche.get("statut") == "en_cours"),
                ("Budget Final", updated_fiche.get("budget_final") == "19000€"),
                ("Notes", "test complet" in updated_fiche.get("notes", "")),
                ("Plan 2D", "Cuisine" in updated_fiche.get("plan_data", "")),
                ("Priorité", updated_fiche.get("priorite") == "moyenne"),
                ("Isolation", updated_fiche.get("isolation") == "bonne")
            ]
            
            all_updates_verified = True
            for field_name, verification in update_verifications:
                if verification:
                    print(f"  ✅ {field_name}: Updated correctly")
                else:
                    print(f"  ❌ {field_name}: Update failed")
                    all_updates_verified = False
            
            if not all_updates_verified:
                print("❌ Test 3 FAILED: Not all updates were applied correctly")
                return False
                
        else:
            print(f"❌ Test 3 FAILED: HTTP {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test 3 FAILED: {str(e)}")
        return False
    
    # Test 4: Plan 2D Data Integrity
    print("\n🔍 Test 4: Plan 2D Data Integrity")
    try:
        # Retrieve the updated fiche and check plan data
        response = requests.get(f"{BASE_URL}/fiches-sdb/{created_fiche_id}", 
                              headers=auth_headers, 
                              timeout=10)
        
        if response.status_code == 200:
            fiche = response.json()
            plan_data_str = fiche.get("plan_data", "{}")
            plan_data = json.loads(plan_data_str)
            
            # Verify plan data structure
            plan_checks = [
                ("Elements", len(plan_data.get("elements", [])) > 0),
                ("Measurements", len(plan_data.get("measurements", [])) > 0),
                ("Rooms", len(plan_data.get("rooms", [])) == 2),
                ("Scale", plan_data.get("scale") == 100),
                ("Grid Size", plan_data.get("gridSize") == 20),
                ("Room Names", any(room.get("name") == "Salon" for room in plan_data.get("rooms", [])) and 
                             any(room.get("name") == "Cuisine" for room in plan_data.get("rooms", [])))
            ]
            
            all_plan_checks_passed = True
            for check_name, verification in plan_checks:
                if verification:
                    print(f"  ✅ Plan 2D {check_name}: Correct")
                else:
                    print(f"  ❌ Plan 2D {check_name}: Failed")
                    all_plan_checks_passed = False
            
            if not all_plan_checks_passed:
                print("❌ Test 4 FAILED: Plan 2D data integrity issues")
                return False
            else:
                print("✅ Plan 2D data integrity maintained")
                
        else:
            print(f"❌ Test 4 FAILED: HTTP {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test 4 FAILED: {str(e)}")
        return False
    
    # Test 5: Clean up - Delete test fiche
    print("\n🔍 Test 5: Cleanup - Deleting test fiche")
    try:
        response = requests.delete(f"{BASE_URL}/fiches-sdb/{created_fiche_id}", 
                                 headers=auth_headers, 
                                 timeout=10)
        
        if response.status_code == 200:
            print("✅ Test fiche deleted successfully")
        else:
            print(f"⚠️  Warning: Could not delete test fiche - HTTP {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Warning: Could not delete test fiche - {str(e)}")
    
    print("\n🎉 ALL TESTS PASSED!")
    print("✅ Fiches Chantier 8-tab support is fully functional")
    print("✅ All CRUD operations work correctly")
    print("✅ Plan 2D system maintains data integrity")
    print("✅ Data persistence across all 8 tabs verified")
    
    return True

if __name__ == "__main__":
    success = test_fiches_chantier_8tabs()
    sys.exit(0 if success else 1)