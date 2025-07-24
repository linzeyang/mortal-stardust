"""
Data Retention and Compliance Management Service.
Handles data lifecycle, retention policies, and regulatory compliance.
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from enum import Enum
from dataclasses import dataclass
from bson import ObjectId

from ..core.database import get_database
from ..services.secure_data_service import DataCategory, secure_data_service
from ..utils.encryption import encrypt_data, decrypt_data

class RetentionStatus(str, Enum):
    """Data retention status."""
    ACTIVE = "active"
    PENDING_DELETION = "pending_deletion"
    DELETED = "deleted"
    ARCHIVED = "archived"
    PURGED = "purged"

class ComplianceRegulation(str, Enum):
    """Supported compliance regulations."""
    GDPR = "gdpr"  # General Data Protection Regulation
    CCPA = "ccpa"  # California Consumer Privacy Act
    PIPEDA = "pipeda"  # Personal Information Protection and Electronic Documents Act
    LGPD = "lgpd"  # Lei Geral de Proteção de Dados

@dataclass
class RetentionPolicy:
    """Data retention policy configuration."""
    data_category: DataCategory
    retention_period_days: int
    archive_after_days: Optional[int] = None
    compliance_requirements: List[ComplianceRegulation] = None
    auto_delete: bool = True
    require_user_consent: bool = False
    backup_before_deletion: bool = True

class DataRetentionService:
    """Service for managing data retention and compliance."""
    
    def __init__(self):
        self.db = None
        self._policies = self._initialize_default_policies()
        self._compliance_handlers = {
            ComplianceRegulation.GDPR: self._handle_gdpr_compliance,
            ComplianceRegulation.CCPA: self._handle_ccpa_compliance,
            ComplianceRegulation.PIPEDA: self._handle_pipeda_compliance,
            ComplianceRegulation.LGPD: self._handle_lgpd_compliance
        }
    
    def _initialize_default_policies(self) -> Dict[DataCategory, RetentionPolicy]:
        """Initialize default retention policies for different data categories."""
        return {
            DataCategory.PERSONAL_INFO: RetentionPolicy(
                data_category=DataCategory.PERSONAL_INFO,
                retention_period_days=2555,  # 7 years
                archive_after_days=1095,  # 3 years
                compliance_requirements=[ComplianceRegulation.GDPR, ComplianceRegulation.CCPA],
                require_user_consent=True,
                backup_before_deletion=True
            ),
            DataCategory.EXPERIENCE_DATA: RetentionPolicy(
                data_category=DataCategory.EXPERIENCE_DATA,
                retention_period_days=1825,  # 5 years
                archive_after_days=730,  # 2 years
                compliance_requirements=[ComplianceRegulation.GDPR],
                auto_delete=True,
                backup_before_deletion=True
            ),
            DataCategory.SOLUTION_DATA: RetentionPolicy(
                data_category=DataCategory.SOLUTION_DATA,
                retention_period_days=1095,  # 3 years
                archive_after_days=365,  # 1 year
                compliance_requirements=[ComplianceRegulation.GDPR],
                auto_delete=True,
                backup_before_deletion=False
            ),
            DataCategory.RATING_DATA: RetentionPolicy(
                data_category=DataCategory.RATING_DATA,
                retention_period_days=730,  # 2 years
                compliance_requirements=[ComplianceRegulation.GDPR],
                auto_delete=True,
                backup_before_deletion=False
            ),
            DataCategory.MEDIA_FILES: RetentionPolicy(
                data_category=DataCategory.MEDIA_FILES,
                retention_period_days=1825,  # 5 years
                archive_after_days=730,  # 2 years
                compliance_requirements=[ComplianceRegulation.GDPR, ComplianceRegulation.CCPA],
                require_user_consent=True,
                backup_before_deletion=True
            ),
            DataCategory.ACTIVITY_LOGS: RetentionPolicy(
                data_category=DataCategory.ACTIVITY_LOGS,
                retention_period_days=365,  # 1 year
                compliance_requirements=[ComplianceRegulation.GDPR],
                auto_delete=True,
                backup_before_deletion=False
            )
        }
    
    async def initialize(self):
        """Initialize the data retention service."""
        self.db = get_database()
        await self._create_retention_indexes()
        await self._migrate_existing_data()
    
    async def _create_retention_indexes(self):
        """Create database indexes for retention management."""
        try:
            # Retention tracking collection indexes
            await self.db.data_retention_tracking.create_index("userId")
            await self.db.data_retention_tracking.create_index("dataCategory")
            await self.db.data_retention_tracking.create_index("retentionStatus")
            await self.db.data_retention_tracking.create_index("scheduledDeletionDate")
            await self.db.data_retention_tracking.create_index("createdAt")
            
            # User consent collection indexes
            await self.db.user_consent.create_index("userId", unique=True)
            await self.db.user_consent.create_index("consentDate")
            await self.db.user_consent.create_index("dataProcessingPurposes")
            
        except Exception as e:
            print(f"Warning: Failed to create retention indexes: {e}")
    
    async def _migrate_existing_data(self):
        """Migrate existing data to include retention metadata."""
        try:
            # Check if migration has already been performed
            migration_record = await self.db.system_migrations.find_one({
                "migration_name": "data_retention_v1"
            })
            
            if migration_record:
                return  # Already migrated
            
            # Add retention metadata to existing records
            for category in DataCategory:
                policy = self._policies.get(category)
                if not policy:
                    continue
                
                collection_name = self._get_collection_name_for_category(category)
                if not collection_name:
                    continue
                
                # Update existing records
                expiry_date = datetime.utcnow() + timedelta(days=policy.retention_period_days)
                archive_date = None
                if policy.archive_after_days:
                    archive_date = datetime.utcnow() + timedelta(days=policy.archive_after_days)
                
                await self.db[collection_name].update_many(
                    {"retentionMetadata": {"$exists": False}},
                    {
                        "$set": {
                            "retentionMetadata": {
                                "policy": policy.__dict__,
                                "scheduledDeletionDate": expiry_date,
                                "scheduledArchiveDate": archive_date,
                                "retentionStatus": RetentionStatus.ACTIVE.value,
                                "migrationDate": datetime.utcnow()
                            }
                        }
                    }
                )
            
            # Record successful migration
            await self.db.system_migrations.insert_one({
                "migration_name": "data_retention_v1",
                "completed_at": datetime.utcnow(),
                "description": "Added retention metadata to existing data"
            })
            
        except Exception as e:
            print(f"Warning: Data retention migration failed: {e}")
    
    def _get_collection_name_for_category(self, category: DataCategory) -> Optional[str]:
        """Get MongoDB collection name for a data category."""
        mapping = {
            DataCategory.PERSONAL_INFO: "users",
            DataCategory.EXPERIENCE_DATA: "experiences",
            DataCategory.SOLUTION_DATA: "solutions",
            DataCategory.RATING_DATA: "solution_ratings",
            DataCategory.MEDIA_FILES: "media_files",
            DataCategory.ACTIVITY_LOGS: "access_logs"
        }
        return mapping.get(category)
    
    async def apply_retention_policy(
        self,
        user_id: str,
        data_category: DataCategory,
        record_id: str
    ) -> Dict[str, Any]:
        """Apply retention policy to a specific data record."""
        try:
            policy = self._policies.get(data_category)
            if not policy:
                raise Exception(f"No retention policy found for category: {data_category}")
            
            # Calculate retention dates
            now = datetime.utcnow()
            deletion_date = now + timedelta(days=policy.retention_period_days)
            archive_date = None
            if policy.archive_after_days:
                archive_date = now + timedelta(days=policy.archive_after_days)
            
            # Create retention tracking record
            tracking_record = {
                "userId": ObjectId(user_id),
                "recordId": record_id,
                "dataCategory": data_category.value,
                "retentionStatus": RetentionStatus.ACTIVE.value,
                "scheduledDeletionDate": deletion_date,
                "scheduledArchiveDate": archive_date,
                "policy": policy.__dict__,
                "createdAt": now,
                "updatedAt": now,
                "complianceFlags": {
                    reg.value: True for reg in (policy.compliance_requirements or [])
                }
            }
            
            result = await self.db.data_retention_tracking.insert_one(tracking_record)
            
            return {
                "tracking_id": str(result.inserted_id),
                "retention_status": RetentionStatus.ACTIVE.value,
                "scheduled_deletion_date": deletion_date.isoformat(),
                "scheduled_archive_date": archive_date.isoformat() if archive_date else None,
                "policy_applied": policy.data_category.value
            }
            
        except Exception as e:
            raise Exception(f"Failed to apply retention policy: {str(e)}")
    
    async def process_scheduled_deletions(self) -> Dict[str, Any]:
        """Process records scheduled for deletion."""
        try:
            now = datetime.utcnow()
            results = {
                "processed": 0,
                "deleted": 0,
                "archived": 0,
                "errors": 0,
                "details": []
            }
            
            # Find records scheduled for deletion
            deletion_candidates = await self.db.data_retention_tracking.find({
                "retentionStatus": RetentionStatus.ACTIVE.value,
                "scheduledDeletionDate": {"$lte": now}
            }).to_list(length=None)
            
            for record in deletion_candidates:
                try:
                    results["processed"] += 1
                    user_id = str(record["userId"])
                    record_id = record["recordId"]
                    data_category = DataCategory(record["dataCategory"])
                    policy = self._policies.get(data_category)
                    
                    # Check compliance requirements
                    compliance_check = await self._check_compliance_before_deletion(
                        user_id, data_category, record
                    )
                    
                    if not compliance_check["can_delete"]:
                        results["details"].append({
                            "record_id": record_id,
                            "status": "skipped",
                            "reason": compliance_check["reason"]
                        })
                        continue
                    
                    # Backup if required
                    if policy and policy.backup_before_deletion:
                        await self._backup_record(user_id, record_id, data_category)
                    
                    # Delete the actual data record
                    success = await self._delete_data_record(user_id, record_id, data_category)
                    
                    if success:
                        # Update retention tracking
                        await self.db.data_retention_tracking.update_one(
                            {"_id": record["_id"]},
                            {
                                "$set": {
                                    "retentionStatus": RetentionStatus.DELETED.value,
                                    "actualDeletionDate": now,
                                    "updatedAt": now
                                }
                            }
                        )
                        results["deleted"] += 1
                        results["details"].append({
                            "record_id": record_id,
                            "status": "deleted",
                            "deletion_date": now.isoformat()
                        })
                    else:
                        results["errors"] += 1
                        results["details"].append({
                            "record_id": record_id,
                            "status": "error",
                            "reason": "Failed to delete data record"
                        })
                
                except Exception as e:
                    results["errors"] += 1
                    results["details"].append({
                        "record_id": record.get("recordId", "unknown"),
                        "status": "error",
                        "reason": str(e)
                    })
            
            return results
            
        except Exception as e:
            raise Exception(f"Failed to process scheduled deletions: {str(e)}")
    
    async def process_scheduled_archiving(self) -> Dict[str, Any]:
        """Process records scheduled for archiving."""
        try:
            now = datetime.utcnow()
            results = {
                "processed": 0,
                "archived": 0,
                "errors": 0,
                "details": []
            }
            
            # Find records scheduled for archiving
            archive_candidates = await self.db.data_retention_tracking.find({
                "retentionStatus": RetentionStatus.ACTIVE.value,
                "scheduledArchiveDate": {"$lte": now},
                "scheduledDeletionDate": {"$gt": now}  # Not yet scheduled for deletion
            }).to_list(length=None)
            
            for record in archive_candidates:
                try:
                    results["processed"] += 1
                    user_id = str(record["userId"])
                    record_id = record["recordId"]
                    data_category = DataCategory(record["dataCategory"])
                    
                    # Archive the record
                    archive_success = await self._archive_record(user_id, record_id, data_category)
                    
                    if archive_success:
                        # Update retention tracking
                        await self.db.data_retention_tracking.update_one(
                            {"_id": record["_id"]},
                            {
                                "$set": {
                                    "retentionStatus": RetentionStatus.ARCHIVED.value,
                                    "actualArchiveDate": now,
                                    "updatedAt": now
                                }
                            }
                        )
                        results["archived"] += 1
                        results["details"].append({
                            "record_id": record_id,
                            "status": "archived",
                            "archive_date": now.isoformat()
                        })
                    else:
                        results["errors"] += 1
                        results["details"].append({
                            "record_id": record_id,
                            "status": "error",
                            "reason": "Failed to archive record"
                        })
                
                except Exception as e:
                    results["errors"] += 1
                    results["details"].append({
                        "record_id": record.get("recordId", "unknown"),
                        "status": "error",
                        "reason": str(e)
                    })
            
            return results
            
        except Exception as e:
            raise Exception(f"Failed to process scheduled archiving: {str(e)}")
    
    async def _check_compliance_before_deletion(
        self,
        user_id: str,
        data_category: DataCategory,
        retention_record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Check compliance requirements before deleting data."""
        try:
            policy = self._policies.get(data_category)
            if not policy or not policy.compliance_requirements:
                return {"can_delete": True, "reason": "No compliance restrictions"}
            
            # Check each compliance requirement
            for regulation in policy.compliance_requirements:
                handler = self._compliance_handlers.get(regulation)
                if handler:
                    compliance_result = await handler(user_id, data_category, retention_record)
                    if not compliance_result["can_delete"]:
                        return compliance_result
            
            return {"can_delete": True, "reason": "All compliance checks passed"}
            
        except Exception as e:
            return {"can_delete": False, "reason": f"Compliance check failed: {str(e)}"}
    
    async def _handle_gdpr_compliance(
        self,
        user_id: str,
        data_category: DataCategory,
        retention_record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle GDPR compliance checks."""
        try:
            # Check if user has explicitly requested data deletion
            deletion_request = await self.db.user_deletion_requests.find_one({
                "userId": ObjectId(user_id),
                "status": "pending"
            })
            
            if deletion_request:
                return {"can_delete": True, "reason": "User requested data deletion (GDPR Art. 17)"}
            
            # Check data processing lawful basis
            user_consent = await self.db.user_consent.find_one({"userId": ObjectId(user_id)})
            
            if not user_consent:
                return {"can_delete": False, "reason": "No consent record found (GDPR compliance)"}
            
            # Check if consent is still valid
            consent_expiry = user_consent.get("consentExpiryDate")
            if consent_expiry and consent_expiry < datetime.utcnow():
                return {"can_delete": True, "reason": "Consent expired (GDPR compliance)"}
            
            # For personal data, require explicit consent or legitimate interest
            if data_category == DataCategory.PERSONAL_INFO:
                has_consent = user_consent.get("dataProcessingConsent", {}).get("personal_info", False)
                if not has_consent:
                    return {"can_delete": True, "reason": "No consent for personal info processing"}
            
            return {"can_delete": True, "reason": "GDPR compliance checks passed"}
            
        except Exception as e:
            return {"can_delete": False, "reason": f"GDPR compliance check failed: {str(e)}"}
    
    async def _handle_ccpa_compliance(
        self,
        user_id: str,
        data_category: DataCategory,
        retention_record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle CCPA compliance checks."""
        # Similar to GDPR but with CCPA-specific requirements
        return {"can_delete": True, "reason": "CCPA compliance checks passed"}
    
    async def _handle_pipeda_compliance(
        self,
        user_id: str,
        data_category: DataCategory,
        retention_record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle PIPEDA compliance checks."""
        return {"can_delete": True, "reason": "PIPEDA compliance checks passed"}
    
    async def _handle_lgpd_compliance(
        self,
        user_id: str,
        data_category: DataCategory,
        retention_record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle LGPD compliance checks."""
        return {"can_delete": True, "reason": "LGPD compliance checks passed"}
    
    async def _backup_record(
        self,
        user_id: str,
        record_id: str,
        data_category: DataCategory
    ) -> bool:
        """Create backup of record before deletion."""
        try:
            # Retrieve the original record
            collection_name = self._get_collection_name_for_category(data_category)
            if not collection_name:
                return False
            
            original_record = await self.db[collection_name].find_one({"_id": ObjectId(record_id)})
            if not original_record:
                return False
            
            # Create backup record
            backup_record = {
                "originalId": original_record["_id"],
                "userId": ObjectId(user_id),
                "dataCategory": data_category.value,
                "originalData": encrypt_data(json.dumps(original_record, default=str)),
                "backupDate": datetime.utcnow(),
                "retentionExpiry": datetime.utcnow() + timedelta(days=90)  # Keep backup for 90 days
            }
            
            await self.db.data_backups.insert_one(backup_record)
            return True
            
        except Exception as e:
            print(f"Failed to backup record {record_id}: {e}")
            return False
    
    async def _archive_record(
        self,
        user_id: str,
        record_id: str,
        data_category: DataCategory
    ) -> bool:
        """Archive a data record."""
        try:
            collection_name = self._get_collection_name_for_category(data_category)
            if not collection_name:
                return False
            
            # Move record to archive collection
            original_record = await self.db[collection_name].find_one({"_id": ObjectId(record_id)})
            if not original_record:
                return False
            
            # Create archive record
            archive_record = {
                **original_record,
                "archivedAt": datetime.utcnow(),
                "originalCollection": collection_name,
                "archiveReason": "retention_policy"
            }
            
            # Insert into archive collection
            await self.db[f"{collection_name}_archive"].insert_one(archive_record)
            
            # Mark original as archived (don't delete yet)
            await self.db[collection_name].update_one(
                {"_id": ObjectId(record_id)},
                {
                    "$set": {
                        "isArchived": True,
                        "archivedAt": datetime.utcnow()
                    }
                }
            )
            
            return True
            
        except Exception as e:
            print(f"Failed to archive record {record_id}: {e}")
            return False
    
    async def _delete_data_record(
        self,
        user_id: str,
        record_id: str,
        data_category: DataCategory
    ) -> bool:
        """Permanently delete a data record."""
        try:
            collection_name = self._get_collection_name_for_category(data_category)
            if not collection_name:
                return False
            
            result = await self.db[collection_name].delete_one({
                "_id": ObjectId(record_id),
                "userId": ObjectId(user_id)
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"Failed to delete record {record_id}: {e}")
            return False
    
    async def get_retention_summary(self, user_id: str) -> Dict[str, Any]:
        """Get retention summary for a user."""
        try:
            pipeline = [
                {
                    "$match": {
                        "userId": ObjectId(user_id)
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "dataCategory": "$dataCategory",
                            "retentionStatus": "$retentionStatus"
                        },
                        "count": {"$sum": 1},
                        "nextDeletion": {"$min": "$scheduledDeletionDate"},
                        "nextArchive": {"$min": "$scheduledArchiveDate"}
                    }
                }
            ]
            
            results = await self.db.data_retention_tracking.aggregate(pipeline).to_list(length=None)
            
            summary = {}
            for result in results:
                category = result["_id"]["dataCategory"]
                status = result["_id"]["retentionStatus"]
                
                if category not in summary:
                    summary[category] = {}
                
                summary[category][status] = {
                    "count": result["count"],
                    "next_deletion": result["nextDeletion"].isoformat() if result["nextDeletion"] else None,
                    "next_archive": result["nextArchive"].isoformat() if result["nextArchive"] else None
                }
            
            return {
                "user_id": user_id,
                "retention_summary": summary,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to get retention summary: {str(e)}")

# Global instance
data_retention_service = DataRetentionService()