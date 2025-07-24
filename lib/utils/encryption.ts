/**
 * Server-Side Encryption Utilities
 *
 * This module provides server-side encryption and decryption functions for
 * protecting sensitive user data in the Mortal Stardust platform. It uses
 * AES-256 encryption with CryptoJS for secure data handling.
 *
 * Key features:
 * - AES-256 encryption for sensitive data protection
 * - String and object encryption/decryption
 * - Data integrity verification with SHA-256 hashing
 * - Secure token generation for various purposes
 *
 * Security considerations:
 * - Uses environment-based encryption keys
 * - Provides fallback for development environments
 * - Includes error handling for encryption failures
 *
 * @module lib/utils/encryption
 */

import CryptoJS from 'crypto-js';

// Encryption key from environment variables with development fallback
// In production, this should be a strong, randomly generated key
// stored securely in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development';

/**
 * Encrypts sensitive data using AES-256 encryption
 *
 * This function encrypts plain text data using AES-256 algorithm with the
 * configured encryption key. Used for protecting sensitive user information
 * like personal details, experience content, and other private data.
 *
 * @param data - Plain text string to encrypt
 * @returns Encrypted data as a base64-encoded string
 * @throws {Error} When encryption fails due to invalid input or system errors
 *
 * @example
 * ```typescript
 * const sensitiveInfo = "User's personal experience details";
 * const encrypted = encryptData(sensitiveInfo);
 * // Store encrypted data in database
 * await saveToDatabase({ content: encrypted });
 * ```
 */
export function encryptData(data: string): string {
  try {
    // Encrypt using AES with the configured key
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts previously encrypted sensitive data
 *
 * This function decrypts AES-256 encrypted data back to its original plain text.
 * Used when retrieving sensitive information from the database for display
 * or processing. Includes validation to ensure decryption was successful.
 *
 * @param encryptedData - Base64-encoded encrypted string to decrypt
 * @returns Original plain text data
 * @throws {Error} When decryption fails due to invalid data or wrong key
 *
 * @example
 * ```typescript
 * const encryptedContent = await getFromDatabase();
 * const originalText = decryptData(encryptedContent.content);
 * // Use decrypted data for display or processing
 * ```
 */
export function decryptData(encryptedData: string): string {
  try {
    // Decrypt using AES with the configured key
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    // Validate that decryption was successful
    if (!decrypted) {
      throw new Error('Invalid encrypted data');
    }

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypts an object by converting it to JSON first
 *
 * This function serializes a JavaScript object to JSON and then encrypts
 * the resulting string. Useful for encrypting complex data structures
 * like user preferences, experience data, or configuration objects.
 *
 * @param obj - Any JavaScript object to encrypt
 * @returns Encrypted JSON string
 *
 * @example
 * ```typescript
 * const userPreferences = {
 *   theme: 'dark',
 *   notifications: true,
 *   privacy: { shareData: false }
 * };
 * const encrypted = encryptObject(userPreferences);
 * ```
 */
export function encryptObject(obj: any): string {
  return encryptData(JSON.stringify(obj));
}

/**
 * Decrypts an object from encrypted JSON string
 *
 * This function decrypts an encrypted JSON string and parses it back
 * into a JavaScript object. Provides type safety through generic typing.
 *
 * @param encryptedData - Encrypted JSON string to decrypt
 * @returns Parsed JavaScript object of specified type
 *
 * @example
 * ```typescript
 * interface UserPrefs {
 *   theme: string;
 *   notifications: boolean;
 * }
 *
 * const decrypted = decryptObject<UserPrefs>(encryptedData);
 * console.log(decrypted.theme); // Type-safe access
 * ```
 */
export function decryptObject<T>(encryptedData: string): T {
  const decrypted = decryptData(encryptedData);
  return JSON.parse(decrypted) as T;
}

/**
 * Creates a SHA-256 hash for data integrity verification
 *
 * Generates a cryptographic hash of the input data using SHA-256 algorithm.
 * Used for verifying data integrity, creating checksums, and ensuring
 * data hasn't been tampered with during storage or transmission.
 *
 * @param data - String data to hash
 * @returns SHA-256 hash as hexadecimal string
 *
 * @example
 * ```typescript
 * const originalData = "Important user data";
 * const hash = createHash(originalData);
 * // Store hash alongside data for later verification
 * ```
 */
export function createHash(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Verifies data integrity using hash comparison
 *
 * Compares a data string against a previously generated hash to verify
 * that the data hasn't been modified. Used for integrity checks and
 * tamper detection in sensitive data operations.
 *
 * @param data - Original data string to verify
 * @param hash - Previously generated hash to compare against
 * @returns True if data matches the hash, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = verifyHash(retrievedData, storedHash);
 * if (!isValid) {
 *   throw new Error('Data integrity check failed');
 * }
 * ```
 */
export function verifyHash(data: string, hash: string): boolean {
  return createHash(data) === hash;
}

/**
 * Generates a secure random string for various purposes
 *
 * Creates a cryptographically secure random string using CryptoJS.
 * Used for generating session tokens, API keys, nonces, and other
 * security-related random values throughout the application.
 *
 * @param length - Length of the random string in bytes (default: 32)
 * @returns Secure random string as hexadecimal
 *
 * @example
 * ```typescript
 * // Generate session token
 * const sessionToken = generateSecureToken(32);
 *
 * // Generate shorter API key
 * const apiKey = generateSecureToken(16);
 *
 * // Generate nonce for cryptographic operations
 * const nonce = generateSecureToken(12);
 * ```
 */
export function generateSecureToken(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}
