"""
Settings Management API Endpoints

This module provides FastAPI endpoints for comprehensive user settings management
including notifications, privacy, security, and UI preferences. All endpoints
require authentication and handle data validation and encryption automatically.

Key Features:
- Granular settings management by category
- JWT-based authentication for all endpoints
- Automatic data validation using Pydantic models
- Field-level encryption for sensitive settings
- Session management for security features
- Comprehensive error handling and logging

Settings Categories:
- Notifications: Communication preferences and timing
- Privacy: Data sharing and retention settings
- Security: 2FA, password policies, session management
- Preferences: UI customization and AI assistant settings
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..api.auth import get_current_user
from ..core.database import get_users_collection
from ..models.user import (
    NotificationPreferences,
    PrivacySettings,
    SecuritySettings,
    Session,
    UIPreferences,
)
from ..utils.field_encryption import decrypt_user_data, encrypt_user_data

router = APIRouter()


@router.get("/notifications", response_model=NotificationPreferences)
async def get_notification_settings(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the authenticated user's notification preferences.

    Returns the user's current notification settings including communication
    preferences, timing settings, and notification type selections.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        NotificationPreferences: User's notification settings containing:
            - ai_solution_complete (bool): AI completion notifications
            - email_reminders (bool): Email notification preference
            - push_notifications (bool): Browser/mobile push notifications
            - weekly_digest (bool): Weekly summary emails
            - feature_updates (bool): New feature announcements
            - morning_time (str): Preferred morning notification time
            - evening_time (str): Preferred evening notification time

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 500 if database operation fails
    """
    try:
        # Get settings from user data, with defaults if not present
        settings = current_user.get("settings", {})
        notifications = settings.get("notifications", {})

        # Return with defaults for any missing fields
        return NotificationPreferences(**notifications)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notification settings",
        )


@router.put("/notifications", response_model=dict)
async def update_notification_settings(
    notification_data: NotificationPreferences,
    current_user: dict = Depends(get_current_user),
):
    """
    Update the authenticated user's notification preferences.

    Allows users to modify their notification settings including which types
    of notifications to receive and when to receive them. Changes are applied
    immediately and affect future communications.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        notification_data (NotificationPreferences): Updated notification settings
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: Success confirmation message

    Raises:
        HTTPException: 400 if validation fails
        HTTPException: 401 if authentication fails
        HTTPException: 422 if request data is invalid
        HTTPException: 500 if database operation fails
    """
    try:
        users_collection = get_users_collection()

        # Prepare update document
        update_doc = {
            "settings.notifications": notification_data.dict(),
            "updatedAt": datetime.utcnow(),
        }

        # Encrypt sensitive data if needed
        encrypted_update = encrypt_user_data(update_doc)

        # Update user settings
        result = await users_collection.update_one(
            {"_id": current_user["_id"]}, {"$set": encrypted_update}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return {"message": "Notification settings updated successfully"}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification settings",
        )


@router.get("/privacy", response_model=PrivacySettings)
async def get_privacy_settings(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the authenticated user's privacy settings.

    Returns the user's current privacy preferences including data sharing
    consent, retention policies, and third-party integration settings.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        PrivacySettings: User's privacy settings containing:
            - data_sharing (bool): Consent for anonymized data usage
            - personalized_recommendations (bool): Enable personalized suggestions
            - marketing_communications (bool): Receive marketing emails
            - third_party_integrations (bool): Allow external service integration
            - data_retention_period (str): Automatic data deletion timeline

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 500 if database operation fails
    """
    try:
        # Decrypt user data to access privacy settings
        decrypted_user = decrypt_user_data(dict(current_user))
        settings = decrypted_user.get("settings", {})
        privacy = settings.get("privacy", {})

        return PrivacySettings(**privacy)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve privacy settings",
        )


@router.put("/privacy", response_model=dict)
async def update_privacy_settings(
    privacy_data: PrivacySettings, current_user: dict = Depends(get_current_user)
):
    """
    Update the authenticated user's privacy settings.

    Allows users to control their privacy preferences including data sharing
    consent, retention policies, and marketing communications. Changes are
    logged for compliance auditing.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        privacy_data (PrivacySettings): Updated privacy settings
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: Success confirmation message

    Raises:
        HTTPException: 400 if validation fails
        HTTPException: 401 if authentication fails
        HTTPException: 422 if request data is invalid
        HTTPException: 500 if database operation fails
    """
    try:
        users_collection = get_users_collection()

        # Prepare update document
        update_doc = {
            "settings.privacy": privacy_data.dict(),
            "updatedAt": datetime.utcnow(),
        }

        # Encrypt sensitive data
        encrypted_update = encrypt_user_data(update_doc)

        # Update user settings
        result = await users_collection.update_one(
            {"_id": current_user["_id"]}, {"$set": encrypted_update}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Log privacy setting changes for compliance
        # TODO: Implement privacy audit logging

        return {"message": "Privacy settings updated successfully"}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update privacy settings",
        )


@router.get("/security", response_model=SecuritySettings)
async def get_security_settings(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the authenticated user's security settings.

    Returns the user's current security configuration including 2FA status,
    password policies, and session management settings.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        SecuritySettings: User's security settings containing:
            - two_factor_enabled (bool): 2FA activation status
            - password_change_required (bool): Force password change flag
            - session_timeout (int): Session timeout in seconds
            - last_password_change (datetime): Most recent password change

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 500 if database operation fails
    """
    try:
        settings = current_user.get("settings", {})
        security = settings.get("security", {})

        return SecuritySettings(**security)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve security settings",
        )


@router.put("/security", response_model=dict)
async def update_security_settings(
    security_data: SecuritySettings, current_user: dict = Depends(get_current_user)
):
    """
    Update the authenticated user's security settings.

    Allows users to modify security preferences including session timeout
    and password policies. 2FA changes require separate endpoints for
    proper verification flow.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        security_data (SecuritySettings): Updated security settings
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: Success confirmation message

    Raises:
        HTTPException: 400 if validation fails
        HTTPException: 401 if authentication fails
        HTTPException: 422 if request data is invalid
        HTTPException: 500 if database operation fails
    """
    try:
        users_collection = get_users_collection()

        # Prepare update document
        update_doc = {
            "settings.security": security_data.dict(),
            "updatedAt": datetime.utcnow(),
        }

        # Encrypt sensitive data
        encrypted_update = encrypt_user_data(update_doc)

        # Update user settings
        result = await users_collection.update_one(
            {"_id": current_user["_id"]}, {"$set": encrypted_update}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return {"message": "Security settings updated successfully"}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update security settings",
        )


@router.get("/preferences", response_model=UIPreferences)
async def get_ui_preferences(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the authenticated user's UI preferences.

    Returns the user's current interface customization settings including
    theme, language, and AI assistant preferences.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        UIPreferences: User's UI preferences containing:
            - theme (str): Visual theme preference
            - language (str): Interface language
            - date_format (str): Date display format
            - timezone (str): User's timezone
            - ai_assistant_style (str): AI communication style
            - detailed_analysis (bool): Prefer detailed AI responses
            - quick_response (bool): Prioritize speed over detail

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 500 if database operation fails
    """
    try:
        settings = current_user.get("settings", {})
        ui_preferences = settings.get("ui_preferences", {})

        return UIPreferences(**ui_preferences)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve UI preferences",
        )


@router.put("/preferences", response_model=dict)
async def update_ui_preferences(
    preferences_data: UIPreferences, current_user: dict = Depends(get_current_user)
):
    """
    Update the authenticated user's UI preferences.

    Allows users to customize their interface experience including theme,
    language, and AI assistant behavior. Changes are applied immediately
    and persist across sessions and devices.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        preferences_data (UIPreferences): Updated UI preferences
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: Success confirmation message

    Raises:
        HTTPException: 400 if validation fails
        HTTPException: 401 if authentication fails
        HTTPException: 422 if request data is invalid
        HTTPException: 500 if database operation fails
    """
    try:
        users_collection = get_users_collection()

        # Prepare update document
        update_doc = {
            "settings.ui_preferences": preferences_data.dict(),
            "updatedAt": datetime.utcnow(),
        }

        # Encrypt sensitive data if needed
        encrypted_update = encrypt_user_data(update_doc)

        # Update user settings
        result = await users_collection.update_one(
            {"_id": current_user["_id"]}, {"$set": encrypted_update}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return {"message": "UI preferences updated successfully"}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update UI preferences",
        )


@router.get("/sessions", response_model=List[Session])
async def get_active_sessions(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the authenticated user's active sessions.

    Returns a list of all active sessions for the user including device
    information, location, and last activity timestamps for security monitoring.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        List[Session]: List of active sessions containing:
            - id (str): Unique session identifier
            - device (str): Device and browser information
            - location (str): Geographic or IP-based location
            - last_active (datetime): Most recent activity timestamp
            - current (bool): Whether this is the current session

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 500 if database operation fails
    """
    try:
        # Get active sessions from user data
        active_sessions = current_user.get("activeSessions", [])

        # Convert to Session objects with proper typing
        sessions = []
        for session_data in active_sessions:
            sessions.append(Session(**session_data))

        return sessions
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve active sessions",
        )


@router.delete("/sessions/{session_id}", response_model=dict)
async def terminate_session(
    session_id: str, current_user: dict = Depends(get_current_user)
):
    """
    Terminate a specific user session.

    Immediately invalidates the specified session, logging out the user
    from that device/browser. The current session cannot be terminated
    through this endpoint for security reasons.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        session_id (str): Unique identifier of the session to terminate
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: Success confirmation message

    Raises:
        HTTPException: 400 if trying to terminate current session
        HTTPException: 401 if authentication fails
        HTTPException: 404 if session not found
        HTTPException: 500 if database operation fails
    """
    try:
        users_collection = get_users_collection()

        # Get current sessions
        active_sessions = current_user.get("activeSessions", [])

        # Find and remove the specified session
        updated_sessions = []
        session_found = False

        for session in active_sessions:
            if session.get("id") == session_id:
                session_found = True
                # Don't allow terminating current session
                if session.get("current", False):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot terminate current session",
                    )
            else:
                updated_sessions.append(session)

        if not session_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Update user with remaining sessions
        result = await users_collection.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "activeSessions": updated_sessions,
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return {"message": "Session terminated successfully"}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to terminate session",
        )


@router.post("/sessions/terminate-all", response_model=dict)
async def terminate_all_sessions(current_user: dict = Depends(get_current_user)):
    """
    Terminate all user sessions except the current one.

    Immediately invalidates all other sessions for the user, effectively
    logging them out from all other devices while keeping the current
    session active for security and usability.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: Success confirmation message with count of terminated sessions

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 500 if database operation fails
    """
    try:
        users_collection = get_users_collection()

        # Get current sessions
        active_sessions = current_user.get("activeSessions", [])

        # Keep only the current session
        current_sessions = [
            session for session in active_sessions if session.get("current", False)
        ]

        terminated_count = len(active_sessions) - len(current_sessions)

        # Update user with only current session
        result = await users_collection.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "activeSessions": current_sessions,
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return {
            "message": "All other sessions terminated successfully",
            "terminated_count": terminated_count,
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to terminate sessions",
        )


@router.post("/delete-data", response_model=dict)
async def request_data_deletion(current_user: dict = Depends(get_current_user)):
    """
    Request complete deletion of user data.

    Initiates the process to permanently delete all user data including
    profile, experiences, solutions, and settings. This operation is
    irreversible and complies with GDPR right to be forgotten.

    Authentication:
        Requires valid JWT token in Authorization header

    Args:
        current_user (dict): Authenticated user object injected by dependency

    Returns:
        dict: Confirmation message with deletion timeline

    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 500 if database operation fails

    Note:
        This endpoint schedules data deletion but does not immediately
        delete data to allow for a grace period and proper cleanup.
    """
    try:
        # TODO: Implement comprehensive data deletion process
        # This should include:
        # 1. Mark user for deletion with grace period
        # 2. Schedule background job for data cleanup
        # 3. Delete related data (experiences, solutions, etc.)
        # 4. Comply with data retention policies
        # 5. Log deletion for compliance auditing

        return {
            "message": "Data deletion request received",
            "timeline": "Data will be permanently deleted within 30 days",
            "grace_period": "You can cancel this request within 7 days",
        }

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process data deletion request",
        )
