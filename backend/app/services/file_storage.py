"""
Secure file storage management system for multimodal content.
Handles local storage with encryption, access control, and cleanup.
In production, this can be extended to support cloud storage (S3, Azure Blob, etc.)
"""

import hashlib
import json
import logging
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

from ..core.config import settings
from ..utils.encryption import decrypt_data, encrypt_data

logger = logging.getLogger(__name__)


@dataclass
class StoredFile:
    """Represents a stored file with metadata."""

    file_id: str
    original_name: str
    stored_path: str
    file_size: int
    mime_type: str
    checksum: str
    created_at: datetime
    user_id: str
    is_encrypted: bool = True
    access_count: int = 0
    last_accessed: Optional[datetime] = None


class SecureFileStorage:
    """Secure file storage manager with encryption and access control."""

    def __init__(self):
        self.base_dir = Path(
            settings.UPLOAD_DIR if hasattr(settings, "UPLOAD_DIR") else "uploads"
        )
        self.metadata_dir = self.base_dir / ".metadata"
        self.temp_dir = self.base_dir / ".temp"

        # Create directory structure
        self._initialize_directories()

        # File constraints
        self.max_file_size = 50 * 1024 * 1024  # 50MB
        self.allowed_extensions = {
            "audio": [".mp3", ".wav", ".m4a", ".ogg", ".flac"],
            "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
            "video": [".mp4", ".avi", ".mov", ".mkv", ".webm"],
        }

        # Cleanup settings
        self.temp_file_ttl = timedelta(hours=1)
        self.orphaned_file_ttl = timedelta(days=7)

    def _initialize_directories(self):
        """Create necessary directory structure."""
        directories = [
            self.base_dir,
            self.metadata_dir,
            self.temp_dir,
            self.base_dir / "audio",
            self.base_dir / "image",
            self.base_dir / "video",
            self.base_dir / "encrypted",
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

        # Create .gitignore to exclude uploads from git
        gitignore_path = self.base_dir / ".gitignore"
        if not gitignore_path.exists():
            with open(gitignore_path, "w") as f:
                f.write("*\n!.gitignore\n")

    async def store_file(
        self,
        file_data: bytes,
        original_name: str,
        mime_type: str,
        user_id: str,
        file_type: str = "unknown",
        encrypt: bool = True,
    ) -> StoredFile:
        """Store a file securely with encryption and metadata."""
        try:
            # Validate file
            if len(file_data) > self.max_file_size:
                raise ValueError(
                    f"File size {len(file_data)} exceeds maximum {self.max_file_size}"
                )

            file_extension = Path(original_name).suffix.lower()
            if file_type in self.allowed_extensions:
                if file_extension not in self.allowed_extensions[file_type]:
                    raise ValueError(
                        f"File extension {file_extension} not allowed for {file_type}"
                    )

            # Generate unique file ID and path
            file_id = str(uuid.uuid4())
            checksum = hashlib.sha256(file_data).hexdigest()

            # Determine storage path
            if encrypt:
                stored_path = self.base_dir / "encrypted" / f"{file_id}.enc"
            else:
                subdir = (
                    file_type if file_type in ["audio", "image", "video"] else "other"
                )
                stored_path = self.base_dir / subdir / f"{file_id}{file_extension}"

            # Store file
            if encrypt:
                encrypted_data = encrypt_data(
                    file_data.decode("latin-1")
                    if isinstance(file_data, bytes)
                    else file_data
                )
                with open(stored_path, "w") as f:
                    f.write(encrypted_data)
            else:
                with open(stored_path, "wb") as f:
                    f.write(file_data)

            # Create file metadata
            stored_file = StoredFile(
                file_id=file_id,
                original_name=original_name,
                stored_path=str(stored_path),
                file_size=len(file_data),
                mime_type=mime_type,
                checksum=checksum,
                created_at=datetime.utcnow(),
                user_id=user_id,
                is_encrypted=encrypt,
            )

            # Store metadata
            await self._store_metadata(stored_file)

            logger.info(f"File stored successfully: {file_id} for user {user_id}")
            return stored_file

        except Exception as e:
            logger.error(f"Failed to store file: {e}")
            raise

    async def retrieve_file(
        self, file_id: str, user_id: str
    ) -> tuple[bytes, StoredFile]:
        """Retrieve a file with access control."""
        try:
            # Load metadata
            stored_file = await self._load_metadata(file_id)
            if not stored_file:
                raise FileNotFoundError(f"File {file_id} not found")

            # Access control check
            if stored_file.user_id != user_id:
                raise PermissionError(
                    f"User {user_id} does not have access to file {file_id}"
                )

            # Read file
            file_path = Path(stored_file.stored_path)
            if not file_path.exists():
                raise FileNotFoundError(
                    f"File data not found: {stored_file.stored_path}"
                )

            if stored_file.is_encrypted:
                with open(file_path) as f:
                    encrypted_data = f.read()
                file_data = decrypt_data(encrypted_data).encode("latin-1")
            else:
                with open(file_path, "rb") as f:
                    file_data = f.read()

            # Verify checksum
            actual_checksum = hashlib.sha256(file_data).hexdigest()
            if actual_checksum != stored_file.checksum:
                logger.warning(f"Checksum mismatch for file {file_id}")

            # Update access metadata
            stored_file.access_count += 1
            stored_file.last_accessed = datetime.utcnow()
            await self._store_metadata(stored_file)

            return file_data, stored_file

        except Exception as e:
            logger.error(f"Failed to retrieve file {file_id}: {e}")
            raise

    async def delete_file(self, file_id: str, user_id: str) -> bool:
        """Delete a file with access control."""
        try:
            # Load metadata
            stored_file = await self._load_metadata(file_id)
            if not stored_file:
                return False

            # Access control check
            if stored_file.user_id != user_id:
                raise PermissionError(
                    f"User {user_id} does not have access to file {file_id}"
                )

            # Delete file
            file_path = Path(stored_file.stored_path)
            if file_path.exists():
                file_path.unlink()

            # Delete metadata
            metadata_path = self.metadata_dir / f"{file_id}.json"
            if metadata_path.exists():
                metadata_path.unlink()

            logger.info(f"File deleted successfully: {file_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete file {file_id}: {e}")
            raise

    async def list_user_files(
        self,
        user_id: str,
        file_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[StoredFile]:
        """List files for a user with filtering."""
        try:
            files = []
            metadata_files = list(self.metadata_dir.glob("*.json"))

            for metadata_file in metadata_files:
                stored_file = await self._load_metadata(metadata_file.stem)
                if stored_file and stored_file.user_id == user_id:
                    # Filter by file type if specified
                    if file_type:
                        file_ext = Path(stored_file.original_name).suffix.lower()
                        if file_type in self.allowed_extensions:
                            if file_ext not in self.allowed_extensions[file_type]:
                                continue
                    files.append(stored_file)

            # Sort by creation date (newest first)
            files.sort(key=lambda x: x.created_at, reverse=True)

            # Apply pagination
            return files[offset : offset + limit]

        except Exception as e:
            logger.error(f"Failed to list files for user {user_id}: {e}")
            return []

    async def get_storage_stats(self, user_id: Optional[str] = None) -> Dict:
        """Get storage statistics."""
        try:
            stats = {
                "total_files": 0,
                "total_size": 0,
                "file_types": {},
                "encrypted_files": 0,
            }

            metadata_files = list(self.metadata_dir.glob("*.json"))

            for metadata_file in metadata_files:
                stored_file = await self._load_metadata(metadata_file.stem)
                if stored_file and (not user_id or stored_file.user_id == user_id):
                    stats["total_files"] += 1
                    stats["total_size"] += stored_file.file_size

                    if stored_file.is_encrypted:
                        stats["encrypted_files"] += 1

                    # File type stats
                    file_ext = Path(stored_file.original_name).suffix.lower()
                    if file_ext not in stats["file_types"]:
                        stats["file_types"][file_ext] = 0
                    stats["file_types"][file_ext] += 1

            return stats

        except Exception as e:
            logger.error(f"Failed to get storage stats: {e}")
            return {}

    async def cleanup_temp_files(self):
        """Clean up temporary and orphaned files."""
        try:
            current_time = datetime.utcnow()
            cleanup_count = 0

            # Clean temp directory
            for temp_file in self.temp_dir.glob("*"):
                if temp_file.is_file():
                    file_age = current_time - datetime.fromtimestamp(
                        temp_file.stat().st_mtime
                    )
                    if file_age > self.temp_file_ttl:
                        temp_file.unlink()
                        cleanup_count += 1

            # Clean orphaned files (files without metadata)
            for storage_dir in [
                self.base_dir / "audio",
                self.base_dir / "image",
                self.base_dir / "video",
                self.base_dir / "encrypted",
            ]:
                if storage_dir.exists():
                    for file_path in storage_dir.glob("*"):
                        if file_path.is_file():
                            file_id = file_path.stem.split(".")[0]
                            metadata_path = self.metadata_dir / f"{file_id}.json"

                            if not metadata_path.exists():
                                file_age = current_time - datetime.fromtimestamp(
                                    file_path.stat().st_mtime
                                )
                                if file_age > self.orphaned_file_ttl:
                                    file_path.unlink()
                                    cleanup_count += 1

            logger.info(f"Cleanup completed: {cleanup_count} files removed")
            return cleanup_count

        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
            return 0

    async def _store_metadata(self, stored_file: StoredFile):
        """Store file metadata."""
        metadata_path = self.metadata_dir / f"{stored_file.file_id}.json"
        metadata = asdict(stored_file)
        # Convert datetime objects to ISO strings
        metadata["created_at"] = stored_file.created_at.isoformat()
        if stored_file.last_accessed:
            metadata["last_accessed"] = stored_file.last_accessed.isoformat()

        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

    async def _load_metadata(self, file_id: str) -> Optional[StoredFile]:
        """Load file metadata."""
        metadata_path = self.metadata_dir / f"{file_id}.json"
        if not metadata_path.exists():
            return None

        try:
            with open(metadata_path) as f:
                metadata = json.load(f)

            # Convert ISO strings back to datetime objects
            metadata["created_at"] = datetime.fromisoformat(metadata["created_at"])
            if metadata.get("last_accessed"):
                metadata["last_accessed"] = datetime.fromisoformat(
                    metadata["last_accessed"]
                )

            return StoredFile(**metadata)

        except Exception as e:
            logger.error(f"Failed to load metadata for {file_id}: {e}")
            return None


# Global instance
file_storage = SecureFileStorage()
