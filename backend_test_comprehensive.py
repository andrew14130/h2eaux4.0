#!/usr/bin/env python3
"""
H2EAUX GESTION API Backend Tests - Comprehensive Testing
Tests all backend functionality including authentication, client management, PAC calculations, and security.
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BASE_URL = "https://h2eaux-dashboard.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test data
TEST_CLIENT_DATA = {
    "nom": "Dubois",
    "prenom": "Jean-Pierre", 
    "telephone": "06 12 34 56 78",
    "email": "jp.dubois@example.fr",
    "adresse": "123 Rue de la Paix",
    "ville": "Paris",
    "code_postal": "75001",
    "type_chauffage": "PAC Air/Eau",
    "notes": "Client test pour validation API"
}

UPDATE_CLIENT_DATA = {
    "telephone": "06 98 76 54 32",
    "email": "jean-pierre.dubois@example.fr",
    "notes": "Client modifié lors des tests"
}

# Test data for Chantiers
TEST_CHANTIER_DATA = {
    "nom": "Installation PAC Villa Test",
    "adresse": "456 Avenue des Tests",
    "ville": "Lyon",
    "code_postal": "69000",
    "client_nom": "Dubois Jean-Pierre",
    "client_telephone": "06 12 34 56 78",
    "type_travaux": "installation_pac",
    "statut": "en_attente",
    "date_debut": "2025-02-01",
    "date_fin_prevue": "2025-02-15",
    "budget_estime": "15000",
    "description": "Installation PAC Air/Eau 12kW avec plancher chauffant"
}

# Test data for Documents
TEST_DOCUMENT_DATA = {
    "nom": "Devis PAC Test",
    "type": "devis",
    "client_nom": "Dubois Jean-Pierre",
    "chantier_nom": "Installation PAC Villa Test",
    "description": "Devis pour installation PAC Air/Eau",
    "tags": "pac, devis, test"
}

# Test data for PAC Calculations
TEST_CALCUL_PAC_DATA = {
    "nom": "Calcul PAC Villa Test",
    "client_nom": "Dubois Jean-Pierre",
    "adresse": "456 Avenue des Tests, Lyon 69000",
    "type_pac": "air_eau",
    "surface_totale": "120",
    "isolation": "moyenne",
    "zone_climatique": "H2",
    "budget_estime": "15000",
    "pieces": [
        {
            "id": "piece1",
            "nom": "Salon",
            "type": "salon",
            "surface": "30",
            "hauteur_plafond": "2.5",
            "orientation": "sud",
            "nombre_facades_exterieures": "1",
            "isolation_murs": "moyenne",
            "type_vitrage": "double",
            "surface_vitree": "10",
            "puissance_necessaire": "2.5",
            "type_unite_interieure": "murale",
            "temperature_depart": "35"
        }
    ],
    "notes": "Test calcul PAC Air/Eau",
    "temperature_exterieure_base": "-5",
    "temperature_interieure_souhaitee": "20",
    "altitude": "200",
    "type_emetteur": "plancher_chauffant",
    "production_ecs": True,
    "volume_ballon_ecs": "200",
    "puissance_calculee": "12",
    "cop_estime": "3.5",
    "type_installation": "",
    "puissance_totale_calculee": "",
    "scop_estime": "",
    "seer_estime": ""
}

class TestResults:
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
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        print(f"{'='*60}")
        return self.failed == 0

def test_health_check():
    """Test 1: Health check endpoint"""
    print(f"\n🔍 Testing Health Check - GET {BASE_URL}/health")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "ok":
                return True, f"API is healthy - {data.get('message', '')}"
            else:
                return False, f"Unexpected response: {data}"
        else:
            return False, f"HTTP {response.status_code}: {response.text}"
    except requests.exceptions.RequestException as e:
        return False, f"Connection error: {str(e)}"

def test_authentication():
    """Test 2: Authentication endpoints"""
    print(f"\n🔍 Testing Authentication - POST {BASE_URL}/auth/login")
    
    results = []
    tokens = {}
    
    # Test admin login
    admin_data = {"username": "admin", "password": "admin123"}
    try:
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json=admin_data, 
                               headers=HEADERS, 
                               timeout=10)
        if response.status_code == 200:
            data = response.json()
            if (data.get("access_token") and 
                data.get("user", {}).get("permissions", {}).get("parametres") == True):
                tokens["admin"] = data["access_token"]
                results.append((True, "Admin login successful with correct permissions"))
            else:
                results.append((False, f"Admin login missing token or permissions: {data}"))
        else:
            results.append((False, f"Admin login failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"Admin login connection error: {str(e)}"))
    
    # Test employee login
    employee_data = {"username": "employe1", "password": "employe123"}
    try:
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json=employee_data, 
                               headers=HEADERS, 
                               timeout=10)
        if response.status_code == 200:
            data = response.json()
            if (data.get("access_token") and 
                data.get("user", {}).get("permissions", {}).get("parametres") == False):
                tokens["employee"] = data["access_token"]
                results.append((True, "Employee login successful with correct permissions"))
            else:
                results.append((False, f"Employee login missing token or wrong permissions: {data}"))
        else:
            results.append((False, f"Employee login failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"Employee login connection error: {str(e)}"))
    
    # Test invalid credentials
    invalid_data = {"username": "invalid", "password": "wrong"}
    try:
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json=invalid_data, 
                               headers=HEADERS, 
                               timeout=10)
        if response.status_code == 401:
            results.append((True, "Invalid credentials correctly rejected"))
        else:
            results.append((False, f"Invalid credentials should return 401, got {response.status_code}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"Invalid credentials test connection error: {str(e)}"))
    
    return results, tokens

def test_client_management(token):
    """Test 3: Client CRUD operations"""
    print(f"\n🔍 Testing Client Management with valid token")
    
    results = []
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    created_client_id = None
    
    # Test GET /api/clients (list all clients)
    try:
        response = requests.get(f"{BASE_URL}/clients", 
                              headers=auth_headers, 
                              timeout=10)
        if response.status_code == 200:
            clients = response.json()
            results.append((True, f"GET clients successful - Found {len(clients)} clients"))
        else:
            results.append((False, f"GET clients failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"GET clients connection error: {str(e)}"))
    
    # Test POST /api/clients (create new client)
    try:
        response = requests.post(f"{BASE_URL}/clients", 
                               json=TEST_CLIENT_DATA, 
                               headers=auth_headers, 
                               timeout=10)
        if response.status_code == 200:
            client = response.json()
            created_client_id = client.get("id")
            if created_client_id and client.get("nom") == TEST_CLIENT_DATA["nom"]:
                results.append((True, f"POST client successful - Created client {client['nom']} {client['prenom']}"))
            else:
                results.append((False, f"POST client missing data: {client}"))
        else:
            results.append((False, f"POST client failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"POST client connection error: {str(e)}"))
    
    # Test GET /api/clients/{id} (get specific client)
    if created_client_id:
        try:
            response = requests.get(f"{BASE_URL}/clients/{created_client_id}", 
                                  headers=auth_headers, 
                                  timeout=10)
            if response.status_code == 200:
                client = response.json()
                if client.get("id") == created_client_id:
                    results.append((True, f"GET client by ID successful - Retrieved {client['nom']} {client['prenom']}"))
                else:
                    results.append((False, f"GET client by ID returned wrong client: {client}"))
            else:
                results.append((False, f"GET client by ID failed - HTTP {response.status_code}: {response.text}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"GET client by ID connection error: {str(e)}"))
    
    # Test PUT /api/clients/{id} (update client)
    if created_client_id:
        try:
            response = requests.put(f"{BASE_URL}/clients/{created_client_id}", 
                                  json=UPDATE_CLIENT_DATA, 
                                  headers=auth_headers, 
                                  timeout=10)
            if response.status_code == 200:
                client = response.json()
                if client.get("telephone") == UPDATE_CLIENT_DATA["telephone"]:
                    results.append((True, f"PUT client successful - Updated client data"))
                else:
                    results.append((False, f"PUT client data not updated correctly: {client}"))
            else:
                results.append((False, f"PUT client failed - HTTP {response.status_code}: {response.text}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"PUT client connection error: {str(e)}"))
    
    # Test DELETE /api/clients/{id} (delete client)
    if created_client_id:
        try:
            response = requests.delete(f"{BASE_URL}/clients/{created_client_id}", 
                                     headers=auth_headers, 
                                     timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "deleted successfully" in data.get("message", "").lower():
                    results.append((True, f"DELETE client successful - {data['message']}"))
                else:
                    results.append((False, f"DELETE client unexpected response: {data}"))
            else:
                results.append((False, f"DELETE client failed - HTTP {response.status_code}: {response.text}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"DELETE client connection error: {str(e)}"))
    
    return results

def test_chantier_management(token):
    """Test 4: Chantier CRUD operations"""
    print(f"\n🔍 Testing Chantier Management")
    
    results = []
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    created_chantier_id = None
    
    # Test GET /api/chantiers
    try:
        response = requests.get(f"{BASE_URL}/chantiers", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            chantiers = response.json()
            results.append((True, f"GET chantiers successful - Found {len(chantiers)} chantiers"))
        else:
            results.append((False, f"GET chantiers failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"GET chantiers connection error: {str(e)}"))
    
    # Test POST /api/chantiers
    try:
        response = requests.post(f"{BASE_URL}/chantiers", json=TEST_CHANTIER_DATA, headers=auth_headers, timeout=10)
        if response.status_code == 200:
            chantier = response.json()
            created_chantier_id = chantier.get("id")
            if created_chantier_id and chantier.get("nom") == TEST_CHANTIER_DATA["nom"]:
                results.append((True, f"POST chantier successful - Created {chantier['nom']}"))
            else:
                results.append((False, f"POST chantier missing data: {chantier}"))
        else:
            results.append((False, f"POST chantier failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"POST chantier connection error: {str(e)}"))
    
    # Test GET /api/chantiers/{id}
    if created_chantier_id:
        try:
            response = requests.get(f"{BASE_URL}/chantiers/{created_chantier_id}", headers=auth_headers, timeout=10)
            if response.status_code == 200:
                chantier = response.json()
                results.append((True, f"GET chantier by ID successful - {chantier['nom']}"))
            else:
                results.append((False, f"GET chantier by ID failed - HTTP {response.status_code}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"GET chantier by ID connection error: {str(e)}"))
    
    # Test DELETE /api/chantiers/{id}
    if created_chantier_id:
        try:
            response = requests.delete(f"{BASE_URL}/chantiers/{created_chantier_id}", headers=auth_headers, timeout=10)
            if response.status_code == 200:
                results.append((True, "DELETE chantier successful"))
            else:
                results.append((False, f"DELETE chantier failed - HTTP {response.status_code}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"DELETE chantier connection error: {str(e)}"))
    
    return results

def test_document_management(token):
    """Test 5: Document CRUD operations"""
    print(f"\n🔍 Testing Document Management")
    
    results = []
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    created_document_id = None
    
    # Test GET /api/documents
    try:
        response = requests.get(f"{BASE_URL}/documents", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            documents = response.json()
            results.append((True, f"GET documents successful - Found {len(documents)} documents"))
        else:
            results.append((False, f"GET documents failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"GET documents connection error: {str(e)}"))
    
    # Test POST /api/documents
    try:
        response = requests.post(f"{BASE_URL}/documents", json=TEST_DOCUMENT_DATA, headers=auth_headers, timeout=10)
        if response.status_code == 200:
            document = response.json()
            created_document_id = document.get("id")
            if created_document_id and document.get("nom") == TEST_DOCUMENT_DATA["nom"]:
                results.append((True, f"POST document successful - Created {document['nom']}"))
            else:
                results.append((False, f"POST document missing data: {document}"))
        else:
            results.append((False, f"POST document failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"POST document connection error: {str(e)}"))
    
    # Test DELETE /api/documents/{id}
    if created_document_id:
        try:
            response = requests.delete(f"{BASE_URL}/documents/{created_document_id}", headers=auth_headers, timeout=10)
            if response.status_code == 200:
                results.append((True, "DELETE document successful"))
            else:
                results.append((False, f"DELETE document failed - HTTP {response.status_code}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"DELETE document connection error: {str(e)}"))
    
    return results

def test_calcul_pac_management(token):
    """Test 6: PAC Calculation CRUD operations - PRIORITY MODULE"""
    print(f"\n🔍 Testing PAC Calculations Management - PRIORITY MODULE")
    
    results = []
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    created_calcul_id = None
    
    # Test GET /api/calculs-pac
    try:
        response = requests.get(f"{BASE_URL}/calculs-pac", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            calculs = response.json()
            results.append((True, f"GET calculs-pac successful - Found {len(calculs)} calculations"))
        else:
            results.append((False, f"GET calculs-pac failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"GET calculs-pac connection error: {str(e)}"))
    
    # Test POST /api/calculs-pac (Air/Eau calculation)
    try:
        response = requests.post(f"{BASE_URL}/calculs-pac", json=TEST_CALCUL_PAC_DATA, headers=auth_headers, timeout=10)
        if response.status_code == 200:
            calcul = response.json()
            created_calcul_id = calcul.get("id")
            if created_calcul_id and calcul.get("nom") == TEST_CALCUL_PAC_DATA["nom"]:
                results.append((True, f"POST calcul PAC Air/Eau successful - Created {calcul['nom']}"))
                # Verify PAC-specific fields
                if calcul.get("type_pac") == "air_eau" and calcul.get("pieces"):
                    results.append((True, "PAC calculation contains correct type and pieces data"))
                else:
                    results.append((False, f"PAC calculation missing type or pieces: {calcul}"))
            else:
                results.append((False, f"POST calcul PAC missing data: {calcul}"))
        else:
            results.append((False, f"POST calcul PAC failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"POST calcul PAC connection error: {str(e)}"))
    
    # Test Air/Air calculation
    air_air_data = TEST_CALCUL_PAC_DATA.copy()
    air_air_data["nom"] = "Calcul PAC Air/Air Test"
    air_air_data["type_pac"] = "air_air"
    air_air_data["type_installation"] = "multi_split"
    air_air_data["scop_estime"] = "4.0"
    air_air_data["seer_estime"] = "6.5"
    
    try:
        response = requests.post(f"{BASE_URL}/calculs-pac", json=air_air_data, headers=auth_headers, timeout=10)
        if response.status_code == 200:
            calcul = response.json()
            if calcul.get("type_pac") == "air_air":
                results.append((True, f"POST calcul PAC Air/Air successful - Created {calcul['nom']}"))
            else:
                results.append((False, f"PAC Air/Air type incorrect: {calcul}"))
        else:
            results.append((False, f"POST calcul PAC Air/Air failed - HTTP {response.status_code}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"POST calcul PAC Air/Air connection error: {str(e)}"))
    
    # Test GET /api/calculs-pac/{id}
    if created_calcul_id:
        try:
            response = requests.get(f"{BASE_URL}/calculs-pac/{created_calcul_id}", headers=auth_headers, timeout=10)
            if response.status_code == 200:
                calcul = response.json()
                results.append((True, f"GET calcul PAC by ID successful - {calcul['nom']}"))
            else:
                results.append((False, f"GET calcul PAC by ID failed - HTTP {response.status_code}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"GET calcul PAC by ID connection error: {str(e)}"))
    
    # Test DELETE /api/calculs-pac/{id}
    if created_calcul_id:
        try:
            response = requests.delete(f"{BASE_URL}/calculs-pac/{created_calcul_id}", headers=auth_headers, timeout=10)
            if response.status_code == 200:
                results.append((True, "DELETE calcul PAC successful"))
            else:
                results.append((False, f"DELETE calcul PAC failed - HTTP {response.status_code}"))
        except requests.exceptions.RequestException as e:
            results.append((False, f"DELETE calcul PAC connection error: {str(e)}"))
    
    return results

def test_fiches_sdb_management(token):
    """Test 7: Fiches SDB CRUD operations"""
    print(f"\n🔍 Testing Fiches SDB Management")
    
    results = []
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Test GET /api/fiches-sdb
    try:
        response = requests.get(f"{BASE_URL}/fiches-sdb", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            fiches = response.json()
            results.append((True, f"GET fiches-sdb successful - Found {len(fiches)} fiches"))
        else:
            results.append((False, f"GET fiches-sdb failed - HTTP {response.status_code}: {response.text}"))
    except requests.exceptions.RequestException as e:
        results.append((False, f"GET fiches-sdb connection error: {str(e)}"))
    
    return results

def test_security():
    """Test 8: Security - access without token"""
    print(f"\n🔍 Testing Security - Access without authentication")
    
    results = []
    protected_endpoints = [
        ("GET", "/clients"),
        ("POST", "/clients"),
        ("GET", "/clients/test-id"),
        ("PUT", "/clients/test-id"),
        ("DELETE", "/clients/test-id")
    ]
    
    for method, endpoint in protected_endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", headers=HEADERS, timeout=10)
            elif method == "POST":
                response = requests.post(f"{BASE_URL}{endpoint}", json=TEST_CLIENT_DATA, headers=HEADERS, timeout=10)
            elif method == "PUT":
                response = requests.put(f"{BASE_URL}{endpoint}", json=UPDATE_CLIENT_DATA, headers=HEADERS, timeout=10)
            elif method == "DELETE":
                response = requests.delete(f"{BASE_URL}{endpoint}", headers=HEADERS, timeout=10)
            
            if response.status_code in [401, 403]:
                results.append((True, f"{method} {endpoint} correctly rejected without token (HTTP {response.status_code})"))
            else:
                results.append((False, f"{method} {endpoint} should reject without token, got HTTP {response.status_code}"))
                
        except requests.exceptions.RequestException as e:
            results.append((False, f"{method} {endpoint} connection error: {str(e)}"))
    
    return results

def main():
    """Main test execution"""
    print("🚀 Starting H2EAUX GESTION API Backend Tests - COMPREHENSIVE")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    test_results = TestResults()
    
    # Test 1: Health Check
    success, message = test_health_check()
    test_results.add_result("Health Check", success, message)
    
    if not success:
        print("\n❌ API is not accessible. Stopping tests.")
        return False
    
    # Test 2: Authentication
    auth_results, tokens = test_authentication()
    for success, message in auth_results:
        test_results.add_result("Authentication", success, message)
    
    # Test 3: Client Management (if we have a valid token)
    if tokens.get("admin"):
        client_results = test_client_management(tokens["admin"])
        for success, message in client_results:
            test_results.add_result("Client Management", success, message)
    else:
        test_results.add_result("Client Management", False, "No valid admin token available")
    
    # Test 4: Chantier Management
    if tokens.get("admin"):
        chantier_results = test_chantier_management(tokens["admin"])
        for success, message in chantier_results:
            test_results.add_result("Chantier Management", success, message)
    else:
        test_results.add_result("Chantier Management", False, "No valid admin token available")
    
    # Test 5: Document Management
    if tokens.get("admin"):
        document_results = test_document_management(tokens["admin"])
        for success, message in document_results:
            test_results.add_result("Document Management", success, message)
    else:
        test_results.add_result("Document Management", False, "No valid admin token available")
    
    # Test 6: PAC Calculations Management - PRIORITY MODULE
    if tokens.get("admin"):
        pac_results = test_calcul_pac_management(tokens["admin"])
        for success, message in pac_results:
            test_results.add_result("PAC Calculations", success, message)
    else:
        test_results.add_result("PAC Calculations", False, "No valid admin token available")
    
    # Test 7: Fiches SDB Management
    if tokens.get("admin"):
        sdb_results = test_fiches_sdb_management(tokens["admin"])
        for success, message in sdb_results:
            test_results.add_result("Fiches SDB", success, message)
    else:
        test_results.add_result("Fiches SDB", False, "No valid admin token available")
    
    # Test 8: Security
    security_results = test_security()
    for success, message in security_results:
        test_results.add_result("Security", success, message)
    
    # Final summary
    all_passed = test_results.summary()
    
    if all_passed:
        print("\n🎉 All tests passed! H2EAUX GESTION API is working correctly.")
        print("✅ All 8 modules tested successfully:")
        print("   1. ✅ Authentication & Security")
        print("   2. ✅ Client Management")
        print("   3. ✅ Chantier Management")
        print("   4. ✅ Document Management")
        print("   5. ✅ PAC Calculations (PRIORITY)")
        print("   6. ✅ Fiches SDB")
        print("   7. ✅ Health Check")
        print("   8. ✅ Security Controls")
    else:
        print(f"\n⚠️  {test_results.failed} test(s) failed. Please check the issues above.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)