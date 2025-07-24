import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB Configuration
    MONGO_URI: str = os.getenv(
        "MONGO_URI", "mongodb://admin:nKcQbeSc@127.0.0.1:27017/admin"
    )
    MONGO_DB: str = os.getenv("MONGO_DB", "life_experience_platform")

    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv(
        "AUTH_SECRET", "life-experience-ai-platform-secret-key-2024"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # Encryption Configuration
    ENCRYPTION_KEY: str = os.getenv(
        "ENCRYPTION_KEY", "life-exp-encrypt-key-256bit-secret-2024"
    )

    # AI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_API_URL: str = os.getenv("OPENAI_API_URL", "https://api.openai.com/v1")

    # File Upload & Storage Configuration
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: dict = {
        "audio": [".mp3", ".wav", ".m4a", ".ogg", ".flac"],
        "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
        "video": [".mp4", ".avi", ".mov", ".mkv", ".webm"],
    }
    ALLOWED_FILE_TYPES: list = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "audio/mpeg",
        "audio/wav",
        "audio/mp3",
        "audio/ogg",
        "video/mp4",
        "video/avi",
        "video/mov",
        "video/wmv",
    ]
    ENABLE_FILE_ENCRYPTION: bool = True
    FILE_CLEANUP_INTERVAL_HOURS: int = 24
    TEMP_FILE_TTL_HOURS: int = 1
    ORPHANED_FILE_TTL_DAYS: int = 7

    # Security Configuration
    BCRYPT_ROUNDS: int = 12

    # CORS Configuration
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "*.clackypaas.com"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
