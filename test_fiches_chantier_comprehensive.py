#!/usr/bin/env python3
"""
H2EAUX GESTION - Comprehensive Fiches Chantier API Tests
Tests the complete Fiches Chantier functionality including all 8 tabs data structure.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://h2eaux-dashboard.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test data for complete Fiche Chantier (8 tabs)
TEST_FICHE_COMPLETE = {
    "nom": "Test Fiche Complète",
    "client_nom": "Martin Dupont",
    "adresse": "123 Rue de Test",
    "telephone": "06 12 34 56 78",
    "email": "martin.dupont@test.fr",
    
    # Onglet 1: Général
    "date_rdv": "2025-02-15",
    "type_intervention": "visite_technique",
    "statut": "planifie",
    
    # Onglet 2: Client
    "nb_personnes": 4,
    "budget_estime": "18000",
    
    # Onglet 3: Logement
    "type_logement": "maison",
    "annee_construction": 2010,
    "surface": "120",
    "isolation": "bonne",
    "menuiseries": "double",
    
    # Onglet 4: Existant
    "chauffage_actuel": "Chaudière gaz ancienne génération",
    "etat_general": "moyen",
    "production_ecs": "chaudiere",
    "observations_existant": "Installation vieillissante, radiateurs en bon état",
    
    # Onglet 5: Besoins
    "besoins": '["chauffage", "ecs", "economie"]',
    "priorite": "haute",
    "delai_souhaite": "court",
    "contraintes": "Travaux pendant vacances scolaires uniquement",
    
    # Onglet 6: Technique
    "compteur_electrique": "12kVA triphasé",
    "arrivee_gaz": "oui",
    "evacuation_eaux": "Tout à l'égout, accès facile",
    "acces_materiel": "facile",
    "contraintes_techniques": "Passage de câbles dans combles",
    
    # Onglet 7: Plan 2D
    "plan_data": '{"elements": [{"type": "room", "name": "Salon", "x": 100, "y": 100, "width": 200, "height": 150}], "scale": 100}',
    
    # Onglet 8: Notes
    "solution_recommandee": "PAC Air/Eau 12kW avec plancher chauffant",
    "points_attention": "Vérifier isolation avant installation",
    "budget_final": "19500",
    "delai_realisation": "3 semaines",
    "notes": "Client très motivé, projet prioritaire"
}

class FicheTestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def add_result(self, test_name, success, message="", details=None):
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status} - {test_name}: {message}"
        if details:
            result += f"\n    Details: {details}"
        self.results.append(result)
        if success:
            self.passed += 1
        else:
            self.failed += 1
        print(result)
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"FICHE CHANTIER TEST SUMMARY: {self.passed}/{total} tests passed")
        print(f"{'='*60}")
        return self.failed == 0

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
    except Exception as e:
        print(f"Failed to get admin token: {e}")
    return None

def test_fiches_sdb_endpoint(token):
    """Test the /fiches-sdb endpoint that the frontend uses"""
    print(f"\n🔍 Testing Fiches SDB Endpoint - GET {BASE_URL}/fiches-sdb")
    
    results = []
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Test GET /api/fiches-sdb
    try:
        response = requests.get(f"{BASE_URL}/fiches-sdb", 
                              headers=auth_headers, 
                              timeout=10)
        if response.status_code == 200:
            fiches = response.json()
            results.append((True, f"GET fiches-sdb successful - Found {len(fiches)} fiches"))
        else:
            results.append((False, f"GET fiches-sdb failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"GET fiches-sdb connection error: {str(e)}"))
    
    return results

def test_fiche_crud_operations(token):
    """Test complete CRUD operations for Fiches Chantier"""
    print(f"\n🔍 Testing Fiche Chantier CRUD Operations")
    
    results = []
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    created_fiche_id = None
    
    # Test POST /api/fiches-sdb (create new fiche)
    try:
        response = requests.post(f"{BASE_URL}/fiches-sdb", 
                               json=TEST_FICHE_COMPLETE, 
                               headers=auth_headers, 
                               timeout=10)
        if response.status_code == 200:
            fiche = response.json()
            created_fiche_id = fiche.get("id")
            if created_fiche_id and fiche.get("nom") == TEST_FICHE_COMPLETE["nom"]:
                results.append((True, f"POST fiche successful - Created fiche '{fiche['nom']}'"))
                
                # Verify all 8 tabs data was saved
                tab_checks = [
                    ("Général", fiche.get("type_intervention") == "visite_technique"),
                    ("Client", fiche.get("nb_personnes") == 4),
                    ("Logement", fiche.get("type_logement") == "maison"),
                    ("Existant", fiche.get("etat_general") == "moyen"),
                    ("Besoins", fiche.get("priorite") == "haute"),
                    ("Technique", fiche.get("compteur_electrique") == "12kVA triphasé"),
                    ("Plan 2D", fiche.get("plan_data") is not None),
                    ("Notes", fiche.get("solution_recommandee") is not None)
                ]
                
                for tab_name, check in tab_checks:
                    if check:
                        results.append((True, f"Tab {tab_name} data correctly saved"))
                    else:
                        results.append((False, f"Tab {tab_name} data missing or incorrect"))
                        
            else:
                results.append((False, f"POST fiche missing data: {fiche}"))
        else:
            results.append((False, f"POST fiche failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"POST fiche connection error: {str(e)}"))
    
    # Test GET /api/fiches-sdb/{id} (get specific fiche)
    if created_fiche_id:
        try:
            response = requests.get(f"{BASE_URL}/fiches-sdb/{created_fiche_id}", 
                                  headers=auth_headers, 
                                  timeout=10)
            if response.status_code == 200:
                fiche = response.json()
                if fiche.get("id") == created_fiche_id:
                    results.append((True, f"GET fiche by ID successful - Retrieved '{fiche['nom']}'"))
                    
                    # Verify data integrity for all tabs
                    integrity_checks = [
                        ("plan_data", fiche.get("plan_data")),
                        ("besoins", fiche.get("besoins")),
                        ("solution_recommandee", fiche.get("solution_recommandee")),
                        ("budget_final", fiche.get("budget_final"))
                    ]
                    
                    for field, value in integrity_checks:
                        if value:
                            results.append((True, f"Field {field} preserved correctly"))
                        else:
                            results.append((False, f"Field {field} lost or corrupted"))
                            
                else:
                    results.append((False, f"GET fiche by ID returned wrong fiche: {fiche}"))
            else:
                results.append((False, f"GET fiche by ID failed - HTTP {response.status_code}: {response.text}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"GET fiche by ID connection error: {str(e)}"))
    
    # Test PUT /api/fiches-sdb/{id} (update fiche)
    if created_fiche_id:
        update_data = {
            "statut": "termine",
            "budget_final": "20000",
            "notes": "Fiche mise à jour lors des tests",
            "plan_data": '{"elements": [{"type": "room", "name": "Salon", "x": 100, "y": 100, "width": 250, "height": 200}], "scale": 100, "updated": true}'
        }
        
        try:
            response = requests.put(f"{BASE_URL}/fiches-sdb/{created_fiche_id}", 
                                  json=update_data, 
                                  headers=auth_headers, 
                                  timeout=10)
            if response.status_code == 200:
                fiche = response.json()
                if (fiche.get("statut") == "termine" and 
                    fiche.get("budget_final") == "20000"):
                    results.append((True, f"PUT fiche successful - Updated fiche data"))
                    
                    # Verify plan data update
                    if '"updated": true' in fiche.get("plan_data", ""):
                        results.append((True, "Plan 2D data update successful"))
                    else:
                        results.append((False, "Plan 2D data update failed"))
                        
                else:
                    results.append((False, f"PUT fiche data not updated correctly: {fiche}"))
            else:
                results.append((False, f"PUT fiche failed - HTTP {response.status_code}: {response.text}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"PUT fiche connection error: {str(e)}"))
    
    # Test DELETE /api/fiches-sdb/{id} (delete fiche)
    if created_fiche_id:
        try:
            response = requests.delete(f"{BASE_URL}/fiches-sdb/{created_fiche_id}", 
                                     headers=auth_headers, 
                                     timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "deleted successfully" in data.get("message", "").lower():
                    results.append((True, f"DELETE fiche successful - {data['message']}"))
                else:
                    results.append((False, f"DELETE fiche unexpected response: {data}"))
            else:
                results.append((False, f"DELETE fiche failed - HTTP {response.status_code}: {response.text}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"DELETE fiche connection error: {str(e)}"))
    
    return results

def test_other_endpoints(token):
    """Test other critical endpoints"""
    print(f"\n🔍 Testing Other Critical Endpoints")
    
    results = []
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Test endpoints that should work
    endpoints_to_test = [
        ("GET", "/chantiers", "Chantiers"),
        ("GET", "/calculs-pac", "Calculs PAC"),
        ("GET", "/documents", "Documents"),
        ("GET", "/users", "Users (Admin only)")
    ]
    
    for method, endpoint, description in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", 
                                  headers=auth_headers, 
                                  timeout=10)
            if response.status_code == 200:
                data = response.json()
                results.append((True, f"{description} endpoint working - Found {len(data)} items"))
            else:
                results.append((False, f"{description} endpoint failed - HTTP {response.status_code}: {response.text}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"{description} endpoint connection error: {str(e)}"))
    
    return results

def main():
    """Main test execution for Fiches Chantier"""
    print("🚀 Starting H2EAUX GESTION - Comprehensive Fiches Chantier Tests")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    test_results = FicheTestResults()
    
    # Get authentication token
    token = get_admin_token()
    if not token:
        test_results.add_result("Authentication", False, "Failed to get admin token")
        return False
    else:
        test_results.add_result("Authentication", True, "Admin token obtained successfully")
    
    # Test 1: Fiches SDB endpoint (used by frontend)
    sdb_results = test_fiches_sdb_endpoint(token)
    for success, message in sdb_results:
        test_results.add_result("Fiches SDB Endpoint", success, message)
    
    # Test 2: Complete CRUD operations with 8 tabs data
    crud_results = test_fiche_crud_operations(token)
    for success, message in crud_results:
        test_results.add_result("Fiche CRUD Operations", success, message)
    
    # Test 3: Other endpoints
    other_results = test_other_endpoints(token)
    for success, message in other_results:
        test_results.add_result("Other Endpoints", success, message)
    
    # Final summary
    all_passed = test_results.summary()
    
    if all_passed:
        print("\n🎉 All Fiches Chantier tests passed! Backend is ready for frontend testing.")
    else:
        print(f"\n⚠️  {test_results.failed} test(s) failed. Please check the issues above.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)