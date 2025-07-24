from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..api.auth import get_current_user
from ..core.database import get_solutions_collection
from ..models.solution import RateSolutionRequest
from ..utils.field_encryption import decrypt_solution_data, encrypt_solution_data

router = APIRouter()


@router.get("/experience/{experience_id}", response_model=List[dict])
async def get_solutions_for_experience(
    experience_id: str, current_user: dict = Depends(get_current_user)
):
    """Get all solutions for a specific experience."""
    solutions_collection = get_solutions_collection()

    cursor = solutions_collection.find(
        {"experienceId": experience_id, "userId": str(current_user["_id"])}
    ).sort("stage", 1)

    solutions = []
    async for solution in cursor:
        # Decrypt sensitive data for response
        decrypted_solution = decrypt_solution_data(dict(solution))
        decrypted_solution["id"] = str(solution["_id"])
        solutions.append(decrypted_solution)

    return solutions


@router.post("/{solution_id}/rate", response_model=dict)
async def rate_solution(
    solution_id: str,
    rating_data: RateSolutionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Rate a solution."""
    solutions_collection = get_solutions_collection()

    # Find solution
    solution = await solutions_collection.find_one(
        {"_id": solution_id, "userId": str(current_user["_id"])}
    )

    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Solution not found"
        )

    # Create update data with encryption
    update_data = {
        "userFeedback": {
            "rating": rating_data.rating.value,
            "isHelpful": rating_data.isHelpful,
            "improvementSuggestions": rating_data.improvementSuggestions,
            "positiveAspects": rating_data.positiveAspects or [],
            "ratedAt": datetime.utcnow(),
        },
        "updatedAt": datetime.utcnow(),
    }

    # Encrypt sensitive feedback data
    update_data = encrypt_solution_data(update_data)

    await solutions_collection.update_one({"_id": solution_id}, {"$set": update_data})

    # Check if rating is below 50% and needs regeneration
    needs_regeneration = rating_data.rating.value < 50

    return {
        "message": "Solution rated successfully",
        "needsRegeneration": needs_regeneration,
    }
