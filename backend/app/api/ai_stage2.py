"""
API endpoints for Stage 2 AI processing - Practical solution generation.
"""

from datetime import datetime
from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel

from ..core.database import get_database
from ..dependencies import get_current_user
from ..models.solution import SolutionStatus
from ..models.user import User
from ..services.enhanced_ai_service import enhanced_ai_service
from ..utils.encryption import decrypt_data

router = APIRouter(prefix="/api/ai/stage2", tags=["ai-stage2"])


class Stage2ProcessingRequest(BaseModel):
    experience_id: str
    stage1_solution_id: Optional[str] = None  # Optional reference to Stage 1 solution
    priority: Optional[str] = "normal"  # normal, high
    additional_context: Optional[Dict[str, Any]] = None


class Stage2ProcessingResponse(BaseModel):
    solution_id: str
    status: str
    stage: int
    processing_time: float
    confidence_score: float
    message: str


@router.post("/process", response_model=Stage2ProcessingResponse)
async def process_stage2(
    request: Stage2ProcessingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Process Stage 2 AI analysis - Practical solution generation.

    This endpoint takes a user's experience and generates practical,
    actionable solutions and recommendations.
    """
    try:
        # Validate experience exists and belongs to user
        experience_doc = await db.experiences.find_one(
            {
                "_id": ObjectId(request.experience_id),
                "userId": ObjectId(current_user.id),
            }
        )

        if not experience_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Experience not found or access denied",
            )

        # Check if Stage 2 solution already exists
        existing_solution = await db.solutions.find_one(
            {
                "experienceId": ObjectId(request.experience_id),
                "stage": 2,
                "userId": ObjectId(current_user.id),
            }
        )

        if (
            existing_solution
            and existing_solution.get("status") == SolutionStatus.COMPLETED
        ):
            return Stage2ProcessingResponse(
                solution_id=str(existing_solution["_id"]),
                status="already_exists",
                stage=2,
                processing_time=0.0,
                confidence_score=existing_solution.get("metadata", {}).get(
                    "confidence_score", 0.0
                ),
                message="Stage 2 solution already exists for this experience",
            )

        # Optionally get Stage 1 solution for context
        stage1_solution = None
        if request.stage1_solution_id:
            stage1_solution = await db.solutions.find_one(
                {
                    "_id": ObjectId(request.stage1_solution_id),
                    "userId": ObjectId(current_user.id),
                    "stage": 1,
                }
            )

        # Create or update solution record
        solution_id = None
        if existing_solution:
            solution_id = existing_solution["_id"]
            # Update status to processing
            await db.solutions.update_one(
                {"_id": solution_id},
                {
                    "$set": {
                        "status": SolutionStatus.PROCESSING,
                        "updatedAt": datetime.utcnow(),
                        "processingStartedAt": datetime.utcnow(),
                    }
                },
            )
        else:
            # Create new solution record
            solution_doc = {
                "userId": ObjectId(current_user.id),
                "experienceId": ObjectId(request.experience_id),
                "stage": 2,
                "stageName": "practical_solutions",
                "status": SolutionStatus.PROCESSING,
                "priority": request.priority,
                "stage1SolutionId": (
                    ObjectId(request.stage1_solution_id)
                    if request.stage1_solution_id
                    else None
                ),
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "processingStartedAt": datetime.utcnow(),
            }

            result = await db.solutions.insert_one(solution_doc)
            solution_id = result.inserted_id

        # Start background processing
        background_tasks.add_task(
            process_stage2_background,
            str(solution_id),
            str(request.experience_id),
            str(request.stage1_solution_id) if request.stage1_solution_id else None,
            current_user.role,
            request.additional_context or {},
        )

        return Stage2ProcessingResponse(
            solution_id=str(solution_id),
            status="processing",
            stage=2,
            processing_time=0.0,
            confidence_score=0.0,
            message="Stage 2 processing started successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start Stage 2 processing: {str(e)}",
        )


@router.get("/status/{solution_id}")
async def get_stage2_status(
    solution_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """Get the current status of Stage 2 processing."""
    try:
        solution_doc = await db.solutions.find_one(
            {
                "_id": ObjectId(solution_id),
                "userId": ObjectId(current_user.id),
                "stage": 2,
            }
        )

        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 2 solution not found",
            )

        # Decrypt content if needed
        content = solution_doc.get("content", {})
        if content and solution_doc.get("status") == SolutionStatus.COMPLETED:
            try:
                if isinstance(content.get("title"), str) and content[
                    "title"
                ].startswith("encrypted:"):
                    content["title"] = decrypt_data(content["title"])
                if isinstance(content.get("description"), str) and content[
                    "description"
                ].startswith("encrypted:"):
                    content["description"] = decrypt_data(content["description"])
                if isinstance(content.get("recommendations"), list):
                    content["recommendations"] = [
                        (
                            decrypt_data(rec)
                            if isinstance(rec, str) and rec.startswith("encrypted:")
                            else rec
                        )
                        for rec in content["recommendations"]
                    ]
                if isinstance(content.get("actionSteps"), list):
                    content["actionSteps"] = [
                        (
                            decrypt_data(step)
                            if isinstance(step, str) and step.startswith("encrypted:")
                            else step
                        )
                        for step in content["actionSteps"]
                    ]
            except Exception as e:
                print(f"Decryption warning: {e}")

        return {
            "solution_id": str(solution_doc["_id"]),
            "status": solution_doc.get("status", SolutionStatus.PROCESSING),
            "stage": solution_doc.get("stage", 2),
            "content": content,
            "processing_time": solution_doc.get("processingTime", 0.0),
            "confidence_score": solution_doc.get("metadata", {}).get(
                "confidence_score", 0.0
            ),
            "created_at": solution_doc.get("createdAt"),
            "updated_at": solution_doc.get("updatedAt"),
            "stage1_solution_id": (
                str(solution_doc["stage1SolutionId"])
                if solution_doc.get("stage1SolutionId")
                else None
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Stage 2 status: {str(e)}",
        )


@router.get("/result/{solution_id}")
async def get_stage2_result(
    solution_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Get the Stage 2 processing result.

    Retrieves the completed AI-generated practical solution.
    The content is automatically decrypted before being returned.
    """
    try:
        solution_doc = await db.solutions.find_one(
            {
                "_id": ObjectId(solution_id),
                "userId": ObjectId(current_user.id),
                "stage": 2,
            }
        )

        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 2 solution not found",
            )

        if solution_doc["status"] not in [SolutionStatus.COMPLETED, SolutionStatus.GENERATED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stage 2 processing not completed. Current status: {solution_doc['status']}",
            )

        # Decrypt the solution content
        content = solution_doc.get("content", {})
        decrypted_content = {
            "title": decrypt_data(content.get("title", "")),
            "description": decrypt_data(content.get("description", "")),
            "actionSteps": [
                decrypt_data(step) for step in content.get("actionSteps", [])
            ],
            "recommendations": [
                decrypt_data(rec) for rec in content.get("recommendations", [])
            ],
            "implementation_timeline": content.get("implementation_timeline", {}),
            "resources": content.get("resources", []),  # Resources are not encrypted
            "success_metrics": content.get("success_metrics", []),
        }

        return {
            "solution_id": str(solution_doc["_id"]),
            "stage": solution_doc["stage"],
            "stage_name": solution_doc["stageName"],
            "status": solution_doc["status"],
            "content": decrypted_content,
            "metadata": {
                "confidence_score": solution_doc.get("metadata", {}).get(
                    "confidence_score", 0.0
                ),
                "processing_time": solution_doc.get("metadata", {}).get(
                    "processing_time", 0.0
                ),
                "generated_at": solution_doc.get("metadata", {}).get("generated_at"),
                "user_role": solution_doc.get("metadata", {}).get("user_role"),
                "stage1_integration": solution_doc.get("metadata", {}).get("stage1_integration", False),
            },
            "created_at": solution_doc["createdAt"].isoformat(),
            "completed_at": (
                solution_doc.get("completedAt").isoformat()
                if solution_doc.get("completedAt")
                else None
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Stage 2 result: {str(e)}",
        )


async def process_stage2_background(
    solution_id: str,
    experience_id: str,
    stage1_solution_id: Optional[str],
    user_role: str,
    additional_context: Dict[str, Any],
):
    """
    Background task for Stage 2 AI processing - Practical solutions generation.

    This function handles the asynchronous processing of Stage 2 AI analysis,
    which focuses on generating practical, actionable solutions based on the
    user's experience and optionally building upon Stage 1 psychological healing.

    Args:
        solution_id (str): MongoDB ObjectId of the solution record to update
        experience_id (str): MongoDB ObjectId of the experience to process
        stage1_solution_id (Optional[str]): ObjectId of Stage 1 solution for context
        user_role (str): User's role for personalized solution generation
        additional_context (Dict[str, Any]): Extra context and preferences

    Processing Flow:
        1. Establishes database connection for background processing
        2. Retrieves experience data and optional Stage 1 solution
        3. Calls enhanced AI service for Stage 2 practical solution generation
        4. Calculates processing time and performance metrics
        5. Updates solution record with encrypted results and metadata
        6. Handles errors by updating solution status appropriately

    Stage 2 Features:
        - Builds upon Stage 1 emotional healing with practical steps
        - Generates specific, actionable recommendations
        - Provides time-bound action plans with milestones
        - Includes resource recommendations for skill development
        - Adapts solutions based on user role and context

    Error Handling:
        - Database connection errors are logged and solution marked as failed
        - AI processing errors are captured and stored in solution record
        - Processing time is tracked even for failed attempts
        - Solution status is updated to GENERATED (retry-able) on failure

    Performance Tracking:
        - Processing time calculation from start to completion
        - Confidence score from AI service for solution quality
        - Integration flags for Stage 1 context usage
        - Context provision tracking for analytics
    """
    # Track processing time for performance monitoring and user feedback
    start_time = datetime.utcnow()

    from motor.motor_asyncio import AsyncIOMotorClient
    from ..core.config import settings

    # Create database connection for background task
    # Background tasks need their own database connection since they run outside request context
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]

    try:

        # Get experience data containing user's original input
        # This provides the context for practical solution generation
        experience_doc = await db.experiences.find_one({"_id": ObjectId(experience_id)})

        if not experience_doc:
            raise Exception("Experience not found")

        # Get Stage 1 solution if available for context integration
        # Stage 1 provides emotional healing context that Stage 2 builds upon
        stage1_solution_doc = None
        if stage1_solution_id:
            stage1_solution_doc = await db.solutions.find_one(
                {"_id": ObjectId(stage1_solution_id)}
            )

        # Process with enhanced AI service for Stage 2 practical solutions
        # This generates actionable steps, strategies, and resource recommendations
        processing_result = await enhanced_ai_service.process_experience_stage2(
            experience_data=experience_doc,  # Original user experience
            stage1_solution=stage1_solution_doc,  # Optional emotional healing context
            user_role=user_role,  # Personalizes solutions for role-specific needs
            additional_context=additional_context,  # User preferences and feedback
        )

        # Calculate total processing time including AI API calls and data processing
        processing_time = (datetime.utcnow() - start_time).total_seconds()

        # Update solution record with AI-generated results and metadata
        # Content is encrypted by the AI service before storage
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.COMPLETED,  # Mark as successfully completed
                    "content": processing_result[
                        "content"
                    ],  # Encrypted AI-generated content
                    "aiMetadata": processing_result[
                        "ai_metadata"
                    ],  # AI processing details
                    "metadata": {
                        "confidence_score": processing_result.get(
                            "confidence_score", 0.8
                        ),  # AI confidence in solution quality
                        "processing_time": processing_time,  # Total processing duration
                        "stage1_integration": bool(
                            stage1_solution_doc
                        ),  # Used Stage 1 context
                        "context_provided": bool(
                            additional_context
                        ),  # Had additional context
                    },
                    "processingTime": processing_time,  # Duplicate for compatibility
                    "updatedAt": datetime.utcnow(),  # Last update timestamp
                    "completedAt": datetime.utcnow(),  # Completion timestamp
                }
            },
        )

        # Log successful completion for monitoring and debugging
        print(f"✅ Stage 2 processing completed for solution {solution_id}")

    except Exception as e:
        # Log processing failure with details for debugging
        print(f"❌ Stage 2 processing failed for solution {solution_id}: {e}")

        # Update solution with error status and details
        # Status is set to GENERATED (not FAILED) to allow retry attempts
        try:
            await db.solutions.update_one(
                {"_id": ObjectId(solution_id)},
                {
                    "$set": {
                        "status": SolutionStatus.GENERATED,  # Retry-able status
                        "error": str(e),  # Error details for debugging
                        "updatedAt": datetime.utcnow(),  # Update timestamp
                        "processingTime": (
                            datetime.utcnow() - start_time
                        ).total_seconds(),  # Time spent before failure
                    }
                },
            )
        except Exception as db_error:
            # Log database update failures for system monitoring
            print(f"Failed to update solution error status: {db_error}")

    finally:
        # Always close database connection to prevent connection leaks
        # Critical for background tasks that create their own connections
        client.close()
