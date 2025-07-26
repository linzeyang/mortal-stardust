"""
API endpoints for Stage 1 AI processing - Psychological healing solution generation.

This module provides endpoints for the first stage of the three-stage AI processing pipeline.
Stage 1 focuses on psychological healing and emotional support, analyzing user experiences
to provide empathetic responses, coping strategies, and emotional validation.

The processing flow:
1. User submits an experience for Stage 1 processing
2. System validates experience ownership and checks for existing solutions
3. Background task processes the experience through AI service
4. Results are encrypted and stored in the database
5. User can poll for status and retrieve completed results

Key Features:
- Asynchronous background processing for better user experience
- Automatic encryption of sensitive AI-generated content
- Support for solution regeneration based on user feedback
- Comprehensive error handling and status tracking
- Priority-based processing queue support

Dependencies:
- enhanced_ai_service: Core AI processing logic
- encryption utilities: For securing sensitive content
- MongoDB: For persistent storage of solutions and experiences
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
from ..utils.field_encryption import decrypt_solution_data, encrypt_solution_data

router = APIRouter(prefix="/api/ai/stage1", tags=["ai-stage1"])


class Stage1ProcessingRequest(BaseModel):
    """Request model for Stage 1 AI processing.

    Attributes:
        experience_id (str): MongoDB ObjectId of the experience to process
        priority (str, optional): Processing priority level. Defaults to "normal".
            - "normal": Standard processing queue
            - "high": Priority processing for urgent cases
        additional_context (Dict[str, Any], optional): Extra context for AI processing.
            Can include user preferences, previous feedback, or specific instructions.
    """

    experience_id: str
    priority: Optional[str] = "normal"  # normal, high
    additional_context: Optional[Dict[str, Any]] = None


class Stage1ProcessingResponse(BaseModel):
    """Response model for Stage 1 processing initiation.

    Attributes:
        solution_id (str): MongoDB ObjectId of the created/updated solution record
        status (str): Current processing status
            - "processing": Background task started successfully
            - "already_exists": Solution already completed for this experience
        stage (int): Processing stage number (always 1 for this endpoint)
        processing_time (float): Time taken for initial processing (usually 0.0 for async)
        confidence_score (float): AI confidence in the solution (0.0 during processing)
        message (str): Human-readable status message for user feedback
    """

    solution_id: str
    status: str
    stage: int
    processing_time: float
    confidence_score: float
    message: str


@router.post("/process", response_model=Stage1ProcessingResponse)
async def process_stage1(
    request: Stage1ProcessingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Process Stage 1 AI analysis - Psychological healing solution generation.

    This endpoint initiates the first stage of AI processing, which focuses on
    psychological healing and emotional support. It analyzes the user's experience
    to provide empathetic responses, coping strategies, and emotional validation.

    The processing is handled asynchronously in the background to provide better
    user experience. The client should poll the status endpoint to check for
    completion and then retrieve results using the result endpoint.

    Args:
        request (Stage1ProcessingRequest): Processing request with experience ID and options
        background_tasks (BackgroundTasks): FastAPI background task manager
        current_user (User): Authenticated user from JWT token
        db: MongoDB database connection

    Returns:
        Stage1ProcessingResponse: Processing initiation response with solution ID and status

    Raises:
        HTTPException: 404 if experience not found or access denied
        HTTPException: 500 for internal processing errors

    Example:
        POST /api/ai/stage1/process
        {
            "experience_id": "507f1f77bcf86cd799439011",
            "priority": "high",
            "additional_context": {"focus": "anxiety_management"}
        }

    Processing Flow:
        1. Validates experience exists and belongs to current user
        2. Checks for existing Stage 1 solution to avoid duplicates
        3. Creates or updates solution record with PROCESSING status
        4. Starts background task for AI processing
        5. Returns solution ID for status polling
    """
    try:
        # Validate experience exists and belongs to user
        # This ensures data privacy and prevents unauthorized access to other users' experiences
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

        # Check if Stage 1 solution already exists
        # Prevents duplicate processing and unnecessary AI API calls
        # Each experience can only have one solution per stage
        existing_solution = await db.solutions.find_one(
            {
                "experienceId": request.experience_id,
                "stage": 1,
                "userId": current_user.id,
            }
        )

        if (
            existing_solution
            and existing_solution.get("status") == SolutionStatus.COMPLETED
        ):
            return Stage1ProcessingResponse(
                solution_id=str(existing_solution["_id"]),
                status="already_exists",
                stage=1,
                processing_time=0.0,
                confidence_score=existing_solution.get("metadata", {}).get(
                    "confidence_score", 0.0
                ),
                message="Stage 1 solution already exists for this experience",
            )

        # Create or update solution record
        # This creates a database record to track processing status and store results
        solution_id = None
        if existing_solution:
            # Reprocess existing solution (e.g., after failure or user request)
            solution_id = str(existing_solution["_id"])
            # Update status to processing and record when processing started
            await db.solutions.update_one(
                {"_id": ObjectId(solution_id)},
                {
                    "$set": {
                        "status": SolutionStatus.PROCESSING,
                        "updatedAt": datetime.utcnow(),
                        "processingStartedAt": datetime.utcnow(),
                    }
                },
            )
        else:
            # Create new solution record with initial metadata
            # stageName helps identify the type of processing for analytics
            solution_doc = {
                "userId": current_user.id,
                "experienceId": request.experience_id,
                "stage": 1,
                "stageName": "psychological_healing",
                "status": SolutionStatus.PROCESSING,
                "priority": request.priority,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "processingStartedAt": datetime.utcnow(),
            }

            result = await db.solutions.insert_one(solution_doc)
            solution_id = result.inserted_id

        # Start background processing
        # Background task prevents blocking the API response while AI processes the experience
        # This improves user experience by allowing immediate response with status polling
        background_tasks.add_task(
            process_stage1_background,
            str(solution_id),
            str(request.experience_id),
            experience_doc[
                "role"
            ],  # role affects AI prompt selection and response style
            request.additional_context
            or {},  # Additional context for personalized processing
        )

        return Stage1ProcessingResponse(
            solution_id=str(solution_id),
            status="processing",
            stage=1,
            processing_time=0.0,
            confidence_score=0.0,
            message="Stage 1 processing started successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start Stage 1 processing: {str(e)}",
        )


@router.get("/status/{solution_id}")
async def get_stage1_status(
    solution_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Get the current status of Stage 1 processing.

    This endpoint allows clients to poll for processing status updates.
    It's designed for real-time status monitoring in the frontend UI.

    Args:
        solution_id (str): MongoDB ObjectId of the solution to check
        current_user (User): Authenticated user from JWT token
        db: MongoDB database connection

    Returns:
        dict: Status information including processing timestamps and confidence score

    Raises:
        HTTPException: 404 if solution not found or access denied
        HTTPException: 500 for database errors

    Example Response:
        {
            "solution_id": "507f1f77bcf86cd799439011",
            "status": "completed",
            "stage": 1,
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:32:15Z",
            "processing_started_at": "2024-01-15T10:30:05Z",
            "completed_at": "2024-01-15T10:32:15Z",
            "confidence_score": 0.87,
            "error_message": null
        }

    Status Values:
        - "processing": AI is currently analyzing the experience
        - "completed": Processing finished successfully, result available
        - "failed": Processing encountered an error, check error_message
    """
    try:
        solution_doc = await db.solutions.find_one(
            {
                "_id": ObjectId(solution_id),
                "userId": current_user.id,
                "stage": 1,
            }
        )

        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 1 solution not found",
            )

        return {
            "solution_id": str(solution_doc["_id"]),
            "status": solution_doc["status"],
            "stage": solution_doc["stage"],
            "created_at": (
                solution_doc["createdAt"].isoformat()
                if solution_doc.get("createdAt")
                else None
            ),
            "updated_at": (
                solution_doc["updatedAt"].isoformat()
                if solution_doc.get("updatedAt")
                else None
            ),
            "processing_started_at": (
                solution_doc.get("processingStartedAt").isoformat()
                if solution_doc.get("processingStartedAt")
                else None
            ),
            "completed_at": (
                solution_doc.get("completedAt").isoformat()
                if solution_doc.get("completedAt")
                else None
            ),
            "confidence_score": solution_doc.get("metadata", {}).get(
                "confidence_score", 0.0
            ),
            "error_message": solution_doc.get("errorMessage"),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Stage 1 status: {str(e)}",
        )


@router.get("/result/{solution_id}")
async def get_stage1_result(
    solution_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Get the Stage 1 processing result.

    Retrieves the completed AI-generated psychological healing solution.
    The content is automatically decrypted before being returned to ensure
    data security while providing seamless access to authorized users.

    Args:
        solution_id (str): MongoDB ObjectId of the completed solution
        current_user (User): Authenticated user from JWT token
        db: MongoDB database connection

    Returns:
        dict: Complete solution with decrypted content and metadata

    Raises:
        HTTPException: 404 if solution not found or access denied
        HTTPException: 400 if processing not completed yet
        HTTPException: 500 for decryption or database errors

    Example Response:
        {
            "solution_id": "507f1f77bcf86cd799439011",
            "stage": 1,
            "stage_name": "psychological_healing",
            "status": "completed",
            "content": {
                "title": "Emotional Support for Your Situation",
                "content": "Based on your experience...",
                "recommendations": ["Practice mindfulness...", "Seek support..."],
                "coping_strategies": ["Deep breathing exercises...", "Journaling..."],
                "emotional_support": ["Your feelings are valid...", "It's okay to..."],
                "resources": [{"type": "article", "url": "...", "title": "..."}]
            },
            "metadata": {
                "confidence_score": 0.87,
                "processing_time": 45.2,
                "generated_at": "2024-01-15T10:32:15Z",
                "user_role": "student"
            },
            "created_at": "2024-01-15T10:30:00Z",
            "completed_at": "2024-01-15T10:32:15Z"
        }

    Security Notes:
        - All sensitive content is encrypted in the database
        - Decryption happens only during authorized access
        - User can only access their own solutions
    """
    try:
        solution_doc = await db.solutions.find_one(
            {
                "_id": ObjectId(solution_id),
                "userId": current_user.id,
                "stage": 1,
            }
        )

        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 1 solution not found",
            )

        if solution_doc["status"] != SolutionStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stage 1 processing not completed. Current status: {solution_doc['status']}",
            )

        # Decrypt the solution content using field-level decryption
        # All sensitive AI-generated content is encrypted at rest for security
        decrypted_solution = decrypt_solution_data(dict(solution_doc))

        # Extract the decrypted content
        content = decrypted_solution.get("content", {})
        decrypted_content = {
            "title": content.get("title", ""),
            "description": content.get(
                "description", ""
            ),  # Maps to old "content" field
            "recommendations": content.get("recommendations", []),
            "actionSteps": content.get(
                "actionSteps", []
            ),  # Maps to old "coping_strategies"
            "emotional_support": content.get("emotional_support", []),
            "resources": content.get("resources", []),  # Resources are not encrypted
        }

        return {
            "solution_id": str(solution_doc["_id"]),
            "stage": decrypted_solution["stage"],
            "stage_name": decrypted_solution["stageName"],
            "status": decrypted_solution["status"],
            "content": decrypted_content,
            "metadata": {
                "confidence_score": decrypted_solution.get("metadata", {}).get(
                    "confidence_score", 0.0
                ),
                "processing_time": decrypted_solution.get("metadata", {}).get(
                    "processing_time", 0.0
                ),
                "generated_at": decrypted_solution.get("metadata", {}).get(
                    "generated_at"
                ),
                "user_role": decrypted_solution.get("metadata", {}).get("user_role"),
            },
            "aiMetadata": decrypted_solution.get(
                "aiMetadata", {}
            ),  # Include AI metadata
            "created_at": decrypted_solution["createdAt"].isoformat(),
            "completed_at": (
                decrypted_solution.get("completedAt").isoformat()
                if decrypted_solution.get("completedAt")
                else None
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Stage 1 result: {str(e)}",
        )


@router.post("/regenerate/{solution_id}")
async def regenerate_stage1_solution(
    solution_id: str,
    background_tasks: BackgroundTasks,
    feedback: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Regenerate Stage 1 solution based on user feedback.

    This endpoint allows users to request a new version of their Stage 1 solution
    when the initial result doesn't meet their needs. User feedback is incorporated
    into the regeneration process to improve the quality and relevance of the new solution.

    Args:
        solution_id (str): MongoDB ObjectId of the solution to regenerate
        background_tasks (BackgroundTasks): FastAPI background task manager
        feedback (Dict[str, Any], optional): User feedback to guide regeneration
        current_user (User): Authenticated user from JWT token
        db: MongoDB database connection

    Returns:
        dict: Regeneration status with solution ID and message

    Raises:
        HTTPException: 404 if solution not found or access denied
        HTTPException: 500 for processing errors

    Example Request:
        POST /api/ai/stage1/regenerate/507f1f77bcf86cd799439011
        {
            "feedback": {
                "issues": ["too generic", "missing specific advice"],
                "preferences": ["more practical steps", "focus on anxiety"],
                "rating": 2
            }
        }

    Feedback Processing:
        - User feedback is stored with the solution for analytics
        - Regeneration count is tracked to prevent excessive API usage
        - Previous solution content is preserved until new version completes
        - Feedback influences AI prompt selection and response generation
    """
    try:
        solution_doc = await db.solutions.find_one(
            {
                "_id": ObjectId(solution_id),
                "userId": current_user.id,
                "stage": 1,
            }
        )

        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 1 solution not found",
            )

        # Update solution status to processing
        # Track regeneration attempts to prevent abuse and for analytics
        # Store user feedback to improve future AI responses
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.PROCESSING,
                    "updatedAt": datetime.utcnow(),
                    "regenerationCount": solution_doc.get("regenerationCount", 0) + 1,
                    "lastFeedback": feedback,  # Used by AI service to improve response
                }
            },
        )

        # Start background regeneration
        # Regeneration uses the same background task but with additional context
        # The "regeneration" flag tells the AI service to consider previous attempts
        background_tasks.add_task(
            process_stage1_background,
            solution_id,
            str(solution_doc["experienceId"]),
            current_user.role,
            {
                "regeneration": True,
                "feedback": feedback,
            },  # Context for improved generation
        )

        return {
            "solution_id": solution_id,
            "status": "regenerating",
            "message": "Stage 1 solution regeneration started",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate Stage 1 solution: {str(e)}",
        )


async def process_stage1_background(
    solution_id: str,
    experience_id: str,
    user_role: str,
    additional_context: Dict[str, Any],
):
    """
    Background task for Stage 1 AI processing.

    This function handles the actual AI processing in the background, allowing
    the API to respond immediately while the AI generates the solution. It manages
    the complete processing pipeline from data preparation to result storage.

    Args:
        solution_id (str): MongoDB ObjectId of the solution record to update
        experience_id (str): MongoDB ObjectId of the experience to process
        user_role (str): User's role for personalized AI responses
        additional_context (Dict[str, Any]): Extra context including feedback and preferences

    Processing Steps:
        1. Establishes database connection for background task
        2. Retrieves experience data and associated media files
        3. Prepares data structure for AI service consumption
        4. Calls enhanced AI service for Stage 1 processing
        5. Updates solution record with encrypted results
        6. Handles errors by updating solution status appropriately

    Error Handling:
        - Database connection errors are logged and solution marked as failed
        - AI processing errors are captured and stored in solution record
        - All exceptions are logged for debugging and monitoring
        - Database connection is always closed in finally block

    Security Considerations:
        - Creates isolated database connection for background processing
        - AI-generated content is encrypted before database storage
        - User data access is validated through experience ownership
    """
    from motor.motor_asyncio import AsyncIOMotorClient

    from ..core.config import settings

    # Create database connection for background task
    # Background tasks need their own database connection since they run outside request context
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]

    try:
        # Get experience data
        # Experience contains the user's input that needs AI analysis
        experience_doc = await db.experiences.find_one({"_id": ObjectId(experience_id)})
        if not experience_doc:
            raise Exception("Experience not found")

        # Get media files associated with this experience
        # Media files (images, audio, video) provide additional context for AI processing
        # Limited to 50 files to prevent memory issues and excessive processing time
        media_files = await db.media_files.find(
            {
                "userId": experience_doc["userId"],
                "experienceId": ObjectId(experience_id),
            }
        ).to_list(length=50)

        # Prepare experience data for AI processing
        # Structure data in format expected by AI service
        # formData contains user's structured input from the experience form
        experience_data = {
            "data": experience_doc.get(
                "formData", {}
            ),  # User's text input and form responses
            "media_files": media_files,  # Associated images, audio, video for context
            "additional_context": additional_context,  # Feedback, preferences, regeneration flags
        }

        # Process with enhanced AI service
        # Stage 1 focuses on psychological healing and emotional support
        # User role influences prompt selection and response style (student, professional, etc.)
        result = await enhanced_ai_service.process_experience_stage1(
            experience_data, user_role
        )

        # Update solution with results
        solution_data = {
            "status": SolutionStatus.COMPLETED,
            "content": result["content"],  # AI-generated content
            "aiMetadata": result.get(
                "metadata", {}
            ),  # Processing stats and confidence scores
            "completedAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        # Apply field-level encryption
        encrypted_solution_data = encrypt_solution_data(solution_data)

        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {"$set": encrypted_solution_data},
        )

    except Exception as e:
        # Update solution with error status
        # Error handling ensures user gets feedback about processing failures
        # Error messages are stored for debugging and user support
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.FAILED,
                    "errorMessage": str(e),  # Error details for debugging
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        # Log error for monitoring and debugging
        print(f"Stage 1 processing failed for solution {solution_id}: {e}")

    finally:
        # Always close database connection to prevent connection leaks
        # Critical for background tasks that create their own connections
        client.close()
