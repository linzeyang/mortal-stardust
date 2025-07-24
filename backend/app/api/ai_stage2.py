"""
API endpoints for Stage 2 AI processing - Practical solution generation.
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
    db = Depends(get_database)
):
    """
    Process Stage 2 AI analysis - Practical solution generation.
    
    This endpoint takes a user's experience and generates practical,
    actionable solutions and recommendations.
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
        
        # Check if Stage 2 solution already exists
        existing_solution = await db.solutions.find_one({
            "experienceId": ObjectId(request.experience_id),
            "stage": 2,
            "userId": ObjectId(current_user.id)
        })
        
        if existing_solution and existing_solution.get("status") == SolutionStatus.COMPLETED:
            return Stage2ProcessingResponse(
                solution_id=str(existing_solution["_id"]),
                status="already_exists",
                stage=2,
                processing_time=0.0,
                confidence_score=existing_solution.get("metadata", {}).get("confidence_score", 0.0),
                message="Stage 2 solution already exists for this experience"
            )
        
        # Optionally get Stage 1 solution for context
        stage1_solution = None
        if request.stage1_solution_id:
            stage1_solution = await db.solutions.find_one({
                "_id": ObjectId(request.stage1_solution_id),
                "userId": ObjectId(current_user.id),
                "stage": 1
            })
        
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
                "stage": 2,
                "stageName": "practical_solutions",
                "status": SolutionStatus.PROCESSING,
                "priority": request.priority,
                "stage1SolutionId": ObjectId(request.stage1_solution_id) if request.stage1_solution_id else None,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "processingStartedAt": datetime.utcnow()
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
            request.additional_context or {}
        )
        
        return Stage2ProcessingResponse(
            solution_id=str(solution_id),
            status="processing",
            stage=2,
            processing_time=0.0,
            confidence_score=0.0,
            message="Stage 2 processing started successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start Stage 2 processing: {str(e)}"
        )

@router.get("/status/{solution_id}")
async def get_stage2_status(
    solution_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get the current status of Stage 2 processing."""
    try:
        solution_doc = await db.solutions.find_one({
            "_id": ObjectId(solution_id),
            "userId": ObjectId(current_user.id),
            "stage": 2
        })
        
        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage 2 solution not found"
            )
        
        # Decrypt content if needed
        content = solution_doc.get("content", {})
        if content and solution_doc.get("status") == SolutionStatus.COMPLETED:
            try:
                if isinstance(content.get("title"), str) and content["title"].startswith("encrypted:"):
                    content["title"] = decrypt_data(content["title"])
                if isinstance(content.get("description"), str) and content["description"].startswith("encrypted:"):
                    content["description"] = decrypt_data(content["description"])
                if isinstance(content.get("recommendations"), list):
                    content["recommendations"] = [
                        decrypt_data(rec) if isinstance(rec, str) and rec.startswith("encrypted:") else rec
                        for rec in content["recommendations"]
                    ]
                if isinstance(content.get("actionSteps"), list):
                    content["actionSteps"] = [
                        decrypt_data(step) if isinstance(step, str) and step.startswith("encrypted:") else step
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
            "confidence_score": solution_doc.get("metadata", {}).get("confidence_score", 0.0),
            "created_at": solution_doc.get("createdAt"),
            "updated_at": solution_doc.get("updatedAt"),
            "stage1_solution_id": str(solution_doc["stage1SolutionId"]) if solution_doc.get("stage1SolutionId") else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Stage 2 status: {str(e)}"
        )

async def process_stage2_background(
    solution_id: str,
    experience_id: str,
    stage1_solution_id: Optional[str],
    user_role: str,
    additional_context: Dict[str, Any]
):
    """Background task for Stage 2 AI processing."""
    start_time = datetime.utcnow()
    
    try:
        db = await get_database()
        
        # Get experience data
        experience_doc = await db.experiences.find_one({
            "_id": ObjectId(experience_id)
        })
        
        if not experience_doc:
            raise Exception("Experience not found")
        
        # Get Stage 1 solution if available
        stage1_solution_doc = None
        if stage1_solution_id:
            stage1_solution_doc = await db.solutions.find_one({
                "_id": ObjectId(stage1_solution_id)
            })
        
        # Process with AI service
        processing_result = await enhanced_ai_service.process_experience_stage2(
            experience_data=experience_doc,
            stage1_solution=stage1_solution_doc,
            user_role=user_role,
            additional_context=additional_context
        )
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Update solution with results
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.COMPLETED,
                    "content": processing_result["content"],
                    "aiMetadata": processing_result["ai_metadata"],
                    "metadata": {
                        "confidence_score": processing_result.get("confidence_score", 0.8),
                        "processing_time": processing_time,
                        "stage1_integration": bool(stage1_solution_doc),
                        "context_provided": bool(additional_context)
                    },
                    "processingTime": processing_time,
                    "updatedAt": datetime.utcnow(),
                    "completedAt": datetime.utcnow()
                }
            }
        )
        
        print(f"✅ Stage 2 processing completed for solution {solution_id}")
        
    except Exception as e:
        print(f"❌ Stage 2 processing failed for solution {solution_id}: {e}")
        
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
                        "processingTime": (datetime.utcnow() - start_time).total_seconds()
                    }
                }
            )
        except Exception as db_error:
            print(f"Failed to update solution error status: {db_error}")