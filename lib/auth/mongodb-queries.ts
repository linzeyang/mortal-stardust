/**
 * MongoDB User Query Functions
 *
 * This module provides database query functions for user authentication and management.
 * It handles session validation, user data retrieval, and profile updates while
 * managing encrypted sensitive data and maintaining security best practices.
 *
 * Key features:
 * - Session-based user authentication
 * - Automatic sensitive data decryption
 * - User profile management
 * - Error handling and logging
 *
 * @module lib/auth/mongodb-queries
 */

import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { getSession } from './session';

/**
 * Retrieves the currently authenticated user from the database
 *
 * This function validates the user's session and fetches their complete profile
 * from MongoDB. It automatically decrypts sensitive data and formats the response
 * for frontend consumption. Returns null if no valid session exists.
 *
 * @returns Promise resolving to user data object or null if not authenticated
 *
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log(`Welcome back, ${user.name}!`);
 *   console.log(`Role: ${user.role}`);
 * } else {
 *   // Redirect to login page
 *   redirect('/sign-in');
 * }
 * ```
 */
export async function getCurrentUser() {
  try {
    // Validate session and extract user ID from JWT
    const session = await getSession();
    if (!session) return null;

    // Establish database connection
    await connectDB();

    // Query user by ID from session
    const user = await User.findById(session.user.id);
    if (!user) return null;

    // Decrypt sensitive data for display (handles field-level encryption)
    user.decryptSensitiveData();

    // Return formatted user data for frontend consumption
    return {
      id: user._id.toString(),
      email: user.email,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      role: user.profile.role,
      avatar: user.profile.avatar,
      phoneNumber: user.profile.phoneNumber,
      dateOfBirth: user.profile.dateOfBirth?.toISOString() || null,
      preferences: user.preferences,
      security: {
        twoFactorEnabled: user.security.twoFactorEnabled,
        lastLogin: user.security.lastLogin?.toISOString() || null
      },
      createdAt: user.createdAt?.toISOString() || null,
      updatedAt: user.updatedAt?.toISOString() || null
    };
  } catch (error) {
    // Log error for debugging but don't expose details to client
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Retrieves a user by their unique ID
 *
 * This function fetches a user's complete profile from MongoDB using their ID.
 * It automatically decrypts sensitive data and formats the response consistently.
 * Used for admin functions, user lookups, and profile displays.
 *
 * @param userId - The MongoDB ObjectId string of the user to retrieve
 * @returns Promise resolving to user data object or null if user not found
 *
 * @example
 * ```typescript
 * const user = await getUserById('507f1f77bcf86cd799439011');
 * if (user) {
 *   console.log(`User: ${user.name} (${user.email})`);
 *   console.log(`Member since: ${user.createdAt}`);
 * }
 * ```
 */
export async function getUserById(userId: string) {
  try {
    // Establish database connection
    await connectDB();

    // Query user by MongoDB ObjectId
    const user = await User.findById(userId);
    if (!user) return null;

    // Decrypt sensitive data for display
    user.decryptSensitiveData();

    // Return formatted user data
    return {
      id: user._id.toString(),
      email: user.email,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      role: user.profile.role,
      avatar: user.profile.avatar,
      phoneNumber: user.profile.phoneNumber,
      dateOfBirth: user.profile.dateOfBirth?.toISOString() || null,
      preferences: user.preferences,
      security: {
        twoFactorEnabled: user.security.twoFactorEnabled,
        lastLogin: user.security.lastLogin?.toISOString() || null
      },
      createdAt: user.createdAt?.toISOString() || null,
      updatedAt: user.updatedAt?.toISOString() || null
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Updates a user's profile information
 *
 * This function allows updating various user profile fields including personal
 * information, preferences, and settings. It validates the user exists before
 * applying updates and automatically saves changes to the database.
 *
 * @param userId - The MongoDB ObjectId string of the user to update
 * @param updates - Object containing the fields to update
 * @param updates.firstName - User's first name
 * @param updates.lastName - User's last name
 * @param updates.role - User's role (student, professional, entrepreneur, etc.)
 * @param updates.avatar - URL to user's profile picture
 * @param updates.phoneNumber - User's phone number (encrypted)
 * @param updates.dateOfBirth - User's date of birth
 * @param updates.preferences - User preference settings object
 * @returns Promise resolving to updated user data or null if user not found
 *
 * @example
 * ```typescript
 * const updatedUser = await updateUserProfile('507f1f77bcf86cd799439011', {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   preferences: {
 *     theme: 'dark',
 *     notifications: true
 *   }
 * });
 *
 * if (updatedUser) {
 *   console.log('Profile updated successfully');
 * }
 * ```
 */
export async function updateUserProfile(userId: string, updates: any) {
  try {
    // Establish database connection
    await connectDB();

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) return null;

    // Update profile fields if provided
    // Only updates fields that are explicitly provided in the updates object
    if (updates.firstName) user.profile.firstName = updates.firstName;
    if (updates.lastName) user.profile.lastName = updates.lastName;
    if (updates.role) user.profile.role = updates.role;
    if (updates.avatar) user.profile.avatar = updates.avatar;
    if (updates.phoneNumber) user.profile.phoneNumber = updates.phoneNumber;
    if (updates.dateOfBirth) user.profile.dateOfBirth = updates.dateOfBirth;

    // Update preferences by merging with existing preferences
    // This preserves existing preference settings while updating specified ones
    if (updates.preferences) {
      Object.assign(user.preferences, updates.preferences);
    }

    // Save changes to database (triggers pre-save hooks for encryption)
    await user.save();

    // Return updated user data for confirmation
    return {
      id: user._id.toString(),
      email: user.email,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      role: user.profile.role,
      avatar: user.profile.avatar,
      preferences: user.preferences,
      updatedAt: user.updatedAt?.toISOString() || null
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}
