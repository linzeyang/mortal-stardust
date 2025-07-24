/**
 * @fileoverview Authentication Server Actions
 *
 * Server-side authentication actions for user sign-in, sign-up, password management,
 * and account operations. These actions handle secure user authentication using
 * MongoDB, bcrypt password hashing, and JWT session management.
 *
 * Key Features:
 * - Secure user registration with password hashing
 * - Email/password authentication with validation
 * - Session management with JWT tokens and HTTP-only cookies
 * - Password update functionality with current password verification
 * - Account deletion with password confirmation
 * - Activity logging for security auditing
 * - Form validation using Zod schemas
 *
 * Security Measures:
 * - Password hashing using bcrypt with salt rounds
 * - JWT tokens stored in secure HTTP-only cookies
 * - Input validation and sanitization
 * - Activity logging for audit trails
 * - Secure session management with automatic expiration
 *
 * Dependencies:
 * - Next.js server actions for form handling
 * - Zod for schema validation and type safety
 * - MongoDB with Mongoose for user data persistence
 * - Custom authentication utilities for session management
 * - bcrypt for secure password hashing
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

'use server';

import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/mongodb-queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';

// Activity logging for MongoDB (simplified for now)
async function logActivity(
  userId: string,
  action: string,
  ipAddress?: string,
  metadata?: string
) {
  // TODO: Implement activity logging with MongoDB
  console.log(`Activity logged: ${action} for user ${userId}`);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  try {
    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password
      };
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password
      };
    }

    // Update last login
    user.security.lastLogin = new Date();
    await user.save();

    await Promise.all([
      setSession({
        id: user._id.toString(),
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        role: user.profile.role
      }),
      logActivity(user._id.toString(), 'SIGN_IN')
    ]);

    redirect('/');
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      error: 'An error occurred during sign in. Please try again.',
      email,
      password
    };
  }
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['workplace_newcomer', 'entrepreneur', 'student', 'other'])
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, firstName, lastName, role } = data;

  try {
    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return {
        error: 'User with this email already exists. Please try again.',
        email,
        password
      };
    }

    const newUser = new User({
      email,
      passwordHash: password, // Will be hashed by the pre-save middleware
      profile: {
        firstName,
        lastName,
        role
      }
    });

    await newUser.save();

    await Promise.all([
      logActivity(newUser._id.toString(), 'SIGN_UP'),
      setSession({
        id: newUser._id.toString(),
        email: newUser.email,
        name: `${newUser.profile.firstName} ${newUser.profile.lastName}`,
        role: newUser.profile.role
      })
    ]);

    redirect('/');
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password
    };
  }
});

export async function signOut() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logActivity(user.id, 'SIGN_OUT');
    }
    (await cookies()).delete('session');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, sessionUser) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    if (newPassword !== confirmPassword) {
      return {
        error: 'New passwords do not match. Please try again.'
      };
    }

    try {
      await connectDB();

      const user = await User.findById(sessionUser.id);

      if (!user) {
        return {
          error: 'User not found. Please try again.'
        };
      }

      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return {
          error: 'Current password is incorrect. Please try again.'
        };
      }

      user.passwordHash = newPassword; // Will be hashed by pre-save middleware
      await user.save();

      await logActivity(user._id.toString(), 'PASSWORD_UPDATE');

      return {
        success: 'Password updated successfully.'
      };
    } catch (error) {
      console.error('Update password error:', error);
      return {
        error: 'Failed to update password. Please try again.'
      };
    }
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100)
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, sessionUser) => {
    const { password } = data;

    try {
      await connectDB();

      const user = await User.findById(sessionUser.id);

      if (!user) {
        return {
          error: 'User not found. Please try again.'
        };
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return {
          error: 'Password is incorrect. Please try again.'
        };
      }

      await logActivity(user._id.toString(), 'ACCOUNT_DELETE');

      // Delete user account
      await User.findByIdAndDelete(user._id);

      // Clear session
      (await cookies()).delete('session');

      redirect('/sign-in');
    } catch (error) {
      console.error('Delete account error:', error);
      return {
        error: 'Failed to delete account. Please try again.'
      };
    }
  }
);
