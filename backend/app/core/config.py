"""
Application Configuration and Settings Management

This module defines all configuration settings for the Mortal Stardust backend application
using Pydantic Settings for type-safe environment variable management. The configuration
covers database connections, security settings, AI integration, file handling, and
deployment-specific parameters.

Configuration Sources (in order of precedence):
1. Environment variables (highest priority)
2. .env file in the backend directory
3. Default values defined in this module (lowest priority)

Security Considerations:
- Sensitive values (API keys, secrets) should be set via environment variables
- Default values are provided for development convenience but should be overridden in production
- Encryption keys and JWT secrets must be changed from defaults in production environments
- File upload limits and allowed types provide security against malicious uploads

Environment Setup:
- Development: Use .env file with appropriate values for local development
- Production: Set environment variables through deployment platform (Docker, Kubernetes, etc.)
- Testing: Override settings in test configuration to use test databases and mock services

Dependencies:
- Pydantic Settings: Type-safe configuration management with validation
- OS module: Environment variable access and path handling
"""

import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings with type validation and environment variable support.

    This class defines all configuration parameters for the application using
    Pydantic Settings, which provides automatic type validation, environment
    variable parsing, and default value management.

    All settings can be overridden via environment variables using the same
    name as the class attribute. For example, MONGO_URI environment variable
    will override the MONGO_URI setting.
    """

    # MongoDB Database Configuration
    # Connection string format: mongodb://[username:password@]host[:port][/database][?options]
    MONGO_URI: str = os.getenv(
        "MONGO_URI", "mongodb://admin:nKcQbeSc@127.0.0.1:27017/admin"
    )  # Full MongoDB connection string with authentication

    MONGO_DB: str = os.getenv(
        "MONGO_DB", "life_experience_platform"
    )  # Target database name for application data

    # JWT Authentication Configuration
    # CRITICAL: Change JWT_SECRET_KEY in production to a cryptographically secure random value
    JWT_SECRET_KEY: str = os.getenv(
        "AUTH_SECRET", "life-experience-ai-platform-secret-key-2024"
    )  # Secret key for JWT token signing and verification - MUST be changed in production

    JWT_ALGORITHM: str = "HS256"  # HMAC SHA-256 algorithm for JWT token signing
    JWT_EXPIRATION_HOURS: int = 24  # Token validity period in hours (24h = 1 day)

    # Data Encryption Configuration
    # Used for field-level encryption of sensitive user data (experiences, personal information)
    # CRITICAL: Must be exactly 32 characters for AES-256 encryption
    ENCRYPTION_KEY: str = os.getenv(
        "ENCRYPTION_KEY", "life-exp-encrypt-key-256bit-secret-2024"
    )  # AES-256 encryption key for sensitive data - MUST be changed in production

    # AI Service Integration Configuration
    # OpenAI API configuration for the three-stage AI processing pipeline
    OPENAI_API_KEY: str = os.getenv(
        "OPENAI_API_KEY", ""
    )  # OpenAI API key - required for AI processing
    OPENAI_API_URL: str = os.getenv(
        "OPENAI_API_URL", "https://api.openai.com/v1"
    )  # OpenAI API base URL - can be changed for compatible APIs
    MODEL_ID: str = os.getenv("MODEL_ID", "gpt-4")

    # File Upload and Storage Configuration
    # Multi-modal experience collection requires secure file handling for images, audio, and video

    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR", "uploads"
    )  # Directory for storing uploaded files
    MAX_FILE_SIZE: int = (
        50 * 1024 * 1024
    )  # Maximum file size: 50MB (prevents DoS attacks via large uploads)

    # Allowed file extensions by media type - security measure to prevent malicious file uploads
    ALLOWED_EXTENSIONS: dict = {
        "audio": [
            ".mp3",
            ".wav",
            ".m4a",
            ".ogg",
            ".flac",
        ],  # Audio formats for voice experiences
        "image": [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".bmp",
            ".webp",
        ],  # Image formats for visual experiences
        "video": [
            ".mp4",
            ".avi",
            ".mov",
            ".mkv",
            ".webm",
        ],  # Video formats for multimedia experiences
    }

    # MIME type validation for additional security - prevents file extension spoofing
    ALLOWED_FILE_TYPES: list = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",  # Image MIME types
        "audio/mpeg",
        "audio/wav",
        "audio/mp3",
        "audio/ogg",  # Audio MIME types
        "video/mp4",
        "video/avi",
        "video/mov",
        "video/wmv",  # Video MIME types
    ]

    # File Security and Lifecycle Management
    ENABLE_FILE_ENCRYPTION: bool = True  # Encrypt uploaded files for privacy protection
    FILE_CLEANUP_INTERVAL_HOURS: int = 24  # How often to run file cleanup tasks
    TEMP_FILE_TTL_HOURS: int = 1  # Time-to-live for temporary files (1 hour)
    ORPHANED_FILE_TTL_DAYS: int = 7  # Time-to-live for orphaned files (7 days)

    # Password Security Configuration
    # Bcrypt configuration for secure password hashing
    BCRYPT_ROUNDS: int = 12  # Number of bcrypt rounds (12 = ~250ms on modern hardware, good security/performance balance)

    # Cross-Origin Resource Sharing (CORS) Configuration
    # Defines which frontend origins are allowed to make API requests
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",  # Local development frontend
        "*.clackypaas.com",  # Production frontend domains
    ]

    # Pydantic model configuration
    model_config = {
        "env_file": ".env",  # Load environment variables from .env file
        "extra": "ignore",  # Ignore extra environment variables not defined in this class
    }


# Global settings instance - singleton pattern for application-wide configuration access
# This instance is imported throughout the application to access configuration values
settings = Settings()
