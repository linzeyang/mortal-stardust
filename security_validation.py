#!/usr/bin/env python3
"""
Security Configuration Validation Script
Life Experience Collection & AI Counseling Platform

This script validates that all security configurations are properly set up
before deployment to production.
"""

import base64
import json
import os
import re
import sys
from datetime import datetime
from typing import Dict


class SecurityValidator:
    def __init__(self):
        self.checks_passed = 0
        self.checks_failed = 0
        self.warnings = 0
        self.results = []

    def log_result(
        self, check_name: str, status: str, message: str, level: str = "INFO"
    ):
        """Log validation result"""
        timestamp = datetime.now().isoformat()
        result = {
            "timestamp": timestamp,
            "check": check_name,
            "status": status,
            "message": message,
            "level": level,
        }
        self.results.append(result)

        if status == "PASS":
            self.checks_passed += 1
            print(f"✅ {check_name}: {message}")
        elif status == "FAIL":
            self.checks_failed += 1
            print(f"❌ {check_name}: {message}")
        elif status == "WARN":
            self.warnings += 1
            print(f"⚠️  {check_name}: {message}")
        else:
            print(f"ℹ️  {check_name}: {message}")

    def check_environment_variables(self) -> None:
        """Validate required environment variables"""
        print("\n🔍 Checking Environment Variables...")

        # Critical environment variables
        critical_vars = [
            "MONGO_CONNECTION_STRING",
            "JWT_SECRET_KEY",
            "ENCRYPTION_KEY",
            "OPENAI_API_KEY",
        ]

        # Optional but recommended variables
        recommended_vars = [
            "NEXTAUTH_SECRET",
            "RATE_LIMIT_REQUESTS",
            "LOG_LEVEL",
            "BACKUP_SCHEDULE",
        ]

        for var in critical_vars:
            if var in os.environ:
                value = os.environ[var]
                if len(value) < 10:
                    self.log_result(
                        f"Environment Variable {var}",
                        "FAIL",
                        "Value too short - security risk",
                        "ERROR",
                    )
                else:
                    self.log_result(
                        f"Environment Variable {var}",
                        "PASS",
                        "Set with adequate length",
                    )
            else:
                self.log_result(
                    f"Environment Variable {var}",
                    "FAIL",
                    "Required variable not set",
                    "ERROR",
                )

        for var in recommended_vars:
            if var not in os.environ:
                self.log_result(
                    f"Environment Variable {var}",
                    "WARN",
                    "Recommended variable not set",
                    "WARNING",
                )

    def check_jwt_security(self) -> None:
        """Validate JWT configuration security"""
        print("\n🔑 Checking JWT Security Configuration...")

        jwt_secret = os.environ.get("JWT_SECRET_KEY", "")

        if len(jwt_secret) < 32:
            self.log_result(
                "JWT Secret Length",
                "FAIL",
                "JWT secret should be at least 32 characters",
                "ERROR",
            )
        elif len(jwt_secret) < 64:
            self.log_result(
                "JWT Secret Length",
                "WARN",
                "JWT secret should be at least 64 characters for maximum security",
                "WARNING",
            )
        else:
            self.log_result(
                "JWT Secret Length",
                "PASS",
                f"JWT secret has adequate length ({len(jwt_secret)} chars)",
            )

        # Check if secret contains variety of characters
        if jwt_secret:
            has_upper = bool(re.search(r"[A-Z]", jwt_secret))
            has_lower = bool(re.search(r"[a-z]", jwt_secret))
            has_digit = bool(re.search(r"\d", jwt_secret))
            has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', jwt_secret))

            complexity_score = sum([has_upper, has_lower, has_digit, has_special])

            if complexity_score >= 3:
                self.log_result(
                    "JWT Secret Complexity",
                    "PASS",
                    "JWT secret has good character variety",
                )
            else:
                self.log_result(
                    "JWT Secret Complexity",
                    "WARN",
                    "JWT secret should include uppercase, lowercase, digits, and special characters",
                    "WARNING",
                )

    def check_encryption_configuration(self) -> None:
        """Validate encryption settings"""
        print("\n🔐 Checking Encryption Configuration...")

        encryption_key = os.environ.get("ENCRYPTION_KEY", "")

        if not encryption_key:
            self.log_result(
                "Encryption Key", "FAIL", "Encryption key not configured", "ERROR"
            )
            return

        try:
            # Try to decode base64 key
            decoded_key = base64.b64decode(encryption_key)
            if len(decoded_key) == 32:  # 256-bit key
                self.log_result(
                    "Encryption Key",
                    "PASS",
                    "AES-256 encryption key properly configured",
                )
            elif len(decoded_key) == 16:  # 128-bit key
                self.log_result(
                    "Encryption Key",
                    "WARN",
                    "Using AES-128, consider upgrading to AES-256",
                    "WARNING",
                )
            else:
                self.log_result(
                    "Encryption Key",
                    "FAIL",
                    f"Invalid key length: {len(decoded_key)} bytes",
                    "ERROR",
                )
        except Exception:
            self.log_result(
                "Encryption Key", "FAIL", "Encryption key is not valid base64", "ERROR"
            )

    def check_database_security(self) -> None:
        """Validate database security settings"""
        print("\n🗄️ Checking Database Security...")

        mongo_uri = os.environ.get("MONGO_CONNECTION_STRING", "")

        if not mongo_uri:
            self.log_result(
                "Database Connection",
                "FAIL",
                "MongoDB connection string not configured",
                "ERROR",
            )
            return

        # Check for authentication in connection string
        if "@" in mongo_uri:
            self.log_result(
                "Database Authentication", "PASS", "Database authentication configured"
            )
        else:
            self.log_result(
                "Database Authentication",
                "FAIL",
                "Database authentication not configured",
                "ERROR",
            )

        # Check for SSL/TLS
        if "ssl=true" in mongo_uri.lower() or "tls=true" in mongo_uri.lower():
            self.log_result(
                "Database Encryption", "PASS", "Database connection encryption enabled"
            )
        else:
            self.log_result(
                "Database Encryption",
                "WARN",
                "Consider enabling SSL/TLS for database connection",
                "WARNING",
            )

    def check_file_security(self) -> None:
        """Check file and directory permissions"""
        print("\n📁 Checking File Security...")

        critical_files = [
            ".env",
            "backend/.env",
            "/home/runner/.clackyai/.environments.yaml",
        ]

        for file_path in critical_files:
            if os.path.exists(file_path):
                file_stat = os.stat(file_path)
                permissions = oct(file_stat.st_mode)[-3:]

                if permissions in ["600", "640"]:
                    self.log_result(
                        f"File Permissions {file_path}",
                        "PASS",
                        f"Secure permissions: {permissions}",
                    )
                elif permissions in ["644", "664"]:
                    self.log_result(
                        f"File Permissions {file_path}",
                        "WARN",
                        f"Permissions could be more restrictive: {permissions}",
                        "WARNING",
                    )
                else:
                    self.log_result(
                        f"File Permissions {file_path}",
                        "FAIL",
                        f"Insecure permissions: {permissions}",
                        "ERROR",
                    )
            else:
                self.log_result(
                    f"File Permissions {file_path}",
                    "INFO",
                    "File not found - skipping check",
                )

    def check_cors_configuration(self) -> None:
        """Validate CORS settings"""
        print("\n🌐 Checking CORS Configuration...")

        # Check if wildcard CORS is used (security risk)
        cors_origins = os.environ.get("BACKEND_CORS_ORIGINS", "")

        if "*" in cors_origins:
            self.log_result(
                "CORS Configuration",
                "FAIL",
                "Wildcard CORS origins detected - security risk",
                "ERROR",
            )
        elif cors_origins and "localhost" not in cors_origins:
            self.log_result(
                "CORS Configuration", "PASS", "CORS origins properly restricted"
            )
        elif "localhost" in cors_origins:
            self.log_result(
                "CORS Configuration",
                "WARN",
                "Localhost in CORS origins - remove for production",
                "WARNING",
            )
        else:
            self.log_result(
                "CORS Configuration",
                "INFO",
                "CORS configuration not found - using defaults",
            )

    def check_rate_limiting(self) -> None:
        """Validate rate limiting configuration"""
        print("\n🚦 Checking Rate Limiting...")

        rate_limit = os.environ.get("RATE_LIMIT_REQUESTS", "")

        if rate_limit:
            try:
                limit_value = int(rate_limit)
                if limit_value <= 1000:
                    self.log_result(
                        "Rate Limiting",
                        "PASS",
                        f"Rate limit configured: {limit_value} requests",
                    )
                else:
                    self.log_result(
                        "Rate Limiting",
                        "WARN",
                        f"Rate limit may be too high: {limit_value}",
                        "WARNING",
                    )
            except ValueError:
                self.log_result(
                    "Rate Limiting", "FAIL", "Invalid rate limit value", "ERROR"
                )
        else:
            self.log_result(
                "Rate Limiting", "WARN", "Rate limiting not configured", "WARNING"
            )

    def check_logging_security(self) -> None:
        """Validate logging configuration for security"""
        print("\n📝 Checking Logging Security...")

        log_level = os.environ.get("LOG_LEVEL", "INFO")

        if log_level.upper() in ["INFO", "WARNING", "ERROR"]:
            self.log_result("Log Level", "PASS", f"Appropriate log level: {log_level}")
        elif log_level.upper() == "DEBUG":
            self.log_result(
                "Log Level",
                "WARN",
                "DEBUG logging may expose sensitive information",
                "WARNING",
            )
        else:
            self.log_result("Log Level", "INFO", f"Unknown log level: {log_level}")

    def check_security_headers(self) -> None:
        """Check if security headers are configured"""
        print("\n🛡️ Checking Security Headers Configuration...")

        # This would typically check nginx or server configuration
        # For now, we'll check if the configuration files exist

        security_configs = [
            "nginx.conf",
            "security.conf",
            "/etc/nginx/sites-available/default",
        ]

        found_config = False
        for config_file in security_configs:
            if os.path.exists(config_file):
                found_config = True
                self.log_result(
                    "Security Headers",
                    "INFO",
                    f"Found security configuration: {config_file}",
                )
                break

        if not found_config:
            self.log_result(
                "Security Headers",
                "WARN",
                "No security header configuration found",
                "WARNING",
            )

    def generate_security_report(self) -> Dict:
        """Generate comprehensive security report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "checks_passed": self.checks_passed,
                "checks_failed": self.checks_failed,
                "warnings": self.warnings,
                "total_checks": len(self.results),
            },
            "results": self.results,
            "recommendations": [],
        }

        # Add recommendations based on failures
        if self.checks_failed > 0:
            report["recommendations"].append(
                "❌ Critical security issues found - address before production deployment"
            )

        if self.warnings > 0:
            report["recommendations"].append(
                "⚠️ Security warnings detected - consider addressing for enhanced security"
            )

        if self.checks_failed == 0 and self.warnings == 0:
            report["recommendations"].append(
                "✅ All security checks passed - system appears secure for deployment"
            )

        return report

    def run_all_checks(self) -> None:
        """Run all security validation checks"""
        print("🔒 Life Experience Platform - Security Validation")
        print("=" * 60)

        self.check_environment_variables()
        self.check_jwt_security()
        self.check_encryption_configuration()
        self.check_database_security()
        self.check_file_security()
        self.check_cors_configuration()
        self.check_rate_limiting()
        self.check_logging_security()
        self.check_security_headers()

        print("\n" + "=" * 60)
        print("🔒 Security Validation Summary")
        print("=" * 60)

        report = self.generate_security_report()

        print(f"✅ Checks Passed: {report['summary']['checks_passed']}")
        print(f"❌ Checks Failed: {report['summary']['checks_failed']}")
        print(f"⚠️  Warnings: {report['summary']['warnings']}")
        print(f"📊 Total Checks: {report['summary']['total_checks']}")

        print("\n📋 Recommendations:")
        for rec in report["recommendations"]:
            print(f"  {rec}")

        # Save detailed report
        with open("security_validation_report.json", "w") as f:
            json.dump(report, f, indent=2)

        print("\n📄 Detailed report saved to: security_validation_report.json")

        # Exit with appropriate code
        if report["summary"]["checks_failed"] > 0:
            print("\n🚨 Security validation failed - deployment not recommended")
            sys.exit(1)
        elif report["summary"]["warnings"] > 0:
            print(
                "\n⚠️  Security validation passed with warnings - review recommendations"
            )
            sys.exit(0)
        else:
            print(
                "\n🎉 Security validation passed - system ready for secure deployment"
            )
            sys.exit(0)


def main():
    """Main function to run security validation"""
    validator = SecurityValidator()
    validator.run_all_checks()


if __name__ == "__main__":
    main()
