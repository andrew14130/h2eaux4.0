#!/usr/bin/env python3
"""
H2EAUX GESTION API Backend Tests
Tests all backend functionality including authentication, client management, and security.
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

def test_security():
    """Test 4: Security - access without token"""
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
    print("🚀 Starting H2EAUX GESTION API Backend Tests")
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
    
    # Test 4: Security
    security_results = test_security()
    for success, message in security_results:
        test_results.add_result("Security", success, message)
    
    # Final summary
    all_passed = test_results.summary()
    
    if all_passed:
        print("\n🎉 All tests passed! H2EAUX GESTION API is working correctly.")
    else:
        print(f"\n⚠️  {test_results.failed} test(s) failed. Please check the issues above.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)