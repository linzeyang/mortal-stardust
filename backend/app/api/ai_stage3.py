"""
API endpoints for Stage 3 AI processing - Follow-up and experience supplementation.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel

from ..core.database import get_database
from ..dependencies import get_current_user
from ..models.solution import SolutionStatus
from ..models.user import User
from ..services.enhanced_ai_service import enhanced_ai_service
from ..utils.field_encryption import decrypt_solution_data, encrypt_solution_data

router = APIRouter(prefix="/api/ai/stage3", tags=["ai-stage3"])


class FollowUpData(BaseModel):
    progress_rating: int  # 1-10 scale
    implemented_actions: List[str]
    challenges_faced: List[str]
    success_stories: List[str]
    additional_concerns: Optional[str] = None
    satisfaction_level: int  # 1-10 scale


class Stage3ProcessingRequest(BaseModel):
    experience_id: str
    stage1_solution_id: Optional[str] = None
    stage2_solution_id: Optional[str] = None
    follow_up_data: Optional[FollowUpData] = None
    days_since_initial: Optional[int] = None
    priority: Optional[str] = "normal"  # normal, high
    additional_context: Optional[Dict[str, Any]] = None


class Stage3ProcessingResponse(BaseModel):
    solution_id: str
    status: str
    stage: int
    processing_time: float
    confidence_score: float
    message: str
    follow_up_scheduled: Optional[str] = None


@router.post("/process", response_model=Stage3ProcessingResponse)
async def process_stage3(
    request: Stage3ProcessingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Process Stage 3 AI analysis - Follow-up and experience supplementation.

    This endpoint provides ongoing support, progress tracking, and
    adaptive recommendations based on user's implementation progress.
    """
    try:
        # Validate experience exists and belongs to user
        experience_doc = await db.experiences.find_one(
            {
                "_id": ObjectId(request.experience_id),
                "userId": current_user.id,
            }
        )

        if not experience_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Experience not found or access denied",
            )

        # Check if Stage 3 solution already exists
        existing_solution = await db.solutions.find_one(
            {
                "experienceId": request.experience_id,
                "stage": 3,
                "userId": current_user.id,
            }
        )

        # Get previous stage solutions for context
        stage1_solution = None
        stage2_solution = None

        if request.stage1_solution_id:
            stage1_solution = await db.solutions.find_one(
                {
                    "_id": request.stage1_solution_id,
                    "userId": current_user.id,
                    "stage": 1,
                }
            )

        if request.stage2_solution_id:
            stage2_solution = await db.solutions.find_one(
                {
                    "_id": request.stage2_solution_id,
                    "userId": current_user.id,
                    "stage": 2,
                }
            )

        # Create or update solution record
        solution_id = None
        if existing_solution:
            solution_id = str(existing_solution["_id"])
            # Update status to processing
            await db.solutions.update_one(
                {"_id": ObjectId(solution_id)},
                {
                    "$set": {
                        "status": SolutionStatus.PROCESSING,
                        "updatedAt": datetime.utcnow(),
                        "processingStartedAt": datetime.utcnow(),
                        "lastFollowUpData": (
                            request.follow_up_data.dict()
                            if request.follow_up_data
                            else None
                        ),
                    }
                },
            )
        else:
            # Create new solution record
            solution_doc = {
                "userId": current_user.id,
                "experienceId": request.experience_id,
                "stage": 3,
                "stageName": "follow_up_support",
                "status": SolutionStatus.PROCESSING,
                "priority": request.priority,
                "stage1SolutionId": (
                    request.stage1_solution_id if request.stage1_solution_id else None
                ),
                "stage2SolutionId": (
                    request.stage2_solution_id if request.stage2_solution_id else None
                ),
                "followUpData": (
                    request.follow_up_data.dict() if request.follow_up_data else None
                ),
                "daysSinceInitial": request.days_since_initial or 0,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "processingStartedAt": datetime.utcnow(),
            }

            result = await db.solutions.insert_one(solution_doc)
            solution_id = result.inserted_id

        # Calculate next follow-up date
        next_follow_up = datetime.utcnow() + timedelta(days=14)  # Default 2 weeks

        # Start background processing
        background_tasks.add_task(
            process_stage3_background,
            str(solution_id),
            str(request.experience_id),
            str(request.stage1_solution_id) if request.stage1_solution_id else None,
            str(request.stage2_solution_id) if request.stage2_solution_id else None,
            experience_doc["role"],
            request.follow_up_data.dict() if request.follow_up_data else {},
            request.additional_context or {},
        )

        return Stage3ProcessingResponse(
            solution_id=str(solution_id),
            status="processing",
            stage=3,
            processing_time=0.0,
            confidence_score=0.0,
            message="Stage 3 follow-up processing started successfully",
            follow_up_scheduled=next_follow_up.isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start Stage 3 processing: {str(e)}",
        )


@router.get("/status/{solution_id}")
async def get_stage3_status(
    solution_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """Get the current status of Stage 3 processing."""
    try:
        solution_doc = await db.solutions.find_one(
            {
                "_id": ObjectId(solution_id),
                "userId": current_user.id,
                "stage": 3,
            }
        )

        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 3 solution not found",
            )

        # Decrypt solution data using field-level decryption
        decrypted_solution = solution_doc
        if solution_doc.get("status") == SolutionStatus.COMPLETED:
            try:
                decrypted_solution = decrypt_solution_data(dict(solution_doc))
            except Exception as e:
                print(f"Decryption warning: {e}")
                # Fall back to original data if decryption fails
                decrypted_solution = solution_doc

        content = decrypted_solution.get("content", {})

        return {
            "solution_id": str(solution_doc["_id"]),
            "status": solution_doc.get("status", SolutionStatus.PROCESSING),
            "stage": solution_doc.get("stage", 3),
            "content": content,
            "processing_time": solution_doc.get("processingTime", 0.0),
            "confidence_score": solution_doc.get("metadata", {}).get(
                "confidence_score", 0.0
            ),
            "created_at": solution_doc.get("createdAt"),
            "updated_at": solution_doc.get("updatedAt"),
            "next_follow_up": solution_doc.get("nextFollowUp"),
            "follow_up_count": solution_doc.get("followUpCount", 0),
            "stage1_solution_id": (
                str(solution_doc["stage1SolutionId"])
                if solution_doc.get("stage1SolutionId")
                else None
            ),
            "stage2_solution_id": (
                str(solution_doc["stage2SolutionId"])
                if solution_doc.get("stage2SolutionId")
                else None
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Stage 3 status: {str(e)}",
        )


@router.post("/follow-up/{solution_id}")
async def submit_follow_up(
    solution_id: str,
    follow_up_data: FollowUpData,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """Submit follow-up data for ongoing Stage 3 processing."""
    try:
        solution_doc = await db.solutions.find_one(
            {
                "_id": ObjectId(solution_id),
                "userId": current_user.id,
                "stage": 3,
            }
        )

        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 3 solution not found",
            )

        # Update solution with new follow-up data
        follow_up_history = solution_doc.get("followUpHistory", [])
        follow_up_history.append(
            {"timestamp": datetime.utcnow(), "data": follow_up_data.dict()}
        )

        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "lastFollowUpData": follow_up_data.dict(),
                    "followUpHistory": follow_up_history,
                    "followUpCount": len(follow_up_history),
                    "status": SolutionStatus.PROCESSING,
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

        # Trigger new processing based on follow-up data
        background_tasks.add_task(
            process_follow_up_background,
            solution_id,
            follow_up_data.dict(),
            current_user.role,
        )

        return {
            "message": "Follow-up data submitted successfully",
            "follow_up_count": len(follow_up_history),
            "processing_started": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit follow-up data: {str(e)}",
        )


async def process_stage3_background(
    solution_id: str,
    experience_id: str,
    stage1_solution_id: Optional[str],
    stage2_solution_id: Optional[str],
    user_role: str,
    follow_up_data: Dict[str, Any],
    additional_context: Dict[str, Any],
):
    """
    Background task for Stage 3 AI processing - Follow-up and experience supplementation.

    This function handles the asynchronous processing of Stage 3 AI analysis,
    which focuses on long-term support, progress tracking, and adaptive recommendations
    based on user's implementation progress from previous stages.

    Args:
        solution_id (str): MongoDB ObjectId of the solution record to update
        experience_id (str): MongoDB ObjectId of the original experience
        stage1_solution_id (Optional[str]): ObjectId of Stage 1 healing solution
        stage2_solution_id (Optional[str]): ObjectId of Stage 2 practical solution
        user_role (str): User's role for personalized follow-up guidance
        follow_up_data (Dict[str, Any]): User's progress and feedback data
        additional_context (Dict[str, Any]): Extra context and preferences

    Processing Flow:
        1. Establishes database connection for background processing
        2. Retrieves experience and all previous stage solutions for context
        3. Calls enhanced AI service for Stage 3 follow-up processing
        4. Calculates processing time and schedules next follow-up
        5. Updates solution record with results and follow-up schedule
        6. Handles errors with appropriate status updates and logging

    Stage 3 Features:
        - Integrates context from all previous stages for comprehensive support
        - Analyzes user progress and implementation success
        - Provides adaptive recommendations based on actual outcomes
        - Schedules future follow-up sessions for continued support
        - Tracks long-term growth patterns and adjusts strategies

    Follow-up Data Processing:
        - Progress ratings and satisfaction levels
        - Successfully implemented actions and challenges faced
        - Success stories and additional concerns
        - Adaptive recommendations based on real outcomes

    Error Handling:
        - Comprehensive error logging for debugging and monitoring
        - Solution status updated to GENERATED for retry capability
        - Processing time tracked even for failed attempts
        - Database connection errors handled gracefully
    """
    # Track processing time for performance monitoring and follow-up scheduling
    start_time = datetime.utcnow()

    try:
        # Get database connection for background task processing
        db = get_database()

        # Get original experience data for context continuity
        # This maintains connection to the user's initial situation
        experience_doc = await db.experiences.find_one({"_id": ObjectId(experience_id)})

        if not experience_doc:
            raise Exception("Experience not found")

        # Get previous stage solutions for comprehensive context integration
        # Stage 3 builds upon both emotional healing and practical solutions
        stage1_solution_doc = None
        stage2_solution_doc = None

        if stage1_solution_id:
            # Stage 1 provides emotional healing context for follow-up support
            stage1_solution_doc = await db.solutions.find_one(
                {"_id": ObjectId(stage1_solution_id)}
            )

        if stage2_solution_id:
            # Stage 2 provides practical solutions context for progress tracking
            stage2_solution_doc = await db.solutions.find_one(
                {"_id": ObjectId(stage2_solution_id)}
            )

        # Process with enhanced AI service for Stage 3 follow-up support
        # This generates long-term growth plans and adaptive recommendations
        processing_result = await enhanced_ai_service.process_experience_stage3(
            experience_data=experience_doc,  # Original user experience for context
            stage1_solution=stage1_solution_doc,  # Emotional healing context
            stage2_solution=stage2_solution_doc,  # Practical solutions context
            follow_up_data=follow_up_data,  # User's progress and feedback
            user_role=user_role,  # Role-specific long-term guidance
            additional_context=additional_context,  # Extra preferences and context
        )

        # Calculate processing time and schedule next follow-up session
        # Default 14-day interval for regular progress check-ins
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        next_follow_up = datetime.utcnow() + timedelta(
            days=14
        )  # 2-week follow-up cycle

        solution_data = {
            "status": SolutionStatus.COMPLETED,  # Mark as successfully completed
            "content": processing_result["content"],  # Follow-up content
            "aiMetadata": processing_result["aiMetadata"],  # AI processing details
            "metadata": {
                "confidence_score": processing_result.get(
                    "confidence_score", 0.8
                ),  # AI confidence in follow-up quality
                "processing_time": processing_time,  # Total processing duration
                "has_follow_up_data": bool(
                    follow_up_data
                ),  # User provided progress data
                "stage1_integration": bool(stage1_solution_doc),  # Used healing context
                "stage2_integration": bool(
                    stage2_solution_doc
                ),  # Used practical context
                "context_provided": bool(additional_context),  # Had additional context
            },
            "processingTime": processing_time,  # Duplicate for compatibility
            "nextFollowUp": next_follow_up,  # Scheduled next follow-up date
            "updatedAt": datetime.utcnow(),  # Last update timestamp
            "completedAt": datetime.utcnow(),  # Completion timestamp
        }

        # Apply field-level encryption
        encrypted_solution_data = encrypt_solution_data(solution_data)

        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {"$set": encrypted_solution_data},
        )

        # Log successful completion for monitoring and follow-up tracking
        print(f"✅ Stage 3 processing completed for solution {solution_id}")

    except Exception as e:
        # Log processing failure with details for debugging and support
        print(f"❌ Stage 3 processing failed for solution {solution_id}: {e}")

        # Update solution with error status and preserve processing attempt data
        # Status is set to GENERATED (not FAILED) to allow retry attempts
        try:
            db = get_database()
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


async def process_follow_up_background(
    solution_id: str, follow_up_data: Dict[str, Any], user_role: str
):
    """
    Background task for processing follow-up data updates and adaptive recommendations.

    This function handles ongoing follow-up processing when users submit progress
    updates after initial Stage 3 completion. It generates adaptive recommendations
    based on real implementation results and user feedback.

    Args:
        solution_id (str): MongoDB ObjectId of the Stage 3 solution to update
        follow_up_data (Dict[str, Any]): User's progress data containing:
            - progress_rating: User's self-assessment of progress (1-10)
            - implemented_actions: List of actions successfully completed
            - challenges_faced: List of obstacles encountered
            - success_stories: List of positive outcomes achieved
            - additional_concerns: New concerns or questions
            - satisfaction_level: Overall satisfaction with solutions (1-10)
        user_role (str): User's role for personalized adaptive recommendations

    Processing Flow:
        1. Retrieves current Stage 3 solution from database
        2. Calls enhanced AI service for follow-up adaptation processing
        3. Generates adaptive recommendations based on real outcomes
        4. Updates solution with new adaptive content and progress assessment
        5. Handles errors with appropriate logging and status updates

    Adaptive Features:
        - Analyzes what worked and what didn't from user feedback
        - Adjusts recommendations based on implementation challenges
        - Celebrates successes and builds upon them
        - Addresses new concerns that emerged during implementation
        - Provides modified strategies for better outcomes

    Error Handling:
        - Comprehensive error logging for debugging
        - Graceful handling of database and AI service errors
        - Preserves original solution content if adaptation fails
        - Logs adaptation failures for system monitoring
    """
    try:
        # Get database connection for follow-up processing
        db = get_database()

        # Get current Stage 3 solution for context and baseline
        # This provides the foundation for adaptive recommendations
        solution_doc = await db.solutions.find_one({"_id": ObjectId(solution_id)})

        if not solution_doc:
            raise Exception("Solution not found")

        # Generate adaptive recommendations based on user's real-world implementation
        # This analyzes what worked, what didn't, and what needs adjustment
        adaptive_result = await enhanced_ai_service.process_follow_up_adaptation(
            current_solution=solution_doc,  # Existing solution as baseline
            follow_up_data=follow_up_data,  # User's progress and feedback
            user_role=user_role,  # Role-specific adaptive guidance
        )

        # Update solution with adaptive recommendations and progress assessment
        # This enhances the original solution with real-world implementation insights
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "adaptiveRecommendations": adaptive_result[
                        "adaptive_recommendations"
                    ],  # New recommendations based on outcomes
                    "progressAssessment": adaptive_result[
                        "progress_assessment"
                    ],  # Progress analysis
                    "status": SolutionStatus.COMPLETED,  # Maintain completed status
                    "updatedAt": datetime.utcnow(),  # Update timestamp
                    "lastAdaptation": datetime.utcnow(),  # Track last adaptation time
                }
            },
        )

        # Log successful adaptation for monitoring and user support tracking
        print(f"✅ Follow-up adaptation completed for solution {solution_id}")

    except Exception as e:
        # Log adaptation failure with details for debugging and system monitoring
        # Note: Solution status is not changed on adaptation failure to preserve original content
        print(f"❌ Follow-up adaptation failed for solution {solution_id}: {e}")
