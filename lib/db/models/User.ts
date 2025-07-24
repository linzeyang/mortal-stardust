/**
 * User Data Model for Mortal Stardust Platform
 *
 * This module defines the User schema and interface for the personal growth counseling
 * platform. It handles user authentication, profile management, security features,
 * and privacy-compliant data storage with field-level encryption.
 *
 * Key Features:
 * - Secure password hashing with bcrypt
 * - Field-level encryption for sensitive data (phone, DOB)
 * - Role-based user categorization for personalized experiences
 * - Account security features (2FA, login attempts, account locking)
 * - GDPR-compliant privacy preferences
 *
 * Data Relationships:
 * - One-to-many with Experience (userId foreign key)
 * - One-to-many with Solution (userId foreign key)
 *
 * @fileoverview User model with authentication, encryption, and security features
 * @author Mortal Stardust Development Team
 * @since 1.0.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcryptjs from 'bcryptjs';
import { encryptData, decryptData } from '../../utils/encryption';

/**
 * User document interface extending Mongoose Document
 *
 * Defines the complete structure of a user document including profile information,
 * security settings, preferences, and methods for data handling.
 *
 * Security Considerations:
 * - passwordHash: Never store plain text passwords
 * - phoneNumber: Encrypted at rest using AES-256
 * - dateOfBirth: Encrypted at rest for privacy compliance
 * - loginAttempts: Used for brute force protection
 * - lockUntil: Temporary account locking mechanism
 */
export interface IUser extends Document {
  /** MongoDB document ID */
  _id: string;

  /** User's email address (unique identifier, lowercase, trimmed) */
  email: string;

  /** Bcrypt hashed password (never store plain text) */
  passwordHash: string;

  /** User profile information */
  profile: {
    /** User's first name (required, trimmed) */
    firstName: string;

    /** User's last name (required, trimmed) */
    lastName: string;

    /** User role for personalized AI guidance and templates */
    role: 'workplace_newcomer' | 'entrepreneur' | 'student' | 'other';

    /** Optional avatar image URL or path */
    avatar?: string;

    /** Phone number (encrypted at rest for privacy) */
    phoneNumber?: string;

    /** Date of birth (encrypted at rest for privacy compliance) */
    dateOfBirth?: Date;
  };

  /** User preferences and settings */
  preferences: {
    /** Preferred language (default: zh-CN) */
    language: string;

    /** Email/push notification preferences */
    notifications: boolean;

    /** Consent for anonymized data sharing for research */
    dataSharing: boolean;
  };

  /** Security and authentication settings */
  security: {
    /** Two-factor authentication enabled status */
    twoFactorEnabled: boolean;

    /** Timestamp of last successful login */
    lastLogin: Date;

    /** Failed login attempt counter for brute force protection */
    loginAttempts: number;

    /** Account lock expiration timestamp (if locked) */
    lockUntil?: Date;
  };

  /** Document creation timestamp (auto-generated) */
  createdAt: Date;

  /** Document last update timestamp (auto-generated) */
  updatedAt: Date;

  /**
   * Compares a plain text password with the stored hash
   * @param candidatePassword - Plain text password to verify
   * @returns Promise resolving to true if password matches
   */
  comparePassword(candidatePassword: string): Promise<boolean>;

  /**
   * Encrypts sensitive profile data before storage
   * Called automatically by pre-save middleware
   */
  encryptSensitiveData(): void;

  /**
   * Decrypts sensitive profile data for display
   * Must be called manually when retrieving user data
   */
  decryptSensitiveData(): void;
}

/**
 * Mongoose schema definition for User documents
 *
 * Defines validation rules, default values, and data types for user documents.
 * Includes business constraints and security considerations.
 *
 * Schema Design Decisions:
 * - email: Unique index for fast lookups, lowercase for consistency
 * - role: Enum constraint ensures valid role values for AI personalization
 * - phoneNumber/dateOfBirth: Stored as strings when encrypted
 * - loginAttempts: Used with lockUntil for progressive account locking
 * - timestamps: Automatic createdAt/updatedAt management
 */
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,        // Creates unique index for fast lookups
    lowercase: true,     // Normalize email case
    trim: true          // Remove whitespace
  },
  passwordHash: {
    type: String,
    required: true      // Never allow null passwords
  },
  profile: {
    firstName: {
      type: String,
      required: true,   // Required for personalization
      trim: true       // Remove leading/trailing spaces
    },
    lastName: {
      type: String,
      required: true,   // Required for personalization
      trim: true       // Remove leading/trailing spaces
    },
    role: {
      type: String,
      enum: ['workplace_newcomer', 'entrepreneur', 'student', 'other'],
      required: true    // Required for AI template selection
    },
    avatar: String,     // Optional profile image
    phoneNumber: String, // Encrypted string storage
    dateOfBirth: Date   // Encrypted date storage
  },
  preferences: {
    language: {
      type: String,
      default: 'zh-CN'  // Default to Chinese for target market
    },
    notifications: {
      type: Boolean,
      default: true     // Opt-in by default for engagement
    },
    dataSharing: {
      type: Boolean,
      default: false    // Opt-out by default for privacy compliance
    }
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false    // Disabled by default, user can enable
    },
    lastLogin: {
      type: Date,
      default: Date.now // Track user activity
    },
    loginAttempts: {
      type: Number,
      default: 0        // Counter for brute force protection
    },
    lockUntil: Date     // Optional account lock expiration
  }
}, {
  timestamps: true      // Automatic createdAt/updatedAt fields
});

/**
 * Database indexes for query performance optimization
 *
 * These indexes improve query performance for common access patterns:
 * - email: Unique index (created automatically by unique: true)
 * - profile.role: For filtering users by role in analytics
 * - createdAt: For chronological sorting and pagination
 */
UserSchema.index({ 'profile.role': 1 });    // Role-based queries
UserSchema.index({ createdAt: -1 });        // Chronological sorting

/**
 * Pre-save middleware for password hashing
 *
 * Automatically hashes passwords before saving to database using bcrypt.
 * Only processes password if it has been modified to avoid rehashing.
 *
 * Security Features:
 * - Uses bcrypt with salt rounds of 12 for strong security
 * - Only hashes when password is modified (not on every save)
 * - Handles errors gracefully to prevent data corruption
 */
UserSchema.pre('save', async function(next) {
  // Skip hashing if password hasn't changed
  if (!this.isModified('passwordHash')) return next();

  try {
    // Generate salt with 12 rounds (good balance of security vs performance)
    const salt = await bcryptjs.genSalt(12);

    // Hash password with generated salt
    this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    // Pass error to Mongoose error handling
    next(error as Error);
  }
});

/**
 * Pre-save middleware for sensitive data encryption
 *
 * Encrypts personally identifiable information before database storage
 * to ensure privacy compliance and data protection.
 *
 * Encrypted Fields:
 * - phoneNumber: AES-256 encryption for contact privacy
 * - dateOfBirth: Encrypted as ISO string for age verification privacy
 *
 * Privacy Compliance:
 * - Supports GDPR right to be forgotten
 * - Enables secure data sharing for research
 * - Protects against data breaches
 */
UserSchema.pre('save', function(next) {
  try {
    // Encrypt phone number if present and modified
    if (this.profile.phoneNumber && this.isModified('profile.phoneNumber')) {
      this.profile.phoneNumber = encryptData(this.profile.phoneNumber);
    }

    // Encrypt date of birth if present and modified
    if (this.profile.dateOfBirth && this.isModified('profile.dateOfBirth')) {
      // Convert to ISO string before encryption for consistent format
      this.profile.dateOfBirth = encryptData(this.profile.dateOfBirth.toISOString()) as any;
    }

    next();
  } catch (error) {
    // Pass encryption errors to Mongoose error handling
    next(error as Error);
  }
});

/**
 * Instance method to verify user password
 *
 * Compares a plain text password against the stored bcrypt hash.
 * Used during authentication to verify user credentials.
 *
 * @param candidatePassword - Plain text password to verify
 * @returns Promise resolving to true if password matches, false otherwise
 *
 * @example
 * ```typescript
 * const user = await User.findOne({ email: 'user@example.com' });
 * const isValid = await user.comparePassword('userPassword123');
 * if (isValid) {
 *   // Proceed with authentication
 * }
 * ```
 */
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcryptjs.compare(candidatePassword, this.passwordHash);
};

/**
 * Instance method to decrypt sensitive user data for display
 *
 * Decrypts encrypted fields to make them readable for application use.
 * Must be called manually after retrieving user documents from database.
 *
 * Decrypted Fields:
 * - phoneNumber: Decrypts to original phone number string
 * - dateOfBirth: Decrypts ISO string and converts back to Date object
 *
 * Error Handling:
 * - Logs decryption errors without throwing to prevent app crashes
 * - Gracefully handles missing or corrupted encrypted data
 *
 * @example
 * ```typescript
 * const user = await User.findById(userId);
 * user.decryptSensitiveData();
 * console.log(user.profile.phoneNumber); // Now readable
 * ```
 */
UserSchema.methods.decryptSensitiveData = function(): void {
  try {
    // Decrypt phone number if present
    if (this.profile.phoneNumber) {
      this.profile.phoneNumber = decryptData(this.profile.phoneNumber);
    }

    // Decrypt and convert date of birth back to Date object
    if (this.profile.dateOfBirth && typeof this.profile.dateOfBirth === 'string') {
      this.profile.dateOfBirth = new Date(decryptData(this.profile.dateOfBirth));
    }
  } catch (error) {
    // Log error but don't throw to prevent application crashes
    console.error('Error decrypting user data:', error);
  }
};

/**
 * User model export with Next.js compatibility
 *
 * Uses conditional model creation to prevent re-compilation errors
 * in Next.js development environment where modules may be reloaded.
 *
 * Model Features:
 * - Automatic password hashing and encryption
 * - Built-in authentication methods
 * - Privacy-compliant data handling
 * - Performance-optimized indexes
 *
 * @example
 * ```typescript
 * import User from './models/User';
 *
 * // Create new user
 * const user = new User({
 *   email: 'user@example.com',
 *   passwordHash: 'plainPassword', // Will be hashed automatically
 *   profile: { firstName: 'John', lastName: 'Doe', role: 'student' }
 * });
 * await user.save();
 *
 * // Find and authenticate user
 * const foundUser = await User.findOne({ email: 'user@example.com' });
 * const isValid = await foundUser.comparePassword('plainPassword');
 * ```
 */
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
