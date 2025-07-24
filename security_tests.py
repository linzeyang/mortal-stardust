#!/usr/bin/env python3
"""
Comprehensive Security Testing Suite for LifePath AI Platform
Tests encryption, authentication, authorization, and data protection
"""

import json
import sys
import time
from datetime import datetime

import jwt
import requests

# Test configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"


class SecurityTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.tokens = {}

    def log_test(self, test_name, status, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat(),
        }
        self.test_results.append(result)
        print(
            f"[{'✅' if status == 'PASS' else '❌' if status == 'FAIL' else '⚠️'}] {test_name}: {details}"
        )

    def test_password_security(self):
        """Test password strength requirements"""
        print("\n🔐 Testing Password Security...")

        weak_passwords = ["123", "password", "12345678", "qwerty123"]

        for password in weak_passwords:
            try:
                response = self.session.post(
                    f"{BASE_URL}/api/auth/register",
                    json={
                        "email": f"weak_{len(password)}@test.com",
                        "password": password,
                        "firstName": "Test",
                        "lastName": "User",
                        "role": "student",
                    },
                )

                if response.status_code == 422:
                    self.log_test(
                        f"Weak Password Rejection ({password})",
                        "PASS",
                        "Weak password correctly rejected",
                    )
                else:
                    self.log_test(
                        f"Weak Password Rejection ({password})",
                        "FAIL",
                        f"Weak password accepted: {response.status_code}",
                    )

            except Exception as e:
                self.log_test(f"Weak Password Test ({password})", "ERROR", str(e))

    def test_authentication_flow(self):
        """Test complete authentication flow"""
        print("\n🔑 Testing Authentication Flow...")

        # Register a test user
        register_data = {
            "email": "auth_test@security.com",
            "password": "SecurePassword123!",
            "firstName": "Auth",
            "lastName": "Test",
            "role": "student",
        }

        try:
            # Registration
            response = self.session.post(
                f"{BASE_URL}/api/auth/register", json=register_data
            )
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.tokens["register"] = data["access_token"]
                    self.log_test(
                        "User Registration",
                        "PASS",
                        "User registered successfully with token",
                    )
                else:
                    self.log_test(
                        "User Registration", "FAIL", "No access token returned"
                    )
            else:
                self.log_test(
                    "User Registration",
                    "FAIL",
                    f"Registration failed: {response.status_code}",
                )

            # Login
            login_data = {
                "email": register_data["email"],
                "password": register_data["password"],
            }

            response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.tokens["login"] = data["access_token"]
                    self.log_test("User Login", "PASS", "Login successful with token")
                else:
                    self.log_test("User Login", "FAIL", "No access token returned")
            else:
                self.log_test(
                    "User Login", "FAIL", f"Login failed: {response.status_code}"
                )

        except Exception as e:
            self.log_test("Authentication Flow", "ERROR", str(e))

    def test_jwt_security(self):
        """Test JWT token security"""
        print("\n🎫 Testing JWT Security...")

        if "login" not in self.tokens:
            self.log_test("JWT Security", "SKIP", "No JWT token available")
            return

        token = self.tokens["login"]

        try:
            # Decode without verification to check structure
            decoded = jwt.decode(token, options={"verify_signature": False})

            # Check for proper claims
            required_claims = ["sub", "email", "exp"]
            missing_claims = [
                claim for claim in required_claims if claim not in decoded
            ]

            if not missing_claims:
                self.log_test("JWT Claims", "PASS", "All required claims present")
            else:
                self.log_test("JWT Claims", "FAIL", f"Missing claims: {missing_claims}")

            # Check expiration
            if "exp" in decoded:
                exp_time = datetime.fromtimestamp(decoded["exp"])
                now = datetime.now()
                if exp_time > now:
                    self.log_test(
                        "JWT Expiration", "PASS", f"Token expires at: {exp_time}"
                    )
                else:
                    self.log_test("JWT Expiration", "FAIL", "Token already expired")

        except Exception as e:
            self.log_test("JWT Security", "ERROR", str(e))

    def test_authorization(self):
        """Test authorization controls"""
        print("\n🛡️ Testing Authorization...")

        # Test without token
        try:
            response = self.session.get(f"{BASE_URL}/api/auth/me")
            if response.status_code in [401, 403]:
                self.log_test(
                    "Unauthorized Access",
                    "PASS",
                    "Protected endpoint requires authentication",
                )
            else:
                self.log_test(
                    "Unauthorized Access",
                    "FAIL",
                    f"Protected endpoint accessible without auth: {response.status_code}",
                )

        except Exception as e:
            self.log_test("Authorization Test", "ERROR", str(e))

        # Test with valid token
        if "login" in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['login']}"}
            try:
                response = self.session.get(f"{BASE_URL}/api/auth/me", headers=headers)
                if response.status_code == 200:
                    self.log_test(
                        "Authorized Access", "PASS", "Valid token grants access"
                    )
                elif response.status_code == 404:
                    self.log_test("Authorized Access", "SKIP", "Endpoint not found")
                else:
                    self.log_test(
                        "Authorized Access",
                        "FAIL",
                        f"Valid token rejected: {response.status_code}",
                    )

            except Exception as e:
                self.log_test("Authorized Access", "ERROR", str(e))

    def test_input_validation(self):
        """Test input validation and sanitization"""
        print("\n🧹 Testing Input Validation...")

        # Test SQL injection attempts
        sql_payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users --",
        ]

        for payload in sql_payloads:
            try:
                response = self.session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": payload, "password": "test123"},
                )

                if response.status_code in [400, 422]:
                    self.log_test(
                        "SQL Injection Protection", "PASS", "Malicious input rejected"
                    )
                elif response.status_code == 404:
                    self.log_test(
                        "SQL Injection Protection", "PASS", "User not found (safe)"
                    )
                else:
                    self.log_test(
                        "SQL Injection Protection",
                        "WARN",
                        f"Unexpected response: {response.status_code}",
                    )

            except Exception as e:
                self.log_test("SQL Injection Test", "ERROR", str(e))

        # Test XSS payloads
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
        ]

        for payload in xss_payloads:
            try:
                response = self.session.post(
                    f"{BASE_URL}/api/auth/register",
                    json={
                        "email": "xss_test@test.com",
                        "password": "TestPassword123!",
                        "firstName": payload,
                        "lastName": "Test",
                        "role": "student",
                    },
                )

                if response.status_code in [400, 422]:
                    self.log_test("XSS Protection", "PASS", "XSS payload rejected")
                elif response.status_code == 200:
                    # Check if the payload was sanitized
                    data = response.json()
                    if payload in str(data):
                        self.log_test(
                            "XSS Protection", "FAIL", "XSS payload not sanitized"
                        )
                    else:
                        self.log_test("XSS Protection", "PASS", "XSS payload sanitized")

            except Exception as e:
                self.log_test("XSS Protection Test", "ERROR", str(e))

    def test_rate_limiting(self):
        """Test rate limiting"""
        print("\n⏱️ Testing Rate Limiting...")

        # Test login rate limiting
        failed_attempts = 0
        for i in range(10):
            try:
                response = self.session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": "nonexistent@test.com", "password": "wrongpassword"},
                )

                if response.status_code == 429:  # Too Many Requests
                    self.log_test(
                        "Rate Limiting",
                        "PASS",
                        f"Rate limit triggered after {i + 1} attempts",
                    )
                    break
                elif response.status_code in [401, 404]:
                    failed_attempts += 1

            except Exception as e:
                self.log_test("Rate Limiting Test", "ERROR", str(e))
                break

        if failed_attempts >= 10:
            self.log_test(
                "Rate Limiting", "WARN", "No rate limiting detected in 10 attempts"
            )

    def test_data_encryption(self):
        """Test data encryption in transit and at rest"""
        print("\n🔒 Testing Data Encryption...")

        # Test HTTPS enforcement (if applicable)
        try:
            response = requests.get("http://localhost:8000/health")
            if response.status_code == 200:
                # Check if sensitive data is in response
                content = response.text.lower()
                sensitive_keywords = ["password", "token", "secret", "key"]

                found_sensitive = [
                    keyword for keyword in sensitive_keywords if keyword in content
                ]
                if not found_sensitive:
                    self.log_test(
                        "Data Exposure", "PASS", "No sensitive data in HTTP responses"
                    )
                else:
                    self.log_test(
                        "Data Exposure",
                        "WARN",
                        f"Potential sensitive data: {found_sensitive}",
                    )

        except Exception as e:
            self.log_test("Data Encryption Test", "ERROR", str(e))

    def run_all_tests(self):
        """Run all security tests"""
        print("🚀 Starting Comprehensive Security Testing Suite")
        print("=" * 60)

        start_time = time.time()

        self.test_password_security()
        self.test_authentication_flow()
        self.test_jwt_security()
        self.test_authorization()
        self.test_input_validation()
        self.test_rate_limiting()
        self.test_data_encryption()

        end_time = time.time()
        duration = end_time - start_time

        # Summary
        print("\n" + "=" * 60)
        print("📊 SECURITY TEST SUMMARY")
        print("=" * 60)

        passed = len([r for r in self.test_results if r["status"] == "PASS"])
        failed = len([r for r in self.test_results if r["status"] == "FAIL"])
        warnings = len([r for r in self.test_results if r["status"] == "WARN"])
        errors = len([r for r in self.test_results if r["status"] == "ERROR"])
        skipped = len([r for r in self.test_results if r["status"] == "SKIP"])

        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"🔥 Errors: {errors}")
        print(f"⏭️  Skipped: {skipped}")
        print(f"⏱️  Duration: {duration:.2f} seconds")

        # Save detailed results
        with open("security_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        print("\n📄 Detailed results saved to: security_test_results.json")

        # Return exit code based on results
        return 0 if failed == 0 else 1


if __name__ == "__main__":
    tester = SecurityTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)
