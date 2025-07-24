from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from ..models.experience import ExperienceCreate, ExperienceUpdate, ExperienceResponse
from ..api.auth import get_current_user
from ..core.database import get_experiences_collection
from ..utils.encryption import encrypt_data, decrypt_data, encrypt_list, decrypt_list
from ..utils.field_encryption import encrypt_experience_data, decrypt_experience_data

router = APIRouter()

@router.post("/", response_model=dict)
async def create_experience(
    experience_data: ExperienceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new life experience entry."""
    experiences_collection = get_experiences_collection()
    
    # Create document structure
    experience_doc = {
        "userId": str(current_user["_id"]),
        "title": experience_data.title,
        "content": {
            "text": experience_data.content.text,
            "mediaFiles": []  # TODO: Handle media files
        },
        "category": experience_data.category.value,
        "emotionalState": {
            "primary": experience_data.emotionalState.primary.value,
            "intensity": experience_data.emotionalState.intensity,
            "description": experience_data.emotionalState.description
        },
        "tags": experience_data.tags,
        "privacy": experience_data.privacy.dict(),
        "metadata": {
            "location": experience_data.metadata.location,
            "dateOccurred": experience_data.metadata.dateOccurred,
            "inputMethod": experience_data.metadata.inputMethod.value,
            "processingStage": experience_data.metadata.processingStage.value
        },
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Encrypt sensitive fields automatically
    experience_doc = encrypt_experience_data(experience_doc)
    
    # Insert experience
    result = await experiences_collection.insert_one(experience_doc)
    
    return {
        "id": str(result.inserted_id),
        "message": "Experience created successfully"
    }

@router.get("/", response_model=List[dict])
async def get_user_experiences(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 20
):
    """Get user's experiences."""
    experiences_collection = get_experiences_collection()
    
    cursor = experiences_collection.find(
        {"userId": str(current_user["_id"])}
    ).sort("createdAt", -1).skip(skip).limit(limit)
    
    experiences = []
    async for experience in cursor:
        # Decrypt sensitive data for response
        decrypted_experience = decrypt_experience_data(dict(experience))
        decrypted_experience["id"] = str(experience["_id"])
        experiences.append(decrypted_experience)
    
    return experiences

@router.get("/{experience_id}", response_model=dict)
async def get_experience(
    experience_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific experience."""
    experiences_collection = get_experiences_collection()
    
    experience = await experiences_collection.find_one({
        "_id": experience_id,
        "userId": str(current_user["_id"])
    })
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    # Decrypt sensitive data and return
    decrypted_experience = decrypt_experience_data(dict(experience))
    decrypted_experience["id"] = str(experience["_id"])
    
    return decrypted_experience