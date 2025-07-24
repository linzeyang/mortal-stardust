/**
 * @fileoverview User API Route Handler
 *
 * API endpoint for retrieving current user information. This route provides
 * authenticated user data for client-side components and state management.
 * It validates the user's session and returns their profile information.
 *
 * Endpoints:
 * - GET /api/user - Returns current authenticated user data
 *
 * Authentication:
 * - Requires valid JWT session token in HTTP-only cookie
 * - Returns null if user is not authenticated
 * - Automatically handles session validation and user lookup
 *
 * Response Format:
 * - Success: User object with profile, preferences, and security info
 * - Unauthenticated: null
 * - Error: null (errors are logged server-side)
 *
 * Dependencies:
 * - MongoDB user query functions for database operations
 * - Session management utilities for authentication
 * - Next.js App Router API route handlers
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

import { getCurrentUser } from '@/lib/auth/mongodb-queries';

/**
 * GET handler for retrieving current user information
 *
 * This endpoint validates the user's session and returns their complete
 * profile data including personal information, preferences, and security
 * settings. Used by client components for user state management.
 *
 * @returns Response containing user data or null if not authenticated
 */
export async function GET() {
  const user = await getCurrentUser();
  return Response.json(user);
}
