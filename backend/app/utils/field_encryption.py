"""Advanced field-level encryption system for selective data protection.

This module provides sophisticated field-level encryption capabilities that automatically
encrypt and decrypt specific fields in data models based on predefined schemas. It enables
granular control over which data fields are encrypted while maintaining application
functionality and database query capabilities.

The system uses a schema-based approach where each model type (User, Experience, Solution)
has a defined encryption schema specifying which fields require encryption. This allows
for optimal balance between security and functionality - sensitive fields are encrypted
while searchable/indexable fields remain in plain text.

Key Features:
- Schema-based field encryption configuration
- Automatic encryption/decryption with decorators
- Nested field path support (e.g., "profile.firstName")
- Transparent integration with existing data models
- Encryption metadata tracking for version management
- Graceful error handling with fallback to original data

Security Design:
- Only sensitive fields are encrypted to maintain query performance
- Encryption metadata is added to track encrypted documents
- Failed decryption preserves original data to prevent data loss
- Uses the same encryption manager as core encryption utilities

Usage Patterns:
- Use decorators for automatic encryption/decryption in database operations
- Use convenience functions for manual encryption/decryption
- Configure encryption schemas for new models as needed
- Monitor encryption metadata for system health and debugging
"""

import copy
import logging
from functools import wraps
from typing import Any, Dict

from .encryption import encryption_manager

logger = logging.getLogger(__name__)

# Field encryption schema defining which fields require encryption for each model type
ENCRYPTION_SCHEMA = {
    "User": {
        # Personal identification information - encrypted for privacy
        "profile.firstName": True,  # Personal name information
        "profile.lastName": True,  # Personal name information
        "profile.phoneNumber": True,  # Contact information
        "profile.dateOfBirth": True,  # Personal demographic data
        "profile.avatar": False,  # URLs don't need encryption, not sensitive
    },
    "Experience": {
        # User-generated content - encrypted for privacy and confidentiality
        "title": True,  # Experience titles may contain sensitive info
        "content.text": True,  # Main experience content is highly sensitive
        "content.mediaFiles.transcript": True,  # Speech transcriptions contain personal info
        "content.mediaFiles.description": True,  # AI descriptions may reveal sensitive context
        "content.mediaFiles.metadata": True,  # Technical metadata may contain location/device info
        "emotionalState.description": True,  # Detailed emotional descriptions are sensitive
        "metadata.location": True,  # Location data requires privacy protection
        "tags": False,  # Tags remain unencrypted for search functionality
    },
    "Solution": {
        # AI-generated content - encrypted to protect user context and AI responses
        "content.title": True,  # Solution titles may reference sensitive topics
        "content.description": True,  # Main AI guidance contains personal context
        "content.recommendations": True,  # Specific recommendations reveal user situation
        "content.actionSteps": True,  # Action plans contain personal guidance
        "aiMetadata.prompt": True,  # AI prompts contain user experience context
        "aiMetadata.parameters": True,  # Parameters may contain sensitive configuration
        "userFeedback.improvementSuggestions": True,  # User feedback contains personal opinions
        "userFeedback.positiveAspects": True,  # Positive feedback may reveal personal details
        "followUp.notes": True,  # Follow-up notes contain ongoing personal context
    },
}


class FieldEncryptor:
    """Handles automatic field-level encryption and decryption based on schemas.

    Provides sophisticated field-level encryption capabilities that selectively
    encrypt sensitive fields while leaving searchable/indexable fields in plain text.
    Uses dot notation to support nested field paths and maintains document structure.

    The encryptor operates on dictionary documents and uses predefined schemas to
    determine which fields require encryption. It adds metadata to track encryption
    status and version for proper decryption and system maintenance.

    Attributes:
        encryption_manager: Core encryption manager instance for cryptographic operations.
            Provides consistent encryption/decryption using application-wide keys.
    """

    def __init__(self):
        """Initialize field encryptor with global encryption manager.

        Creates a field encryptor instance that uses the application's global
        encryption manager for consistent cryptographic operations across all
        field-level encryption and decryption operations.
        """
        self.encryption_manager = encryption_manager

    def encrypt_document(
        self, document: Dict[str, Any], schema_name: str
    ) -> Dict[str, Any]:
        """Encrypt specified fields in a document based on schema configuration.

        Processes a document dictionary and encrypts fields marked for encryption
        in the specified schema. Preserves document structure while selectively
        encrypting sensitive fields. Adds encryption metadata for proper decryption.

        Args:
            document: Dictionary document to encrypt fields in.
                Can contain nested structures and mixed data types.
            schema_name: Name of encryption schema to use (e.g., "User", "Experience").
                Must exist in ENCRYPTION_SCHEMA configuration.

        Returns:
            Dict[str, Any]: Document with specified fields encrypted and metadata added.
                Original document structure is preserved with encrypted field values.

        Behavior:
            - Returns original document unchanged if schema doesn't exist
            - Only encrypts fields marked as True in the schema
            - Skips encryption for None values to avoid errors
            - Adds _encryption metadata to track encryption status
            - Preserves all non-encrypted fields in original form
        """
        if schema_name not in ENCRYPTION_SCHEMA:
            return document

        encrypted_doc = copy.deepcopy(document)
        schema = ENCRYPTION_SCHEMA[schema_name]

        for field_path, should_encrypt in schema.items():
            if should_encrypt:
                value = self._get_nested_value(encrypted_doc, field_path)
                if value is not None:
                    encrypted_value = self._encrypt_field_value(value)
                    self._set_nested_value(encrypted_doc, field_path, encrypted_value)

        # Add encryption metadata for tracking and proper decryption
        encrypted_doc["_encryption"] = {
            "encrypted": True,
            "schema": schema_name,
            "version": "1.0",
        }

        return encrypted_doc

    def decrypt_document(
        self, document: Dict[str, Any], schema_name: str
    ) -> Dict[str, Any]:
        """Decrypt specified fields in a document after database retrieval.

        Processes a document dictionary and decrypts fields that were previously
        encrypted based on schema configuration. Handles decryption errors gracefully
        by preserving original values to prevent data loss.

        Args:
            document: Dictionary document with encrypted fields.
                Should contain _encryption metadata if fields are encrypted.
            schema_name: Name of encryption schema used for original encryption.
                Must match the schema used during encryption process.

        Returns:
            Dict[str, Any]: Document with encrypted fields decrypted and metadata removed.
                Original document structure preserved with decrypted field values.

        Behavior:
            - Returns original document if not marked as encrypted
            - Returns original document if schema doesn't exist
            - Attempts to decrypt each field marked for encryption in schema
            - Preserves original encrypted value if decryption fails (with warning)
            - Removes _encryption metadata from final document
            - Logs warnings for decryption failures without stopping process

        Error Handling:
            - Graceful degradation: failed decryption preserves encrypted data
            - Logs warnings for debugging without exposing sensitive information
            - Continues processing other fields even if some decryption fails
        """
        if not document.get("_encryption", {}).get("encrypted", False):
            return document

        if schema_name not in ENCRYPTION_SCHEMA:
            return document

        decrypted_doc = copy.deepcopy(document)
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
                        # Keep original value if decryption fails to prevent data loss

        # Remove encryption metadata from response to clean up document
        decrypted_doc.pop("_encryption", None)
        return decrypted_doc

    def _encrypt_field_value(self, value: Any) -> str:
        """Encrypt a single field value based on its data type.

        Handles encryption of different data types by choosing the appropriate
        encryption method. Complex objects are serialized to JSON before encryption
        while simple strings are encrypted directly.

        Args:
            value: Field value to encrypt. Can be string, list, dict, or other types.

        Returns:
            str: Encrypted value as base64-encoded string, or None if input was None.

        Type Handling:
            - str: Direct string encryption
            - list/dict: JSON serialization then encryption
            - other types: Convert to string then encrypt
        """
        if value is None:
            return None

        if isinstance(value, str):
            return self.encryption_manager.encrypt_string(value)
        elif isinstance(value, (list, dict)):
            return self.encryption_manager.encrypt_object(value)
        else:
            # Convert to string first for primitive types
            return self.encryption_manager.encrypt_string(str(value))

    def _decrypt_field_value(self, encrypted_value: str) -> Any:
        """Decrypt a single field value and restore original data type.

        Attempts to decrypt field values and restore their original data types.
        Tries object decryption first (for complex types) then falls back to
        string decryption for simple values.

        Args:
            encrypted_value: Base64-encoded encrypted string to decrypt.

        Returns:
            Any: Decrypted value in original data type, or None if input was None.

        Decryption Strategy:
            - First attempts object decryption (handles lists/dicts)
            - Falls back to string decryption if object decryption fails
            - Preserves original data types when possible
        """
        if encrypted_value is None:
            return None

        try:
            # Try to decrypt as object first (for lists/dicts)
            return self.encryption_manager.decrypt_object(encrypted_value)
        except:
            # If that fails, decrypt as string
            return self.encryption_manager.decrypt_string(encrypted_value)

    def _get_nested_value(self, document: Dict[str, Any], path: str) -> Any:
        """Get value from nested dictionary structure using dot notation path.

        Traverses nested dictionary structures using dot-separated field paths
        to retrieve values from deeply nested documents. Supports both dictionary
        keys and list indices for flexible document navigation.

        Args:
            document: Dictionary document to traverse.
            path: Dot-separated path to desired value (e.g., "profile.firstName").

        Returns:
            Any: Value at specified path, or None if path doesn't exist.

        Path Format:
            - "field" - top-level field
            - "parent.child" - nested dictionary field
            - "list.0" - list item by index (numeric keys)
            - "deep.nested.field" - multiple levels of nesting

        Error Handling:
            - Returns None if any part of path doesn't exist
            - Handles missing keys gracefully without exceptions
            - Supports mixed dictionary/list structures
        """
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
        """Set value in nested dictionary structure using dot notation path.

        Creates or updates values in nested dictionary structures using dot-separated
        field paths. Automatically creates intermediate dictionary structures as
        needed to support the full path.

        Args:
            document: Dictionary document to modify in-place.
            path: Dot-separated path to field to set (e.g., "profile.firstName").
            value: Value to set at the specified path.

        Path Format:
            - "field" - top-level field
            - "parent.child" - nested dictionary field
            - "deep.nested.field" - multiple levels of nesting

        Behavior:
            - Creates intermediate dictionaries if they don't exist
            - Overwrites existing values at the specified path
            - Modifies the document dictionary in-place
            - Supports arbitrary nesting depth
        """
        keys = path.split(".")
        current = document

        # Navigate to parent of target field, creating intermediate dicts as needed
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]

        # Set the final value
        current[keys[-1]] = value


# Global field encryptor instance for application-wide use
field_encryptor = FieldEncryptor()


def encrypt_before_save(schema_name: str):
    """Decorator to automatically encrypt document fields before database save operations.

    Creates a decorator that intercepts database save operations and automatically
    encrypts specified fields based on the provided schema before the data is
    stored. Provides transparent encryption without modifying application logic.

    Args:
        schema_name: Name of encryption schema to use (e.g., "User", "Experience").
            Must exist in ENCRYPTION_SCHEMA configuration.

    Returns:
        Decorator function that can be applied to database save methods.

    Usage:
        @encrypt_before_save("User")
        async def save_user(user_data):
            # user_data will be automatically encrypted before this function runs
            return await database.save(user_data)

    Behavior:
        - Automatically detects document data in function arguments
        - Encrypts fields according to specified schema
        - Preserves function signature and return values
        - Works with both positional and keyword arguments
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find document data in arguments and encrypt it
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
    """Decorator to automatically decrypt document fields after database load operations.

    Creates a decorator that intercepts database load operations and automatically
    decrypts specified fields based on the provided schema after the data is
    retrieved. Provides transparent decryption without modifying application logic.

    Args:
        schema_name: Name of encryption schema to use (e.g., "User", "Experience").
            Must match the schema used during encryption.

    Returns:
        Decorator function that can be applied to database load methods.

    Usage:
        @decrypt_after_load("User")
        async def load_user(user_id):
            user_data = await database.load(user_id)
            # user_data will be automatically decrypted before being returned
            return user_data

    Behavior:
        - Automatically detects document data in function return values
        - Decrypts fields according to specified schema
        - Handles both single documents and lists of documents
        - Preserves function signature and error handling
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)

            # Decrypt result based on its type
            if isinstance(result, dict):
                return field_encryptor.decrypt_document(result, schema_name)
            elif isinstance(result, list):
                return [
                    field_encryptor.decrypt_document(doc, schema_name) for doc in result
                ]

            return result

        return wrapper

    return decorator


# Convenience functions for manual field-level encryption and decryption operations


def encrypt_user_data(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt user data fields according to User schema configuration.

    Convenience function for manually encrypting user data when automatic
    decorator-based encryption is not suitable. Encrypts personal information
    fields while preserving searchable fields in plain text.

    Args:
        user_data: Dictionary containing user information to encrypt.

    Returns:
        Dict[str, Any]: User data with sensitive fields encrypted and metadata added.

    Encrypted Fields:
        - profile.firstName, profile.lastName (personal identification)
        - profile.phoneNumber (contact information)
        - profile.dateOfBirth (demographic data)
    """
    return field_encryptor.encrypt_document(user_data, "User")


def decrypt_user_data(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Decrypt user data fields according to User schema configuration.

    Convenience function for manually decrypting user data when automatic
    decorator-based decryption is not suitable. Restores encrypted personal
    information fields to plain text for application use.

    Args:
        user_data: Dictionary containing encrypted user information.

    Returns:
        Dict[str, Any]: User data with encrypted fields decrypted and metadata removed.
    """
    return field_encryptor.decrypt_document(user_data, "User")


def encrypt_experience_data(experience_data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt experience data fields according to Experience schema configuration.

    Convenience function for manually encrypting experience data when automatic
    decorator-based encryption is not suitable. Encrypts sensitive user content
    while preserving metadata needed for querying and analytics.

    Args:
        experience_data: Dictionary containing experience information to encrypt.

    Returns:
        Dict[str, Any]: Experience data with sensitive fields encrypted and metadata added.

    Encrypted Fields:
        - title, content.text (user-generated content)
        - content.mediaFiles.transcript, content.mediaFiles.description (processed content)
        - emotionalState.description, metadata.location (personal context)
    """
    return field_encryptor.encrypt_document(experience_data, "Experience")


def decrypt_experience_data(experience_data: Dict[str, Any]) -> Dict[str, Any]:
    """Decrypt experience data fields according to Experience schema configuration.

    Convenience function for manually decrypting experience data when automatic
    decorator-based decryption is not suitable. Restores encrypted user content
    to plain text for application processing and display.

    Args:
        experience_data: Dictionary containing encrypted experience information.

    Returns:
        Dict[str, Any]: Experience data with encrypted fields decrypted and metadata removed.
    """
    return field_encryptor.decrypt_document(experience_data, "Experience")


def encrypt_solution_data(solution_data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt solution data fields according to Solution schema configuration.

    Convenience function for manually encrypting solution data when automatic
    decorator-based encryption is not suitable. Encrypts AI-generated content
    and user feedback while preserving analytics and status information.

    Args:
        solution_data: Dictionary containing solution information to encrypt.

    Returns:
        Dict[str, Any]: Solution data with sensitive fields encrypted and metadata added.

    Encrypted Fields:
        - content.title, content.description, content.recommendations (AI guidance)
        - aiMetadata.prompt, aiMetadata.parameters (AI processing context)
        - userFeedback.improvementSuggestions, followUp.notes (user input)
    """
    return field_encryptor.encrypt_document(solution_data, "Solution")


def decrypt_solution_data(solution_data: Dict[str, Any]) -> Dict[str, Any]:
    """Decrypt solution data fields according to Solution schema configuration.

    Convenience function for manually decrypting solution data when automatic
    decorator-based decryption is not suitable. Restores encrypted AI content
    and user feedback to plain text for application use.

    Args:
        solution_data: Dictionary containing encrypted solution information.

    Returns:
        Dict[str, Any]: Solution data with encrypted fields decrypted and metadata removed.
    """
    return field_encryptor.decrypt_document(solution_data, "Solution")
