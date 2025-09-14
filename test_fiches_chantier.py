#!/usr/bin/env python3
"""
H2EAUX GESTION API - Fiches Chantier Module Tests
CRITICAL PRIORITY: Tests the complete Fiches Chantier functionality with 8 tabs
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://h2eaux-dashboard.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test data for Fiches Chantier - Complete 8 tabs structure
TEST_FICHE_CHANTIER_DATA = {
    "nom": "Fiche Test Villa Moderne",
    "client_nom": "Martin Jean-Claude",
    "adresse": "15 Avenue des Champs, Lyon 69000",
    "telephone": "06 12 34 56 78",
    "email": "jc.martin@example.fr",
    
    # Onglet 1: Général
    "date_rdv": "2025-02-15",
    "type_intervention": "visite_technique",
    "statut": "planifie",
    
    # Onglet 2: Client  
    "nb_personnes": 4,
    "budget_estime": "25000",
    
    # Onglet 3: Logement
    "type_logement": "maison",
    "annee_construction": 2010,
    "surface": "150",
    "isolation": "bonne",
    "menuiseries": "double",
    
    # Onglet 4: Existant
    "chauffage_actuel": "Chaudière gaz",
    "etat_general": "bon",
    "production_ecs": "chaudiere",
    "observations_existant": "Installation vieillissante mais fonctionnelle",
    
    # Onglet 5: Besoins
    "besoins": '{"chauffage": true, "climatisation": true, "ecs": true, "ventilation": false}',
    "priorite": "haute",
    "delai_souhaite": "court",
    "contraintes": "Travaux pendant vacances scolaires uniquement",
    
    # Onglet 6: Technique
    "compteur_electrique": "Triphasé 12kVA",
    "arrivee_gaz": "oui",
    "evacuation_eaux": "Tout à l'égout",
    "acces_materiel": "facile",
    "contraintes_techniques": "Passage par garage pour unité extérieure",
    
    # Onglet 7: Plan 2D
    "plan_data": '{"elements": [{"type": "rectangle", "x": 100, "y": 100, "width": 200, "height": 150, "label": "Salon"}], "scale": 1.0}',
    
    # Onglet 8: Notes
    "solution_recommandee": "PAC Air/Eau 14kW avec plancher chauffant",
    "points_attention": "Vérifier isolation combles, prévoir renforcement électrique",
    "budget_final": "28500",
    "delai_realisation": "3 semaines",
    "notes": "Client très motivé, projet bien défini"
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
            print(f"❌ Login failed - HTTP {response.status_code}: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Login connection error: {str(e)}")
        return None

def test_fiches_chantier_complete():
    """Test complete Fiches Chantier functionality - 8 tabs"""
    print("🚀 Testing FICHES CHANTIER Module - CRITICAL PRIORITY")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Get authentication token
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without authentication token")
        return False
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    results = []
    created_fiche_id = None
    
    print(f"\n🔍 Testing Fiches Chantier CRUD Operations")
    
    # Test 1: GET /api/fiches-chantier (list all fiches)
    try:
        response = requests.get(f"{BASE_URL}/fiches-chantier", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            fiches = response.json()
            results.append(f"✅ GET fiches-chantier successful - Found {len(fiches)} fiches")
        else:
            results.append(f"❌ GET fiches-chantier failed - HTTP {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        results.append(f"❌ GET fiches-chantier connection error: {str(e)}")
    
    # Test 2: POST /api/fiches-chantier (create new fiche with 8 tabs data)
    try:
        response = requests.post(f"{BASE_URL}/fiches-chantier", 
                               json=TEST_FICHE_CHANTIER_DATA, 
                               headers=auth_headers, 
                               timeout=10)
        if response.status_code == 200:
            fiche = response.json()
            created_fiche_id = fiche.get("id")
            if created_fiche_id and fiche.get("nom") == TEST_FICHE_CHANTIER_DATA["nom"]:
                results.append(f"✅ POST fiche-chantier successful - Created '{fiche['nom']}'")
                
                # Verify all 8 tabs data is preserved
                tab_checks = []
                
                # Tab 1: Général
                if (fiche.get("date_rdv") == TEST_FICHE_CHANTIER_DATA["date_rdv"] and 
                    fiche.get("type_intervention") == TEST_FICHE_CHANTIER_DATA["type_intervention"]):
                    tab_checks.append("✅ Onglet 1 (Général) - Data preserved")
                else:
                    tab_checks.append("❌ Onglet 1 (Général) - Data missing or incorrect")
                
                # Tab 2: Client
                if (fiche.get("nb_personnes") == TEST_FICHE_CHANTIER_DATA["nb_personnes"] and 
                    fiche.get("budget_estime") == TEST_FICHE_CHANTIER_DATA["budget_estime"]):
                    tab_checks.append("✅ Onglet 2 (Client) - Data preserved")
                else:
                    tab_checks.append("❌ Onglet 2 (Client) - Data missing or incorrect")
                
                # Tab 3: Logement
                if (fiche.get("type_logement") == TEST_FICHE_CHANTIER_DATA["type_logement"] and 
                    fiche.get("surface") == TEST_FICHE_CHANTIER_DATA["surface"]):
                    tab_checks.append("✅ Onglet 3 (Logement) - Data preserved")
                else:
                    tab_checks.append("❌ Onglet 3 (Logement) - Data missing or incorrect")
                
                # Tab 4: Existant
                if (fiche.get("chauffage_actuel") == TEST_FICHE_CHANTIER_DATA["chauffage_actuel"] and 
                    fiche.get("etat_general") == TEST_FICHE_CHANTIER_DATA["etat_general"]):
                    tab_checks.append("✅ Onglet 4 (Existant) - Data preserved")
                else:
                    tab_checks.append("❌ Onglet 4 (Existant) - Data missing or incorrect")
                
                # Tab 5: Besoins
                if (fiche.get("besoins") == TEST_FICHE_CHANTIER_DATA["besoins"] and 
                    fiche.get("priorite") == TEST_FICHE_CHANTIER_DATA["priorite"]):
                    tab_checks.append("✅ Onglet 5 (Besoins) - Data preserved")
                else:
                    tab_checks.append("❌ Onglet 5 (Besoins) - Data missing or incorrect")
                
                # Tab 6: Technique
                if (fiche.get("compteur_electrique") == TEST_FICHE_CHANTIER_DATA["compteur_electrique"] and 
                    fiche.get("arrivee_gaz") == TEST_FICHE_CHANTIER_DATA["arrivee_gaz"]):
                    tab_checks.append("✅ Onglet 6 (Technique) - Data preserved")
                else:
                    tab_checks.append("❌ Onglet 6 (Technique) - Data missing or incorrect")
                
                # Tab 7: Plan 2D - CRITICAL
                if fiche.get("plan_data") == TEST_FICHE_CHANTIER_DATA["plan_data"]:
                    tab_checks.append("✅ Onglet 7 (Plan 2D) - CRITICAL - Data preserved")
                else:
                    tab_checks.append("❌ Onglet 7 (Plan 2D) - CRITICAL - Data missing or incorrect")
                
                # Tab 8: Notes
                if (fiche.get("solution_recommandee") == TEST_FICHE_CHANTIER_DATA["solution_recommandee"] and 
                    fiche.get("budget_final") == TEST_FICHE_CHANTIER_DATA["budget_final"]):
                    tab_checks.append("✅ Onglet 8 (Notes) - Data preserved")
                else:
                    tab_checks.append("❌ Onglet 8 (Notes) - Data missing or incorrect")
                
                results.extend(tab_checks)
                
            else:
                results.append(f"❌ POST fiche-chantier missing data: {fiche}")
        else:
            results.append(f"❌ POST fiche-chantier failed - HTTP {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        results.append(f"❌ POST fiche-chantier connection error: {str(e)}")
    
    # Test 3: GET /api/fiches-chantier/{id} (get specific fiche)
    if created_fiche_id:
        try:
            response = requests.get(f"{BASE_URL}/fiches-chantier/{created_fiche_id}", 
                                  headers=auth_headers, 
                                  timeout=10)
            if response.status_code == 200:
                fiche = response.json()
                if fiche.get("id") == created_fiche_id:
                    results.append(f"✅ GET fiche-chantier by ID successful - Retrieved '{fiche['nom']}'")
                else:
                    results.append(f"❌ GET fiche-chantier by ID returned wrong fiche: {fiche}")
            else:
                results.append(f"❌ GET fiche-chantier by ID failed - HTTP {response.status_code}: {response.text}")
        except requests.exceptions.RequestException as e:
            results.append(f"❌ GET fiche-chantier by ID connection error: {str(e)}")
    
    # Test 4: PUT /api/fiches-chantier/{id} (update fiche - test Plan 2D update)
    if created_fiche_id:
        update_data = {
            "statut": "en_cours",
            "plan_data": '{"elements": [{"type": "rectangle", "x": 100, "y": 100, "width": 200, "height": 150, "label": "Salon"}, {"type": "circle", "x": 300, "y": 200, "radius": 50, "label": "PAC"}], "scale": 1.0}',
            "notes": "Fiche mise à jour avec nouveau plan 2D"
        }
        
        try:
            response = requests.put(f"{BASE_URL}/fiches-chantier/{created_fiche_id}", 
                                  json=update_data, 
                                  headers=auth_headers, 
                                  timeout=10)
            if response.status_code == 200:
                fiche = response.json()
                if (fiche.get("statut") == "en_cours" and 
                    fiche.get("plan_data") == update_data["plan_data"]):
                    results.append("✅ PUT fiche-chantier successful - Updated with new Plan 2D data")
                else:
                    results.append(f"❌ PUT fiche-chantier data not updated correctly: {fiche}")
            else:
                results.append(f"❌ PUT fiche-chantier failed - HTTP {response.status_code}: {response.text}")
        except requests.exceptions.RequestException as e:
            results.append(f"❌ PUT fiche-chantier connection error: {str(e)}")
    
    # Test 5: DELETE /api/fiches-chantier/{id} (delete fiche)
    if created_fiche_id:
        try:
            response = requests.delete(f"{BASE_URL}/fiches-chantier/{created_fiche_id}", 
                                     headers=auth_headers, 
                                     timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "deleted successfully" in data.get("message", "").lower():
                    results.append(f"✅ DELETE fiche-chantier successful - {data['message']}")
                else:
                    results.append(f"❌ DELETE fiche-chantier unexpected response: {data}")
            else:
                results.append(f"❌ DELETE fiche-chantier failed - HTTP {response.status_code}: {response.text}")
        except requests.exceptions.RequestException as e:
            results.append(f"❌ DELETE fiche-chantier connection error: {str(e)}")
    
    # Print all results
    print("\n" + "="*80)
    print("FICHES CHANTIER MODULE TEST RESULTS:")
    print("="*80)
    
    passed = 0
    failed = 0
    
    for result in results:
        print(result)
        if result.startswith("✅"):
            passed += 1
        else:
            failed += 1
    
    print(f"\n{'='*80}")
    print(f"FICHES CHANTIER SUMMARY: {passed}/{passed + failed} tests passed")
    print(f"{'='*80}")
    
    if failed == 0:
        print("\n🎉 FICHES CHANTIER Module is working perfectly!")
        print("✅ All 8 tabs functionality verified:")
        print("   1. ✅ Onglet Général")
        print("   2. ✅ Onglet Client")
        print("   3. ✅ Onglet Logement")
        print("   4. ✅ Onglet Existant")
        print("   5. ✅ Onglet Besoins")
        print("   6. ✅ Onglet Technique")
        print("   7. ✅ Onglet Plan 2D (CRITICAL)")
        print("   8. ✅ Onglet Notes")
        return True
    else:
        print(f"\n⚠️  {failed} test(s) failed in FICHES CHANTIER module.")
        return False

if __name__ == "__main__":
    success = test_fiches_chantier_complete()
    sys.exit(0 if success else 1)