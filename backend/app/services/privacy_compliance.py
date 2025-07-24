"""
Privacy and Compliance Service
Handles GDPR compliance, data anonymization, and privacy features
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING
from pymongo.database import Database

from ..utils.encryption import encryption_manager

logger = logging.getLogger(__name__)


class PrivacyComplianceService:
    """Service for handling privacy compliance and GDPR requirements"""

    def __init__(self, db: Database):
        self.db = db
        self.encryption_manager = encryption_manager
        self.collections = {
            "users": self.db.users,
            "experiences": self.db.experiences,
            "solutions": self.db.solutions,
            "media_files": self.db.media_files,
            "experience_summaries": self.db.experience_summaries,
            "solution_analytics": self.db.solution_analytics,
            "consent_records": self.db.consent_records,
            "data_requests": self.db.data_requests,
            "anonymization_log": self.db.anonymization_log,
            "audit_logs": self.db.audit_logs,
        }
        self._ensure_privacy_indexes()

    def _ensure_privacy_indexes(self):
        """Create indexes for privacy and compliance collections"""
        try:
            # Consent records indexes
            self.collections["consent_records"].create_index(
                [("user_id", ASCENDING), ("created_at", DESCENDING)]
            )
            self.collections["consent_records"].create_index(
                [("consent_type", ASCENDING), ("status", ASCENDING)]
            )

            # Data requests indexes
            self.collections["data_requests"].create_index(
                [
                    ("user_id", ASCENDING),
                    ("request_type", ASCENDING),
                    ("status", ASCENDING),
                ]
            )
            self.collections["data_requests"].create_index([("created_at", DESCENDING)])

            # Anonymization log indexes
            self.collections["anonymization_log"].create_index(
                [("user_id", ASCENDING), ("anonymized_at", DESCENDING)]
            )

            # Audit logs indexes
            self.collections["audit_logs"].create_index(
                [("user_id", ASCENDING), ("timestamp", DESCENDING)]
            )
            self.collections["audit_logs"].create_index(
                [("action_type", ASCENDING), ("timestamp", DESCENDING)]
            )

            logger.info("✅ Privacy compliance indexes created successfully")
        except Exception as e:
            logger.error(f"⚠️ Error creating privacy indexes: {str(e)}")

    async def record_consent(
        self,
        user_id: str,
        consent_type: str,
        granted: bool,
        purpose: str,
        legal_basis: str = "consent",
        metadata: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Record user consent for data processing"""
        try:
            consent_record = {
                "consent_id": str(ObjectId()),
                "user_id": user_id,
                "consent_type": consent_type,  # data_processing, analytics, marketing, etc.
                "status": "granted" if granted else "withdrawn",
                "purpose": purpose,
                "legal_basis": legal_basis,
                "granted_at": datetime.utcnow() if granted else None,
                "withdrawn_at": None if granted else datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "metadata": metadata or {},
                "ip_address": metadata.get("ip_address") if metadata else None,
                "user_agent": metadata.get("user_agent") if metadata else None,
            }

            # Insert consent record
            result = await self.collections["consent_records"].insert_one(
                consent_record
            )

            # Log the consent action
            await self._log_audit_event(
                user_id=user_id,
                action_type="consent_recorded",
                details={
                    "consent_type": consent_type,
                    "status": consent_record["status"],
                    "purpose": purpose,
                },
            )

            logger.info(
                f"✅ Consent recorded for user {user_id}: {consent_type} - {consent_record['status']}"
            )
            return {
                "consent_id": consent_record["consent_id"],
                "status": "success",
                "message": "Consent recorded successfully",
            }

        except Exception as e:
            logger.error(f"❌ Error recording consent for user {user_id}: {str(e)}")
            raise Exception(f"Failed to record consent: {str(e)}")

    async def get_user_consents(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all consent records for a user"""
        try:
            consents = (
                await self.collections["consent_records"]
                .find({"user_id": user_id})
                .sort("created_at", DESCENDING)
                .to_list(length=None)
            )

            # Group by consent type and get latest status
            consent_summary = {}
            for consent in consents:
                consent_type = consent["consent_type"]
                if consent_type not in consent_summary:
                    consent_summary[consent_type] = consent
                elif (
                    consent["created_at"] > consent_summary[consent_type]["created_at"]
                ):
                    consent_summary[consent_type] = consent

            return {
                "current_consents": list(consent_summary.values()),
                "consent_history": consents,
                "total_records": len(consents),
            }

        except Exception as e:
            logger.error(f"❌ Error getting consents for user {user_id}: {str(e)}")
            raise Exception(f"Failed to retrieve consent records: {str(e)}")

    async def export_user_data(self, user_id: str, request_id: str) -> Dict[str, Any]:
        """Export all user data for GDPR data portability right"""
        try:
            logger.info(f"🔄 Starting data export for user {user_id}")

            export_data = {
                "export_info": {
                    "user_id": user_id,
                    "export_date": datetime.utcnow().isoformat(),
                    "request_id": request_id,
                    "format_version": "1.0",
                },
                "user_profile": {},
                "experiences": [],
                "solutions": [],
                "media_files": [],
                "summaries": [],
                "analytics": [],
                "consents": [],
                "audit_trail": [],
            }

            # Export user profile
            user = await self.collections["users"].find_one({"_id": ObjectId(user_id)})
            if user:
                # Decrypt sensitive fields for export
                user_data = dict(user)
                user_data["_id"] = str(user_data["_id"])

                # Decrypt encrypted fields
                encrypted_fields = ["email", "firstName", "lastName", "phoneNumber"]
                for field in encrypted_fields:
                    if field in user_data and user_data[field]:
                        try:
                            user_data[field] = self.encryption_manager.decrypt_string(
                                user_data[field]
                            )
                        except:
                            pass  # Keep encrypted if decryption fails

                export_data["user_profile"] = user_data

            # Export experiences
            experiences = (
                await self.collections["experiences"]
                .find({"user_id": user_id})
                .to_list(length=None)
            )

            for exp in experiences:
                exp_data = dict(exp)
                exp_data["_id"] = str(exp_data["_id"])

                # Decrypt experience content
                if "content" in exp_data:
                    try:
                        decrypted_content = self.encryption_manager.decrypt_object(
                            exp_data["content"]
                        )
                        exp_data["content"] = decrypted_content
                    except:
                        pass

                export_data["experiences"].append(exp_data)

            # Export solutions
            solutions = (
                await self.collections["solutions"]
                .find({"user_id": user_id})
                .to_list(length=None)
            )

            for sol in solutions:
                sol_data = dict(sol)
                sol_data["_id"] = str(sol_data["_id"])

                # Decrypt solution content
                try:
                    if "content" in sol_data:
                        sol_data["content"] = self.encryption_manager.decrypt_string(
                            sol_data["content"]
                        )
                except:
                    pass

                export_data["solutions"].append(sol_data)

            # Export media files metadata
            media_files = (
                await self.collections["media_files"]
                .find({"user_id": user_id})
                .to_list(length=None)
            )

            for media in media_files:
                media_data = dict(media)
                media_data["_id"] = str(media_data["_id"])
                export_data["media_files"].append(media_data)

            # Export summaries
            summaries = (
                await self.collections["experience_summaries"]
                .find({"user_id": user_id})
                .to_list(length=None)
            )

            for summary in summaries:
                summary_data = dict(summary)
                summary_data["_id"] = str(summary_data["_id"])
                export_data["summaries"].append(summary_data)

            # Export analytics
            analytics = (
                await self.collections["solution_analytics"]
                .find({"user_id": user_id})
                .to_list(length=None)
            )

            for analytic in analytics:
                analytic_data = dict(analytic)
                analytic_data["_id"] = str(analytic_data["_id"])
                export_data["analytics"].append(analytic_data)

            # Export consent records
            consents = (
                await self.collections["consent_records"]
                .find({"user_id": user_id})
                .to_list(length=None)
            )

            for consent in consents:
                consent_data = dict(consent)
                export_data["consents"].append(consent_data)

            # Export audit trail (last 90 days)
            ninety_days_ago = datetime.utcnow() - timedelta(days=90)
            audit_logs = (
                await self.collections["audit_logs"]
                .find({"user_id": user_id, "timestamp": {"$gte": ninety_days_ago}})
                .to_list(length=None)
            )

            for log in audit_logs:
                log_data = dict(log)
                log_data["_id"] = str(log_data["_id"])
                export_data["audit_trail"].append(log_data)

            # Update export request status
            await self.collections["data_requests"].update_one(
                {"request_id": request_id},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.utcnow(),
                        "export_size": len(json.dumps(export_data)),
                    }
                },
            )

            logger.info(f"✅ Data export completed for user {user_id}")
            return export_data

        except Exception as e:
            logger.error(f"❌ Error exporting data for user {user_id}: {str(e)}")
            await self.collections["data_requests"].update_one(
                {"request_id": request_id},
                {
                    "$set": {
                        "status": "failed",
                        "error_message": str(e),
                        "failed_at": datetime.utcnow(),
                    }
                },
            )
            raise Exception(f"Failed to export user data: {str(e)}")

    async def anonymize_user_data(
        self, user_id: str, request_id: str
    ) -> Dict[str, Any]:
        """Anonymize user data for statistical purposes while preserving research value"""
        try:
            logger.info(f"🔄 Starting data anonymization for user {user_id}")

            anonymization_map = {
                "original_user_id": user_id,
                "anonymous_id": self._generate_anonymous_id(user_id),
                "anonymized_at": datetime.utcnow(),
                "request_id": request_id,
            }

            # Anonymize experiences
            experiences = (
                await self.collections["experiences"]
                .find({"user_id": user_id})
                .to_list(length=None)
            )

            anonymized_experiences = []
            for exp in experiences:
                anonymized_exp = await self._anonymize_experience(
                    exp, anonymization_map
                )
                anonymized_experiences.append(anonymized_exp)

            # Anonymize solutions
            solutions = (
                await self.collections["solutions"]
                .find({"user_id": user_id})
                .to_list(length=None)
            )

            anonymized_solutions = []
            for sol in solutions:
                anonymized_sol = await self._anonymize_solution(sol, anonymization_map)
                anonymized_solutions.append(anonymized_sol)

            # Store anonymized data in separate collection
            anonymized_data = {
                "anonymization_id": str(ObjectId()),
                "anonymous_user_id": anonymization_map["anonymous_id"],
                "anonymized_at": anonymization_map["anonymized_at"],
                "data": {
                    "experiences": anonymized_experiences,
                    "solutions": anonymized_solutions,
                    "demographic_info": await self._anonymize_demographics(user_id),
                },
                "metadata": {
                    "total_experiences": len(anonymized_experiences),
                    "total_solutions": len(anonymized_solutions),
                    "anonymization_method": "gdpr_compliant_v1.0",
                },
            }

            await self.db.anonymized_data.insert_one(anonymized_data)

            # Log anonymization
            anonymization_log = {
                "log_id": str(ObjectId()),
                "user_id": user_id,
                "anonymous_id": anonymization_map["anonymous_id"],
                "anonymized_at": datetime.utcnow(),
                "request_id": request_id,
                "data_types_anonymized": ["experiences", "solutions", "demographics"],
                "records_processed": len(anonymized_experiences)
                + len(anonymized_solutions),
            }

            await self.collections["anonymization_log"].insert_one(anonymization_log)

            logger.info(f"✅ Data anonymization completed for user {user_id}")
            return {
                "status": "success",
                "anonymous_id": anonymization_map["anonymous_id"],
                "records_processed": anonymization_log["records_processed"],
                "anonymized_at": anonymization_map["anonymized_at"].isoformat(),
            }

        except Exception as e:
            logger.error(f"❌ Error anonymizing data for user {user_id}: {str(e)}")
            raise Exception(f"Failed to anonymize user data: {str(e)}")

    async def delete_user_data(
        self, user_id: str, request_id: str, retention_policy: str = "complete"
    ) -> Dict[str, Any]:
        """Delete user data according to GDPR right to erasure"""
        try:
            logger.info(
                f"🔄 Starting data deletion for user {user_id} with policy: {retention_policy}"
            )

            deletion_summary = {
                "user_id": user_id,
                "request_id": request_id,
                "deletion_policy": retention_policy,
                "deleted_at": datetime.utcnow(),
                "collections_affected": [],
                "records_deleted": 0,
            }

            if retention_policy == "complete":
                # Complete deletion - remove all user data
                collections_to_delete = [
                    "experiences",
                    "solutions",
                    "media_files",
                    "experience_summaries",
                    "solution_analytics",
                ]

                for collection_name in collections_to_delete:
                    collection = self.collections[collection_name]
                    result = await collection.delete_many({"user_id": user_id})

                    if result.deleted_count > 0:
                        deletion_summary["collections_affected"].append(collection_name)
                        deletion_summary["records_deleted"] += result.deleted_count

                # Delete user profile (keep for audit trail with anonymized data)
                user_result = await self.collections["users"].delete_one(
                    {"_id": ObjectId(user_id)}
                )
                if user_result.deleted_count > 0:
                    deletion_summary["collections_affected"].append("users")
                    deletion_summary["records_deleted"] += user_result.deleted_count

            elif retention_policy == "anonymize_retain":
                # Anonymize data but retain for research
                anonymization_result = await self.anonymize_user_data(
                    user_id, request_id
                )

                # Then delete original data
                collections_to_delete = ["experiences", "solutions", "media_files"]
                for collection_name in collections_to_delete:
                    collection = self.collections[collection_name]
                    result = await collection.delete_many({"user_id": user_id})
                    deletion_summary["records_deleted"] += result.deleted_count

                deletion_summary["anonymization_id"] = anonymization_result.get(
                    "anonymous_id"
                )

            # Update deletion request status
            await self.collections["data_requests"].update_one(
                {"request_id": request_id},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.utcnow(),
                        "deletion_summary": deletion_summary,
                    }
                },
            )

            # Log deletion event
            await self._log_audit_event(
                user_id=user_id, action_type="data_deletion", details=deletion_summary
            )

            logger.info(f"✅ Data deletion completed for user {user_id}")
            return deletion_summary

        except Exception as e:
            logger.error(f"❌ Error deleting data for user {user_id}: {str(e)}")
            raise Exception(f"Failed to delete user data: {str(e)}")

    async def create_data_request(
        self, user_id: str, request_type: str, details: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Create a data processing request (export, deletion, anonymization)"""
        try:
            request_id = str(ObjectId())

            data_request = {
                "request_id": request_id,
                "user_id": user_id,
                "request_type": request_type,  # export, delete, anonymize, rectify
                "status": "pending",
                "created_at": datetime.utcnow(),
                "details": details or {},
                "estimated_completion": datetime.utcnow()
                + timedelta(days=30),  # GDPR 30-day limit
                "priority": "high" if request_type == "delete" else "medium",
            }

            await self.collections["data_requests"].insert_one(data_request)

            await self._log_audit_event(
                user_id=user_id,
                action_type="data_request_created",
                details={"request_id": request_id, "request_type": request_type},
            )

            logger.info(f"✅ Data request created: {request_id} for user {user_id}")
            return {
                "request_id": request_id,
                "status": "pending",
                "estimated_completion": data_request[
                    "estimated_completion"
                ].isoformat(),
            }

        except Exception as e:
            logger.error(f"❌ Error creating data request for user {user_id}: {str(e)}")
            raise Exception(f"Failed to create data request: {str(e)}")

    async def get_privacy_dashboard(self, user_id: str) -> Dict[str, Any]:
        """Get privacy dashboard data for user"""
        try:
            # Get current consents
            consents_data = await self.get_user_consents(user_id)

            # Get data requests
            data_requests = (
                await self.collections["data_requests"]
                .find({"user_id": user_id})
                .sort("created_at", DESCENDING)
                .limit(10)
                .to_list(length=None)
            )

            # Get data usage statistics
            data_stats = await self._get_data_usage_stats(user_id)

            # Get retention information
            retention_info = await self._get_data_retention_info(user_id)

            dashboard = {
                "user_id": user_id,
                "generated_at": datetime.utcnow().isoformat(),
                "consents": consents_data,
                "data_requests": [
                    {
                        "request_id": req["request_id"],
                        "request_type": req["request_type"],
                        "status": req["status"],
                        "created_at": req["created_at"].isoformat(),
                        "estimated_completion": (
                            req.get("estimated_completion", "").isoformat()
                            if req.get("estimated_completion")
                            else None
                        ),
                    }
                    for req in data_requests
                ],
                "data_usage": data_stats,
                "retention_policy": retention_info,
                "privacy_rights": {
                    "access": "Export your personal data",
                    "rectification": "Correct your personal data",
                    "erasure": "Delete your personal data",
                    "portability": "Transfer your data to another service",
                    "object": "Object to processing of your data",
                    "restrict": "Restrict processing of your data",
                },
            }

            return dashboard

        except Exception as e:
            logger.error(
                f"❌ Error generating privacy dashboard for user {user_id}: {str(e)}"
            )
            raise Exception(f"Failed to generate privacy dashboard: {str(e)}")

    def _generate_anonymous_id(self, user_id: str) -> str:
        """Generate a consistent anonymous ID for a user"""
        # Use SHA-256 hash of user_id with salt for consistent anonymization
        salt = "privacy_compliant_anonymization_2024"
        hash_input = f"{user_id}_{salt}".encode()
        return f"anon_{hashlib.sha256(hash_input).hexdigest()[:16]}"

    async def _anonymize_experience(
        self, experience: Dict, anonymization_map: Dict
    ) -> Dict:
        """Anonymize a single experience record"""
        anonymized = {
            "anonymous_user_id": anonymization_map["anonymous_id"],
            "experience_type": experience.get("experience_type"),
            "role": experience.get("role"),
            "stage": experience.get("stage"),
            "created_at": experience.get("created_at"),
            "content_type": (
                "text" if experience.get("content", {}).get("text") else "multimodal"
            ),
            "has_media": bool(experience.get("content", {}).get("media_files")),
            "emotional_indicators": self._extract_emotional_indicators(experience),
            "anonymized_at": anonymization_map["anonymized_at"],
        }

        # Remove all personally identifiable content
        # Keep only statistical and research-relevant data
        return anonymized

    async def _anonymize_solution(
        self, solution: Dict, anonymization_map: Dict
    ) -> Dict:
        """Anonymize a single solution record"""
        anonymized = {
            "anonymous_user_id": anonymization_map["anonymous_id"],
            "stage": solution.get("stage"),
            "rating": solution.get("rating"),
            "effectiveness_score": solution.get("effectiveness_score"),
            "solution_type": solution.get("solution_type"),
            "created_at": solution.get("created_at"),
            "response_time_ms": solution.get("response_time_ms"),
            "anonymized_at": anonymization_map["anonymized_at"],
        }

        return anonymized

    async def _anonymize_demographics(self, user_id: str) -> Dict:
        """Extract anonymized demographic information"""
        user = await self.collections["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            return {}

        # Extract only non-identifying demographic data
        demographics = {
            "role": user.get("role"),
            "account_created": user.get("createdAt"),
            "language_preference": user.get("preferences", {}).get("language"),
            "age_range": (
                self._get_age_range(user.get("dateOfBirth"))
                if user.get("dateOfBirth")
                else None
            ),
        }

        return demographics

    def _get_age_range(self, date_of_birth: str) -> str:
        """Convert date of birth to age range for anonymization"""
        try:
            if isinstance(date_of_birth, str):
                dob = datetime.fromisoformat(date_of_birth.replace("Z", "+00:00"))
            else:
                dob = date_of_birth

            age = (datetime.utcnow() - dob).days // 365

            if age < 18:
                return "under_18"
            elif age < 25:
                return "18_24"
            elif age < 35:
                return "25_34"
            elif age < 45:
                return "35_44"
            elif age < 55:
                return "45_54"
            elif age < 65:
                return "55_64"
            else:
                return "65_plus"
        except:
            return "unknown"

    def _extract_emotional_indicators(self, experience: Dict) -> List[str]:
        """Extract emotional indicators for research while removing identifying content"""
        indicators = []
        content = experience.get("content", {})

        if isinstance(content, dict):
            text_content = content.get("text", "")
            if text_content and isinstance(text_content, str):
                # Basic emotional indicator extraction (non-identifying)
                emotional_keywords = {
                    "positive": ["happy", "excited", "confident", "proud", "satisfied"],
                    "negative": ["anxious", "worried", "frustrated", "sad", "stressed"],
                    "neutral": ["uncertain", "curious", "contemplating", "planning"],
                }

                text_lower = text_content.lower()
                for category, keywords in emotional_keywords.items():
                    if any(keyword in text_lower for keyword in keywords):
                        indicators.append(category)

        return list(set(indicators))  # Remove duplicates

    async def _get_data_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get data usage statistics for user"""
        try:
            stats = {}

            # Count records in each collection
            for collection_name, collection in self.collections.items():
                if collection_name in [
                    "users",
                    "consent_records",
                    "data_requests",
                    "audit_logs",
                ]:
                    continue

                count = await collection.count_documents({"user_id": user_id})
                stats[collection_name] = count

            # Calculate total storage estimate
            total_records = sum(stats.values())
            estimated_storage_mb = total_records * 0.05  # Rough estimate

            stats["summary"] = {
                "total_records": total_records,
                "estimated_storage_mb": round(estimated_storage_mb, 2),
                "last_updated": datetime.utcnow().isoformat(),
            }

            return stats

        except Exception as e:
            logger.error(f"Error getting data usage stats for user {user_id}: {str(e)}")
            return {}

    async def _get_data_retention_info(self, user_id: str) -> Dict[str, Any]:
        """Get data retention policy information"""
        try:
            user = await self.collections["users"].find_one({"_id": ObjectId(user_id)})
            if not user:
                return {}

            account_created = user.get("createdAt", datetime.utcnow())
            if isinstance(account_created, str):
                account_created = datetime.fromisoformat(
                    account_created.replace("Z", "+00:00")
                )

            # Default retention periods
            retention_periods = {
                "user_profile": "7 years after account deletion",
                "experiences": "5 years or until deletion request",
                "solutions": "3 years for anonymized analytics",
                "media_files": "2 years or until deletion request",
                "audit_logs": "7 years for compliance",
            }

            retention_info = {
                "account_age_days": (datetime.utcnow() - account_created).days,
                "retention_periods": retention_periods,
                "next_review_date": (
                    datetime.utcnow() + timedelta(days=365)
                ).isoformat(),
            }

            return retention_info

        except Exception as e:
            logger.error(f"Error getting retention info for user {user_id}: {str(e)}")
            return {}

    async def _log_audit_event(self, user_id: str, action_type: str, details: Dict):
        """Log audit event for compliance tracking"""
        try:
            audit_log = {
                "log_id": str(ObjectId()),
                "user_id": user_id,
                "action_type": action_type,
                "timestamp": datetime.utcnow(),
                "details": details,
                "source": "privacy_compliance_service",
            }

            await self.collections["audit_logs"].insert_one(audit_log)

        except Exception as e:
            logger.error(f"Failed to log audit event: {str(e)}")
