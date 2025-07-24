"""
User Management API Endpoints

This module provides FastAPI endpoints for user profile management including
profile retrieval and updates. All endpoints require authentication and handle
sensitive data encryption/decryption automatically.

Key Features:
- JWT-based authentication for all endpoints
- Automatic encryption/decryption of sensitive user data
- Profile data validation using Pydantic models
- MongoDB integration with proper error handling

Security Considerations:
- All sensitive user data is encrypted at rest using AES-256
- Authentication required for all endpoints via JWT tokens
- Input validation prevents malicious data injection
"""

from datetime import datetime

from fastapi import APIRouter, Depends

from ..api.auth import get_current_user
from ..core.database import get_users_collection
from ..models.user import UserUpdate
from ..utils.field_encryption import decrypt_user_data, encrypt_user_data

router = APIRouter()


@router.get("/profile", response_model=dict)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the authenticated user's complete profile information.

    This endpoint returns the user's profile data including personal information,
    preferences, and account metadata. Sensitive data is automatically decrypted
    before being returned to the client.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: User profile data containing:
            - id (str): User's unique identifier
            - email (str): User's email address
            - profile (dict): Personal information (firstName, lastName, role, etc.)
            - preferences (dict): User preferences and settings
            - createdAt (datetime): Account creation timestamp
            - updatedAt (datetime): Last profile update timestamp

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 500 if database operation fails

    Example Response:
        {
            "id": "507f1f77bcf86cd799439011",
            "email": "user@example.com",
            "profile": {
                "firstName": "John",
                "lastName": "Doe",
                "role": "student",
                "avatar": "https://example.com/avatar.jpg"
            },
            "preferences": {
                "theme": "dark",
                "language": "en"
            },
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-15T10:30:00Z"
        }
    """
    # Decrypt sensitive user data for response
    decrypted_user = decrypt_user_data(dict(current_user))
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "profile": decrypted_user["profile"],
        "preferences": decrypted_user["preferences"],
        "createdAt": current_user["createdAt"],
        "updatedAt": current_user["updatedAt"],
    }


@router.put("/profile", response_model=dict)
async def update_user_profile(
    profile_data: UserUpdate, current_user: dict = Depends(get_current_user)
):
    """
    Update the authenticated user's profile information.

    This endpoint allows users to update their profile data including personal
    information and preferences. Only provided fields are updated (partial updates
    supported). Sensitive data is automatically encrypted before storage.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        profile_data (UserUpdate): Pydantic model containing profile updates
            - firstName (str, optional): User's first name
            - lastName (str, optional): User's last name
            - role (UserRole, optional): User's role (student, professional, entrepreneur)
            - avatar (str, optional): URL to user's avatar image
            - phoneNumber (str, optional): User's phone number
            - dateOfBirth (date, optional): User's date of birth
            - preferences (UserPreferences, optional): User preference settings
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: Success confirmation message
            - message (str): "Profile updated successfully"

    Raises:
        HTTPException: 400 if validation fails
        HTTPException: 401 if authentication fails
        HTTPException: 422 if request data is invalid
        HTTPException: 500 if database operation fails

    Business Rules:
        - Only authenticated users can update their own profile
        - Partial updates are supported - only provided fields are updated
        - Role changes are validated against allowed UserRole enum values
        - Phone numbers and dates of birth are encrypted before storage
        - updatedAt timestamp is automatically set to current UTC time

    Example Request:
        PUT /api/users/profile
        {
            "firstName": "Jane",
            "lastName": "Smith",
            "role": "professional",
            "preferences": {
                "theme": "light",
                "notifications": true
            }
        }

    Example Response:
        {
            "message": "Profile updated successfully"
        }
    """
    users_collection = get_users_collection()

    # Create update document with automatic timestamp
    update_doc = {"updatedAt": datetime.utcnow()}

    # Build update document with only provided fields (partial update support)
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

    # Encrypt sensitive fields before database storage
    encrypted_update = encrypt_user_data(update_doc)

    # Convert to dot notation for MongoDB $set operation
    update_data = {}
    for key, value in encrypted_update.items():
        if key != "_encryption":  # Exclude encryption metadata from update
            update_data[key] = value

    # Perform atomic update operation
    await users_collection.update_one(
        {"_id": current_user["_id"]}, {"$set": update_data}
    )

    return {"message": "Profile updated successfully"}
