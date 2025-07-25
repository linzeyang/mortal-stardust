"""User models and authentication schemas for the Mortal Stardust platform.

This module defines all user-related Pydantic models including authentication,
profile management, preferences, and security settings. The models support
role-based personalization and comprehensive user lifecycle management.

The user system is designed around different user roles that receive tailored
AI guidance and experience processing based on their specific needs and contexts.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    """User role enumeration for personalized AI guidance and experience processing.

    Each role receives customized templates, prompts, and solution recommendations
    based on their specific life context and challenges. This enables the AI
    to provide more relevant and actionable guidance.

    Values:
        WORKPLACE_NEWCOMER: Recent graduates or career changers adapting to
            professional environments. Focus on workplace skills, networking,
            and career development guidance.
        ENTREPRENEUR: Business owners, startup founders, and self-employed
            individuals. Emphasis on business strategy, leadership, and
            decision-making support.
        STUDENT: Academic learners at various levels. Guidance covers study
            techniques, exam preparation, academic stress, and career planning.
        OTHER: General users who don't fit specific categories. Receives
            balanced, general-purpose life guidance and emotional support.
    """

    WORKPLACE_NEWCOMER = "workplace_newcomer"
    ENTREPRENEUR = "entrepreneur"
    STUDENT = "student"
    OTHER = "other"


class UserProfile(BaseModel):
    """User profile information for personalization and display purposes.

    Contains core user identity information that influences AI guidance
    personalization and user experience customization. Profile data is
    used to tailor communication style, cultural context, and age-appropriate
    recommendations.

    Attributes:
        firstName: User's given name, used for personalized communication.
            Validation: 1-50 characters, required for user identification.
        lastName: User's family name, combined with firstName for full identity.
            Validation: 1-50 characters, required for complete user profile.
        role: User's primary life context role for AI guidance customization.
            Determines which templates and solution approaches are prioritized.
        avatar: Optional profile image URL or base64 data for user interface.
            Used for personalized dashboard and improved user experience.
        phoneNumber: Optional contact number for account recovery and notifications.
            Format validation handled by client, stored as string for flexibility.
        dateOfBirth: Optional birth date for age-appropriate guidance and analytics.
            Used to customize advice relevance and track generational patterns.
        bio: Optional personal biography or description for profile display.
            Validation: Maximum 500 characters for concise personal introduction.
    """

    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    role: UserRole
    avatar: Optional[str] = None
    phoneNumber: Optional[str] = None
    dateOfBirth: Optional[datetime] = None
    bio: Optional[str] = Field(None, max_length=500)


class NotificationPreferences(BaseModel):
    """User notification preferences for communication control.

    Manages how and when users receive notifications from the platform,
    including AI completion alerts, email reminders, and feature updates.
    Supports granular control over notification types and timing.

    Attributes:
        ai_solution_complete: Notify when AI completes experience analysis.
            Default: True for immediate feedback on AI processing completion.
        email_reminders: Send email notifications for important updates.
            Default: True for engagement, but user-controllable for privacy.
        push_notifications: Enable browser/mobile push notifications.
            Default: False to avoid intrusion, requires explicit user opt-in.
        weekly_digest: Send weekly summary of user progress and insights.
            Default: True for engagement and progress tracking.
        feature_updates: Notify about new platform features and improvements.
            Default: False to avoid marketing-like communications.
        morning_time: Preferred time for morning notifications (HH:MM format).
            Default: "09:00" for typical work day start time.
        evening_time: Preferred time for evening notifications (HH:MM format).
            Default: "20:00" for typical evening availability.
    """

    ai_solution_complete: bool = True
    email_reminders: bool = True
    push_notifications: bool = False
    weekly_digest: bool = True
    feature_updates: bool = False
    morning_time: str = "09:00"
    evening_time: str = "20:00"


class PrivacySettings(BaseModel):
    """User privacy and data sharing preferences.

    Controls how user data is used by the platform, including analytics,
    personalization, and third-party integrations. Ensures GDPR compliance
    and provides granular privacy control.

    Attributes:
        data_sharing: Allow anonymized data for AI model improvement.
            Default: False to ensure explicit opt-in for privacy compliance.
        personalized_recommendations: Enable personalized AI suggestions.
            Default: True as core platform feature, but user-controllable.
        marketing_communications: Receive product updates and marketing.
            Default: False to avoid unsolicited marketing communications.
        third_party_integrations: Allow integration with external services.
            Default: False for maximum privacy protection.
        data_retention_period: How long to keep user data before deletion.
            Default: "never" - user must explicitly choose retention period.
            Options: "never", "1year", "2years", "5years"
    """

    data_sharing: bool = False
    personalized_recommendations: bool = True
    marketing_communications: bool = False
    third_party_integrations: bool = False
    data_retention_period: str = "never"


class SecuritySettings(BaseModel):
    """Enhanced user security settings and account protection.

    Manages advanced security features including two-factor authentication,
    session management, and password policies. Provides comprehensive
    account protection against unauthorized access.

    Attributes:
        two_factor_enabled: Whether 2FA is active for the account.
            Default: False to avoid friction, but recommended for security.
        password_change_required: Force password change on next login.
            Default: False, set to True for security incidents or policy.
        session_timeout: Session timeout in seconds for automatic logout.
            Default: 3600 (1 hour) for balance of security and usability.
        last_password_change: Timestamp of most recent password change.
            Used for password age policies and security monitoring.
    """

    two_factor_enabled: bool = False
    password_change_required: bool = False
    session_timeout: int = 3600  # seconds
    last_password_change: Optional[datetime] = None


class UIPreferences(BaseModel):
    """User interface and experience preferences.

    Controls the visual appearance and behavior of the platform interface,
    including theme, language, and AI assistant customization. Enables
    personalized user experience across devices and sessions.

    Attributes:
        theme: Visual theme preference (light, dark, system).
            Default: "light" for broad compatibility and readability.
        language: Interface language preference (ISO 639-1 codes).
            Default: "zh-CN" for primary target market (Simplified Chinese).
        date_format: Preferred date display format.
            Default: "YYYY-MM-DD" for international standard format.
        timezone: User's timezone for proper time display and scheduling.
            Default: "Asia/Shanghai" for primary target market.
        ai_assistant_style: AI communication style preference.
            Default: "balanced" for appropriate tone and formality.
            Options: "professional", "friendly", "balanced", "encouraging"
        detailed_analysis: Prefer detailed AI analysis and explanations.
            Default: True for comprehensive guidance and insights.
        quick_response: Prioritize speed over detail in AI responses.
            Default: False - prefer quality over speed for better guidance.
    """

    theme: str = "light"
    language: str = "zh-CN"
    date_format: str = "YYYY-MM-DD"
    timezone: str = "Asia/Shanghai"
    ai_assistant_style: str = "balanced"
    detailed_analysis: bool = True
    quick_response: bool = False


class UserPreferences(BaseModel):
    """Legacy user preference settings for backward compatibility.

    Maintains existing preference structure while new settings are migrated
    to dedicated models. Will be deprecated in favor of specific settings models.

    Attributes:
        language: User's preferred language for AI responses and interface.
            Default: "zh-CN" (Simplified Chinese) as primary target market.
        notifications: Whether user wants to receive system notifications.
            Default: True to enable engagement, but user-controllable for privacy.
        dataSharing: User consent for anonymized data usage in AI improvement.
            Default: False to ensure explicit opt-in for privacy compliance.
    """

    language: str = "zh-CN"
    notifications: bool = True
    dataSharing: bool = False


class UserSecurity(BaseModel):
    """User security settings and account protection mechanisms.

    Manages authentication security features, login tracking, and account
    protection against unauthorized access. Implements progressive security
    measures including attempt limiting and temporary account locking.

    Attributes:
        twoFactorEnabled: Whether two-factor authentication is active.
            Default: False to avoid friction, but recommended for sensitive accounts.
            When enabled, requires additional verification beyond password.
        lastLogin: Timestamp of user's most recent successful authentication.
            Default: Current UTC time on account creation.
            Used for security monitoring and inactive account identification.
        loginAttempts: Count of consecutive failed login attempts.
            Default: 0, incremented on each failure, reset on success.
            Used to trigger account locking after threshold (typically 5 attempts).
        lockUntil: Timestamp when account lock expires, if currently locked.
            Default: None (account not locked).
            Prevents login attempts until this time passes, implements exponential backoff.
    """

    twoFactorEnabled: bool = False
    lastLogin: datetime = Field(default_factory=datetime.utcnow)
    loginAttempts: int = 0
    lockUntil: Optional[datetime] = None


class UserSettings(BaseModel):
    """Comprehensive user settings container for all preference categories.

    Organizes all user settings into logical categories for better management
    and API organization. Provides default values for all settings to ensure
    consistent user experience from account creation.

    Attributes:
        notifications: Notification preferences and timing settings.
            Controls how and when users receive platform communications.
        privacy: Privacy and data sharing preferences.
            Manages user consent and data usage policies.
        security: Enhanced security settings beyond basic authentication.
            Controls advanced security features and session management.
        ui_preferences: User interface and experience customization.
            Controls visual appearance and AI assistant behavior.
    """

    notifications: NotificationPreferences = Field(
        default_factory=NotificationPreferences
    )
    privacy: PrivacySettings = Field(default_factory=PrivacySettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    ui_preferences: UIPreferences = Field(default_factory=UIPreferences)


class Session(BaseModel):
    """Active user session information for security management.

    Represents an active user session with device and location information
    for security monitoring and session management features.

    Attributes:
        id: Unique session identifier for termination operations.
        device: Device information (browser, OS, etc.) for user recognition.
        location: Geographic location or IP-based location for security.
        last_active: Timestamp of most recent session activity.
        current: Whether this is the current session (for UI indication).
        created_at: Session creation timestamp for age tracking.
    """

    id: str
    device: str
    location: str
    last_active: datetime
    current: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
    """User registration request model for new account creation.

    Validates and structures data required for creating a new user account.
    Enforces security requirements and data quality constraints during
    the registration process. All fields are required for complete user setup.

    Attributes:
        email: User's email address for authentication and communication.
            Validation: Must be valid email format, used as unique identifier.
            Serves as primary login credential and contact method.
        password: User's chosen password for account security.
            Validation: 8-100 characters to balance security and usability.
            Will be hashed before storage, never stored in plain text.
        firstName: User's given name for profile and personalization.
            Validation: 1-50 characters, required for user identification.
        lastName: User's family name for complete identity.
            Validation: 1-50 characters, combined with firstName for full name.
        role: User's primary context role for AI guidance customization.
            Required to enable immediate personalized experience after registration.
    """

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    role: UserRole


class UserLogin(BaseModel):
    """User authentication request model for login attempts.

    Validates user credentials during authentication process. Enforces
    the same password constraints as registration to ensure consistency
    and prevent authentication bypass through malformed requests.

    Attributes:
        email: User's registered email address for account identification.
            Validation: Must be valid email format, case-insensitive matching.
            Used to locate user account in database for credential verification.
        password: User's password for authentication verification.
            Validation: 8-100 characters, must match stored password hash.
            Validated against hashed version stored in database.
    """

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """User profile update request model for account modifications.

    Allows partial updates to user profile information while maintaining
    data validation constraints. All fields are optional to support
    granular updates without requiring complete profile reconstruction.

    Attributes:
        firstName: Updated given name, maintains same validation as creation.
            Validation: 1-50 characters when provided, None to skip update.
        lastName: Updated family name, maintains same validation as creation.
            Validation: 1-50 characters when provided, None to skip update.
        role: Updated user role, triggers AI guidance reconfiguration.
            When changed, affects future experience processing and recommendations.
        avatar: Updated profile image URL or data.
            Can be set to None to remove existing avatar.
        phoneNumber: Updated contact number for account recovery.
            Can be set to None to remove existing phone number.
        dateOfBirth: Updated birth date for age-appropriate guidance.
            Can be set to None to remove existing date of birth.
        bio: Updated user biography or personal description.
            Can be set to None to remove existing bio.
        preferences: Updated user preferences for platform customization.
            Partial updates supported through nested model validation.
        settings: Updated comprehensive user settings.
            Allows updating any category of user settings independently.
    """

    firstName: Optional[str] = Field(None, min_length=1, max_length=50)
    lastName: Optional[str] = Field(None, min_length=1, max_length=50)
    role: Optional[UserRole] = None
    avatar: Optional[str] = None
    phoneNumber: Optional[str] = None
    dateOfBirth: Optional[datetime] = None
    bio: Optional[str] = Field(None, max_length=500)
    preferences: Optional[UserPreferences] = None
    settings: Optional[UserSettings] = None


class UserResponse(BaseModel):
    """User data response model for API endpoints and client consumption.

    Structures user data for safe transmission to client applications,
    excluding sensitive information like password hashes while providing
    complete profile and preference information for user interface rendering.

    Attributes:
        id: User's unique identifier from MongoDB ObjectId.
            Aliased from "_id" to match MongoDB document structure.
            Used for all user-related database operations and references.
        email: User's email address for display and account management.
            Safe to include in responses as it's not sensitive authentication data.
        name: User's full name for display purposes.
            Computed from firstName and lastName for convenience.
        profile: Complete user profile information for personalization.
            Includes name, role, avatar, and optional contact information.
        preferences: User's platform preferences for client-side customization.
            Language, notification, and data sharing settings for UI adaptation.
        settings: Comprehensive user settings for all preference categories.
            Includes notifications, privacy, security, and UI preferences.
        security: Non-sensitive security information for account status display.
            Excludes sensitive data like password hashes or security tokens.
        activeSessions: List of active user sessions for security management.
            Includes device and location information for session monitoring.
        createdAt: Account creation timestamp for analytics and display.
            ISO format for consistent client-side date handling.
        updatedAt: Last profile modification timestamp for change tracking.
            ISO format for consistent client-side date handling.
    """

    id: str = Field(..., alias="_id")
    email: EmailStr
    name: str
    profile: UserProfile
    preferences: UserPreferences
    settings: UserSettings = Field(default_factory=UserSettings)
    security: UserSecurity
    activeSessions: list[Session] = Field(default_factory=list)
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class User(BaseModel):
    """Main User model for authentication and general application use.

    Represents a complete user entity with all profile, preference, and security
    information. This is the primary model used throughout the application for
    user operations, AI processing context, and business logic implementation.

    The model combines all user-related data into a single coherent structure
    while maintaining clear separation of concerns through nested models for
    different functional areas (profile, preferences, security).

    Attributes:
        id: MongoDB ObjectId as string, None for new users before database insertion.
            Aliased from "_id" to match MongoDB document structure.
        email: User's unique email address for authentication and communication.
            Serves as primary identifier and login credential.
        firstName: User's given name for personalization and display.
            Combined with lastName for full name display and communication.
        lastName: User's family name for complete identity representation.
            Used in formal communications and full name display contexts.
        role: User's primary life context role for AI guidance customization.
            Determines which templates, prompts, and solutions are prioritized.
        avatar: Optional profile image URL or base64 data for user interface.
            Enhances user experience through visual personalization.
        phoneNumber: Optional contact number for account recovery and notifications.
            Stored as string to accommodate international format variations.
        dateOfBirth: Optional birth date for age-appropriate guidance and analytics.
            Used to customize advice relevance and demographic insights.
        preferences: User's platform preferences with sensible defaults.
            Controls language, notifications, and data sharing settings.
        security: User's security settings and authentication state.
            Manages login tracking, attempt limiting, and account protection.
        createdAt: Account creation timestamp, set automatically on creation.
            Used for analytics, account age calculations, and audit trails.
        updatedAt: Last modification timestamp, updated on profile changes.
            Tracks when user information was last modified for change management.
    """

    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    firstName: str
    lastName: str
    role: UserRole
    avatar: Optional[str] = None
    phoneNumber: Optional[str] = None
    dateOfBirth: Optional[datetime] = None
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    security: UserSecurity = Field(default_factory=UserSecurity)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    @property
    def name(self) -> str:
        """Get user's full name by combining first and last names.

        Returns:
            str: Full name in "FirstName LastName" format for display purposes.
        """
        return f"{self.firstName} {self.lastName}"

    @property
    def is_active(self) -> bool:
        """Check if user account is currently active and not locked.

        Determines account status based on security lock settings. An account
        is considered active if it's not currently locked or if the lock
        period has expired.

        Returns:
            bool: True if account is active and can authenticate, False if locked.
        """
        if self.security.lockUntil:
            return datetime.utcnow() > self.security.lockUntil
        return True

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class UserInDB(BaseModel):
    """User model for database storage with sensitive authentication data.

    Represents the complete user record as stored in the database, including
    sensitive authentication information like password hashes. This model
    should only be used for database operations and never exposed in API
    responses or client communications.

    The model separates profile information into nested structures to maintain
    clear data organization and enable efficient partial updates while keeping
    sensitive authentication data secure and isolated.

    Attributes:
        id: MongoDB ObjectId as string, None for new users before insertion.
            Aliased from "_id" to match MongoDB document structure.
            Primary key for all database operations and foreign key references.
        email: User's unique email address, serves as authentication identifier.
            Indexed in database for fast lookup during authentication.
        passwordHash: Bcrypt hash of user's password for secure authentication.
            Never stored in plain text, used only for password verification.
            Generated using secure hashing with salt for protection against rainbow tables.
        profile: Complete user profile information in nested structure.
            Includes name, role, avatar, and optional contact information.
        preferences: User's platform preferences for customization.
            Language, notification, and data sharing settings.
        settings: Comprehensive user settings for all preference categories.
            Includes notifications, privacy, security, and UI preferences.
        security: User's security settings and authentication state.
            Login tracking, attempt limiting, and account protection data.
        activeSessions: List of active user sessions for security management.
            Stored as encrypted session data for security monitoring.
        createdAt: Account creation timestamp, set automatically on creation.
            Used for analytics, account age calculations, and audit trails.
        updatedAt: Last modification timestamp, updated on any profile changes.
            Tracks when user information was last modified for change management.
    """

    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    passwordHash: str  # Sensitive: bcrypt hash of user password
    profile: UserProfile
    preferences: UserPreferences
    settings: UserSettings = Field(default_factory=UserSettings)
    security: UserSecurity
    activeSessions: list[Session] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
