"""
API endpoints for secure data recording and management.
Provides encrypted storage, access control, and audit capabilities.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from ..dependencies import get_current_user
from ..models.user import User
from ..services.secure_data_service import (
    AccessType,
    DataCategory,
    DataSensitivityLevel,
    secure_data_service,
)

router = APIRouter(prefix="/api/secure-data", tags=["secure-data"])


class StoreDataRequest(BaseModel):
    data: Dict[str, Any]
    data_category: DataCategory
    sensitivity_level: DataSensitivityLevel = DataSensitivityLevel.CONFIDENTIAL
    additional_metadata: Optional[Dict[str, Any]] = None


class UpdateDataRequest(BaseModel):
    record_id: str
    updated_data: Dict[str, Any]


class DeleteDataRequest(BaseModel):
    record_id: str
    hard_delete: bool = False


class DataInventoryResponse(BaseModel):
    user_id: str
    total_records: int
    categories: Dict[str, Any]
    generated_at: str


class AccessLogResponse(BaseModel):
    logs: List[Dict[str, Any]]
    total_count: int
    generated_at: str


def get_request_context(request: Request) -> Dict[str, str]:
    """Extract request context for audit logging."""
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
    }


@router.post("/store")
async def store_encrypted_data(
    request: StoreDataRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
):
    """Store data with encryption and audit trail."""
    try:
        # Initialize service if not already done
        if not secure_data_service.db:
            await secure_data_service.initialize()

        request_context = get_request_context(http_request)

        record_id = await secure_data_service.store_encrypted_data(
            user_id=current_user.id,
            data=request.data,
            data_category=request.data_category,
            sensitivity_level=request.sensitivity_level,
            additional_metadata=request.additional_metadata,
            request_context=request_context,
        )

        return {
            "success": True,
            "record_id": record_id,
            "message": "Data stored securely with encryption",
            "data_category": request.data_category.value,
            "sensitivity_level": request.sensitivity_level.value,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store encrypted data: {str(e)}",
        )


@router.get("/retrieve/{record_id}")
async def retrieve_encrypted_data(
    record_id: str,
    http_request: Request,
    current_user: User = Depends(get_current_user),
):
    """Retrieve and decrypt data with access logging."""
    try:
        if not secure_data_service.db:
            await secure_data_service.initialize()

        request_context = get_request_context(http_request)

        decrypted_data = await secure_data_service.retrieve_encrypted_data(
            user_id=current_user.id,
            record_id=record_id,
            request_context=request_context,
        )

        if decrypted_data is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data record not found or access denied",
            )

        return {
            "success": True,
            "data": decrypted_data,
            "record_id": record_id,
            "retrieved_at": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve encrypted data: {str(e)}",
        )


@router.put("/update")
async def update_encrypted_data(
    request: UpdateDataRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
):
    """Update encrypted data record."""
    try:
        if not secure_data_service.db:
            await secure_data_service.initialize()

        request_context = get_request_context(http_request)

        success = await secure_data_service.update_encrypted_data(
            user_id=current_user.id,
            record_id=request.record_id,
            updated_data=request.updated_data,
            request_context=request_context,
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data record not found or update failed",
            )

        return {
            "success": True,
            "record_id": request.record_id,
            "message": "Data updated successfully",
            "updated_at": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update encrypted data: {str(e)}",
        )


@router.delete("/delete")
async def delete_encrypted_data(
    request: DeleteDataRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
):
    """Delete encrypted data record."""
    try:
        if not secure_data_service.db:
            await secure_data_service.initialize()

        request_context = get_request_context(http_request)

        success = await secure_data_service.delete_encrypted_data(
            user_id=current_user.id,
            record_id=request.record_id,
            hard_delete=request.hard_delete,
            request_context=request_context,
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data record not found or deletion failed",
            )

        return {
            "success": True,
            "record_id": request.record_id,
            "hard_delete": request.hard_delete,
            "message": "Data deleted successfully",
            "deleted_at": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete encrypted data: {str(e)}",
        )


@router.get("/inventory", response_model=DataInventoryResponse)
async def get_data_inventory(current_user: User = Depends(get_current_user)):
    """Get inventory of all encrypted data for the current user."""
    try:
        if not secure_data_service.db:
            await secure_data_service.initialize()

        inventory = await secure_data_service.get_user_data_inventory(current_user.id)

        total_records = sum(
            cat_data.get("record_count", 0) for cat_data in inventory.values()
        )

        return DataInventoryResponse(
            user_id=current_user.id,
            total_records=total_records,
            categories=inventory,
            generated_at=datetime.utcnow().isoformat(),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get data inventory: {str(e)}",
        )


@router.get("/access-logs", response_model=AccessLogResponse)
async def get_access_logs(
    limit: int = 100,
    data_category: Optional[DataCategory] = None,
    access_type: Optional[AccessType] = None,
    current_user: User = Depends(get_current_user),
):
    """Get access logs for the current user."""
    try:
        if not secure_data_service.db:
            await secure_data_service.initialize()

        logs = await secure_data_service.get_access_logs(
            user_id=current_user.id,
            limit=min(limit, 1000),  # Cap at 1000 for performance
            data_category=data_category,
            access_type=access_type,
        )

        return AccessLogResponse(
            logs=logs, total_count=len(logs), generated_at=datetime.utcnow().isoformat()
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get access logs: {str(e)}",
        )


@router.post("/cleanup-expired")
async def cleanup_expired_data(current_user: User = Depends(get_current_user)):
    """Clean up expired data records (admin operation)."""
    try:
        # Only allow admin users to perform cleanup
        if current_user.role not in ["admin", "system_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required for data cleanup operations",
            )

        if not secure_data_service.db:
            await secure_data_service.initialize()

        results = await secure_data_service.cleanup_expired_data()

        return {
            "success": True,
            "deleted_records": results["deleted"],
            "errors": results["errors"],
            "cleanup_performed_at": datetime.utcnow().isoformat(),
            "message": f"Cleaned up {results['deleted']} expired records",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup expired data: {str(e)}",
        )


@router.get("/categories")
async def get_data_categories():
    """Get available data categories and sensitivity levels."""
    return {
        "data_categories": [
            {"value": category.value, "label": category.value.replace("_", " ").title()}
            for category in DataCategory
        ],
        "sensitivity_levels": [
            {
                "value": level.value,
                "label": level.value.title(),
                "description": {
                    "public": "No restrictions on access",
                    "internal": "Limited to internal systems",
                    "confidential": "Restricted access with encryption",
                    "restricted": "Highest security with strict access controls",
                }.get(level.value, ""),
            }
            for level in DataSensitivityLevel
        ],
        "access_types": [
            {"value": access.value, "label": access.value.title()}
            for access in AccessType
        ],
    }


@router.get("/statistics")
async def get_security_statistics(current_user: User = Depends(get_current_user)):
    """Get security and access statistics."""
    try:
        if not secure_data_service.db:
            await secure_data_service.initialize()

        # Get recent access patterns
        from datetime import timedelta

        last_week = datetime.utcnow() - timedelta(days=7)

        # Access statistics
        access_stats = await secure_data_service.db.access_logs.aggregate(
            [
                {
                    "$match": {
                        "userId": ObjectId(current_user.id),
                        "timestamp": {"$gte": last_week},
                    }
                },
                {
                    "$group": {
                        "_id": {"access_type": "$accessType", "success": "$success"},
                        "count": {"$sum": 1},
                    }
                },
            ]
        ).to_list(length=None)

        # Data inventory summary
        inventory = await secure_data_service.get_user_data_inventory(current_user.id)

        # Security score calculation
        total_records = sum(
            cat_data.get("record_count", 0) for cat_data in inventory.values()
        )
        encrypted_records = total_records  # All records are encrypted in our system
        security_score = min(100, (encrypted_records / max(total_records, 1)) * 100)

        return {
            "user_id": current_user.id,
            "security_score": round(security_score, 1),
            "total_encrypted_records": total_records,
            "recent_access_stats": access_stats,
            "data_categories": len(inventory),
            "last_updated": datetime.utcnow().isoformat(),
            "recommendations": (
                [
                    "All sensitive data is properly encrypted",
                    "Regular access logging is active",
                    "Data retention policies are enforced",
                ]
                if security_score > 90
                else [
                    "Consider enabling additional security features",
                    "Review data access patterns regularly",
                    "Ensure all sensitive data is categorized properly",
                ]
            ),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get security statistics: {str(e)}",
        )
