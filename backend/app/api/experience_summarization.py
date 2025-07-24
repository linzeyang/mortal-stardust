"""
Experience Summarization API endpoints
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from pymongo.database import Database

from ..core.database import get_database
from ..dependencies import get_current_user
from ..services.experience_summarization import ExperienceSummarizationService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/experience-summarization", tags=["experience-summarization"]
)


# Request/Response Models
class SummaryRequest(BaseModel):
    experience_id: str = Field(..., description="Experience ID to summarize")
    stage: str = Field(
        default="all", description="Stage to summarize (stage1, stage2, stage3, or all)"
    )


class SummaryResponse(BaseModel):
    summary_id: str
    experience_id: str
    stage: str
    summary: Dict[str, Any]
    created_at: str
    status: str


class SummaryListItem(BaseModel):
    summary_id: str
    experience_id: str
    stage: str
    created_at: str
    updated_at: str
    summary_score: Optional[float] = None
    tags: List[str] = []


class SummaryListResponse(BaseModel):
    summaries: List[SummaryListItem]
    total_count: int
    page: int
    page_size: int


@router.post("/generate", response_model=SummaryResponse)
async def generate_experience_summary(
    request: SummaryRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    Generate AI-powered summary of user experience
    """
    try:
        user_id = str(current_user.id)

        # Initialize summarization service
        summarization_service = ExperienceSummarizationService(db)

        # Generate summary
        summary_result = await summarization_service.generate_experience_summary(
            user_id=user_id, experience_id=request.experience_id, stage=request.stage
        )

        return SummaryResponse(**summary_result)

    except ValueError as e:
        logger.error(f"Validation error in generate_experience_summary: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating experience summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate experience summary",
        )


@router.get("/list", response_model=SummaryListResponse)
async def list_experience_summaries(
    experience_id: Optional[str] = Query(None, description="Filter by experience ID"),
    stage: Optional[str] = Query(None, description="Filter by stage"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    List experience summaries for the current user
    """
    try:
        user_id = str(current_user.id)

        # Initialize summarization service
        summarization_service = ExperienceSummarizationService(db)

        # Get summaries
        summaries = await summarization_service.get_experience_summaries(
            user_id=user_id, experience_id=experience_id, stage=stage
        )

        # Apply pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_summaries = summaries[start_idx:end_idx]

        # Convert to response format
        summary_items = []
        for summary in paginated_summaries:
            # Extract metadata for list view
            summary_data = summary.get("summary_data", {})
            metadata = summary_data.get("summary_metadata", {})

            summary_items.append(
                SummaryListItem(
                    summary_id=summary["summary_id"],
                    experience_id=summary["experience_id"],
                    stage=summary["stage"],
                    created_at=summary["created_at"],
                    updated_at=summary["updated_at"],
                    summary_score=metadata.get("summary_score"),
                    tags=metadata.get("tags", []),
                )
            )

        return SummaryListResponse(
            summaries=summary_items,
            total_count=len(summaries),
            page=page,
            page_size=page_size,
        )

    except Exception as e:
        logger.error(f"Error listing experience summaries: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve experience summaries",
        )


@router.get("/{summary_id}", response_model=Dict[str, Any])
async def get_experience_summary(
    summary_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    Get detailed experience summary by ID
    """
    try:
        user_id = str(current_user.id)

        # Initialize summarization service
        summarization_service = ExperienceSummarizationService(db)

        # Get specific summary
        summaries = await summarization_service.get_experience_summaries(
            user_id=user_id
        )

        # Find the requested summary
        target_summary = None
        for summary in summaries:
            if summary["summary_id"] == summary_id:
                target_summary = summary
                break

        if not target_summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Experience summary not found",
            )

        return target_summary

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting experience summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve experience summary",
        )


@router.delete("/{summary_id}")
async def delete_experience_summary(
    summary_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    Delete experience summary
    """
    try:
        user_id = str(current_user.id)

        # Initialize summarization service
        summarization_service = ExperienceSummarizationService(db)

        # Delete summary
        success = await summarization_service.delete_experience_summary(
            user_id=user_id, summary_id=summary_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Experience summary not found or already deleted",
            )

        return {"message": "Experience summary deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting experience summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete experience summary",
        )


class BatchGenerateRequest(BaseModel):
    experience_ids: List[str] = Field(..., description="List of experience IDs")
    stage: str = Field(default="all", description="Stage to summarize")


@router.post("/batch-generate")
async def batch_generate_summaries(
    request: BatchGenerateRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
):
    """
    Generate summaries for multiple experiences
    """
    try:
        user_id = str(current_user.id)

        # Initialize summarization service
        summarization_service = ExperienceSummarizationService(db)

        results = []
        errors = []

        for experience_id in request.experience_ids:
            try:
                summary_result = (
                    await summarization_service.generate_experience_summary(
                        user_id=user_id,
                        experience_id=experience_id,
                        stage=request.stage,
                    )
                )
                results.append(
                    {
                        "experience_id": experience_id,
                        "summary_id": summary_result["summary_id"],
                        "status": "success",
                    }
                )
            except Exception as e:
                logger.error(
                    f"Error generating summary for experience {experience_id}: {str(e)}"
                )
                errors.append({"experience_id": experience_id, "error": str(e)})

        return {
            "successful_summaries": results,
            "failed_summaries": errors,
            "total_requested": len(request.experience_ids),
            "successful_count": len(results),
            "failed_count": len(errors),
        }

    except Exception as e:
        logger.error(f"Error in batch summary generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process batch summary generation",
        )


@router.get("/analytics/overview")
async def get_summary_analytics(
    current_user: dict = Depends(get_current_user), db: Database = Depends(get_database)
):
    """
    Get analytics overview of user's experience summaries
    """
    try:
        user_id = str(current_user.id)

        # Initialize summarization service
        summarization_service = ExperienceSummarizationService(db)

        # Get all summaries for analytics
        summaries = await summarization_service.get_experience_summaries(
            user_id=user_id
        )

        if not summaries:
            return {
                "total_summaries": 0,
                "stage_distribution": {},
                "average_score": 0,
                "tag_distribution": {},
                "recent_activity": [],
            }

        # Calculate analytics
        total_summaries = len(summaries)

        # Stage distribution
        stage_distribution = {}
        scores = []
        tag_counts = {}

        for summary in summaries:
            stage = summary.get("stage", "unknown")
            stage_distribution[stage] = stage_distribution.get(stage, 0) + 1

            # Extract score and tags from metadata
            summary_data = summary.get("summary_data", {})
            metadata = summary_data.get("summary_metadata", {})

            if "summary_score" in metadata:
                scores.append(metadata["summary_score"])

            for tag in metadata.get("tags", []):
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

        # Calculate average score
        average_score = sum(scores) / len(scores) if scores else 0

        # Get recent activity (last 5 summaries)
        recent_summaries = sorted(
            summaries, key=lambda x: x["created_at"], reverse=True
        )[:5]
        recent_activity = [
            {
                "summary_id": s["summary_id"],
                "experience_id": s["experience_id"],
                "stage": s["stage"],
                "created_at": s["created_at"],
            }
            for s in recent_summaries
        ]

        return {
            "total_summaries": total_summaries,
            "stage_distribution": stage_distribution,
            "average_score": round(average_score, 1),
            "tag_distribution": tag_counts,
            "recent_activity": recent_activity,
        }

    except Exception as e:
        logger.error(f"Error getting summary analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve summary analytics",
        )
