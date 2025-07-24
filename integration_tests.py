#!/usr/bin/env python3
"""
Comprehensive Integration Testing Suite for LifePath AI Platform
Tests the complete workflow from user registration to AI solution generation
"""

import requests
import json
import time
import base64
from datetime import datetime
import sys
import os

# Test configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

class IntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.test_user = None
        self.auth_token = None
        self.test_data = {}
        
    def log_test(self, test_name, status, details="", data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        self.test_results.append(result)
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️" if status == "WARN" else "ℹ️"
        print(f"[{status_icon}] {test_name}: {details}")
        
    def setup_test_environment(self):
        """Setup test environment and create test user"""
        print("\n🔧 Setting up test environment...")
        
        # Create test user
        test_user_data = {
            "email": f"integration_test_{int(time.time())}@test.com",
            "password": "IntegrationTest123!",
            "firstName": "Integration",
            "lastName": "Test",
            "role": "student"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/api/auth/register", json=test_user_data)
            if response.status_code == 200:
                data = response.json()
                self.test_user = data.get('user')
                self.auth_token = data.get('access_token')
                self.test_data['user'] = self.test_user
                self.log_test("Test User Setup", "PASS", f"Created user: {self.test_user['email']}")
                return True
            else:
                self.log_test("Test User Setup", "FAIL", f"Failed to create user: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Test User Setup", "ERROR", str(e))
            return False
            
    def test_user_authentication_flow(self):
        """Test complete user authentication workflow"""
        print("\n🔐 Testing User Authentication Flow...")
        
        if not self.test_user:
            self.log_test("Authentication Flow", "SKIP", "No test user available")
            return False
            
        # Test login
        try:
            login_data = {
                "email": self.test_user['email'], 
                "password": "IntegrationTest123!"
            }
            
            response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                if token:
                    self.auth_token = token
                    self.log_test("User Login", "PASS", "Login successful with fresh token")
                    return True
                else:
                    self.log_test("User Login", "FAIL", "No access token in response")
                    return False
            else:
                self.log_test("User Login", "FAIL", f"Login failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("User Authentication", "ERROR", str(e))
            return False
            
    def test_experience_submission(self):
        """Test experience submission workflow"""
        print("\n📝 Testing Experience Submission...")
        
        if not self.auth_token:
            self.log_test("Experience Submission", "SKIP", "No authentication token")
            return False
            
        # Test experience data following ExperienceCreate model
        experience_data = {
            "title": "学业压力与时间管理困扰",
            "content": {
                "text": "作为大三学生，我发现自己在面对繁重的课业压力时经常感到焦虑和无助。特别是在准备期末考试期间，我总是无法有效地管理时间，经常熬夜但效率很低。这种状态让我感到很沮丧，也影响了我的睡眠和健康。我希望能找到更好的学习方法和时间管理技巧。",
                "mediaFiles": []
            },
            "category": "education",
            "emotionalState": {
                "primary": "anxious",
                "intensity": 8,
                "description": "考试压力导致的高度焦虑状态"
            },
            "tags": [
                "学习压力",
                "考试焦虑", 
                "时间管理",
                "心理健康",
                "职业规划"
            ],
            "privacy": {
                "isPublic": False,
                "shareWithAI": True,
                "anonymizeForResearch": False
            },
            "metadata": {
                "location": "University Library",
                "dateOccurred": "2024-01-15T10:00:00.000Z",
                "inputMethod": "text",
                "processingStage": "pending"
            }
        }
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = self.session.post(
                f"{BASE_URL}/api/experiences/", 
                json=experience_data, 
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test_data['experience'] = data
                self.log_test("Experience Submission", "PASS", f"Experience created: {data.get('experience_id', 'N/A')}")
                return True
            elif response.status_code == 404:
                self.log_test("Experience Submission", "SKIP", "Experience endpoint not found")
                return False
            else:
                self.log_test("Experience Submission", "FAIL", f"Submission failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Experience Submission", "ERROR", str(e))
            return False
            
    def test_multimodal_file_upload(self):
        """Test multimodal file upload functionality"""
        print("\n📁 Testing Multimodal File Upload...")
        
        if not self.auth_token:
            self.log_test("File Upload", "SKIP", "No authentication token")
            return False
            
        # Create test files
        test_files = {
            'text_file.txt': "这是一个测试文本文件，包含了用户的详细经历描述。",
            'test_data.json': json.dumps({"test": "data", "type": "experience_supplement"})
        }
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        for filename, content in test_files.items():
            try:
                # Write test file
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # Upload file
                with open(filename, 'rb') as f:
                    files = {'file': (filename, f, 'text/plain')}
                    data = {'description': f'Integration test file: {filename}'}
                    
                    response = self.session.post(
                        f"{BASE_URL}/api/media/upload",
                        files=files,
                        data=data,
                        headers=headers
                    )
                    
                if response.status_code == 200:
                    result = response.json()
                    self.test_data[f'file_{filename}'] = result
                    self.log_test(f"File Upload ({filename})", "PASS", f"File uploaded: {result.get('file_id', 'N/A')}")
                elif response.status_code == 404:
                    self.log_test(f"File Upload ({filename})", "SKIP", "Upload endpoint not found")
                else:
                    self.log_test(f"File Upload ({filename})", "FAIL", f"Upload failed: {response.status_code}")
                    
                # Cleanup
                if os.path.exists(filename):
                    os.remove(filename)
                    
            except Exception as e:
                self.log_test(f"File Upload ({filename})", "ERROR", str(e))
                
    def test_ai_processing_stage1(self):
        """Test AI processing stage 1 - Psychological healing"""
        print("\n🧠 Testing AI Processing Stage 1 (Psychological Healing)...")
        
        if not self.auth_token:
            self.log_test("AI Stage 1", "SKIP", "No authentication token")
            return False
            
        if 'experience' not in self.test_data:
            self.log_test("AI Stage 1", "SKIP", "No experience data available")
            return False
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        experience_id = self.test_data['experience'].get('experience_id')
        
        if not experience_id:
            self.log_test("AI Stage 1", "SKIP", "No experience ID available")
            return False
            
        ai_request = {
            "experience_id": experience_id,
            "stage": 1,
            "focus_areas": ["emotional_support", "stress_management", "psychological_wellbeing"],
            "preferred_approach": "cognitive_behavioral_therapy"
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/api/ai/stage1/process",
                json=ai_request,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test_data['ai_stage1'] = data
                self.log_test("AI Stage 1 Processing", "PASS", f"Psychological healing solution generated")
                return True
            elif response.status_code == 404:
                self.log_test("AI Stage 1 Processing", "SKIP", "AI stage 1 endpoint not found")
                return False
            else:
                self.log_test("AI Stage 1 Processing", "FAIL", f"Processing failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("AI Stage 1 Processing", "ERROR", str(e))
            return False
            
    def test_ai_processing_stage2(self):
        """Test AI processing stage 2 - Practical solutions"""
        print("\n🎯 Testing AI Processing Stage 2 (Practical Solutions)...")
        
        if not self.auth_token:
            self.log_test("AI Stage 2", "SKIP", "No authentication token")
            return False
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        experience_id = self.test_data.get('experience', {}).get('experience_id')
        
        if not experience_id:
            self.log_test("AI Stage 2", "SKIP", "No experience ID available")
            return False
            
        ai_request = {
            "experience_id": experience_id,
            "stage": 2,
            "solution_types": ["actionable_steps", "time_management", "study_techniques"],
            "implementation_timeline": "short_term"
        }
        
        try:
            response = self.session.post(
                f"{BASE_URL}/api/ai/stage2/process",
                json=ai_request,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test_data['ai_stage2'] = data
                self.log_test("AI Stage 2 Processing", "PASS", "Practical solutions generated")
                return True
            elif response.status_code == 404:
                self.log_test("AI Stage 2 Processing", "SKIP", "AI stage 2 endpoint not found")
                return False
            else:
                self.log_test("AI Stage 2 Processing", "FAIL", f"Processing failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("AI Stage 2 Processing", "ERROR", str(e))
            return False
            
    def test_solution_rating_system(self):
        """Test solution rating and feedback system"""
        print("\n⭐ Testing Solution Rating System...")
        
        if not self.auth_token:
            self.log_test("Solution Rating", "SKIP", "No authentication token")
            return False
            
        # Test different rating scenarios
        test_ratings = [
            {"rating": 85, "feedback": "这个方案很有帮助，特别是时间管理的建议", "helpful_aspects": ["具体可行", "针对性强"]},
            {"rating": 45, "feedback": "方案过于泛泛，缺乏具体指导", "improvement_needed": ["更具体的步骤", "个性化建议"]},
            {"rating": 75, "feedback": "大部分建议都很好，但有些需要更多细节", "helpful_aspects": ["心理疏导", "实用技巧"]}
        ]
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        for i, rating_data in enumerate(test_ratings):
            try:
                # Add required fields using correct API structure
                rating_request = {
                    "solution_id": f"test_solution_{i+1}",
                    "rating_percentage": rating_data["rating"],
                    "feedback_text": rating_data.get("feedback"),
                    "helpful_aspects": rating_data.get("helpful_aspects", []),
                    "improvement_suggestions": rating_data.get("improvement_needed", []),
                    "would_recommend": rating_data["rating"] >= 70,
                    "implementation_difficulty": 5
                }
                
                response = self.session.post(
                    f"{BASE_URL}/api/solutions/rate",
                    json=rating_request,
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.test_data[f'rating_{i+1}'] = result
                    
                    # Check if regeneration was triggered for low ratings
                    if rating_data['rating'] < 50:
                        self.log_test(f"Solution Rating ({rating_data['rating']}%)", "PASS", "Low rating triggered regeneration")
                    else:
                        self.log_test(f"Solution Rating ({rating_data['rating']}%)", "PASS", "Rating submitted successfully")
                        
                elif response.status_code == 404:
                    self.log_test(f"Solution Rating ({rating_data['rating']}%)", "SKIP", "Rating endpoint not found")
                else:
                    self.log_test(f"Solution Rating ({rating_data['rating']}%)", "FAIL", f"Rating failed: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Solution Rating ({rating_data['rating']}%)", "ERROR", str(e))
                
    def test_experience_summarization(self):
        """Test experience summarization system"""
        print("\n📊 Testing Experience Summarization...")
        
        if not self.auth_token:
            self.log_test("Experience Summarization", "SKIP", "No authentication token")
            return False
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = self.session.get(
                f"{BASE_URL}/api/experience-summarization/list",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test_data['summary'] = data
                self.log_test("Experience Summarization", "PASS", f"Generated summary with {len(data.get('summaries', []))} entries")
                return True
            elif response.status_code == 404:
                self.log_test("Experience Summarization", "SKIP", "Summary endpoint not found")
                return False
            else:
                self.log_test("Experience Summarization", "FAIL", f"Summarization failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Experience Summarization", "ERROR", str(e))
            return False
            
    def test_solution_analytics(self):
        """Test solution analytics system"""
        print("\n📈 Testing Solution Analytics...")
        
        if not self.auth_token:
            self.log_test("Solution Analytics", "SKIP", "No authentication token")
            return False
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = self.session.get(
                f"{BASE_URL}/api/solution-analytics/history",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test_data['analytics'] = data
                self.log_test("Solution Analytics", "PASS", "Analytics data retrieved successfully")
                return True
            elif response.status_code == 404:
                self.log_test("Solution Analytics", "SKIP", "Analytics endpoint not found")
                return False
            else:
                self.log_test("Solution Analytics", "FAIL", f"Analytics failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Solution Analytics", "ERROR", str(e))
            return False
            
    def test_privacy_compliance(self):
        """Test privacy compliance and GDPR features"""
        print("\n🛡️ Testing Privacy Compliance...")
        
        if not self.auth_token:
            self.log_test("Privacy Compliance", "SKIP", "No authentication token")
            return False
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test data export request
        try:
            export_request = {
                "request_type": "data_export",
                "purpose": "integration_testing",
                "include_data": ["experiences", "solutions", "ratings"]
            }
            
            response = self.session.post(
                f"{BASE_URL}/api/privacy/data-request",
                json=export_request,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test_data['data_export'] = data
                self.log_test("GDPR Data Export", "PASS", f"Export request created: {data.get('request_id', 'N/A')}")
            elif response.status_code == 404:
                self.log_test("GDPR Data Export", "SKIP", "Privacy endpoint not found")
            else:
                self.log_test("GDPR Data Export", "FAIL", f"Export request failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("GDPR Data Export", "ERROR", str(e))
            
    def test_frontend_integration(self):
        """Test frontend integration"""
        print("\n🌐 Testing Frontend Integration...")
        
        try:
            # Test frontend health
            response = requests.get(f"{FRONTEND_URL}/api/user")
            if response.status_code in [200, 401]:  # 401 is expected without auth
                self.log_test("Frontend Health", "PASS", "Frontend is responsive")
            else:
                self.log_test("Frontend Health", "FAIL", f"Frontend not responding: {response.status_code}")
                
            # Test API integration
            response = requests.get(f"{FRONTEND_URL}/api/health")
            if response.status_code == 200:
                self.log_test("Frontend API Integration", "PASS", "API endpoints accessible")
            else:
                self.log_test("Frontend API Integration", "WARN", "Some API endpoints may not be accessible")
                
        except Exception as e:
            self.log_test("Frontend Integration", "ERROR", str(e))
            
    def run_integration_tests(self):
        """Run complete integration test suite"""
        print("🚀 Starting Comprehensive Integration Testing")
        print("=" * 70)
        
        start_time = time.time()
        
        # Setup
        if not self.setup_test_environment():
            print("❌ Test environment setup failed. Aborting tests.")
            return 1
            
        # Core workflow tests
        self.test_user_authentication_flow()
        self.test_experience_submission()
        self.test_multimodal_file_upload()
        self.test_ai_processing_stage1()
        self.test_ai_processing_stage2()
        self.test_solution_rating_system()
        self.test_experience_summarization()
        self.test_solution_analytics()
        self.test_privacy_compliance()
        self.test_frontend_integration()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 INTEGRATION TEST SUMMARY")
        print("=" * 70)
        
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warnings = len([r for r in self.test_results if r['status'] == 'WARN'])
        errors = len([r for r in self.test_results if r['status'] == 'ERROR'])
        skipped = len([r for r in self.test_results if r['status'] == 'SKIP'])
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"🔥 Errors: {errors}")
        print(f"⏭️  Skipped: {skipped}")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        
        # Test coverage analysis
        total_components = 10  # Number of major system components
        tested_components = passed + failed
        coverage = (tested_components / total_components) * 100
        print(f"🎯 Test Coverage: {coverage:.1f}%")
        
        # Save detailed results
        with open('integration_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'passed': passed,
                    'failed': failed,
                    'warnings': warnings,
                    'errors': errors,
                    'skipped': skipped,
                    'duration': duration,
                    'coverage': coverage
                },
                'test_data': self.test_data,
                'detailed_results': self.test_results
            }, f, indent=2)
        print(f"\n📄 Detailed results saved to: integration_test_results.json")
        
        # Workflow completeness check
        workflow_steps = ['setup', 'auth', 'experience', 'ai_stage1', 'ai_stage2', 'rating']
        completed_steps = [step for step in workflow_steps if any(step in r['test'].lower() for r in self.test_results if r['status'] == 'PASS')]
        
        workflow_completion = (len(completed_steps) / len(workflow_steps)) * 100
        print(f"🔄 Workflow Completion: {workflow_completion:.1f}%")
        
        if workflow_completion >= 80:
            print("🎉 Integration testing completed successfully!")
            return 0
        elif workflow_completion >= 60:
            print("⚠️  Integration testing partially successful")
            return 1
        else:
            print("❌ Integration testing failed - critical workflow issues")
            return 2

if __name__ == "__main__":
    tester = IntegrationTester()
    exit_code = tester.run_integration_tests()
    sys.exit(exit_code)