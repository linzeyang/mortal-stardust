"""
Advanced field-level encryption system for sensitive user data.
Provides automatic encryption/decryption for specific fields in models.
"""

import logging
from functools import wraps
from typing import Any, Dict

from .encryption import encryption_manager

logger = logging.getLogger(__name__)

# Define which fields need encryption for each model
ENCRYPTION_SCHEMA = {
    "User": {
        "profile.firstName": True,
        "profile.lastName": True,
        "profile.phoneNumber": True,
        "profile.dateOfBirth": True,
        "profile.avatar": False,  # URLs don't need encryption
    },
    "Experience": {
        "title": True,
        "content.text": True,
        "content.mediaFiles.transcript": True,
        "content.mediaFiles.description": True,
        "content.mediaFiles.metadata": True,
        "emotionalState.description": True,
        "metadata.location": True,
        "tags": False,  # Tags can remain unencrypted for search
    },
    "Solution": {
        "content.title": True,
        "content.description": True,
        "content.recommendations": True,
        "content.actionSteps": True,
        "aiMetadata.prompt": True,
        "aiMetadata.parameters": True,
        "userFeedback.improvementSuggestions": True,
        "userFeedback.positiveAspects": True,
        "followUp.notes": True,
    },
}


class FieldEncryptor:
    """Handles automatic field-level encryption/decryption."""

    def __init__(self):
        self.encryption_manager = encryption_manager

    def encrypt_document(
        self, document: Dict[str, Any], schema_name: str
    ) -> Dict[str, Any]:
        """Encrypt specified fields in a document before storing."""
        if schema_name not in ENCRYPTION_SCHEMA:
            return document

        encrypted_doc = document.copy()
        schema = ENCRYPTION_SCHEMA[schema_name]

        for field_path, should_encrypt in schema.items():
            if should_encrypt:
                value = self._get_nested_value(encrypted_doc, field_path)
                if value is not None:
                    encrypted_value = self._encrypt_field_value(value)
                    self._set_nested_value(encrypted_doc, field_path, encrypted_value)

        # Add encryption metadata
        encrypted_doc["_encryption"] = {
            "encrypted": True,
            "schema": schema_name,
            "version": "1.0",
        }

        return encrypted_doc

    def decrypt_document(
        self, document: Dict[str, Any], schema_name: str
    ) -> Dict[str, Any]:
        """Decrypt specified fields in a document after retrieval."""
        if not document.get("_encryption", {}).get("encrypted", False):
            return document

        if schema_name not in ENCRYPTION_SCHEMA:
            return document

        decrypted_doc = document.copy()
        schema = ENCRYPTION_SCHEMA[schema_name]

        for field_path, should_encrypt in schema.items():
            if should_encrypt:
                value = self._get_nested_value(decrypted_doc, field_path)
                if value is not None:
                    try:
                        decrypted_value = self._decrypt_field_value(value)
                        self._set_nested_value(
                            decrypted_doc, field_path, decrypted_value
                        )
                    except Exception as e:
                        logger.warning(f"Failed to decrypt field {field_path}: {e}")
                        # Keep original value if decryption fails

        # Remove encryption metadata from response
        decrypted_doc.pop("_encryption", None)
        return decrypted_doc

    def _encrypt_field_value(self, value: Any) -> str:
        """Encrypt a single field value."""
        if value is None:
            return None

        if isinstance(value, str):
            return self.encryption_manager.encrypt_string(value)
        elif isinstance(value, (list, dict)):
            return self.encryption_manager.encrypt_object(value)
        else:
            # Convert to string first
            return self.encryption_manager.encrypt_string(str(value))

    def _decrypt_field_value(self, encrypted_value: str) -> Any:
        """Decrypt a single field value."""
        if encrypted_value is None:
            return None

        try:
            # Try to decrypt as object first (for lists/dicts)
            return self.encryption_manager.decrypt_object(encrypted_value)
        except:
            # If that fails, decrypt as string
            return self.encryption_manager.decrypt_string(encrypted_value)

    def _get_nested_value(self, document: Dict[str, Any], path: str) -> Any:
        """Get value from nested dictionary using dot notation."""
        keys = path.split(".")
        current = document

        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            elif isinstance(current, list) and key.isdigit():
                idx = int(key)
                if 0 <= idx < len(current):
                    current = current[idx]
                else:
                    return None
            else:
                return None

        return current

    def _set_nested_value(
        self, document: Dict[str, Any], path: str, value: Any
    ) -> None:
        """Set value in nested dictionary using dot notation."""
        keys = path.split(".")
        current = document

        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]

        current[keys[-1]] = value


# Global field encryptor instance
field_encryptor = FieldEncryptor()


def encrypt_before_save(schema_name: str):
    """Decorator to encrypt fields before saving to database."""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find document data in arguments
            if args and isinstance(args[0], dict):
                args = (field_encryptor.encrypt_document(args[0], schema_name),) + args[
                    1:
                ]
            elif "document" in kwargs:
                kwargs["document"] = field_encryptor.encrypt_document(
                    kwargs["document"], schema_name
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


def decrypt_after_load(schema_name: str):
    """Decorator to decrypt fields after loading from database."""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)

            if isinstance(result, dict):
                return field_encryptor.decrypt_document(result, schema_name)
            elif isinstance(result, list):
                return [
                    field_encryptor.decrypt_document(doc, schema_name) for doc in result
                ]

            return result

        return wrapper

    return decorator


# Convenience functions for manual encryption/decryption
def encrypt_user_data(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt user data."""
    return field_encryptor.encrypt_document(user_data, "User")


def decrypt_user_data(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Decrypt user data."""
    return field_encryptor.decrypt_document(user_data, "User")


def encrypt_experience_data(experience_data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt experience data."""
    return field_encryptor.encrypt_document(experience_data, "Experience")


def decrypt_experience_data(experience_data: Dict[str, Any]) -> Dict[str, Any]:
    """Decrypt experience data."""
    return field_encryptor.decrypt_document(experience_data, "Experience")


def encrypt_solution_data(solution_data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt solution data."""
    return field_encryptor.encrypt_document(solution_data, "Solution")


def decrypt_solution_data(solution_data: Dict[str, Any]) -> Dict[str, Any]:
    """Decrypt solution data."""
    return field_encryptor.decrypt_document(solution_data, "Solution")
