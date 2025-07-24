from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class ProcessingStage(int, Enum):
    STAGE1 = 1  # Psychological Healing
    STAGE2 = 2  # Practical Solutions
    STAGE3 = 3  # Follow-up Support

class ResourceType(str, Enum):
    ARTICLE = "article"
    BOOK = "book"
    VIDEO = "video"
    PODCAST = "podcast"
    PROFESSIONAL = "professional"

class SolutionStatus(str, Enum):
    PROCESSING = "processing"
    GENERATED = "generated"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    REGENERATING = "regenerating"
    ARCHIVED = "archived"
    COMPLETED = "completed"

class UserRating(int, Enum):
    POOR = 30
    FAIR = 50
    GOOD = 70
    EXCELLENT = 100

class Resource(BaseModel):
    type: ResourceType
    title: str
    url: Optional[str] = None
    description: Optional[str] = None

class SolutionContent(BaseModel):
    title: str  # Encrypted
    description: str  # Encrypted
    recommendations: List[str] = []  # Encrypted
    actionSteps: Optional[List[str]] = None  # Encrypted
    resources: Optional[List[Resource]] = None

class AIMetadata(BaseModel):
    model: str = "gpt-4"
    prompt: str  # Encrypted
    parameters: Dict[str, Any] = {}  # Encrypted
    processingTime: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    version: str = "1.0"

class UserFeedback(BaseModel):
    rating: UserRating
    isHelpful: bool = False
    improvementSuggestions: Optional[str] = None  # Encrypted
    positiveAspects: Optional[List[str]] = None  # Encrypted
    ratedAt: datetime = Field(default_factory=datetime.utcnow)

class SolutionAnalytics(BaseModel):
    viewCount: int = 0
    shareCount: int = 0
    effectivenessScore: Optional[float] = None

class FollowUp(BaseModel):
    scheduledDate: datetime
    completed: bool = False
    notes: Optional[str] = None  # Encrypted

class SolutionCreate(BaseModel):
    experienceId: str
    stage: ProcessingStage
    content: SolutionContent
    aiMetadata: AIMetadata

class SolutionUpdate(BaseModel):
    content: Optional[SolutionContent] = None
    userFeedback: Optional[UserFeedback] = None
    status: Optional[SolutionStatus] = None
    followUp: Optional[FollowUp] = None

class SolutionResponse(BaseModel):
    id: str = Field(..., alias="_id")
    userId: str
    experienceId: str
    stage: ProcessingStage
    content: SolutionContent
    aiMetadata: AIMetadata
    userFeedback: Optional[UserFeedback] = None
    status: SolutionStatus
    analytics: SolutionAnalytics
    followUp: Optional[FollowUp] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class SolutionInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    userId: str
    experienceId: str
    stage: ProcessingStage
    content: SolutionContent
    aiMetadata: AIMetadata
    userFeedback: Optional[UserFeedback] = None
    status: SolutionStatus = SolutionStatus.GENERATED
    analytics: SolutionAnalytics = SolutionAnalytics()
    followUp: Optional[FollowUp] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

# Request/Response models for rating
class RateSolutionRequest(BaseModel):
    rating: UserRating
    isHelpful: bool = False
    improvementSuggestions: Optional[str] = None
    positiveAspects: Optional[List[str]] = None