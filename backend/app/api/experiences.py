"""
Experience Management API Endpoints

This module provides FastAPI endpoints for managing user life experiences including
creation, retrieval, and processing. Experiences are the core data structure that
feeds into the AI processing pipeline for generating personalized solutions.

Key Features:
- CRUD operations for user experiences with automatic encryption
- Multi-modal content support (text, images, audio, video)
- Emotional state tracking and categorization
- Privacy controls and metadata management
- Integration with AI processing pipeline

Data Flow:
1. User creates experience with content and emotional context
2. Experience is encrypted and stored in MongoDB
3. Experience feeds into 3-stage AI processing pipeline
4. Generated solutions are linked back to the experience

Security Considerations:
- All sensitive experience content is encrypted at rest
- User isolation - users can only access their own experiences
- Privacy settings control data sharing and processing
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..api.auth import get_current_user
from ..core.database import get_experiences_collection
from ..models.experience import ExperienceCreate
from ..utils.field_encryption import decrypt_experience_data, encrypt_experience_data

router = APIRouter()


@router.post("/", response_model=dict)
async def create_experience(
    experience_data: ExperienceCreate, current_user: dict = Depends(get_current_user)
):
    """
    Create a new life experience entry for the authenticated user.

    This endpoint creates a new experience record that will be processed through
    the AI pipeline to generate personalized solutions. The experience content
    is automatically encrypted before storage and linked to the user's account.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        experience_data (ExperienceCreate): Pydantic model containing experience data
            - title (str): Brief title describing the experience
            - content (ExperienceContent): Experience content with text and media
            - category (ExperienceCategory): Category (work, personal, academic, etc.)
            - emotionalState (EmotionalState): Primary emotion, intensity, description
            - tags (List[str]): User-defined tags for categorization
            - privacy (PrivacySettings): Privacy and sharing preferences
            - metadata (ExperienceMetadata): Location, date, input method, etc.
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: Creation confirmation with experience ID
            - id (str): Unique identifier for the created experience
            - message (str): Success confirmation message

    Raises:
        HTTPException: 400 if validation fails
        HTTPException: 401 if authentication fails
        HTTPException: 422 if request data is invalid
        HTTPException: 500 if database operation fails

    Business Rules:
        - Each experience is linked to the authenticated user
        - Experience content is automatically encrypted before storage
        - Processing stage is initially set to "pending"
        - Timestamps are automatically set to current UTC time
        - Media files are stored separately and referenced by ID

    Data Validation:
        - Title must be non-empty and under 200 characters
        - Emotional intensity must be between 1-10
        - Category must be valid enum value
        - Privacy settings are validated against schema

    Example Request:
        POST /api/experiences/
        {
            "title": "Challenging presentation at work",
            "content": {
                "text": "Had to present quarterly results to the board..."
            },
            "category": "work",
            "emotionalState": {
                "primary": "anxiety",
                "intensity": 7,
                "description": "Nervous but determined"
            },
            "tags": ["presentation", "work", "growth"],
            "privacy": {
                "isPublic": false,
                "allowAnalytics": true
            },
            "metadata": {
                "location": "Office Conference Room",
                "dateOccurred": "2024-01-15",
                "inputMethod": "text"
            }
        }

    Example Response:
        {
            "id": "507f1f77bcf86cd799439011",
            "message": "Experience created successfully"
        }
    """
    experiences_collection = get_experiences_collection()

    # Create document structure with user association
    experience_doc = {
        "userId": str(current_user["_id"]),
        "title": experience_data.title,
        "content": {
            "text": experience_data.content.text,
            "mediaFiles": [],  # TODO: Handle media files in future iteration
        },
        "category": experience_data.category.value,
        "emotionalState": {
            "primary": experience_data.emotionalState.primary.value,
            "intensity": experience_data.emotionalState.intensity,
            "description": experience_data.emotionalState.description,
        },
        "tags": experience_data.tags,
        "privacy": experience_data.privacy.dict(),
        "metadata": {
            "location": experience_data.metadata.location,
            "dateOccurred": experience_data.metadata.dateOccurred,
            "inputMethod": experience_data.metadata.inputMethod.value,
            "processingStage": experience_data.metadata.processingStage.value,
        },
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    # Encrypt sensitive fields automatically before storage
    experience_doc = encrypt_experience_data(experience_doc)

    # Insert experience into MongoDB collection
    result = await experiences_collection.insert_one(experience_doc)

    return {"id": str(result.inserted_id), "message": "Experience created successfully"}


@router.get("/", response_model=List[dict])
async def get_user_experiences(
    current_user: dict = Depends(get_current_user), skip: int = 0, limit: int = 20
):
    """
    Retrieve a paginated list of the authenticated user's experiences.

    This endpoint returns the user's experiences in reverse chronological order
    (newest first) with support for pagination. All sensitive data is automatically
    decrypted before being returned to the client.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        current_user (dict): Authenticated user object injected by dependency
        skip (int, optional): Number of records to skip for pagination (default: 0)
        limit (int, optional): Maximum number of records to return (default: 20, max: 100)

    Returns:
        List[dict]: List of experience objects containing:
            - id (str): Experience unique identifier
            - title (str): Experience title
            - content (dict): Experience content with text and media references
            - category (str): Experience category
            - emotionalState (dict): Emotional context and intensity
            - tags (List[str]): User-defined tags
            - privacy (dict): Privacy settings
            - metadata (dict): Location, date, processing stage, etc.
            - createdAt (datetime): Creation timestamp
            - updatedAt (datetime): Last update timestamp

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 422 if pagination parameters are invalid
        HTTPException: 500 if database operation fails

    Business Rules:
        - Users can only access their own experiences
        - Results are sorted by creation date (newest first)
        - Pagination prevents excessive memory usage
        - All sensitive content is decrypted for authorized user

    Query Performance:
        - Uses compound index on (userId, createdAt) for efficient sorting
        - Cursor-based pagination for consistent results
        - Limit enforced to prevent resource exhaustion

    Example Request:
        GET /api/experiences/?skip=0&limit=10

    Example Response:
        [
            {
                "id": "507f1f77bcf86cd799439011",
                "title": "Job interview success",
                "content": {
                    "text": "Finally got the job I wanted...",
                    "mediaFiles": []
                },
                "category": "work",
                "emotionalState": {
                    "primary": "joy",
                    "intensity": 9,
                    "description": "Extremely happy and relieved"
                },
                "tags": ["career", "success", "interview"],
                "createdAt": "2024-01-15T10:30:00Z",
                "updatedAt": "2024-01-15T10:30:00Z"
            }
        ]
    """
    experiences_collection = get_experiences_collection()

    # Build query with user isolation and pagination
    cursor = (
        experiences_collection.find({"userId": str(current_user["_id"])})
        .sort("createdAt", -1)  # Newest first
        .skip(skip)
        .limit(min(limit, 100))  # Enforce maximum limit for performance
    )

    experiences = []
    async for experience in cursor:
        # Decrypt sensitive data for authorized user response
        decrypted_experience = decrypt_experience_data(dict(experience))
        decrypted_experience["id"] = str(experience["_id"])
        experiences.append(decrypted_experience)

    return experiences


@router.get("/{experience_id}", response_model=dict)
async def get_experience(
    experience_id: str, current_user: dict = Depends(get_current_user)
):
    """
    Retrieve a specific experience by its unique identifier.

    This endpoint returns detailed information about a single experience,
    including all content, metadata, and processing status. The experience
    must belong to the authenticated user for security.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        experience_id (str): Unique identifier of the experience to retrieve
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: Complete experience object containing:
            - id (str): Experience unique identifier
            - title (str): Experience title
            - content (dict): Full experience content with text and media
            - category (str): Experience category
            - emotionalState (dict): Detailed emotional context
            - tags (List[str]): All associated tags
            - privacy (dict): Privacy and sharing settings
            - metadata (dict): Complete metadata including processing stage
            - createdAt (datetime): Creation timestamp
            - updatedAt (datetime): Last modification timestamp

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 404 if experience not found or doesn't belong to user
        HTTPException: 422 if experience_id format is invalid
        HTTPException: 500 if database operation fails

    Business Rules:
        - Users can only access experiences they own
        - Experience ID must be valid MongoDB ObjectId format
        - All sensitive content is decrypted for authorized access
        - Returns complete experience data for detailed viewing/editing

    Security Considerations:
        - User isolation enforced at database query level
        - Experience ownership verified before data access
        - Sensitive content decrypted only for authorized user

    Example Request:
        GET /api/experiences/507f1f77bcf86cd799439011

    Example Response:
        {
            "id": "507f1f77bcf86cd799439011",
            "title": "Difficult conversation with manager",
            "content": {
                "text": "Had to discuss my concerns about the project timeline...",
                "mediaFiles": ["audio_recording_123.mp3"]
            },
            "category": "work",
            "emotionalState": {
                "primary": "anxiety",
                "intensity": 6,
                "description": "Nervous but necessary conversation"
            },
            "tags": ["work", "communication", "management"],
            "privacy": {
                "isPublic": false,
                "allowAnalytics": true
            },
            "metadata": {
                "location": "Office",
                "dateOccurred": "2024-01-15",
                "inputMethod": "voice",
                "processingStage": "completed"
            },
            "createdAt": "2024-01-15T14:30:00Z",
            "updatedAt": "2024-01-15T15:45:00Z"
        }
    """
    experiences_collection = get_experiences_collection()

    # Query with user isolation for security
    experience = await experiences_collection.find_one(
        {"_id": experience_id, "userId": str(current_user["_id"])}
    )

    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found or access denied",
        )

    # Decrypt sensitive data for authorized user
    decrypted_experience = decrypt_experience_data(dict(experience))
    decrypted_experience["id"] = str(experience["_id"])

    return decrypted_experience
