/**
 * Authentication and Session Management Utilities
 *
 * This module provides core authentication functionality including password hashing,
 * JWT token management, and session handling for the Mortal Stardust platform.
 * It uses bcryptjs for secure password hashing and jose for JWT operations.
 *
 * Key features:
 * - Secure password hashing with bcrypt
 * - JWT token signing and verification
 * - HTTP-only cookie session management
 * - Session data encryption and decryption
 *
 * @module lib/auth/session
 */

import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * MongoDB User interface for type safety
 * Represents the essential user data structure from MongoDB
 */
interface MongoUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// JWT signing key derived from environment secret
// Used for both signing and verifying JWT tokens
const key = new TextEncoder().encode(process.env.AUTH_SECRET);

// bcrypt salt rounds for password hashing
// 10 rounds provides good security vs performance balance
const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password using bcrypt
 *
 * Uses bcryptjs with a salt rounds of 10 to securely hash passwords
 * for storage in the database. The salt is automatically generated
 * and included in the hash.
 *
 * @param password - The plain text password to hash
 * @returns Promise resolving to the hashed password string
 *
 * @example
 * ```typescript
 * const hashedPassword = await hashPassword('userPassword123');
 * // Returns: $2a$10$... (bcrypt hash format)
 * ```
 */
export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain text password with a hashed password
 *
 * Uses bcrypt's compare function to verify if a plain text password
 * matches the stored hash. This is used during login authentication.
 *
 * @param plainTextPassword - The plain text password to verify
 * @param hashedPassword - The stored bcrypt hash to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await comparePasswords('userInput', storedHash);
 * if (isValid) {
 *   // Password is correct, proceed with login
 * }
 * ```
 */
export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

/**
 * Session data structure stored in JWT tokens
 * Contains user information and expiration timestamp
 */
type SessionData = {
  user: { id: string; email: string; name: string; role: string };
  expires: string;
};

/**
 * Signs a JWT token with session data
 *
 * Creates a signed JWT token containing user session information.
 * Uses HS256 algorithm for signing and sets automatic expiration.
 * The token is used for maintaining user authentication state.
 *
 * @param payload - Session data to encode in the JWT
 * @returns Promise resolving to the signed JWT token string
 *
 * @example
 * ```typescript
 * const sessionData = {
 *   user: { id: '123', email: 'user@example.com', name: 'John Doe', role: 'user' },
 *   expires: new Date(Date.now() + 86400000).toISOString()
 * };
 * const token = await signToken(sessionData);
 * ```
 */
export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })  // Use HMAC SHA-256 algorithm
    .setIssuedAt()                         // Set current timestamp as issued time
    .setExpirationTime('1 day from now')   // Auto-expire after 24 hours
    .sign(key);                           // Sign with secret key
}

/**
 * Verifies and decodes a JWT token
 *
 * Validates the JWT signature and extracts the session data payload.
 * Throws an error if the token is invalid, expired, or tampered with.
 * Used by middleware and authentication checks.
 *
 * @param input - The JWT token string to verify
 * @returns Promise resolving to the decoded session data
 * @throws {JWTExpired} When the token has expired
 * @throws {JWTInvalid} When the token signature is invalid
 *
 * @example
 * ```typescript
 * try {
 *   const sessionData = await verifyToken(tokenFromCookie);
 *   console.log('User ID:', sessionData.user.id);
 * } catch (error) {
 *   // Token is invalid or expired
 *   redirectToLogin();
 * }
 * ```
 */
export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],  // Only accept HS256 algorithm for security
  });
  return payload as SessionData;
}

/**
 * Retrieves the current user session from cookies
 *
 * Extracts the session JWT from HTTP-only cookies and verifies it.
 * Returns null if no session exists or if the token is invalid.
 * This is the primary method for checking authentication status.
 *
 * @returns Promise resolving to session data or null if not authenticated
 *
 * @example
 * ```typescript
 * const session = await getSession();
 * if (session) {
 *   console.log('Logged in as:', session.user.name);
 * } else {
 *   // User is not authenticated
 *   redirectToLogin();
 * }
 * ```
 */
export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

/**
 * Creates and sets a new user session
 *
 * Generates a new JWT token with user data and stores it in an HTTP-only cookie.
 * The session expires after 24 hours and includes security settings to prevent
 * XSS and CSRF attacks. Called after successful login or registration.
 *
 * @param user - MongoDB user object containing authentication data
 *
 * @example
 * ```typescript
 * // After successful login validation
 * const user = await User.findOne({ email });
 * if (user && await comparePasswords(password, user.password)) {
 *   await setSession(user);
 *   redirect('/dashboard');
 * }
 * ```
 */
export async function setSession(user: MongoUser) {
  // Set session expiration to 24 hours from now
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Create session data structure
  const session: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    expires: expiresInOneDay.toISOString(),
  };

  // Sign the session data into a JWT token
  const encryptedSession = await signToken(session);

  // Set the JWT as an HTTP-only cookie with security settings
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,    // Prevents XSS attacks by blocking JavaScript access
    secure: true,      // Only send over HTTPS in production
    sameSite: 'lax',   // CSRF protection while allowing normal navigation
  });
}
