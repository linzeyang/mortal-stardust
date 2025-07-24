from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class MediaType(str, Enum):
    AUDIO = "audio"
    IMAGE = "image"
    VIDEO = "video"


class ExperienceCategory(str, Enum):
    CAREER = "career"
    RELATIONSHIP = "relationship"
    EDUCATION = "education"
    HEALTH = "health"
    FINANCE = "finance"
    PERSONAL_GROWTH = "personal_growth"
    OTHER = "other"


class EmotionalState(str, Enum):
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    ANXIOUS = "anxious"
    CONFUSED = "confused"
    EXCITED = "excited"
    PEACEFUL = "peaceful"
    FRUSTRATED = "frustrated"


class InputMethod(str, Enum):
    TEXT = "text"
    VOICE = "voice"
    MIXED = "mixed"


class ProcessingStage(str, Enum):
    PENDING = "pending"
    STAGE1 = "stage1"
    STAGE2 = "stage2"
    STAGE3 = "stage3"
    COMPLETED = "completed"


class MediaFile(BaseModel):
    type: MediaType
    filename: str
    originalName: str
    url: str  # Will be encrypted
    size: int
    duration: Optional[int] = None  # For audio/video
    transcript: Optional[str] = None  # Encrypted
    description: Optional[str] = None  # Encrypted
    metadata: Optional[Dict[str, Any]] = None  # Encrypted


class ExperienceEmotionalState(BaseModel):
    primary: EmotionalState
    intensity: int = Field(..., ge=1, le=10)
    description: Optional[str] = None  # Encrypted


class ExperiencePrivacy(BaseModel):
    isPublic: bool = False
    shareWithAI: bool = True
    anonymizeForResearch: bool = False


class ExperienceMetadata(BaseModel):
    location: Optional[str] = None  # Encrypted
    dateOccurred: datetime
    inputMethod: InputMethod = InputMethod.TEXT
    processingStage: ProcessingStage = ProcessingStage.PENDING


class ExperienceContent(BaseModel):
    text: str  # Encrypted
    mediaFiles: List[MediaFile] = []


class ExperienceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: ExperienceContent
    category: ExperienceCategory
    emotionalState: ExperienceEmotionalState
    tags: List[str] = []
    privacy: ExperiencePrivacy = ExperiencePrivacy()
    metadata: ExperienceMetadata


class ExperienceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[ExperienceContent] = None
    category: Optional[ExperienceCategory] = None
    emotionalState: Optional[ExperienceEmotionalState] = None
    tags: Optional[List[str]] = None
    privacy: Optional[ExperiencePrivacy] = None
    metadata: Optional[ExperienceMetadata] = None


class ExperienceResponse(BaseModel):
    id: str = Field(..., alias="_id")
    userId: str
    title: str
    content: ExperienceContent
    category: ExperienceCategory
    emotionalState: ExperienceEmotionalState
    tags: List[str]
    privacy: ExperiencePrivacy
    metadata: ExperienceMetadata
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class ExperienceInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    userId: str
    title: str  # Encrypted
    content: ExperienceContent
    category: ExperienceCategory
    emotionalState: ExperienceEmotionalState
    tags: List[str] = []
    privacy: ExperiencePrivacy
    metadata: ExperienceMetadata
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
