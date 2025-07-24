"""
API endpoints for Stage 1 AI processing - Psychological healing solution generation.
"""

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from typing import Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel

from ..dependencies import get_current_user
from ..models.user import User
from ..models.experience import ExperienceInDB, ExperienceResponse
from ..models.solution import SolutionInDB, SolutionResponse, ProcessingStage, SolutionStatus
from ..core.database import get_database
from ..services.enhanced_ai_service import enhanced_ai_service
from ..utils.encryption import encrypt_data, decrypt_data

router = APIRouter(prefix="/api/ai/stage1", tags=["ai-stage1"])

class Stage1ProcessingRequest(BaseModel):
    experience_id: str
    priority: Optional[str] = "normal"  # normal, high
    additional_context: Optional[Dict[str, Any]] = None

class Stage1ProcessingResponse(BaseModel):
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
    db = Depends(get_database)
):
    """
    Process Stage 1 AI analysis - Psychological healing solution generation.
    
    This endpoint takes a user's experience and generates a comprehensive
    psychological healing and emotional support solution.
    """
    try:
        # Validate experience exists and belongs to user
        experience_doc = await db.experiences.find_one({
            "_id": ObjectId(request.experience_id),
            "userId": ObjectId(current_user.id)
        })
        
        if not experience_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Experience not found or access denied"
            )
        
        # Check if Stage 1 solution already exists
        existing_solution = await db.solutions.find_one({
            "experienceId": ObjectId(request.experience_id),
            "stage": 1,
            "userId": ObjectId(current_user.id)
        })
        
        if existing_solution and existing_solution.get("status") == SolutionStatus.COMPLETED:
            return Stage1ProcessingResponse(
                solution_id=str(existing_solution["_id"]),
                status="already_exists",
                stage=1,
                processing_time=0.0,
                confidence_score=existing_solution.get("metadata", {}).get("confidence_score", 0.0),
                message="Stage 1 solution already exists for this experience"
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
                        "processingStartedAt": datetime.utcnow()
                    }
                }
            )
        else:
            # Create new solution record
            solution_doc = {
                "userId": ObjectId(current_user.id),
                "experienceId": ObjectId(request.experience_id),
                "stage": 1,
                "stageName": "psychological_healing",
                "status": SolutionStatus.PROCESSING,
                "priority": request.priority,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "processingStartedAt": datetime.utcnow()
            }
            
            result = await db.solutions.insert_one(solution_doc)
            solution_id = result.inserted_id
        
        # Start background processing
        background_tasks.add_task(
            process_stage1_background,
            str(solution_id),
            str(request.experience_id),
            current_user.role,
            request.additional_context or {}
        )
        
        return Stage1ProcessingResponse(
            solution_id=str(solution_id),
            status="processing",
            stage=1,
            processing_time=0.0,
            confidence_score=0.0,
            message="Stage 1 processing started successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start Stage 1 processing: {str(e)}"
        )

@router.get("/status/{solution_id}")
async def get_stage1_status(
    solution_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get the current status of Stage 1 processing."""
    try:
        solution_doc = await db.solutions.find_one({
            "_id": ObjectId(solution_id),
            "userId": ObjectId(current_user.id),
            "stage": 1
        })
        
        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 1 solution not found"
            )
        
        return {
            "solution_id": str(solution_doc["_id"]),
            "status": solution_doc["status"],
            "stage": solution_doc["stage"],
            "created_at": solution_doc["createdAt"].isoformat() if solution_doc.get("createdAt") else None,
            "updated_at": solution_doc["updatedAt"].isoformat() if solution_doc.get("updatedAt") else None,
            "processing_started_at": solution_doc.get("processingStartedAt").isoformat() if solution_doc.get("processingStartedAt") else None,
            "completed_at": solution_doc.get("completedAt").isoformat() if solution_doc.get("completedAt") else None,
            "confidence_score": solution_doc.get("metadata", {}).get("confidence_score", 0.0),
            "error_message": solution_doc.get("errorMessage")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Stage 1 status: {str(e)}"
        )

@router.get("/result/{solution_id}")
async def get_stage1_result(
    solution_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get the Stage 1 processing result."""
    try:
        solution_doc = await db.solutions.find_one({
            "_id": ObjectId(solution_id),
            "userId": ObjectId(current_user.id),
            "stage": 1
        })
        
        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 1 solution not found"
            )
        
        if solution_doc["status"] != SolutionStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stage 1 processing not completed. Current status: {solution_doc['status']}"
            )
        
        # Decrypt the solution content
        content = solution_doc.get("content", {})
        decrypted_content = {
            "title": decrypt_data(content.get("title", "")),
            "content": decrypt_data(content.get("content", "")),
            "recommendations": [decrypt_data(rec) for rec in content.get("recommendations", [])],
            "coping_strategies": [decrypt_data(strategy) for strategy in content.get("coping_strategies", [])],
            "emotional_support": [decrypt_data(support) for support in content.get("emotional_support", [])],
            "resources": content.get("resources", [])
        }
        
        return {
            "solution_id": str(solution_doc["_id"]),
            "stage": solution_doc["stage"],
            "stage_name": solution_doc["stageName"],
            "status": solution_doc["status"],
            "content": decrypted_content,
            "metadata": {
                "confidence_score": solution_doc.get("metadata", {}).get("confidence_score", 0.0),
                "processing_time": solution_doc.get("metadata", {}).get("processing_time", 0.0),
                "generated_at": solution_doc.get("metadata", {}).get("generated_at"),
                "user_role": solution_doc.get("metadata", {}).get("user_role")
            },
            "created_at": solution_doc["createdAt"].isoformat(),
            "completed_at": solution_doc.get("completedAt").isoformat() if solution_doc.get("completedAt") else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Stage 1 result: {str(e)}"
        )

@router.post("/regenerate/{solution_id}")
async def regenerate_stage1_solution(
    solution_id: str,
    background_tasks: BackgroundTasks,
    feedback: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Regenerate Stage 1 solution based on user feedback."""
    try:
        solution_doc = await db.solutions.find_one({
            "_id": ObjectId(solution_id),
            "userId": ObjectId(current_user.id),
            "stage": 1
        })
        
        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 1 solution not found"
            )
        
        # Update solution status to processing
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.PROCESSING,
                    "updatedAt": datetime.utcnow(),
                    "regenerationCount": solution_doc.get("regenerationCount", 0) + 1,
                    "lastFeedback": feedback
                }
            }
        )
        
        # Start background regeneration
        background_tasks.add_task(
            process_stage1_background,
            solution_id,
            str(solution_doc["experienceId"]),
            current_user.role,
            {"regeneration": True, "feedback": feedback}
        )
        
        return {
            "solution_id": solution_id,
            "status": "regenerating",
            "message": "Stage 1 solution regeneration started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate Stage 1 solution: {str(e)}"
        )

async def process_stage1_background(
    solution_id: str, 
    experience_id: str, 
    user_role: str, 
    additional_context: Dict[str, Any]
):
    """Background task for Stage 1 AI processing."""
    from motor.motor_asyncio import AsyncIOMotorClient
    from ..core.config import settings
    
    # Create database connection for background task
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]
    
    try:
        # Get experience data
        experience_doc = await db.experiences.find_one({"_id": ObjectId(experience_id)})
        if not experience_doc:
            raise Exception("Experience not found")
        
        # Get media files associated with this experience
        media_files = await db.media_files.find({
            "userId": experience_doc["userId"],
            "experienceId": ObjectId(experience_id)
        }).to_list(length=50)
        
        # Prepare experience data for AI processing
        experience_data = {
            "data": experience_doc.get("formData", {}),
            "media_files": media_files,
            "additional_context": additional_context
        }
        
        # Process with enhanced AI service
        result = await enhanced_ai_service.process_experience_stage1(experience_data, user_role)
        
        # Update solution with results
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.COMPLETED,
                    "content": result["content"],
                    "metadata": result["metadata"],
                    "completedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
    except Exception as e:
        # Update solution with error status
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.FAILED,
                    "errorMessage": str(e),
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        print(f"Stage 1 processing failed for solution {solution_id}: {e}")
    
    finally:
        client.close()