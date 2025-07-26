"""
Application dependencies for FastAPI dependency injection.
Provides common dependencies like user authentication, database connections, etc.
"""

from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from .core.config import settings
from .core.database import get_database
from .models.user import User

# Security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> User:
    """
    Get the current authenticated user from JWT token.

    Args:
        credentials: HTTP Bearer token credentials
        db: Database connection

    Returns:
        User: The authenticated user object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    try:
        # Decode JWT token
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    try:
        from bson import ObjectId

        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Convert database document to User model format
        user_data = {
            "id": str(user_doc["_id"]),
            "email": user_doc["email"],
            "firstName": user_doc["profile"]["firstName"],
            "lastName": user_doc["profile"]["lastName"],
            "role": user_doc["profile"]["role"],
            "avatar": user_doc["profile"].get("avatar"),
            "phoneNumber": user_doc["profile"].get("phoneNumber"),
            "dateOfBirth": user_doc["profile"].get("dateOfBirth"),
            "preferences": user_doc.get("preferences", {}),
            "security": user_doc.get("security", {}),
            "createdAt": user_doc.get("createdAt"),
            "updatedAt": user_doc.get("updatedAt"),
        }
        user = User(**user_data)
        return user

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to authenticate user",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current active user (extends get_current_user with active status check).

    Args:
        current_user: The authenticated user

    Returns:
        User: The active user object

    Raises:
        HTTPException: If user is not active
    """
    if not getattr(current_user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> Optional[User]:
    """
    Get the current user if authenticated, None otherwise.
    Useful for endpoints that work for both authenticated and anonymous users.

    Args:
        credentials: Optional HTTP Bearer token credentials
        db: Database connection

    Returns:
        Optional[User]: The authenticated user or None
    """
    if credentials is None:
        return None

    try:
        # Create a mock credentials object for get_current_user
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials=credentials.credentials
        )
        return await get_current_user(mock_credentials, db)
    except HTTPException:
        return None


def require_role(required_role: str):
    """
    Dependency factory to require specific user role.

    Args:
        required_role: The required user role

    Returns:
        Function: Dependency function that validates user role
    """

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires {required_role} role",
            )
        return current_user

    return role_checker


def require_admin():
    """
    Dependency to require admin role.

    Returns:
        Function: Dependency function that validates admin role
    """
    return require_role("admin")
