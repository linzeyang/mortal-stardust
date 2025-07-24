"""
API endpoints for solution rating and evaluation system.
Handles user ratings for AI solutions with regeneration logic.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..core.database import get_database
from ..dependencies import get_current_user
from ..models.solution import SolutionStatus
from ..models.user import User
from ..services.enhanced_ai_service import enhanced_ai_service
from ..utils.encryption import decrypt_data, encrypt_data

router = APIRouter(prefix="/api/solutions", tags=["solution-rating"])


class SolutionRating(BaseModel):
    solution_id: str
    rating_percentage: int = Field(
        ..., ge=0, le=100, description="Rating percentage from 0-100"
    )
    feedback_text: Optional[str] = Field(
        None, max_length=2000, description="Optional feedback text"
    )
    helpful_aspects: Optional[List[str]] = Field(
        default_factory=list, description="What was helpful about the solution"
    )
    improvement_suggestions: Optional[List[str]] = Field(
        default_factory=list, description="Suggestions for improvement"
    )
    would_recommend: Optional[bool] = None
    implementation_difficulty: Optional[int] = Field(
        None, ge=1, le=10, description="How difficult to implement (1-10)"
    )


class RatingResponse(BaseModel):
    rating_id: str
    solution_id: str
    rating_percentage: int
    status: str
    regeneration_triggered: bool
    message: str
    new_solution_id: Optional[str] = None


class SolutionRegenerationRequest(BaseModel):
    solution_id: str
    previous_rating: int
    improvement_feedback: Optional[str] = None
    specific_requirements: Optional[List[str]] = None


@router.post("/rate", response_model=RatingResponse)
async def rate_solution(
    rating: SolutionRating,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Rate an AI solution. Automatically triggers regeneration for ratings below 50%.
    """
    try:
        # Verify solution exists and belongs to user
        solution_doc = await db.solutions.find_one(
            {"_id": ObjectId(rating.solution_id), "userId": ObjectId(current_user.id)}
        )

        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solution not found or access denied",
            )

        # Check if solution is already rated
        existing_rating = await db.solution_ratings.find_one(
            {
                "solutionId": ObjectId(rating.solution_id),
                "userId": ObjectId(current_user.id),
            }
        )

        # Prepare rating document
        rating_doc = {
            "userId": ObjectId(current_user.id),
            "solutionId": ObjectId(rating.solution_id),
            "experienceId": solution_doc["experienceId"],
            "stage": solution_doc["stage"],
            "ratingPercentage": rating.rating_percentage,
            "feedbackText": (
                encrypt_data(rating.feedback_text) if rating.feedback_text else None
            ),
            "helpfulAspects": rating.helpful_aspects,
            "improvementSuggestions": rating.improvement_suggestions,
            "wouldRecommend": rating.would_recommend,
            "implementationDifficulty": rating.implementation_difficulty,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        rating_id = None
        if existing_rating:
            # Update existing rating
            rating_id = existing_rating["_id"]
            await db.solution_ratings.update_one(
                {"_id": rating_id},
                {"$set": {**rating_doc, "updatedAt": datetime.utcnow()}},
            )
        else:
            # Create new rating
            result = await db.solution_ratings.insert_one(rating_doc)
            rating_id = result.inserted_id

        # Update solution with rating info
        await db.solutions.update_one(
            {"_id": ObjectId(rating.solution_id)},
            {
                "$set": {
                    "currentRating": rating.rating_percentage,
                    "isRated": True,
                    "ratingUpdatedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

        # Check if regeneration is needed (rating < 50%)
        regeneration_triggered = rating.rating_percentage < 50
        new_solution_id = None

        if regeneration_triggered:
            # Trigger solution regeneration in background
            background_tasks.add_task(
                regenerate_solution_background,
                rating.solution_id,
                rating.rating_percentage,
                current_user.id,
                rating.feedback_text,
                rating.improvement_suggestions,
            )

            # Mark original solution as regenerating
            await db.solutions.update_one(
                {"_id": ObjectId(rating.solution_id)},
                {
                    "$set": {
                        "status": SolutionStatus.REGENERATING,
                        "regenerationTriggeredAt": datetime.utcnow(),
                    }
                },
            )

        # For high-rated solutions (70%+), record as successful solution
        if rating.rating_percentage >= 70:
            await record_successful_solution(
                rating.solution_id,
                rating.rating_percentage,
                rating.helpful_aspects,
                current_user.id,
                db,
            )

        return RatingResponse(
            rating_id=str(rating_id),
            solution_id=rating.solution_id,
            rating_percentage=rating.rating_percentage,
            status="rated",
            regeneration_triggered=regeneration_triggered,
            message="感谢您的评价！"
            + (
                "由于评分较低，我们将重新生成更好的解决方案。"
                if regeneration_triggered
                else (
                    "您的反馈已记录，有助于改进我们的服务。"
                    if rating.rating_percentage >= 70
                    else "您的反馈已记录。"
                )
            ),
            new_solution_id=new_solution_id,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rate solution: {str(e)}",
        )


@router.get("/{solution_id}/rating")
async def get_solution_rating(
    solution_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """Get rating for a specific solution."""
    try:
        rating_doc = await db.solution_ratings.find_one(
            {"solutionId": ObjectId(solution_id), "userId": ObjectId(current_user.id)}
        )

        if not rating_doc:
            return {"rated": False}

        # Decrypt sensitive data
        feedback_text = None
        if rating_doc.get("feedbackText"):
            feedback_text = decrypt_data(rating_doc["feedbackText"])

        return {
            "rated": True,
            "rating_id": str(rating_doc["_id"]),
            "rating_percentage": rating_doc["ratingPercentage"],
            "feedback_text": feedback_text,
            "helpful_aspects": rating_doc.get("helpfulAspects", []),
            "improvement_suggestions": rating_doc.get("improvementSuggestions", []),
            "would_recommend": rating_doc.get("wouldRecommend"),
            "implementation_difficulty": rating_doc.get("implementationDifficulty"),
            "created_at": rating_doc["createdAt"].isoformat(),
            "updated_at": rating_doc["updatedAt"].isoformat(),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get rating: {str(e)}",
        )


@router.post("/regenerate", response_model=Dict[str, Any])
async def manual_regenerate_solution(
    request: SolutionRegenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database),
):
    """Manually trigger solution regeneration."""
    try:
        # Verify solution exists and belongs to user
        solution_doc = await db.solutions.find_one(
            {"_id": ObjectId(request.solution_id), "userId": ObjectId(current_user.id)}
        )

        if not solution_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solution not found or access denied",
            )

        # Trigger regeneration
        background_tasks.add_task(
            regenerate_solution_background,
            request.solution_id,
            request.previous_rating,
            current_user.id,
            request.improvement_feedback,
            request.specific_requirements,
        )

        # Update solution status
        await db.solutions.update_one(
            {"_id": ObjectId(request.solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.REGENERATING,
                    "regenerationTriggeredAt": datetime.utcnow(),
                    "manualRegenerationRequested": True,
                }
            },
        )

        return {
            "status": "regeneration_started",
            "message": "正在重新生成解决方案，请稍候...",
            "solution_id": request.solution_id,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate solution: {str(e)}",
        )


@router.get("/analytics/ratings")
async def get_rating_analytics(
    current_user: User = Depends(get_current_user), db=Depends(get_database)
):
    """Get rating analytics for current user."""
    try:
        # Aggregate user's ratings
        pipeline = [
            {"$match": {"userId": ObjectId(current_user.id)}},
            {
                "$group": {
                    "_id": None,
                    "total_ratings": {"$sum": 1},
                    "avg_rating": {"$avg": "$ratingPercentage"},
                    "high_ratings": {
                        "$sum": {"$cond": [{"$gte": ["$ratingPercentage", 70]}, 1, 0]}
                    },
                    "medium_ratings": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$gte": ["$ratingPercentage", 50]},
                                        {"$lt": ["$ratingPercentage", 70]},
                                    ]
                                },
                                1,
                                0,
                            ]
                        }
                    },
                    "low_ratings": {
                        "$sum": {"$cond": [{"$lt": ["$ratingPercentage", 50]}, 1, 0]}
                    },
                }
            },
        ]

        result = await db.solution_ratings.aggregate(pipeline).to_list(length=1)

        if not result:
            return {
                "total_ratings": 0,
                "avg_rating": 0,
                "high_ratings": 0,
                "medium_ratings": 0,
                "low_ratings": 0,
                "success_rate": 0,
            }

        stats = result[0]
        success_rate = (
            (stats["high_ratings"] / stats["total_ratings"] * 100)
            if stats["total_ratings"] > 0
            else 0
        )

        return {
            "total_ratings": stats["total_ratings"],
            "avg_rating": round(stats["avg_rating"], 1),
            "high_ratings": stats["high_ratings"],
            "medium_ratings": stats["medium_ratings"],
            "low_ratings": stats["low_ratings"],
            "success_rate": round(success_rate, 1),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}",
        )


async def regenerate_solution_background(
    solution_id: str,
    previous_rating: int,
    user_id: str,
    feedback: Optional[str] = None,
    improvement_suggestions: Optional[List[str]] = None,
):
    """Background task for solution regeneration."""
    try:
        db = get_database()

        # Get original solution and experience
        solution_doc = await db.solutions.find_one({"_id": ObjectId(solution_id)})
        experience_doc = await db.experiences.find_one(
            {"_id": solution_doc["experienceId"]}
        )
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})

        if not all([solution_doc, experience_doc, user_doc]):
            return

        # Prepare regeneration context
        regeneration_context = {
            "previous_rating": previous_rating,
            "feedback": feedback,
            "improvement_suggestions": improvement_suggestions,
            "original_solution_id": solution_id,
            "regeneration_attempt": solution_doc.get("regenerationAttempt", 0) + 1,
        }

        # Generate new solution using AI service
        stage = solution_doc["stage"]

        if stage == 1:
            new_solution = await enhanced_ai_service.process_stage1_healing(
                experience_doc, user_doc["role"], regeneration_context
            )
        elif stage == 2:
            new_solution = await enhanced_ai_service.process_stage2_practical(
                experience_doc, user_doc["role"], regeneration_context
            )
        elif stage == 3:
            new_solution = await enhanced_ai_service.process_stage3_followup(
                experience_doc, user_doc["role"], regeneration_context
            )

        # Create new solution document
        new_solution_doc = {
            "userId": ObjectId(user_id),
            "experienceId": solution_doc["experienceId"],
            "stage": stage,
            "stageName": solution_doc["stageName"],
            "status": SolutionStatus.COMPLETED,
            "priority": solution_doc.get("priority", "normal"),
            "content": encrypt_data(new_solution["content"]),
            "processingTime": new_solution["processing_time"],
            "confidenceScore": new_solution["confidence_score"],
            "isRegenerated": True,
            "originalSolutionId": ObjectId(solution_id),
            "regenerationAttempt": regeneration_context["regeneration_attempt"],
            "regenerationReason": f"Low rating: {previous_rating}%",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        result = await db.solutions.insert_one(new_solution_doc)
        new_solution_id = result.inserted_id

        # Update original solution
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.REGENERATED,
                    "regeneratedSolutionId": new_solution_id,
                    "regenerationCompletedAt": datetime.utcnow(),
                }
            },
        )

    except Exception as e:
        # Log error and update solution status
        db = get_database()
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {
                "$set": {
                    "status": SolutionStatus.ERROR,
                    "errorMessage": f"Regeneration failed: {str(e)}",
                    "regenerationFailedAt": datetime.utcnow(),
                }
            },
        )


async def record_successful_solution(
    solution_id: str,
    rating_percentage: int,
    helpful_aspects: List[str],
    user_id: str,
    db,
):
    """Record high-rated solution for analytics and improvement."""
    try:
        # Create success record
        success_record = {
            "solutionId": ObjectId(solution_id),
            "userId": ObjectId(user_id),
            "ratingPercentage": rating_percentage,
            "helpfulAspects": helpful_aspects,
            "recordedAt": datetime.utcnow(),
        }

        await db.successful_solutions.insert_one(success_record)

        # Update solution with success flag
        await db.solutions.update_one(
            {"_id": ObjectId(solution_id)},
            {"$set": {"isSuccessful": True, "successRecordedAt": datetime.utcnow()}},
        )

    except Exception as e:
        # Log error but don't fail the rating process
        print(f"Failed to record successful solution: {e}")
