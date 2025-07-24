/**
 * Authentication Middleware and Form Action Validators
 *
 * This module provides higher-order functions for validating form actions
 * and ensuring user authentication. It integrates Zod schema validation
 * with Next.js Server Actions to provide type-safe form handling.
 *
 * Key features:
 * - Form data validation using Zod schemas
 * - Automatic user authentication checks
 * - Type-safe action wrappers
 * - Error handling and state management
 *
 * @module lib/auth/middleware
 */

import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/mongodb-queries';
import { redirect } from 'next/navigation';

/**
 * MongoDB User type definition
 * Represents the complete user data structure returned from database queries
 */
type MongoUser = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  preferences: any;
  security: any;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Action state type for form handling
 * Used to communicate validation errors and success messages back to forms
 */
export type ActionState = {
  error?: string;      // Validation or processing error message
  success?: string;    // Success confirmation message
  [key: string]: any;  // Additional properties for flexible state management
};

/**
 * Type definition for validated action functions without authentication
 * These functions receive validated data and the original FormData
 */
type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

/**
 * Higher-order function that wraps Server Actions with Zod validation
 *
 * This function creates a validated wrapper around Server Actions that:
 * - Validates form data against a Zod schema
 * - Returns validation errors in a consistent format
 * - Passes validated data to the action function
 *
 * Used for public actions that don't require authentication (login, register, etc.)
 *
 * @param schema - Zod schema to validate form data against
 * @param action - The actual action function to execute with validated data
 * @returns A wrapped action function compatible with useFormState
 *
 * @example
 * ```typescript
 * const loginSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(6)
 * });
 *
 * const loginAction = validatedAction(loginSchema, async (data, formData) => {
 *   // data is now type-safe and validated
 *   const user = await authenticateUser(data.email, data.password);
 *   return { success: 'Login successful' };
 * });
 * ```
 */
export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    // Parse form data and validate against schema
    const result = schema.safeParse(Object.fromEntries(formData));

    // Return validation error if schema validation fails
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    // Execute the action with validated data
    return action(result.data, formData);
  };
}

/**
 * Type definition for validated action functions that require authentication
 * These functions receive validated data, FormData, and the authenticated user
 */
type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: MongoUser
) => Promise<T>;

/**
 * Higher-order function that wraps Server Actions with validation and authentication
 *
 * This function creates a wrapper that:
 * - Checks user authentication before processing
 * - Validates form data against a Zod schema
 * - Provides the authenticated user to the action function
 * - Handles authentication errors consistently
 *
 * Used for protected actions that require a logged-in user
 *
 * @param schema - Zod schema to validate form data against
 * @param action - The action function that requires an authenticated user
 * @returns A wrapped action function with authentication and validation
 * @throws {Error} When user is not authenticated
 *
 * @example
 * ```typescript
 * const updateProfileSchema = z.object({
 *   firstName: z.string().min(1),
 *   lastName: z.string().min(1)
 * });
 *
 * const updateProfileAction = validatedActionWithUser(
 *   updateProfileSchema,
 *   async (data, formData, user) => {
 *     // user is guaranteed to be authenticated
 *     await updateUserProfile(user.id, data);
 *     return { success: 'Profile updated' };
 *   }
 * );
 * ```
 */
export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    // Check authentication first - throws error if not authenticated
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    // Validate form data against schema
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    // Execute action with validated data and authenticated user
    return action(result.data, formData, user);
  };
}
