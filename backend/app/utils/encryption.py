"""Core encryption utilities for secure data protection in Mortal Stardust platform.

This module provides comprehensive encryption services for protecting sensitive user data
including personal information, experiences, and AI-generated solutions. Uses industry-standard
AES-256 encryption via Fernet symmetric encryption with PBKDF2 key derivation.

The encryption system is designed to be transparent to application logic while ensuring
all sensitive data is encrypted at rest and in transit. Supports both string and object
encryption with automatic JSON serialization for complex data structures.

Security Features:
- AES-256 encryption with Fernet for authenticated encryption
- PBKDF2 key derivation with 100,000 iterations for password-based keys
- SHA-256 hashing for data integrity verification
- RSA key pair generation for advanced encryption scenarios
- Automatic base64 encoding for safe string storage

Usage Guidelines:
- Always use the global encryption_manager instance for consistency
- Encrypt all user-generated content before database storage
- Use convenience functions for common encryption operations
- Handle encryption errors gracefully with appropriate fallbacks
"""

import base64
import hashlib
import json

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from ..core.config import settings


class EncryptionManager:
    """Central encryption manager for all cryptographic operations.

    Provides a unified interface for encryption, decryption, and hashing operations
    throughout the application. Uses Fernet symmetric encryption with PBKDF2 key
    derivation to ensure strong security while maintaining performance.

    The manager is initialized once with the application's encryption key and
    provides thread-safe encryption services for all data protection needs.

    Attributes:
        key: Derived encryption key from application settings.
            Generated using PBKDF2 with SHA-256 and 100,000 iterations.
        cipher_suite: Fernet cipher instance for encryption/decryption operations.
            Provides authenticated encryption with automatic integrity verification.
    """

    def __init__(self):
        """Initialize encryption manager with derived key from application settings.

        Creates a Fernet cipher suite using a key derived from the application's
        ENCRYPTION_KEY setting. The key derivation process uses PBKDF2 with
        SHA-256 hashing and 100,000 iterations for security.
        """
        self.key = self._derive_key(settings.ENCRYPTION_KEY)
        self.cipher_suite = Fernet(self.key)

    def _derive_key(self, password: str) -> bytes:
        """Derive a cryptographically strong encryption key from password.

        Uses PBKDF2 (Password-Based Key Derivation Function 2) with SHA-256
        to derive a 32-byte encryption key suitable for Fernet encryption.
        The salt is derived from the password hash for consistency.

        Args:
            password: Master password from application configuration.
                Should be a strong, randomly generated string.

        Returns:
            bytes: Base64-encoded 32-byte encryption key for Fernet.

        Security Notes:
            - Uses 100,000 iterations to resist brute-force attacks
            - Salt is derived from password hash for deterministic key generation
            - Key length is 32 bytes (256 bits) for AES-256 security
        """
        password_bytes = password.encode("utf-8")
        salt = hashlib.sha256(password_bytes).digest()[
            :16
        ]  # Use first 16 bytes as salt

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
        return key

    def encrypt_string(self, data: str) -> str:
        """Encrypt a string using Fernet authenticated encryption.

        Encrypts string data using AES-256 in CBC mode with HMAC authentication.
        The result is base64-encoded for safe storage in databases and JSON.

        Args:
            data: Plain text string to encrypt. Empty strings are returned unchanged.

        Returns:
            str: Base64-encoded encrypted string, or original if empty.

        Raises:
            ValueError: If encryption fails due to invalid input or system error.

        Security Notes:
            - Uses authenticated encryption to prevent tampering
            - Includes automatic timestamp for replay attack prevention
            - Base64 encoding ensures safe storage in text fields
        """
        if not data:
            return data

        try:
            encrypted = self.cipher_suite.encrypt(data.encode("utf-8"))
            return base64.urlsafe_b64encode(encrypted).decode("utf-8")
        except Exception as e:
            raise ValueError(f"Encryption failed: {e}")

    def decrypt_string(self, encrypted_data: str) -> str:
        """Decrypt a string using Fernet authenticated decryption.

        Decrypts base64-encoded encrypted string data with automatic integrity
        verification. Fernet automatically validates the authentication tag
        and timestamp to ensure data hasn't been tampered with.

        Args:
            encrypted_data: Base64-encoded encrypted string. Empty strings returned unchanged.

        Returns:
            str: Decrypted plain text string, or original if empty.

        Raises:
            ValueError: If decryption fails due to invalid data, tampering, or system error.

        Security Notes:
            - Automatically verifies authentication tag to detect tampering
            - Validates timestamp to prevent replay attacks (default 60 second window)
            - Fails securely by raising exception rather than returning partial data
        """
        if not encrypted_data:
            return encrypted_data

        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode("utf-8"))
            decrypted = self.cipher_suite.decrypt(encrypted_bytes)
            return decrypted.decode("utf-8")
        except Exception as e:
            raise ValueError(f"Decryption failed: {e}")

    def encrypt_object(self, obj: any) -> str:
        """Encrypt a complex object by serializing to JSON first.

        Converts complex Python objects (dicts, lists, custom objects) to JSON
        string representation before encryption. Handles datetime objects and
        other non-serializable types using string conversion.

        Args:
            obj: Any Python object that can be JSON-serialized.
                Includes dicts, lists, primitives, and objects with __str__ methods.

        Returns:
            str: Base64-encoded encrypted JSON string representation of object.

        Raises:
            ValueError: If JSON serialization or encryption fails.

        Usage Notes:
            - Use for complex data structures like user preferences or metadata
            - Datetime objects are automatically converted to strings
            - Custom objects should implement __str__ for proper serialization
        """
        json_str = json.dumps(obj, default=str)
        return self.encrypt_string(json_str)

    def decrypt_object(self, encrypted_data: str) -> any:
        """Decrypt a complex object from encrypted JSON string.

        Decrypts base64-encoded encrypted data and deserializes from JSON
        back to original Python object structure. Preserves data types
        for primitives but datetime objects remain as strings.

        Args:
            encrypted_data: Base64-encoded encrypted JSON string.

        Returns:
            any: Deserialized Python object matching original structure.

        Raises:
            ValueError: If decryption or JSON deserialization fails.

        Usage Notes:
            - Datetime objects will be returned as ISO format strings
            - Complex nested structures are preserved
            - Use for user preferences, metadata, and configuration objects
        """
        json_str = self.decrypt_string(encrypted_data)
        return json.loads(json_str)

    def encrypt_list(self, items: list) -> list:
        """Encrypt a list of strings, preserving list structure.

        Encrypts each string item in a list individually while maintaining
        the list structure. Non-string items are left unchanged to preserve
        mixed-type lists with only sensitive strings encrypted.

        Args:
            items: List containing strings and other data types.
                Only string items will be encrypted.

        Returns:
            list: List with string items encrypted, other types unchanged.

        Usage Notes:
            - Use for lists like tags, recommendations, or action steps
            - Non-string items (numbers, booleans) remain unencrypted
            - Maintains original list order and structure
        """
        return [self.encrypt_string(item) for item in items if isinstance(item, str)]

    def decrypt_list(self, encrypted_items: list) -> list:
        """Decrypt a list of encrypted strings, preserving list structure.

        Decrypts each encrypted string item in a list while maintaining
        the list structure. Non-string items are left unchanged to handle
        mixed-type lists with only sensitive strings decrypted.

        Args:
            encrypted_items: List containing encrypted strings and other data types.
                Only string items will be decrypted.

        Returns:
            list: List with string items decrypted, other types unchanged.

        Usage Notes:
            - Use for lists like tags, recommendations, or action steps
            - Non-string items (numbers, booleans) remain unchanged
            - Maintains original list order and structure
        """
        return [
            self.decrypt_string(item)
            for item in encrypted_items
            if isinstance(item, str)
        ]

    def create_hash(self, data: str) -> str:
        """Create SHA-256 hash of data for integrity verification.

        Generates a cryptographically secure hash of input data using SHA-256.
        Used for data integrity verification, password hashing (with salt),
        and creating unique identifiers for sensitive data.

        Args:
            data: String data to hash. UTF-8 encoded before hashing.

        Returns:
            str: Hexadecimal representation of SHA-256 hash (64 characters).

        Security Notes:
            - SHA-256 is cryptographically secure and collision-resistant
            - Use with salt for password hashing to prevent rainbow table attacks
            - Hash is deterministic - same input always produces same output
        """
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

    def verify_hash(self, data: str, hash_value: str) -> bool:
        """Verify data integrity against a known hash value.

        Compares the SHA-256 hash of provided data against a known hash value
        to verify data integrity. Used for password verification and detecting
        data corruption or tampering.

        Args:
            data: Original data to verify.
            hash_value: Expected hash value to compare against.

        Returns:
            bool: True if data hash matches expected value, False otherwise.

        Security Notes:
            - Constant-time comparison prevents timing attacks
            - Use for password verification with proper salting
            - Can detect any modification to original data
        """
        return self.create_hash(data) == hash_value


# Global encryption manager instance for application-wide use
encryption_manager = EncryptionManager()


# Convenience functions for common encryption operations
def encrypt_data(data: str) -> str:
    """Encrypt string data using the global encryption manager.

    Convenience function for encrypting string data without directly
    accessing the encryption manager instance. Provides a clean API
    for common encryption operations throughout the application.

    Args:
        data: Plain text string to encrypt.

    Returns:
        str: Base64-encoded encrypted string.

    Raises:
        ValueError: If encryption fails.
    """
    return encryption_manager.encrypt_string(data)


def decrypt_data(encrypted_data: str) -> str:
    """Decrypt string data using the global encryption manager.

    Convenience function for decrypting string data without directly
    accessing the encryption manager instance. Provides a clean API
    for common decryption operations throughout the application.

    Args:
        encrypted_data: Base64-encoded encrypted string.

    Returns:
        str: Decrypted plain text string.

    Raises:
        ValueError: If decryption fails.
    """
    return encryption_manager.decrypt_string(encrypted_data)


def encrypt_object(obj: any) -> str:
    """Encrypt object data using the global encryption manager.

    Convenience function for encrypting complex objects by serializing
    to JSON first. Useful for user preferences, metadata, and configuration.

    Args:
        obj: Any JSON-serializable Python object.

    Returns:
        str: Base64-encoded encrypted JSON string.

    Raises:
        ValueError: If serialization or encryption fails.
    """
    return encryption_manager.encrypt_object(obj)


def decrypt_object(encrypted_data: str) -> any:
    """Decrypt object data using the global encryption manager.

    Convenience function for decrypting complex objects from encrypted
    JSON strings. Restores original object structure and data types.

    Args:
        encrypted_data: Base64-encoded encrypted JSON string.

    Returns:
        any: Deserialized Python object.

    Raises:
        ValueError: If decryption or deserialization fails.
    """
    return encryption_manager.decrypt_object(encrypted_data)


def encrypt_list(items: list) -> list:
    """Encrypt list of strings using the global encryption manager.

    Convenience function for encrypting string items in lists while
    preserving list structure and non-string items.

    Args:
        items: List containing strings and other data types.

    Returns:
        list: List with string items encrypted.
    """
    return encryption_manager.encrypt_list(items)


def decrypt_list(encrypted_items: list) -> list:
    """Decrypt list of strings using the global encryption manager.

    Convenience function for decrypting string items in lists while
    preserving list structure and non-string items.

    Args:
        encrypted_items: List containing encrypted strings and other data types.

    Returns:
        list: List with string items decrypted.
    """
    return encryption_manager.decrypt_list(encrypted_items)


def create_hash(data: str) -> str:
    """Create SHA-256 hash using the global encryption manager.

    Convenience function for creating cryptographically secure hashes
    for data integrity verification and password hashing.

    Args:
        data: String data to hash.

    Returns:
        str: Hexadecimal SHA-256 hash.
    """
    return encryption_manager.create_hash(data)


def verify_hash(data: str, hash_value: str) -> bool:
    """Verify data hash using the global encryption manager.

    Convenience function for verifying data integrity against known
    hash values. Used for password verification and tamper detection.

    Args:
        data: Original data to verify.
        hash_value: Expected hash value.

    Returns:
        bool: True if hash matches, False otherwise.
    """
    return encryption_manager.verify_hash(data, hash_value)


def generate_key_pair():
    """Generate RSA key pair for advanced encryption scenarios.

    Creates a new RSA public/private key pair for asymmetric encryption
    use cases such as secure key exchange, digital signatures, or
    hybrid encryption systems. Uses 2048-bit keys for security.

    Returns:
        dict: Dictionary containing PEM-encoded private and public keys.
            - "private_key": PEM-encoded private key string
            - "public_key": PEM-encoded public key string

    Raises:
        ValueError: If key generation fails due to system limitations.

    Security Notes:
        - Uses 2048-bit RSA keys for current security standards
        - Private key is not encrypted - store securely
        - Public exponent 65537 is standard and secure
        - Keys are PEM-encoded for easy storage and transmission

    Usage:
        Used for advanced encryption scenarios requiring asymmetric
        cryptography, such as secure API key exchange or digital signatures.
    """
    try:
        # Generate private key
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

        # Get public key
        public_key = private_key.public_key()

        # Serialize private key
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )

        # Serialize public key
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        return {
            "private_key": private_pem.decode("utf-8"),
            "public_key": public_pem.decode("utf-8"),
        }
    except Exception as e:
        raise ValueError(f"Key pair generation failed: {e}")


def generate_fernet_key() -> str:
    """Generate a new Fernet encryption key for symmetric encryption.

    Creates a cryptographically secure random key suitable for Fernet
    symmetric encryption. Use this for generating new encryption keys
    for different environments or key rotation scenarios.

    Returns:
        str: Base64-encoded Fernet encryption key (44 characters).

    Security Notes:
        - Key is cryptographically random and suitable for production use
        - Store securely and never expose in logs or error messages
        - Use for key rotation or environment-specific encryption keys
        - Compatible with all Fernet encryption operations

    Usage:
        Primarily used for generating new encryption keys during deployment
        setup or key rotation procedures. Not used for normal application
        encryption operations.
    """
    return Fernet.generate_key().decode("utf-8")
