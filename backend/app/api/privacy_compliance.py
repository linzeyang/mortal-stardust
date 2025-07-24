"""
Privacy and Compliance API endpoints
Handles GDPR compliance requests and privacy management
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from pymongo.database import Database

from ..core.database import get_database
from ..dependencies import get_current_user
from ..services.privacy_compliance import PrivacyComplianceService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/privacy", tags=["privacy-compliance"])


# Request/Response Models
class ConsentRequest(BaseModel):
    consent_type: str = Field(
        ..., description="Type of consent (data_processing, analytics, marketing)"
    )
    granted: bool = Field(..., description="Whether consent is granted or withdrawn")
    purpose: str = Field(..., description="Purpose of data processing")
    legal_basis: str = Field(
        default="consent", description="Legal basis for processing"
    )


class ConsentResponse(BaseModel):
    consent_id: str
    status: str
    message: str


class DataRequestRequest(BaseModel):
    request_type: str = Field(
        ..., description="Type of request (export, delete, anonymize, rectify)"
    )
    details: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional request details"
    )
    retention_policy: Optional[str] = Field(
        default="complete", description="Retention policy for deletion"
    )


class DataRequestResponse(BaseModel):
    request_id: str
    status: str
    estimated_completion: str
    message: str


class PrivacyDashboardResponse(BaseModel):
    user_id: str
    generated_at: str
    consents: Dict[str, Any]
    data_requests: List[Dict[str, Any]]
    data_usage: Dict[str, Any]
    retention_policy: Dict[str, Any]
    privacy_rights: Dict[str, str]


@router.post("/consent", response_model=ConsentResponse)
async def record_consent(
    request: ConsentRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    Record user consent for data processing
    """
    try:
        user_id = str(current_user.id)

        # Initialize privacy service
        privacy_service = PrivacyComplianceService(db)

        # Record consent with metadata
        metadata = {
            "ip_address": None,  # Would be extracted from request in production
            "user_agent": None,  # Would be extracted from request in production
            "timestamp": datetime.utcnow().isoformat(),
        }

        result = await privacy_service.record_consent(
            user_id=user_id,
            consent_type=request.consent_type,
            granted=request.granted,
            purpose=request.purpose,
            legal_basis=request.legal_basis,
            metadata=metadata,
        )

        return ConsentResponse(
            consent_id=result["consent_id"],
            status=result["status"],
            message=result["message"],
        )

    except Exception as e:
        logger.error(f"Error recording consent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record consent",
        )


@router.get("/consent")
async def get_user_consents(
    current_user: dict = Depends(get_current_user), db: Database = Depends(get_database)
):
    """
    Get all consent records for the current user
    """
    try:
        user_id = str(current_user.id)

        # Initialize privacy service
        privacy_service = PrivacyComplianceService(db)

        # Get consent records
        consents = await privacy_service.get_user_consents(user_id)

        return consents

    except Exception as e:
        logger.error(f"Error getting user consents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve consent records",
        )


@router.post("/data-request", response_model=DataRequestResponse)
async def create_data_request(
    request: DataRequestRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    Create a data processing request (export, delete, anonymize, rectify)
    """
    try:
        user_id = str(current_user.id)

        # Validate request type
        valid_request_types = ["export", "delete", "anonymize", "rectify"]
        if request.request_type not in valid_request_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid request type. Must be one of: {valid_request_types}",
            )

        # Initialize privacy service
        privacy_service = PrivacyComplianceService(db)

        # Create data request
        data_request = await privacy_service.create_data_request(
            user_id=user_id, request_type=request.request_type, details=request.details
        )

        # Process request in background based on type
        if request.request_type == "export":
            background_tasks.add_task(
                process_export_request, user_id, data_request["request_id"], db
            )
        elif request.request_type == "delete":
            background_tasks.add_task(
                process_deletion_request,
                user_id,
                data_request["request_id"],
                request.retention_policy or "complete",
                db,
            )
        elif request.request_type == "anonymize":
            background_tasks.add_task(
                process_anonymization_request, user_id, data_request["request_id"], db
            )

        return DataRequestResponse(
            request_id=data_request["request_id"],
            status=data_request["status"],
            estimated_completion=data_request["estimated_completion"],
            message=f"Data {request.request_type} request created successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating data request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create data request",
        )


@router.get("/data-request/{request_id}")
async def get_data_request_status(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    Get the status of a data processing request
    """
    try:
        user_id = str(current_user.id)

        # Find the data request
        data_request = await db.data_requests.find_one(
            {"request_id": request_id, "user_id": user_id}
        )

        if not data_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Data request not found"
            )

        # Convert ObjectId and datetime fields for JSON serialization
        response_data = {
            "request_id": data_request["request_id"],
            "request_type": data_request["request_type"],
            "status": data_request["status"],
            "created_at": data_request["created_at"].isoformat(),
            "estimated_completion": (
                data_request.get("estimated_completion", "").isoformat()
                if data_request.get("estimated_completion")
                else None
            ),
            "completed_at": (
                data_request.get("completed_at", "").isoformat()
                if data_request.get("completed_at")
                else None
            ),
            "error_message": data_request.get("error_message"),
        }

        # Add download link for completed export requests
        if (
            data_request["request_type"] == "export"
            and data_request["status"] == "completed"
        ):
            response_data["download_url"] = f"/api/privacy/export/{request_id}/download"

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting data request status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve data request status",
        )


@router.get("/export/{request_id}/download")
async def download_user_data_export(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    Download exported user data
    """
    try:
        user_id = str(current_user.id)

        # Verify the export request
        data_request = await db.data_requests.find_one(
            {
                "request_id": request_id,
                "user_id": user_id,
                "request_type": "export",
                "status": "completed",
            }
        )

        if not data_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export request not found or not completed",
            )

        # Initialize privacy service and get export data
        privacy_service = PrivacyComplianceService(db)
        export_data = await privacy_service.export_user_data(user_id, request_id)

        return {
            "export_data": export_data,
            "format": "json",
            "generated_at": datetime.utcnow().isoformat(),
            "download_expires_at": (datetime.utcnow().timestamp() + 86400),  # 24 hours
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading export data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download export data",
        )


@router.get("/dashboard", response_model=PrivacyDashboardResponse)
async def get_privacy_dashboard(
    current_user: dict = Depends(get_current_user), db: Database = Depends(get_database)
):
    """
    Get privacy dashboard with user's privacy information and controls
    """
    try:
        user_id = str(current_user.id)

        # Initialize privacy service
        privacy_service = PrivacyComplianceService(db)

        # Get dashboard data
        dashboard_data = await privacy_service.get_privacy_dashboard(user_id)

        return PrivacyDashboardResponse(**dashboard_data)

    except Exception as e:
        logger.error(f"Error getting privacy dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve privacy dashboard",
        )


@router.delete("/account")
async def request_account_deletion(
    retention_policy: str = Query(
        default="complete", description="Retention policy: complete, anonymize_retain"
    ),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    Request complete account deletion (GDPR Right to Erasure)
    """
    try:
        user_id = str(current_user.id)

        # Create deletion request
        privacy_service = PrivacyComplianceService(db)

        deletion_request = await privacy_service.create_data_request(
            user_id=user_id,
            request_type="delete",
            details={"retention_policy": retention_policy},
        )

        return {
            "message": "Account deletion request created successfully",
            "request_id": deletion_request["request_id"],
            "estimated_completion": deletion_request["estimated_completion"],
            "retention_policy": retention_policy,
            "warning": "This action cannot be undone. All your data will be permanently deleted according to the selected retention policy.",
        }

    except Exception as e:
        logger.error(f"Error requesting account deletion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process account deletion request",
        )


@router.get("/audit-log")
async def get_audit_log(
    limit: int = Query(
        default=50, ge=1, le=100, description="Number of audit log entries to return"
    ),
    days: int = Query(
        default=30, ge=1, le=90, description="Number of days to look back"
    ),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    Get user's audit log for transparency
    """
    try:
        user_id = str(current_user.id)

        # Calculate date range
        from datetime import timedelta

        start_date = datetime.utcnow() - timedelta(days=days)

        # Get audit logs
        audit_logs = (
            await db.audit_logs.find(
                {"user_id": user_id, "timestamp": {"$gte": start_date}}
            )
            .sort("timestamp", -1)
            .limit(limit)
            .to_list(length=None)
        )

        # Format audit logs for response
        formatted_logs = []
        for log in audit_logs:
            formatted_log = {
                "timestamp": log["timestamp"].isoformat(),
                "action_type": log["action_type"],
                "details": log.get("details", {}),
                "source": log.get("source", "system"),
            }
            formatted_logs.append(formatted_log)

        return {
            "audit_logs": formatted_logs,
            "total_entries": len(formatted_logs),
            "date_range": {
                "from": start_date.isoformat(),
                "to": datetime.utcnow().isoformat(),
            },
        }

    except Exception as e:
        logger.error(f"Error getting audit log: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit log",
        )


# Background task functions
async def process_export_request(user_id: str, request_id: str, db: Database):
    """Background task to process data export request"""
    try:
        privacy_service = PrivacyComplianceService(db)
        await privacy_service.export_user_data(user_id, request_id)
        logger.info(f"✅ Export request {request_id} completed for user {user_id}")
    except Exception as e:
        logger.error(
            f"❌ Export request {request_id} failed for user {user_id}: {str(e)}"
        )


async def process_deletion_request(
    user_id: str, request_id: str, retention_policy: str, db: Database
):
    """Background task to process data deletion request"""
    try:
        privacy_service = PrivacyComplianceService(db)
        await privacy_service.delete_user_data(user_id, request_id, retention_policy)
        logger.info(f"✅ Deletion request {request_id} completed for user {user_id}")
    except Exception as e:
        logger.error(
            f"❌ Deletion request {request_id} failed for user {user_id}: {str(e)}"
        )


async def process_anonymization_request(user_id: str, request_id: str, db: Database):
    """Background task to process data anonymization request"""
    try:
        privacy_service = PrivacyComplianceService(db)
        await privacy_service.anonymize_user_data(user_id, request_id)
        logger.info(
            f"✅ Anonymization request {request_id} completed for user {user_id}"
        )
    except Exception as e:
        logger.error(
            f"❌ Anonymization request {request_id} failed for user {user_id}: {str(e)}"
        )
