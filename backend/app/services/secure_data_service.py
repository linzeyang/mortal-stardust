"""
Secure Data Recording Service with Advanced Encryption and Audit Logging.
Handles encrypted storage, access control, and compliance features.
"""

import hashlib
import json
import secrets
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

from bson import ObjectId

from ..core.database import get_database
from ..utils.encryption import decrypt_data, encrypt_data


class DataSensitivityLevel(str, Enum):
    """Data sensitivity classification levels."""

    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"


class AccessType(str, Enum):
    """Types of data access operations."""

    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    EXPORT = "export"
    DECRYPT = "decrypt"


class DataCategory(str, Enum):
    """Categories of user data."""

    PERSONAL_INFO = "personal_info"
    EXPERIENCE_DATA = "experience_data"
    SOLUTION_DATA = "solution_data"
    RATING_DATA = "rating_data"
    MEDIA_FILES = "media_files"
    ACTIVITY_LOGS = "activity_logs"


@dataclass
class EncryptionMetadata:
    """Metadata for encrypted data records."""

    encryption_algorithm: str
    key_id: str
    iv: str
    created_at: datetime
    sensitivity_level: DataSensitivityLevel
    data_category: DataCategory
    retention_period_days: int
    access_count: int = 0
    last_accessed: Optional[datetime] = None


@dataclass
class AccessLog:
    """Access log record for audit trail."""

    user_id: str
    data_id: str
    data_category: DataCategory
    access_type: AccessType
    timestamp: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = None


class SecureDataService:
    """Advanced secure data recording and management service."""

    def __init__(self):
        self.db = None
        self._encryption_keys = {}
        self._retention_policies = {
            DataCategory.PERSONAL_INFO: 2555,  # 7 years
            DataCategory.EXPERIENCE_DATA: 1825,  # 5 years
            DataCategory.SOLUTION_DATA: 1095,  # 3 years
            DataCategory.RATING_DATA: 730,  # 2 years
            DataCategory.MEDIA_FILES: 1825,  # 5 years
            DataCategory.ACTIVITY_LOGS: 365,  # 1 year
        }

    async def initialize(self):
        """Initialize the secure data service."""
        self.db = get_database()
        await self._initialize_encryption_keys()
        await self._create_audit_indexes()

    async def _initialize_encryption_keys(self):
        """Initialize encryption keys for different data categories."""
        for category in DataCategory:
            # In production, these should be stored in a secure key management service
            self._encryption_keys[category.value] = secrets.token_hex(32)

    async def _create_audit_indexes(self):
        """Create database indexes for audit trails."""
        try:
            # Access logs indexes
            await self.db.access_logs.create_index("userId")
            await self.db.access_logs.create_index("dataId")
            await self.db.access_logs.create_index("timestamp")
            await self.db.access_logs.create_index("dataCategory")
            await self.db.access_logs.create_index([("userId", 1), ("timestamp", -1)])

            # Encrypted data indexes
            await self.db.encrypted_records.create_index("userId")
            await self.db.encrypted_records.create_index("dataCategory")
            await self.db.encrypted_records.create_index("createdAt")
            await self.db.encrypted_records.create_index("expiresAt")
            await self.db.encrypted_records.create_index("sensitivityLevel")

        except Exception as e:
            print(f"Warning: Failed to create audit indexes: {e}")

    async def store_encrypted_data(
        self,
        user_id: str,
        data: Dict[str, Any],
        data_category: DataCategory,
        sensitivity_level: DataSensitivityLevel = DataSensitivityLevel.CONFIDENTIAL,
        additional_metadata: Optional[Dict[str, Any]] = None,
        request_context: Optional[Dict[str, str]] = None,
    ) -> str:
        """
        Store data with encryption and full audit trail.

        Args:
            user_id: User ID who owns the data
            data: Data to be encrypted and stored
            data_category: Category of the data
            sensitivity_level: Sensitivity classification
            additional_metadata: Additional metadata to store
            request_context: Request context for audit trail

        Returns:
            str: ID of the stored encrypted record
        """
        try:
            # Serialize and encrypt the data
            serialized_data = json.dumps(data, default=str, ensure_ascii=False)
            encrypted_data = encrypt_data(serialized_data)

            # Create encryption metadata
            retention_days = self._retention_policies.get(data_category, 365)
            expires_at = datetime.utcnow() + timedelta(days=retention_days)

            encryption_metadata = EncryptionMetadata(
                encryption_algorithm="AES-256-GCM",
                key_id=f"{data_category.value}_key",
                iv=secrets.token_hex(16),
                created_at=datetime.utcnow(),
                sensitivity_level=sensitivity_level,
                data_category=data_category,
                retention_period_days=retention_days,
            )

            # Create the encrypted record
            record = {
                "userId": ObjectId(user_id),
                "encryptedData": encrypted_data,
                "dataCategory": data_category.value,
                "sensitivityLevel": sensitivity_level.value,
                "encryptionMetadata": asdict(encryption_metadata),
                "additionalMetadata": additional_metadata or {},
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "expiresAt": expires_at,
                "isActive": True,
                "accessCount": 0,
                "checksum": self._calculate_checksum(serialized_data),
            }

            # Store the record
            result = await self.db.encrypted_records.insert_one(record)
            record_id = str(result.inserted_id)

            # Log the access
            await self._log_access(
                user_id=user_id,
                data_id=record_id,
                data_category=data_category,
                access_type=AccessType.CREATE,
                request_context=request_context,
            )

            return record_id

        except Exception as e:
            # Log failed access attempt
            await self._log_access(
                user_id=user_id,
                data_id="unknown",
                data_category=data_category,
                access_type=AccessType.CREATE,
                success=False,
                error_message=str(e),
                request_context=request_context,
            )
            raise Exception(f"Failed to store encrypted data: {str(e)}")

    async def retrieve_encrypted_data(
        self,
        user_id: str,
        record_id: str,
        request_context: Optional[Dict[str, str]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve and decrypt data with access logging.

        Args:
            user_id: User ID requesting the data
            record_id: ID of the encrypted record
            request_context: Request context for audit trail

        Returns:
            Dict[str, Any]: Decrypted data or None if not found/accessible
        """
        try:
            # Retrieve the record
            record = await self.db.encrypted_records.find_one(
                {
                    "_id": ObjectId(record_id),
                    "userId": ObjectId(user_id),
                    "isActive": True,
                    "expiresAt": {"$gt": datetime.utcnow()},
                }
            )

            if not record:
                await self._log_access(
                    user_id=user_id,
                    data_id=record_id,
                    data_category=DataCategory.PERSONAL_INFO,  # Default
                    access_type=AccessType.READ,
                    success=False,
                    error_message="Record not found or access denied",
                    request_context=request_context,
                )
                return None

            # Decrypt the data
            encrypted_data = record["encryptedData"]
            decrypted_data = decrypt_data(encrypted_data)

            # Verify checksum
            calculated_checksum = self._calculate_checksum(decrypted_data)
            stored_checksum = record.get("checksum")

            if calculated_checksum != stored_checksum:
                await self._log_access(
                    user_id=user_id,
                    data_id=record_id,
                    data_category=DataCategory(record["dataCategory"]),
                    access_type=AccessType.READ,
                    success=False,
                    error_message="Data integrity check failed",
                    request_context=request_context,
                )
                raise Exception("Data integrity check failed")

            # Update access count
            await self.db.encrypted_records.update_one(
                {"_id": ObjectId(record_id)},
                {
                    "$inc": {"accessCount": 1},
                    "$set": {
                        "lastAccessedAt": datetime.utcnow(),
                        "updatedAt": datetime.utcnow(),
                    },
                },
            )

            # Log successful access
            await self._log_access(
                user_id=user_id,
                data_id=record_id,
                data_category=DataCategory(record["dataCategory"]),
                access_type=AccessType.READ,
                request_context=request_context,
            )

            # Parse and return the data
            return json.loads(decrypted_data)

        except Exception as e:
            await self._log_access(
                user_id=user_id,
                data_id=record_id,
                data_category=DataCategory.PERSONAL_INFO,  # Default
                access_type=AccessType.READ,
                success=False,
                error_message=str(e),
                request_context=request_context,
            )
            raise Exception(f"Failed to retrieve encrypted data: {str(e)}")

    async def update_encrypted_data(
        self,
        user_id: str,
        record_id: str,
        updated_data: Dict[str, Any],
        request_context: Optional[Dict[str, str]] = None,
    ) -> bool:
        """Update encrypted data record."""
        try:
            # First check if record exists and user has access
            existing_record = await self.db.encrypted_records.find_one(
                {
                    "_id": ObjectId(record_id),
                    "userId": ObjectId(user_id),
                    "isActive": True,
                }
            )

            if not existing_record:
                return False

            # Encrypt the updated data
            serialized_data = json.dumps(updated_data, default=str, ensure_ascii=False)
            encrypted_data = encrypt_data(serialized_data)

            # Update the record
            result = await self.db.encrypted_records.update_one(
                {"_id": ObjectId(record_id)},
                {
                    "$set": {
                        "encryptedData": encrypted_data,
                        "updatedAt": datetime.utcnow(),
                        "checksum": self._calculate_checksum(serialized_data),
                    }
                },
            )

            # Log the access
            await self._log_access(
                user_id=user_id,
                data_id=record_id,
                data_category=DataCategory(existing_record["dataCategory"]),
                access_type=AccessType.UPDATE,
                request_context=request_context,
            )

            return result.modified_count > 0

        except Exception as e:
            await self._log_access(
                user_id=user_id,
                data_id=record_id,
                data_category=DataCategory.PERSONAL_INFO,  # Default
                access_type=AccessType.UPDATE,
                success=False,
                error_message=str(e),
                request_context=request_context,
            )
            raise Exception(f"Failed to update encrypted data: {str(e)}")

    async def delete_encrypted_data(
        self,
        user_id: str,
        record_id: str,
        hard_delete: bool = False,
        request_context: Optional[Dict[str, str]] = None,
    ) -> bool:
        """
        Delete encrypted data record (soft delete by default).

        Args:
            user_id: User ID requesting deletion
            record_id: ID of the record to delete
            hard_delete: Whether to permanently delete the record
            request_context: Request context for audit trail

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if hard_delete:
                # Permanent deletion
                result = await self.db.encrypted_records.delete_one(
                    {"_id": ObjectId(record_id), "userId": ObjectId(user_id)}
                )
                success = result.deleted_count > 0
            else:
                # Soft delete
                result = await self.db.encrypted_records.update_one(
                    {"_id": ObjectId(record_id), "userId": ObjectId(user_id)},
                    {
                        "$set": {
                            "isActive": False,
                            "deletedAt": datetime.utcnow(),
                            "updatedAt": datetime.utcnow(),
                        }
                    },
                )
                success = result.modified_count > 0

            # Log the deletion
            await self._log_access(
                user_id=user_id,
                data_id=record_id,
                data_category=DataCategory.PERSONAL_INFO,  # Will be updated based on actual record
                access_type=AccessType.DELETE,
                success=success,
                additional_context={"hard_delete": hard_delete},
                request_context=request_context,
            )

            return success

        except Exception as e:
            await self._log_access(
                user_id=user_id,
                data_id=record_id,
                data_category=DataCategory.PERSONAL_INFO,
                access_type=AccessType.DELETE,
                success=False,
                error_message=str(e),
                request_context=request_context,
            )
            return False

    async def get_user_data_inventory(self, user_id: str) -> Dict[str, Any]:
        """Get inventory of all encrypted data for a user."""
        try:
            pipeline = [
                {"$match": {"userId": ObjectId(user_id), "isActive": True}},
                {
                    "$group": {
                        "_id": "$dataCategory",
                        "count": {"$sum": 1},
                        "total_size": {"$sum": {"$strLenBytes": "$encryptedData"}},
                        "oldest_record": {"$min": "$createdAt"},
                        "newest_record": {"$max": "$createdAt"},
                        "sensitivity_levels": {"$addToSet": "$sensitivityLevel"},
                    }
                },
            ]

            results = await self.db.encrypted_records.aggregate(pipeline).to_list(
                length=None
            )

            inventory = {}
            for result in results:
                category = result["_id"]
                inventory[category] = {
                    "record_count": result["count"],
                    "total_size_bytes": result["total_size"],
                    "oldest_record": result["oldest_record"].isoformat(),
                    "newest_record": result["newest_record"].isoformat(),
                    "sensitivity_levels": result["sensitivity_levels"],
                }

            return inventory

        except Exception as e:
            raise Exception(f"Failed to get data inventory: {str(e)}")

    async def cleanup_expired_data(self) -> Dict[str, int]:
        """Clean up expired data records."""
        try:
            now = datetime.utcnow()

            # Find expired records
            expired_records = await self.db.encrypted_records.find(
                {"expiresAt": {"$lt": now}, "isActive": True}
            ).to_list(length=None)

            results = {"deleted": 0, "errors": 0}

            for record in expired_records:
                try:
                    # Hard delete expired records
                    await self.db.encrypted_records.delete_one({"_id": record["_id"]})
                    results["deleted"] += 1

                    # Log the cleanup
                    await self._log_access(
                        user_id=str(record["userId"]),
                        data_id=str(record["_id"]),
                        data_category=DataCategory(record["dataCategory"]),
                        access_type=AccessType.DELETE,
                        additional_context={"reason": "expired_data_cleanup"},
                    )

                except Exception as e:
                    results["errors"] += 1
                    print(f"Failed to delete expired record {record['_id']}: {e}")

            return results

        except Exception as e:
            raise Exception(f"Failed to cleanup expired data: {str(e)}")

    async def _log_access(
        self,
        user_id: str,
        data_id: str,
        data_category: DataCategory,
        access_type: AccessType,
        success: bool = True,
        error_message: Optional[str] = None,
        additional_context: Optional[Dict[str, Any]] = None,
        request_context: Optional[Dict[str, str]] = None,
    ):
        """Log data access for audit trail."""
        try:
            access_log = {
                "userId": ObjectId(user_id),
                "dataId": data_id,
                "dataCategory": data_category.value,
                "accessType": access_type.value,
                "timestamp": datetime.utcnow(),
                "success": success,
                "errorMessage": error_message,
                "ipAddress": (
                    request_context.get("ip_address") if request_context else None
                ),
                "userAgent": (
                    request_context.get("user_agent") if request_context else None
                ),
                "additionalContext": additional_context or {},
            }

            await self.db.access_logs.insert_one(access_log)

        except Exception as e:
            # Don't fail the main operation if logging fails
            print(f"Failed to log access: {e}")

    def _calculate_checksum(self, data: str) -> str:
        """Calculate SHA-256 checksum for data integrity."""
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

    async def get_access_logs(
        self,
        user_id: str,
        limit: int = 100,
        data_category: Optional[DataCategory] = None,
        access_type: Optional[AccessType] = None,
    ) -> List[Dict[str, Any]]:
        """Get access logs for a user."""
        try:
            query = {"userId": ObjectId(user_id)}

            if data_category:
                query["dataCategory"] = data_category.value
            if access_type:
                query["accessType"] = access_type.value

            logs = (
                await self.db.access_logs.find(query)
                .sort("timestamp", -1)
                .limit(limit)
                .to_list(length=limit)
            )

            # Convert ObjectIds to strings
            for log in logs:
                log["_id"] = str(log["_id"])
                log["userId"] = str(log["userId"])
                log["timestamp"] = log["timestamp"].isoformat()

            return logs

        except Exception as e:
            raise Exception(f"Failed to get access logs: {str(e)}")


# Global instance
secure_data_service = SecureDataService()
