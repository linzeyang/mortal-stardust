"""
Privacy and GDPR compliance middleware for data protection.
Handles data anonymization, audit logging, and user data rights.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.database import get_database
from ..utils.encryption import encryption_manager

logger = logging.getLogger(__name__)


class PrivacyComplianceMiddleware(BaseHTTPMiddleware):
    """Middleware to handle privacy compliance and data protection."""

    def __init__(self, app, config: Dict[str, Any] = None):
        super().__init__(app)
        self.config = config or {}
        self.audit_enabled = self.config.get("audit_enabled", True)
        self.data_retention_days = self.config.get("data_retention_days", 365)

    async def dispatch(self, request: Request, call_next):
        # Log data access for audit purposes
        if self.audit_enabled:
            await self._log_data_access(request)

        response = await call_next(request)

        # Add privacy headers
        self._add_privacy_headers(response)

        return response

    async def _log_data_access(self, request: Request):
        """Log data access for audit purposes."""
        try:
            db = get_database()
            audit_collection = db.audit_logs

            # Extract user info if available
            user_id = None
            if hasattr(request.state, "user"):
                user_id = str(request.state.user.get("_id"))

            # Create audit log entry
            audit_entry = {
                "timestamp": datetime.utcnow(),
                "userId": user_id,
                "endpoint": str(request.url.path),
                "method": request.method,
                "ipAddress": self._hash_ip_address(request.client.host),
                "userAgent": request.headers.get("user-agent", ""),
                "dataAccessed": self._categorize_data_access(request.url.path),
                "purpose": self._determine_access_purpose(request.url.path),
                "legalBasis": "consent",  # Default, should be configured per endpoint
            }

            await audit_collection.insert_one(audit_entry)

        except Exception as e:
            logger.error(f"Failed to log data access: {e}")

    def _hash_ip_address(self, ip_address: str) -> str:
        """Hash IP address for privacy compliance."""
        return encryption_manager.create_hash(ip_address)

    def _categorize_data_access(self, path: str) -> List[str]:
        """Categorize what type of data is being accessed."""
        categories = []

        if "/experiences" in path:
            categories.extend(["personal_experiences", "emotional_data"])
        if "/profile" in path:
            categories.extend(["personal_info", "contact_info"])
        if "/solutions" in path:
            categories.extend(["ai_analysis", "recommendations"])
        if "/auth" in path:
            categories.extend(["authentication_data"])

        return categories

    def _determine_access_purpose(self, path: str) -> str:
        """Determine the purpose of data access."""
        if "/auth" in path:
            return "authentication"
        elif "/experiences" in path:
            return "experience_management"
        elif "/solutions" in path:
            return "ai_counseling"
        elif "/profile" in path:
            return "profile_management"
        else:
            return "general_service"

    def _add_privacy_headers(self, response: Response):
        """Add privacy-related headers to response."""
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"


class DataAnonymizer:
    """Handles data anonymization for privacy compliance."""

    @staticmethod
    def anonymize_user_data(user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize user data for research/analytics purposes."""
        anonymized = user_data.copy()

        # Remove or hash identifying information
        if "email" in anonymized:
            anonymized["email"] = DataAnonymizer._hash_email(anonymized["email"])

        if "profile" in anonymized:
            profile = anonymized["profile"]
            if "firstName" in profile:
                profile["firstName"] = DataAnonymizer._generate_pseudonym()
            if "lastName" in profile:
                profile["lastName"] = DataAnonymizer._generate_pseudonym()
            if "phoneNumber" in profile:
                del profile["phoneNumber"]
            if "dateOfBirth" in profile:
                # Keep only year for age range analysis
                if profile["dateOfBirth"]:
                    birth_year = profile["dateOfBirth"].year
                    profile["ageRange"] = DataAnonymizer._get_age_range(birth_year)
                del profile["dateOfBirth"]

        # Add anonymization metadata
        anonymized["_anonymized"] = {
            "timestamp": datetime.utcnow(),
            "version": "1.0",
            "method": "pseudonymization",
        }

        return anonymized

    @staticmethod
    def anonymize_experience_data(experience_data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize experience data while preserving analytical value."""
        anonymized = experience_data.copy()

        # Remove user identifying information
        anonymized["userId"] = DataAnonymizer._generate_pseudonym()

        # Anonymize content while preserving emotional and categorical data
        if "content" in anonymized:
            content = anonymized["content"]
            if "text" in content:
                content["text"] = DataAnonymizer._anonymize_text_content(
                    content["text"]
                )

        # Keep metadata but remove location specifics
        if "metadata" in anonymized:
            metadata = anonymized["metadata"]
            if "location" in metadata and metadata["location"]:
                # Keep only general region/country
                metadata["location"] = DataAnonymizer._generalize_location(
                    metadata["location"]
                )

        return anonymized

    @staticmethod
    def _hash_email(email: str) -> str:
        """Hash email for anonymization."""
        return encryption_manager.create_hash(email)

    @staticmethod
    def _generate_pseudonym() -> str:
        """Generate a consistent pseudonym."""
        import random
        import string

        return "".join(random.choices(string.ascii_letters, k=8))

    @staticmethod
    def _get_age_range(birth_year: int) -> str:
        """Convert birth year to age range."""
        current_year = datetime.now().year
        age = current_year - birth_year

        if age < 18:
            return "under-18"
        elif age < 25:
            return "18-24"
        elif age < 35:
            return "25-34"
        elif age < 45:
            return "35-44"
        elif age < 55:
            return "45-54"
        elif age < 65:
            return "55-64"
        else:
            return "65-plus"

    @staticmethod
    def _anonymize_text_content(text: str) -> str:
        """Anonymize text content by removing personal identifiers."""
        # This is a simplified version - in production, use NLP libraries
        # to identify and replace personal information
        import re

        # Remove email addresses
        text = re.sub(r"\S+@\S+", "[EMAIL]", text)

        # Remove phone numbers
        text = re.sub(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b", "[PHONE]", text)

        # Remove social security numbers
        text = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "[SSN]", text)

        # This should be expanded with more sophisticated PII detection
        return text

    @staticmethod
    def _generalize_location(location: str) -> str:
        """Generalize location to protect privacy."""
        # Simple implementation - in production, use geocoding services
        if len(location) > 20:
            # Return only first part (likely city/region)
            parts = location.split(",")
            return parts[0].strip() if parts else location[:20]
        return location


class DataRetentionManager:
    """Manages data retention and automatic deletion."""

    def __init__(self, retention_days: int = 365):
        self.retention_days = retention_days

    async def cleanup_expired_data(self):
        """Clean up data that has exceeded retention period."""
        try:
            db = get_database()
            cutoff_date = datetime.utcnow() - timedelta(days=self.retention_days)

            # Clean up audit logs
            result = await db.audit_logs.delete_many(
                {"timestamp": {"$lt": cutoff_date}}
            )
            logger.info(f"Deleted {result.deleted_count} expired audit log entries")

            # Clean up temporary data (e.g., session data, temporary files)
            # Add more cleanup logic as needed

        except Exception as e:
            logger.error(f"Data retention cleanup failed: {e}")


class GDPRComplianceService:
    """Service to handle GDPR user rights."""

    @staticmethod
    async def export_user_data(user_id: str) -> Dict[str, Any]:
        """Export all user data for GDPR compliance."""
        try:
            db = get_database()

            # Collect all user data
            user_data = {}

            # User profile
            user = await db.users.find_one({"_id": user_id})
            if user:
                user_data["profile"] = dict(user)

            # Experiences
            experiences = []
            async for exp in db.experiences.find({"userId": user_id}):
                experiences.append(dict(exp))
            user_data["experiences"] = experiences

            # Solutions
            solutions = []
            async for sol in db.solutions.find({"userId": user_id}):
                solutions.append(dict(sol))
            user_data["solutions"] = solutions

            # Audit logs (last 30 days only for privacy)
            recent_cutoff = datetime.utcnow() - timedelta(days=30)
            audit_logs = []
            async for log in db.audit_logs.find(
                {"userId": user_id, "timestamp": {"$gte": recent_cutoff}}
            ):
                audit_logs.append(dict(log))
            user_data["recent_activity"] = audit_logs

            # Add export metadata
            user_data["export_info"] = {
                "generated_at": datetime.utcnow(),
                "data_format": "json",
                "retention_period_days": 365,
                "user_rights": [
                    "right_to_access",
                    "right_to_rectification",
                    "right_to_erasure",
                    "right_to_portability",
                    "right_to_restrict_processing",
                ],
            }

            return user_data

        except Exception as e:
            logger.error(f"User data export failed: {e}")
            raise

    @staticmethod
    async def delete_user_data(user_id: str, verification_token: str = None) -> bool:
        """Delete all user data (right to be forgotten)."""
        try:
            db = get_database()

            # In production, add verification token check

            # Delete user data in correct order (foreign key constraints)
            await db.solutions.delete_many({"userId": user_id})
            await db.experiences.delete_many({"userId": user_id})
            await db.audit_logs.delete_many({"userId": user_id})
            await db.users.delete_one({"_id": user_id})

            logger.info(f"Successfully deleted all data for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"User data deletion failed: {e}")
            return False


# Export instances for use in the application
data_anonymizer = DataAnonymizer()
data_retention_manager = DataRetentionManager()
gdpr_compliance_service = GDPRComplianceService()
