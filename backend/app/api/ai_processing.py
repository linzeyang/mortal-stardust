from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from ..api.auth import get_current_user
from ..core.database import get_experiences_collection, get_solutions_collection
from ..services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


@router.post("/process/{experience_id}/{stage}", response_model=dict)
async def process_experience(
    experience_id: str, stage: int, current_user: dict = Depends(get_current_user)
):
    """Process an experience through AI pipeline."""
    if stage not in [1, 2, 3]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid stage. Must be 1, 2, or 3",
        )

    experiences_collection = get_experiences_collection()
    solutions_collection = get_solutions_collection()

    # Get experience
    experience = await experiences_collection.find_one(
        {"_id": ObjectId(experience_id), "userId": str(current_user["_id"])}
    )

    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found"
        )

    # Check if solution for this stage already exists
    existing_solution = await solutions_collection.find_one(
        {
            "experienceId": experience_id,
            "userId": str(current_user["_id"]),
            "stage": stage,
        }
    )

    if existing_solution:
        return {
            "id": str(existing_solution["_id"]),
            "message": "Solution already exists for this stage",
        }

    try:
        # Process through AI service
        solution_data = await ai_service.process_experience(experience, stage)

        # Save solution to database
        solution_doc = {
            "userId": str(current_user["_id"]),
            "experienceId": experience_id,
            "stage": stage,
            "content": solution_data["content"],
            "aiMetadata": solution_data["metadata"],
            "status": "generated",
            "analytics": {"viewCount": 0, "shareCount": 0, "effectivenessScore": None},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        result = await solutions_collection.insert_one(solution_doc)

        # Update experience processing stage
        await experiences_collection.update_one(
            {"_id": ObjectId(experience_id)},
            {
                "$set": {
                    "metadata.processingStage": f"stage{stage}",
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

        return {
            "id": str(result.inserted_id),
            "stage": stage,
            "content": solution_data["content"],
            "message": "Experience processed successfully",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}",
        )


@router.post("/regenerate/{solution_id}", response_model=dict)
async def regenerate_solution(
    solution_id: str, current_user: dict = Depends(get_current_user)
):
    """Regenerate a solution that received low rating."""
    solutions_collection = get_solutions_collection()
    experiences_collection = get_experiences_collection()

    # Get solution
    solution = await solutions_collection.find_one(
        {"_id": ObjectId(solution_id), "userId": str(current_user["_id"])}
    )

    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Solution not found"
        )

    # Check if solution has low rating
    if not solution.get("userFeedback") or solution["userFeedback"]["rating"] >= 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solution does not need regeneration",
        )

    # Get experience
    experience = await experiences_collection.find_one(
        {"_id": ObjectId(solution["experienceId"])}
    )

    try:
        # Mark as regenerating
        await solutions_collection.update_one(
            {"_id": ObjectId(solution_id)}, {"$set": {"status": "regenerating"}}
        )

        # Process through AI service with previous feedback
        solution_data = await ai_service.regenerate_solution(
            experience, solution["stage"], solution["userFeedback"]
        )

        # Update solution
        update_data = {
            "content": solution_data["content"],
            "aiMetadata": solution_data["metadata"],
            "status": "generated",
            "userFeedback": None,  # Clear previous feedback
            "updatedAt": datetime.utcnow(),
        }

        await solutions_collection.update_one(
            {"_id": ObjectId(solution_id)}, {"$set": update_data}
        )

        return {
            "id": solution_id,
            "content": solution_data["content"],
            "message": "Solution regenerated successfully",
        }

    except Exception as e:
        # Reset status on error
        await solutions_collection.update_one(
            {"_id": ObjectId(solution_id)}, {"$set": {"status": "generated"}}
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Regeneration failed: {str(e)}",
        )
