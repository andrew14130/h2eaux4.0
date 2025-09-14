#!/usr/bin/env python3
"""
H2EAUX GESTION - Fiches Chantier Backend Tests
Tests the 8-tab Fiches Chantier functionality including Plan 2D data
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8001/api"
HEADERS = {"Content-Type": "application/json"}

# Test data for comprehensive Fiche Chantier with all 8 tabs
TEST_FICHE_DATA = {
    "nom": "Fiche Test Villa Moderne",
    "client_nom": "Martin Jean-Claude",
    "adresse": "15 Avenue des Chênes, Lyon 69000",
    "telephone": "06 12 34 56 78",
    "email": "jc.martin@example.fr",
    
    # Tab 1: Général
    "date_rdv": "2025-02-15",
    "type_intervention": "visite_technique",
    "statut": "en_cours",
    
    # Tab 2: Client
    "nb_personnes": 4,
    
    # Tab 3: Logement
    "type_logement": "maison_individuelle",
    "annee_construction": 1995,
    "isolation": "moyenne",
    "menuiseries": "double_vitrage",
    
    # Tab 4: Existant
    "chauffage_actuel": "chaudiere_gaz",
    "etat_general": "bon",
    "production_ecs": "chaudiere",
    "observations_existant": "Installation vieillissante mais fonctionnelle",
    
    # Tab 5: Besoins
    "besoins": "chauffage,ecs,climatisation",
    "priorite": "haute",
    "delai_souhaite": "3_mois",
    "contraintes": "Budget limité, travaux en été",
    
    # Tab 6: Technique
    "compteur_electrique": "triphasé",
    "arrivee_gaz": "oui",
    "evacuation_eaux": "tout_a_legout",
    "acces_materiel": "facile",
    "contraintes_techniques": "Passage de gaines difficile",
    
    # Tab 7: Plan 2D (JSON data)
    "plan_data": json.dumps({
        "canvas": {
            "width": 800,
            "height": 600,
            "scale": "1:50"
        },
        "elements": [
            {
                "type": "room",
                "name": "Salon",
                "x": 100,
                "y": 100,
                "width": 200,
                "height": 150
            },
            {
                "type": "door",
                "x": 150,
                "y": 100,
                "width": 20
            }
        ],
        "grid": {
            "size": 20,
            "visible": True
        }
    }),
    
    # Tab 8: Notes
    "solution_recommandee": "PAC Air/Eau 12kW avec plancher chauffant",
    "points_attention": "Vérifier isolation avant installation",
    "budget_final": "18500",
    "delai_realisation": "2_semaines",
    
    # Legacy SDB fields (for compatibility)
    "type_sdb": "visite_technique",
    "surface": "120",
    "budget_estime": "18000",
    "notes": "Fiche complète avec tous les onglets remplis"
}

def get_admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/auth/login", 
                           json={"username": "admin", "password": "admin123"}, 
                           headers=HEADERS)
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_fiches_chantier_crud():
    """Test complete CRUD operations for Fiches Chantier"""
    print("🔍 Testing Fiches Chantier - Complete 8-tab functionality")
    
    token = get_admin_token()
    if not token:
        print("❌ Failed to get admin token")
        return False
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    results = []
    created_fiche_id = None
    
    # Test 1: Create fiche with all 8 tabs data
    try:
        response = requests.post(f"{BASE_URL}/fiches-sdb", 
                               json=TEST_FICHE_DATA, 
                               headers=auth_headers)
        if response.status_code == 200:
            fiche = response.json()
            created_fiche_id = fiche.get("id")
            results.append(f"✅ CREATE: Fiche created successfully - {fiche['nom']}")
            
            # Verify all tabs data is saved
            tab_checks = [
                ("Tab 1 - Général", fiche.get("date_rdv") == "2025-02-15"),
                ("Tab 2 - Client", fiche.get("nb_personnes") == 4),
                ("Tab 3 - Logement", fiche.get("type_logement") == "maison_individuelle"),
                ("Tab 4 - Existant", fiche.get("chauffage_actuel") == "chaudiere_gaz"),
                ("Tab 5 - Besoins", fiche.get("besoins") == "chauffage,ecs,climatisation"),
                ("Tab 6 - Technique", fiche.get("compteur_electrique") == "triphasé"),
                ("Tab 7 - Plan 2D", fiche.get("plan_data") is not None),
                ("Tab 8 - Notes", fiche.get("solution_recommandee") == "PAC Air/Eau 12kW avec plancher chauffant")
            ]
            
            for tab_name, check in tab_checks:
                if check:
                    results.append(f"✅ {tab_name}: Data saved correctly")
                else:
                    results.append(f"❌ {tab_name}: Data not saved correctly")
                    
        else:
            results.append(f"❌ CREATE: Failed - HTTP {response.status_code}: {response.text}")
    except Exception as e:
        results.append(f"❌ CREATE: Exception - {str(e)}")
    
    # Test 2: Read fiche and verify all data
    if created_fiche_id:
        try:
            response = requests.get(f"{BASE_URL}/fiches-sdb/{created_fiche_id}", 
                                  headers=auth_headers)
            if response.status_code == 200:
                fiche = response.json()
                results.append(f"✅ READ: Fiche retrieved successfully")
                
                # Verify Plan 2D data integrity
                if fiche.get("plan_data"):
                    try:
                        plan_data = json.loads(fiche["plan_data"])
                        if plan_data.get("canvas", {}).get("width") == 800:
                            results.append("✅ Plan 2D: JSON data integrity verified")
                        else:
                            results.append("❌ Plan 2D: JSON data corrupted")
                    except json.JSONDecodeError:
                        results.append("❌ Plan 2D: Invalid JSON data")
                else:
                    results.append("❌ Plan 2D: No plan data found")
            else:
                results.append(f"❌ READ: Failed - HTTP {response.status_code}")
        except Exception as e:
            results.append(f"❌ READ: Exception - {str(e)}")
    
    # Test 3: Update fiche with new data
    if created_fiche_id:
        update_data = {
            "statut": "termine",
            "budget_final": "19500",
            "solution_recommandee": "PAC Air/Eau 14kW avec plancher chauffant + ECS",
            "plan_data": json.dumps({
                "canvas": {"width": 800, "height": 600, "scale": "1:100"},
                "elements": [
                    {"type": "room", "name": "Salon", "x": 100, "y": 100, "width": 250, "height": 180},
                    {"type": "pac", "x": 300, "y": 200, "model": "14kW"}
                ]
            })
        }
        
        try:
            response = requests.put(f"{BASE_URL}/fiches-sdb/{created_fiche_id}", 
                                  json=update_data, 
                                  headers=auth_headers)
            if response.status_code == 200:
                fiche = response.json()
                if fiche.get("statut") == "termine" and fiche.get("budget_final") == "19500":
                    results.append("✅ UPDATE: Fiche updated successfully")
                else:
                    results.append("❌ UPDATE: Data not updated correctly")
            else:
                results.append(f"❌ UPDATE: Failed - HTTP {response.status_code}")
        except Exception as e:
            results.append(f"❌ UPDATE: Exception - {str(e)}")
    
    # Test 4: List all fiches
    try:
        response = requests.get(f"{BASE_URL}/fiches-sdb", headers=auth_headers)
        if response.status_code == 200:
            fiches = response.json()
            results.append(f"✅ LIST: Retrieved {len(fiches)} fiches")
        else:
            results.append(f"❌ LIST: Failed - HTTP {response.status_code}")
    except Exception as e:
        results.append(f"❌ LIST: Exception - {str(e)}")
    
    # Test 5: Delete fiche
    if created_fiche_id:
        try:
            response = requests.delete(f"{BASE_URL}/fiches-sdb/{created_fiche_id}", 
                                     headers=auth_headers)
            if response.status_code == 200:
                results.append("✅ DELETE: Fiche deleted successfully")
            else:
                results.append(f"❌ DELETE: Failed - HTTP {response.status_code}")
        except Exception as e:
            results.append(f"❌ DELETE: Exception - {str(e)}")
    
    # Print results
    for result in results:
        print(result)
    
    # Count successes
    successes = len([r for r in results if r.startswith("✅")])
    total = len(results)
    
    print(f"\n📊 Fiches Chantier Test Results: {successes}/{total} passed")
    return successes == total

def main():
    print("🚀 Starting H2EAUX GESTION - Fiches Chantier Backend Tests")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}\n")
    
    success = test_fiches_chantier_crud()
    
    if success:
        print("\n🎉 All Fiches Chantier tests passed! 8-tab system is fully functional.")
    else:
        print("\n⚠️ Some Fiches Chantier tests failed. Check the issues above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)