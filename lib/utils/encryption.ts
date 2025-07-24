import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development';

/**
 * Encrypts sensitive data using AES-256-GCM
 */
export function encryptData(data: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts sensitive data
 */
export function decryptData(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

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
 */
export function encryptObject(obj: any): string {
  return encryptData(JSON.stringify(obj));
}

/**
 * Decrypts an object from encrypted JSON string
 */
export function decryptObject<T>(encryptedData: string): T {
  const decrypted = decryptData(encryptedData);
  return JSON.parse(decrypted) as T;
}

/**
 * Creates a hash for data integrity verification
 */
export function createHash(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Verifies data integrity using hash
 */
export function verifyHash(data: string, hash: string): boolean {
  return createHash(data) === hash;
}

/**
 * Generates a secure random string for various purposes
 */
export function generateSecureToken(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}
