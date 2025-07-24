from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa
import base64
import json
import hashlib
from ..core.config import settings

class EncryptionManager:
    def __init__(self):
        self.key = self._derive_key(settings.ENCRYPTION_KEY)
        self.cipher_suite = Fernet(self.key)
    
    def _derive_key(self, password: str) -> bytes:
        """Derive encryption key from password."""
        password_bytes = password.encode('utf-8')
        salt = hashlib.sha256(password_bytes).digest()[:16]  # Use first 16 bytes as salt
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
        return key
    
    def encrypt_string(self, data: str) -> str:
        """Encrypt a string."""
        if not data:
            return data
        
        try:
            encrypted = self.cipher_suite.encrypt(data.encode('utf-8'))
            return base64.urlsafe_b64encode(encrypted).decode('utf-8')
        except Exception as e:
            raise ValueError(f"Encryption failed: {e}")
    
    def decrypt_string(self, encrypted_data: str) -> str:
        """Decrypt a string."""
        if not encrypted_data:
            return encrypted_data
        
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))
            decrypted = self.cipher_suite.decrypt(encrypted_bytes)
            return decrypted.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Decryption failed: {e}")
    
    def encrypt_object(self, obj: any) -> str:
        """Encrypt an object by converting to JSON first."""
        json_str = json.dumps(obj, default=str)
        return self.encrypt_string(json_str)
    
    def decrypt_object(self, encrypted_data: str) -> any:
        """Decrypt an object from JSON string."""
        json_str = self.decrypt_string(encrypted_data)
        return json.loads(json_str)
    
    def encrypt_list(self, items: list) -> list:
        """Encrypt a list of strings."""
        return [self.encrypt_string(item) for item in items if isinstance(item, str)]
    
    def decrypt_list(self, encrypted_items: list) -> list:
        """Decrypt a list of strings."""
        return [self.decrypt_string(item) for item in encrypted_items if isinstance(item, str)]
    
    def create_hash(self, data: str) -> str:
        """Create SHA-256 hash of data."""
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    
    def verify_hash(self, data: str, hash_value: str) -> bool:
        """Verify data against hash."""
        return self.create_hash(data) == hash_value

# Global encryption manager instance
encryption_manager = EncryptionManager()

# Convenience functions
def encrypt_data(data: str) -> str:
    """Encrypt string data."""
    return encryption_manager.encrypt_string(data)

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt string data."""
    return encryption_manager.decrypt_string(encrypted_data)

def encrypt_object(obj: any) -> str:
    """Encrypt object data."""
    return encryption_manager.encrypt_object(obj)

def decrypt_object(encrypted_data: str) -> any:
    """Decrypt object data."""
    return encryption_manager.decrypt_object(encrypted_data)

def encrypt_list(items: list) -> list:
    """Encrypt list of strings."""
    return encryption_manager.encrypt_list(items)

def decrypt_list(encrypted_items: list) -> list:
    """Decrypt list of strings."""
    return encryption_manager.decrypt_list(encrypted_items)

def create_hash(data: str) -> str:
    """Create hash of data."""
    return encryption_manager.create_hash(data)

def verify_hash(data: str, hash_value: str) -> bool:
    """Verify data hash."""
    return encryption_manager.verify_hash(data, hash_value)

def generate_key_pair():
    """Generate RSA key pair for advanced encryption scenarios."""
    try:
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        
        # Get public key
        public_key = private_key.public_key()
        
        # Serialize private key
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        # Serialize public key
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        return {
            'private_key': private_pem.decode('utf-8'),
            'public_key': public_pem.decode('utf-8')
        }
    except Exception as e:
        raise ValueError(f"Key pair generation failed: {e}")

def generate_fernet_key() -> str:
    """Generate a new Fernet encryption key."""
    return Fernet.generate_key().decode('utf-8')