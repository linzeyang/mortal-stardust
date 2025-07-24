from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from ..models.user import UserResponse, UserUpdate
from ..api.auth import get_current_user
from ..core.database import get_users_collection
from ..utils.field_encryption import encrypt_user_data, decrypt_user_data

router = APIRouter()

@router.get("/profile", response_model=dict)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile."""
    # Decrypt sensitive user data for response
    decrypted_user = decrypt_user_data(dict(current_user))
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "profile": decrypted_user["profile"],
        "preferences": decrypted_user["preferences"],
        "createdAt": current_user["createdAt"],
        "updatedAt": current_user["updatedAt"]
    }

@router.put("/profile", response_model=dict)
async def update_user_profile(
    profile_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile."""
    users_collection = get_users_collection()
    
    # Create update document
    update_doc = {"updatedAt": datetime.utcnow()}
    
    if profile_data.firstName:
        update_doc["profile.firstName"] = profile_data.firstName
    if profile_data.lastName:
        update_doc["profile.lastName"] = profile_data.lastName
    if profile_data.role:
        update_doc["profile.role"] = profile_data.role.value
    if profile_data.avatar:
        update_doc["profile.avatar"] = profile_data.avatar
    if profile_data.phoneNumber:
        update_doc["profile.phoneNumber"] = profile_data.phoneNumber
    if profile_data.dateOfBirth:
        update_doc["profile.dateOfBirth"] = profile_data.dateOfBirth
    if profile_data.preferences:
        update_doc["preferences"] = profile_data.preferences.dict()
    
    # Encrypt sensitive fields
    encrypted_update = encrypt_user_data(update_doc)
    
    # Convert to dot notation for MongoDB update
    update_data = {}
    for key, value in encrypted_update.items():
        if key != "_encryption":
            update_data[key] = value
    
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated successfully"}