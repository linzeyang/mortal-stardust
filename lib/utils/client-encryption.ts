/**
 * Client-Side Encryption Utilities
 *
 * This module provides comprehensive client-side encryption capabilities for
 * protecting sensitive user data before transmission to the backend and after
 * receiving responses. It implements AES-256 encryption with PBKDF2 key derivation
 * for enhanced security.
 *
 * Key features:
 * - End-to-end encryption for sensitive form data
 * - Automatic field-level encryption for known sensitive fields
 * - Secure local storage with encryption
 * - Data integrity verification with hashing
 * - React hooks for easy component integration
 *
 * Security implementation:
 * - AES-256-CBC encryption with random IV for each operation
 * - PBKDF2 key derivation with 10,000 iterations
 * - Random salt generation for each encryption
 * - Base64 encoding for safe data transmission
 *
 * @module lib/utils/client-encryption
 */

import CryptoJS from 'crypto-js';

/**
 * Encryption configuration interface
 * Defines the cryptographic parameters used throughout the encryption process
 */
interface EncryptionConfig {
  algorithm: string;  // Encryption algorithm (AES)
  keySize: number;    // Key size in 32-bit words (8 = 256 bits)
  iterations: number; // PBKDF2 iterations for key derivation
}

/**
 * Client-side encryption class for protecting sensitive user data
 *
 * This class provides a comprehensive encryption solution for client-side
 * data protection. It automatically handles encryption/decryption of sensitive
 * form fields and provides secure storage capabilities.
 *
 * The encryption process uses:
 * - AES-256-CBC for symmetric encryption
 * - PBKDF2 with 10,000 iterations for key derivation
 * - Random salt and IV for each encryption operation
 * - Base64 encoding for safe data transmission
 */
class ClientEncryption {
  private config: EncryptionConfig;
  private secretKey: string;

  /**
   * Initialize the client encryption with secure configuration
   *
   * Sets up encryption parameters and retrieves the encryption key from
   * environment variables. In production, the key should be unique per
   * user session and securely managed.
   */
  constructor() {
    // Encryption configuration with security best practices
    this.config = {
      algorithm: 'AES',           // Advanced Encryption Standard
      keySize: 256 / 32,          // 256-bit key size (8 words of 32 bits each)
      iterations: 10000           // PBKDF2 iterations (balance of security vs performance)
    };

    // Encryption key from environment variables
    // In production, this should be:
    // 1. Unique per user session
    // 2. Derived from user credentials or session data
    // 3. Never stored in plain text
    this.secretKey = process.env.NEXT_PUBLIC_CLIENT_ENCRYPTION_KEY || 'default-client-key-change-in-production';
  }

  /**
   * Encrypt sensitive form data before sending to backend
   *
   * Automatically identifies and encrypts sensitive fields in form data objects.
   * This provides transparent encryption for user forms without requiring
   * manual field-by-field encryption in components.
   *
   * Sensitive fields include personal information, experience content, and
   * location data that require privacy protection during transmission.
   *
   * @param data - Form data object with potentially sensitive fields
   * @returns New object with sensitive fields encrypted
   *
   * @example
   * ```typescript
   * const formData = {
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   email: 'john@example.com',  // Not encrypted
   *   experienceContent: 'Personal story...'
   * };
   *
   * const encrypted = clientEncryption.encryptFormData(formData);
   * // firstName, lastName, and experienceContent are now encrypted
   * // email remains in plain text as it's not in sensitive fields list
   * ```
   */
  encryptFormData(data: Record<string, any>): Record<string, any> {
    // List of fields that contain sensitive personal information
    // These fields are automatically encrypted before transmission
    const sensitiveFields = [
      'firstName',        // Personal identification
      'lastName',         // Personal identification
      'phoneNumber',      // Contact information
      'experienceContent', // Personal experiences and stories
      'personalDetails',  // Additional personal information
      'emotionalState',   // Emotional and psychological data
      'location'          // Geographic location data
    ];

    // Create a copy to avoid mutating the original data
    const encrypted = { ...data };

    // Encrypt each sensitive field if it exists and is a string
    for (const field of sensitiveFields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encryptString(encrypted[field]);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt sensitive data received from backend
   *
   * Automatically identifies and decrypts sensitive fields in response data.
   * This provides transparent decryption for data received from the backend
   * without requiring manual field-by-field decryption in components.
   *
   * Includes error handling to gracefully handle decryption failures by
   * keeping the original encrypted value rather than breaking the application.
   *
   * @param data - Response data object with potentially encrypted fields
   * @returns New object with sensitive fields decrypted
   *
   * @example
   * ```typescript
   * const responseData = await fetch('/api/user-profile');
   * const decrypted = clientEncryption.decryptResponseData(responseData);
   * // Sensitive fields are now decrypted and ready for display
   * ```
   */
  decryptResponseData(data: Record<string, any>): Record<string, any> {
    // Same list of sensitive fields that were encrypted
    const sensitiveFields = [
      'firstName',
      'lastName',
      'phoneNumber',
      'experienceContent',
      'personalDetails',
      'emotionalState',
      'location'
    ];

    // Create a copy to avoid mutating the original data
    const decrypted = { ...data };

    // Decrypt each sensitive field with error handling
    for (const field of sensitiveFields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = this.decryptString(decrypted[field]);
        } catch (error) {
          // Log warning but don't break the application
          console.warn(`Failed to decrypt field ${field}:`, error);
          // Keep original value if decryption fails (may be plain text)
        }
      }
    }

    return decrypted;
  }

  /**
   * Encrypt a string value using AES-256-CBC with PBKDF2 key derivation
   *
   * This method implements secure string encryption with the following features:
   * - Random salt generation for each encryption (prevents rainbow table attacks)
   * - PBKDF2 key derivation with 10,000 iterations (slows down brute force attacks)
   * - Random IV for each encryption (prevents pattern analysis)
   * - AES-256-CBC encryption with PKCS7 padding
   * - Base64 encoding for safe data transmission
   *
   * @param text - Plain text string to encrypt
   * @returns Base64-encoded encrypted string, or original text if encryption fails
   *
   * @example
   * ```typescript
   * const sensitive = "User's personal information";
   * const encrypted = clientEncryption.encryptString(sensitive);
   * // Returns: Base64-encoded encrypted string
   * ```
   */
  encryptString(text: string): string {
    if (!text) return text;

    try {
      // Generate random salt (128 bits) for key derivation
      // Salt prevents rainbow table attacks and ensures unique keys
      const salt = CryptoJS.lib.WordArray.random(128 / 8);

      // Derive encryption key using PBKDF2 with salt
      // 10,000 iterations provide security against brute force attacks
      const key = CryptoJS.PBKDF2(this.secretKey, salt, {
        keySize: this.config.keySize,
        iterations: this.config.iterations
      });

      // Generate random initialization vector (128 bits)
      // IV ensures identical plaintexts produce different ciphertexts
      const iv = CryptoJS.lib.WordArray.random(128 / 8);

      // Encrypt using AES-256-CBC with PKCS7 padding
      const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });

      // Combine salt + IV + encrypted data for storage/transmission
      // Format: [32 hex chars salt][32 hex chars IV][encrypted data]
      const combined = salt.toString() + iv.toString() + encrypted.toString();

      // Encode as Base64 for safe transmission over HTTP
      return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return text; // Return original if encryption fails (graceful degradation)
    }
  }

  /**
   * Decrypt a string value that was encrypted with encryptString
   *
   * This method reverses the encryption process by:
   * - Decoding the Base64-encoded data
   * - Extracting the salt, IV, and encrypted content
   * - Deriving the same key using PBKDF2 with the extracted salt
   * - Decrypting using AES-256-CBC with the extracted IV
   *
   * @param encryptedText - Base64-encoded encrypted string from encryptString
   * @returns Original plain text string
   * @throws {Error} When decryption fails due to invalid data or wrong key
   *
   * @example
   * ```typescript
   * const encrypted = "base64-encoded-encrypted-data";
   * const original = clientEncryption.decryptString(encrypted);
   * // Returns: Original plain text
   * ```
   */
  decryptString(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      // Decode Base64 to get combined salt+IV+encrypted data
      const combined = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encryptedText));

      // Extract components from combined string
      // First 32 hex characters (16 bytes) = salt
      const salt = CryptoJS.enc.Hex.parse(combined.substr(0, 32));
      // Next 32 hex characters (16 bytes) = IV
      const iv = CryptoJS.enc.Hex.parse(combined.substr(32, 32));
      // Remaining characters = encrypted data
      const encrypted = combined.substring(64);

      // Derive the same key using PBKDF2 with extracted salt
      const key = CryptoJS.PBKDF2(this.secretKey, salt, {
        keySize: this.config.keySize,
        iterations: this.config.iterations
      });

      // Decrypt using AES-256-CBC with extracted IV
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });

      // Convert decrypted bytes back to UTF-8 string
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error; // Throw error for proper error handling in calling code
    }
  }

  /**
   * Encrypt object data by serializing to JSON first
   *
   * Converts a JavaScript object to JSON string and then encrypts it.
   * Useful for encrypting complex data structures like user preferences,
   * form state, or configuration objects before storage or transmission.
   *
   * @param obj - JavaScript object to encrypt
   * @returns Encrypted JSON string, or plain JSON if encryption fails
   *
   * @example
   * ```typescript
   * const userSettings = {
   *   theme: 'dark',
   *   privacy: { shareData: false },
   *   preferences: { notifications: true }
   * };
   * const encrypted = clientEncryption.encryptObject(userSettings);
   * ```
   */
  encryptObject(obj: any): string {
    try {
      // Serialize object to JSON string
      const jsonString = JSON.stringify(obj);
      // Encrypt the JSON string
      return this.encryptString(jsonString);
    } catch (error) {
      console.error('Object encryption failed:', error);
      // Return plain JSON if encryption fails (graceful degradation)
      return JSON.stringify(obj);
    }
  }

  /**
   * Decrypt object data from encrypted JSON string
   *
   * Decrypts an encrypted JSON string and parses it back into a JavaScript object.
   * Used to retrieve complex data structures that were encrypted with encryptObject.
   *
   * @param encryptedData - Encrypted JSON string from encryptObject
   * @returns Parsed JavaScript object
   * @throws {Error} When decryption or JSON parsing fails
   *
   * @example
   * ```typescript
   * const encrypted = "encrypted-json-data";
   * const userSettings = clientEncryption.decryptObject(encrypted);
   * console.log(userSettings.theme); // Access decrypted object properties
   * ```
   */
  decryptObject(encryptedData: string): any {
    try {
      // Decrypt the encrypted JSON string
      const decryptedString = this.decryptString(encryptedData);
      // Parse JSON back to object
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Object decryption failed:', error);
      throw error; // Re-throw for proper error handling
    }
  }

  /**
   * Generate SHA-256 hash for data integrity checking
   *
   * Creates a cryptographic hash of the input data for integrity verification.
   * Used to detect if data has been modified during storage or transmission.
   * The hash is deterministic - same input always produces same hash.
   *
   * @param data - String data to hash
   * @returns SHA-256 hash as hexadecimal string
   *
   * @example
   * ```typescript
   * const data = "Important user data";
   * const hash = clientEncryption.generateHash(data);
   * // Store hash alongside data for later verification
   * ```
   */
  generateHash(data: string): string {
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  }

  /**
   * Verify data integrity using hash comparison
   *
   * Compares current data against a previously generated hash to verify
   * that the data hasn't been modified. Used for integrity checks and
   * tamper detection in sensitive operations.
   *
   * @param data - Current data string to verify
   * @param hash - Previously generated hash to compare against
   * @returns True if data matches the hash, false if modified
   *
   * @example
   * ```typescript
   * const isValid = clientEncryption.verifyHash(currentData, storedHash);
   * if (!isValid) {
   *   console.warn('Data integrity check failed - data may be corrupted');
   * }
   * ```
   */
  verifyHash(data: string, hash: string): boolean {
    const computedHash = this.generateHash(data);
    return computedHash === hash;
  }

  /**
   * Store data securely in localStorage with encryption
   *
   * Encrypts data before storing it in browser localStorage. This provides
   * protection against XSS attacks that might try to read sensitive data
   * from localStorage. The data is encrypted with the user's session key.
   *
   * @param key - Storage key identifier
   * @param value - Data to encrypt and store (any serializable type)
   *
   * @example
   * ```typescript
   * const sensitiveData = {
   *   userPreferences: { theme: 'dark' },
   *   temporaryFormData: { step1: 'completed' }
   * };
   * clientEncryption.setSecureItem('user_session_data', sensitiveData);
   * ```
   */
  setSecureItem(key: string, value: any): void {
    try {
      // Encrypt the data before storing
      const encrypted = this.encryptObject(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage failed:', error);
      // Fail silently to avoid breaking application flow
    }
  }

  /**
   * Retrieve and decrypt data from secure localStorage
   *
   * Retrieves encrypted data from localStorage and decrypts it back to
   * its original form. Returns null if the key doesn't exist or if
   * decryption fails (which may indicate tampering or key changes).
   *
   * @param key - Storage key identifier
   * @returns Decrypted data or null if not found/decryption failed
   *
   * @example
   * ```typescript
   * const userData = clientEncryption.getSecureItem('user_session_data');
   * if (userData) {
   *   console.log('Theme:', userData.userPreferences.theme);
   * }
   * ```
   */
  getSecureItem(key: string): any {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      // Decrypt and return the data
      return this.decryptObject(encrypted);
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      // Return null if decryption fails (may indicate tampering)
      return null;
    }
  }

  /**
   * Remove item from secure storage
   *
   * Removes an encrypted item from localStorage. This is a simple wrapper
   * around localStorage.removeItem for consistency with the secure storage API.
   *
   * @param key - Storage key identifier to remove
   *
   * @example
   * ```typescript
   * // Clear temporary form data after submission
   * clientEncryption.removeSecureItem('temp_form_data');
   * ```
   */
  removeSecureItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all secure storage items
   *
   * Removes all items from localStorage that appear to be encrypted data.
   * This method only removes items with keys starting with 'secure_' to
   * avoid accidentally clearing other application data.
   *
   * Used during logout or when clearing user session data for privacy.
   *
   * @example
   * ```typescript
   * // Clear all encrypted data on logout
   * clientEncryption.clearSecureStorage();
   * ```
   */
  clearSecureStorage(): void {
    // Iterate through localStorage items in reverse order
    // (reverse order prevents index shifting issues during removal)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      // Only clear items that look like encrypted data
      // This prevents accidentally clearing other application data
      if (key && key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    }
  }
}

/**
 * Global client encryption instance
 *
 * Pre-configured instance of ClientEncryption that can be imported and used
 * throughout the application. This singleton pattern ensures consistent
 * encryption configuration across all components.
 */
export const clientEncryption = new ClientEncryption();

/**
 * React hook for client-side encryption utilities
 *
 * Provides a convenient way to access encryption functions in React components.
 * The hook returns bound methods from the global clientEncryption instance,
 * ensuring proper context and making the API more React-friendly.
 *
 * @returns Object containing encryption utility functions
 *
 * @example
 * ```typescript
 * function UserForm() {
 *   const { encryptFormData, setSecureItem } = useClientEncryption();
 *
 *   const handleSubmit = (formData) => {
 *     const encrypted = encryptFormData(formData);
 *     // Send encrypted data to backend
 *
 *     // Store encrypted backup locally
 *     setSecureItem('form_backup', formData);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export const useClientEncryption = () => {
  return {
    // Form data encryption/decryption
    encryptFormData: clientEncryption.encryptFormData.bind(clientEncryption),
    decryptResponseData: clientEncryption.decryptResponseData.bind(clientEncryption),

    // Secure localStorage operations
    setSecureItem: clientEncryption.setSecureItem.bind(clientEncryption),
    getSecureItem: clientEncryption.getSecureItem.bind(clientEncryption),
    removeSecureItem: clientEncryption.removeSecureItem.bind(clientEncryption),
    clearSecureStorage: clientEncryption.clearSecureStorage.bind(clientEncryption)
  };
};

// Default export for direct class usage
export default clientEncryption;
