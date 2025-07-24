/**
 * Client-side encryption utilities for protecting sensitive data
 * before sending to backend and after receiving from backend.
 */

import CryptoJS from 'crypto-js';

interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  iterations: number;
}

class ClientEncryption {
  private config: EncryptionConfig;
  private secretKey: string;

  constructor() {
    this.config = {
      algorithm: 'AES',
      keySize: 256 / 32,
      iterations: 10000
    };

    // In production, this should come from environment variables
    // and be unique per user session
    this.secretKey = process.env.NEXT_PUBLIC_CLIENT_ENCRYPTION_KEY || 'default-client-key-change-in-production';
  }

  /**
   * Encrypt sensitive form data before sending to backend
   */
  encryptFormData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'firstName',
      'lastName',
      'phoneNumber',
      'experienceContent',
      'personalDetails',
      'emotionalState',
      'location'
    ];

    const encrypted = { ...data };

    for (const field of sensitiveFields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encryptString(encrypted[field]);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt sensitive data received from backend
   */
  decryptResponseData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'firstName',
      'lastName',
      'phoneNumber',
      'experienceContent',
      'personalDetails',
      'emotionalState',
      'location'
    ];

    const decrypted = { ...data };

    for (const field of sensitiveFields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = this.decryptString(decrypted[field]);
        } catch (error) {
          console.warn(`Failed to decrypt field ${field}:`, error);
          // Keep original value if decryption fails
        }
      }
    }

    return decrypted;
  }

  /**
   * Encrypt a string value
   */
  encryptString(text: string): string {
    if (!text) return text;

    try {
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const key = CryptoJS.PBKDF2(this.secretKey, salt, {
        keySize: this.config.keySize,
        iterations: this.config.iterations
      });

      const iv = CryptoJS.lib.WordArray.random(128 / 8);
      const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });

      const combined = salt.toString() + iv.toString() + encrypted.toString();
      return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return text; // Return original if encryption fails
    }
  }

  /**
   * Decrypt a string value
   */
  decryptString(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      const combined = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encryptedText));

      const salt = CryptoJS.enc.Hex.parse(combined.substr(0, 32));
      const iv = CryptoJS.enc.Hex.parse(combined.substr(32, 32));
      const encrypted = combined.substring(64);

      const key = CryptoJS.PBKDF2(this.secretKey, salt, {
        keySize: this.config.keySize,
        iterations: this.config.iterations
      });

      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt object data
   */
  encryptObject(obj: any): string {
    try {
      const jsonString = JSON.stringify(obj);
      return this.encryptString(jsonString);
    } catch (error) {
      console.error('Object encryption failed:', error);
      return JSON.stringify(obj);
    }
  }

  /**
   * Decrypt object data
   */
  decryptObject(encryptedData: string): any {
    try {
      const decryptedString = this.decryptString(encryptedData);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Object decryption failed:', error);
      throw error;
    }
  }

  /**
   * Generate secure hash for data integrity checking
   */
  generateHash(data: string): string {
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  }

  /**
   * Verify hash for data integrity
   */
  verifyHash(data: string, hash: string): boolean {
    const computedHash = this.generateHash(data);
    return computedHash === hash;
  }

  /**
   * Secure local storage with encryption
   */
  setSecureItem(key: string, value: any): void {
    try {
      const encrypted = this.encryptObject(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage failed:', error);
    }
  }

  /**
   * Retrieve and decrypt from secure local storage
   */
  getSecureItem(key: string): any {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      return this.decryptObject(encrypted);
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      return null;
    }
  }

  /**
   * Remove item from secure storage
   */
  removeSecureItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all secure storage
   */
  clearSecureStorage(): void {
    // Only clear items that look like encrypted data
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    }
  }
}

// Global client encryption instance
export const clientEncryption = new ClientEncryption();

// Convenience hooks for React components
export const useClientEncryption = () => {
  return {
    encryptFormData: clientEncryption.encryptFormData.bind(clientEncryption),
    decryptResponseData: clientEncryption.decryptResponseData.bind(clientEncryption),
    setSecureItem: clientEncryption.setSecureItem.bind(clientEncryption),
    getSecureItem: clientEncryption.getSecureItem.bind(clientEncryption),
    removeSecureItem: clientEncryption.removeSecureItem.bind(clientEncryption),
    clearSecureStorage: clientEncryption.clearSecureStorage.bind(clientEncryption)
  };
};

export default clientEncryption;
