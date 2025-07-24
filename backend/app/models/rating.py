"""
Database models for solution ratings and evaluations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class SolutionRatingInDB(BaseModel):
    """Solution rating document in MongoDB."""
    id: Optional[str] = Field(alias="_id")
    userId: ObjectId
    solutionId: ObjectId
    experienceId: ObjectId
    stage: int
    ratingPercentage: int = Field(..., ge=0, le=100)
    feedbackText: Optional[str] = None  # Encrypted
    helpfulAspects: List[str] = Field(default_factory=list)
    improvementSuggestions: List[str] = Field(default_factory=list)
    wouldRecommend: Optional[bool] = None
    implementationDifficulty: Optional[int] = Field(None, ge=1, le=10)
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class SolutionRatingResponse(BaseModel):
    """Response model for solution rating."""
    rating_id: str
    solution_id: str
    experience_id: str
    stage: int
    rating_percentage: int
    feedback_text: Optional[str] = None
    helpful_aspects: List[str] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)
    would_recommend: Optional[bool] = None
    implementation_difficulty: Optional[int] = None
    created_at: str
    updated_at: str

class SuccessfulSolutionInDB(BaseModel):
    """Successful solution record in MongoDB (70%+ rated solutions)."""
    id: Optional[str] = Field(alias="_id")
    solutionId: ObjectId
    userId: ObjectId
    experienceId: ObjectId
    stage: int
    ratingPercentage: int
    helpfulAspects: List[str] = Field(default_factory=list)
    recordedAt: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class RatingAnalytics(BaseModel):
    """Rating analytics response model."""
    total_ratings: int
    avg_rating: float
    high_ratings: int  # 70%+
    medium_ratings: int  # 50-69%
    low_ratings: int  # <50%
    success_rate: float  # Percentage of 70%+ ratings

class RatingTrend(BaseModel):
    """Rating trend data."""
    date: str
    avg_rating: float
    rating_count: int

class StageRatingComparison(BaseModel):
    """Rating comparison across different AI processing stages."""
    stage: int
    stage_name: str
    total_ratings: int
    avg_rating: float
    high_ratings: int
    success_rate: float