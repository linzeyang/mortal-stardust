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
from ..utils.encryption import decrypt_data

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
                "userId": ObjectId(current_user.id),
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
                "experienceId": ObjectId(request.experience_id),
                "stage": 3,
                "userId": ObjectId(current_user.id),
            }
        )

        # Get previous stage solutions for context
        stage1_solution = None
        stage2_solution = None

        if request.stage1_solution_id:
            stage1_solution = await db.solutions.find_one(
                {
                    "_id": ObjectId(request.stage1_solution_id),
                    "userId": ObjectId(current_user.id),
                    "stage": 1,
                }
            )

        if request.stage2_solution_id:
            stage2_solution = await db.solutions.find_one(
                {
                    "_id": ObjectId(request.stage2_solution_id),
                    "userId": ObjectId(current_user.id),
                    "stage": 2,
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
                "userId": ObjectId(current_user.id),
                "experienceId": ObjectId(request.experience_id),
                "stage": 3,
                "stageName": "follow_up_support",
                "status": SolutionStatus.PROCESSING,
                "priority": request.priority,
                "stage1SolutionId": (
                    ObjectId(request.stage1_solution_id)
                    if request.stage1_solution_id
                    else None
                ),
                "stage2SolutionId": (
                    ObjectId(request.stage2_solution_id)
                    if request.stage2_solution_id
                    else None
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
            current_user.role,
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
                "userId": ObjectId(current_user.id),
                "stage": 3,
            }
        )

        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 3 solution not found",
            )

        # Decrypt content if needed
        content = solution_doc.get("content", {})
        if content and solution_doc.get("status") == SolutionStatus.COMPLETED:
            try:
                if isinstance(content.get("title"), str) and content[
                    "title"
                ].startswith("encrypted:"):
                    content["title"] = decrypt_data(content["title"])
                if isinstance(content.get("follow_up_plan"), str) and content[
                    "follow_up_plan"
                ].startswith("encrypted:"):
                    content["follow_up_plan"] = decrypt_data(content["follow_up_plan"])
                if isinstance(content.get("progress_assessment"), str) and content[
                    "progress_assessment"
                ].startswith("encrypted:"):
                    content["progress_assessment"] = decrypt_data(
                        content["progress_assessment"]
                    )
                if isinstance(content.get("adaptive_recommendations"), list):
                    content["adaptive_recommendations"] = [
                        (
                            decrypt_data(rec)
                            if isinstance(rec, str) and rec.startswith("encrypted:")
                            else rec
                        )
                        for rec in content["adaptive_recommendations"]
                    ]
            except Exception as e:
                print(f"Decryption warning: {e}")

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
                "userId": ObjectId(current_user.id),
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
    """Background task for Stage 3 AI processing."""
    start_time = datetime.utcnow()

    try:
        db = await get_database()

        # Get experience data
        experience_doc = await db.experiences.find_one({"_id": ObjectId(experience_id)})

        if not experience_doc:
            raise Exception("Experience not found")

        # Get previous stage solutions if available
        stage1_solution_doc = None
        stage2_solution_doc = None

        if stage1_solution_id:
            stage1_solution_doc = await db.solutions.find_one(
                {"_id": ObjectId(stage1_solution_id)}
            )

        if stage2_solution_id:
            stage2_solution_doc = await db.solutions.find_one(
                {"_id": ObjectId(stage2_solution_id)}
            )

        # Process with AI service
        processing_result = await enhanced_ai_service.process_experience_stage3(
            experience_data=experience_doc,
            stage1_solution=stage1_solution_doc,
            stage2_solution=stage2_solution_doc,
            follow_up_data=follow_up_data,
            user_role=user_role,
            additional_context=additional_context,
        )

        # Calculate processing time and next follow-up
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        next_follow_up = datetime.utcnow() + timedelta(days=14)

        # Update solution with results
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.COMPLETED,
                    "content": processing_result["content"],
                    "aiMetadata": processing_result["ai_metadata"],
                    "metadata": {
                        "confidence_score": processing_result.get(
                            "confidence_score", 0.8
                        ),
                        "processing_time": processing_time,
                        "has_follow_up_data": bool(follow_up_data),
                        "stage1_integration": bool(stage1_solution_doc),
                        "stage2_integration": bool(stage2_solution_doc),
                        "context_provided": bool(additional_context),
                    },
                    "processingTime": processing_time,
                    "nextFollowUp": next_follow_up,
                    "updatedAt": datetime.utcnow(),
                    "completedAt": datetime.utcnow(),
                }
            },
        )

        print(f"✅ Stage 3 processing completed for solution {solution_id}")

    except Exception as e:
        print(f"❌ Stage 3 processing failed for solution {solution_id}: {e}")

        # Update solution with error status
        try:
            db = await get_database()
            await db.solutions.update_one(
                {"_id": ObjectId(solution_id)},
                {
                    "$set": {
                        "status": SolutionStatus.GENERATED,  # Failed processing, back to generated
                        "error": str(e),
                        "updatedAt": datetime.utcnow(),
                        "processingTime": (
                            datetime.utcnow() - start_time
                        ).total_seconds(),
                    }
                },
            )
        except Exception as db_error:
            print(f"Failed to update solution error status: {db_error}")


async def process_follow_up_background(
    solution_id: str, follow_up_data: Dict[str, Any], user_role: str
):
    """Background task for processing follow-up data updates."""
    try:
        db = await get_database()

        # Get current solution
        solution_doc = await db.solutions.find_one({"_id": ObjectId(solution_id)})

        if not solution_doc:
            raise Exception("Solution not found")

        # Generate adaptive recommendations based on follow-up
        adaptive_result = await enhanced_ai_service.process_follow_up_adaptation(
            current_solution=solution_doc,
            follow_up_data=follow_up_data,
            user_role=user_role,
        )

        # Update solution with adaptive recommendations
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "adaptiveRecommendations": adaptive_result[
                        "adaptive_recommendations"
                    ],
                    "progressAssessment": adaptive_result["progress_assessment"],
                    "status": SolutionStatus.COMPLETED,
                    "updatedAt": datetime.utcnow(),
                    "lastAdaptation": datetime.utcnow(),
                }
            },
        )

        print(f"✅ Follow-up adaptation completed for solution {solution_id}")

    except Exception as e:
        print(f"❌ Follow-up adaptation failed for solution {solution_id}: {e}")
