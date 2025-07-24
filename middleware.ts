/**
 * Next.js Middleware for Authentication and Session Management
 *
 * This middleware runs on every request to handle JWT token refresh and
 * session management. It automatically refreshes valid session tokens
 * to maintain user authentication state across the application.
 *
 * Key responsibilities:
 * - Validates existing JWT session tokens
 * - Automatically refreshes tokens on GET requests to extend session life
 * - Removes invalid or expired session cookies
 * - Runs on all routes except API endpoints and static assets
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

/**
 * Middleware function that processes authentication for incoming requests
 *
 * This function intercepts requests to validate and refresh JWT tokens stored
 * in HTTP-only cookies. It only processes GET requests to avoid interfering
 * with form submissions and API calls.
 *
 * @param request - The incoming Next.js request object
 * @returns NextResponse with updated session cookie or original response
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  // Create response object that will be returned
  let res = NextResponse.next();

  // Only refresh sessions on GET requests to avoid interfering with mutations
  // Session refresh on GET requests ensures users stay logged in during browsing
  if (sessionCookie && request.method === 'GET') {
    try {
      // Verify the existing JWT token and extract user data
      const parsed = await verifyToken(sessionCookie.value);

      // Set new expiration time to 24 hours from now
      // This sliding window approach keeps active users logged in
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Generate new JWT token with refreshed expiration
      // Preserves all existing user data while extending session life
      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,    // Prevents XSS attacks by making cookie inaccessible to JavaScript
        secure: true,      // Ensures cookie is only sent over HTTPS in production
        sameSite: 'lax',   // Provides CSRF protection while allowing normal navigation
        expires: expiresInOneDay
      });
    } catch (error) {
      // If token verification fails (expired, invalid, or corrupted),
      // remove the session cookie to force re-authentication
      console.error('Error updating session:', error);
      res.cookies.delete('session');
    }
  }

  return res;
}

// Middleware configuration
export const config = {
  // Route matcher pattern - runs on all routes except:
  // - /api/* (API routes handle their own authentication)
  // - /_next/static/* (static assets don't need authentication)
  // - /_next/image/* (Next.js image optimization)
  // - /favicon.ico (browser favicon requests)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],

  // Use Node.js runtime for full middleware capabilities
  // Required for JWT operations and complex session logic
  runtime: 'nodejs'
};
