/**
 * MongoDB Connection Management Module
 *
 * This module provides centralized database connection management for the Mortal Stardust
 * application using Mongoose ODM. It implements connection pooling, caching, and error
 * handling to ensure optimal database performance and reliability.
 *
 * Key Features:
 * - Global connection caching to prevent multiple connections
 * - Automatic reconnection handling
 * - Environment-based configuration
 * - Connection lifecycle management
 *
 * @fileoverview MongoDB connection utilities with connection pooling and caching
 * @author Mortal Stardust Development Team
 * @since 1.0.0
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables for database configuration
dotenv.config();

// Database connection configuration from environment variables
const MONGO_URI = process.env.MONGO_URI!;
const MONGO_DB = process.env.MONGO_DB || 'life_experience_platform';

// Validate required environment variables at startup
if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable');
}

/**
 * Interface for the global Mongoose connection cache
 *
 * This interface defines the structure for caching database connections
 * to prevent multiple connection attempts and improve performance.
 */
interface MongooseCache {
  /** Active Mongoose connection instance, null if not connected */
  conn: typeof mongoose | null;
  /** Promise for pending connection attempt, null if no connection in progress */
  promise: Promise<typeof mongoose> | null;
}

/**
 * Global cache declaration for Mongoose connections
 *
 * This extends the global namespace to include a mongoose cache property,
 * enabling connection reuse across different parts of the application.
 * This is particularly important in serverless environments where
 * connection pooling needs to persist across function invocations.
 */
declare global {
  var mongoose: MongooseCache | undefined;
}

// Initialize or retrieve the global connection cache
let cached = global.mongoose;

// Create cache if it doesn't exist
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Establishes a connection to MongoDB with connection caching and error handling
 *
 * This function implements a singleton pattern for database connections to prevent
 * multiple connection attempts and optimize performance. It uses global caching
 * to maintain connections across serverless function invocations.
 *
 * Performance Optimizations:
 * - Connection caching prevents redundant connection attempts
 * - bufferCommands: false reduces memory usage in serverless environments
 * - Promise caching prevents race conditions during concurrent connection attempts
 *
 * Error Handling:
 * - Clears cached promise on connection failure to allow retry attempts
 * - Provides detailed error logging for debugging
 * - Throws original error for upstream handling
 *
 * @returns Promise that resolves to the Mongoose connection instance
 * @throws {Error} When connection fails or environment variables are missing
 *
 * @example
 * ```typescript
 * try {
 *   const db = await connectDB();
 *   console.log('Database connected:', db.connection.readyState);
 * } catch (error) {
 *   console.error('Connection failed:', error);
 * }
 * ```
 */
export async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    const opts = {
      // Disable command buffering for better serverless performance
      bufferCommands: false,
      // Specify target database name
      dbName: MONGO_DB,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts);
  }

  try {
    // Await connection and cache the result
    cached.conn = await cached.promise;
    console.log('✅ MongoDB connected successfully');
    return cached.conn;
  } catch (e) {
    console.error('❌ MongoDB connection error:', e);
    // Clear failed promise to allow retry attempts
    cached.promise = null;
    throw e;
  }
}

/**
 * Gracefully disconnects from MongoDB and clears connection cache
 *
 * This function properly closes the database connection and resets the global
 * cache to ensure clean disconnection. It's primarily used during application
 * shutdown or in testing environments where connection cleanup is required.
 *
 * Connection Cleanup:
 * - Closes active Mongoose connection
 * - Clears cached connection instance
 * - Resets connection promise for future reconnection
 *
 * @returns Promise that resolves when disconnection is complete
 *
 * @example
 * ```typescript
 * // Graceful shutdown
 * process.on('SIGTERM', async () => {
 *   await disconnectDB();
 *   process.exit(0);
 * });
 *
 * // Test cleanup
 * afterAll(async () => {
 *   await disconnectDB();
 * });
 * ```
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    // Close the active connection
    await cached.conn.disconnect();

    // Clear cache to allow fresh connections
    cached.conn = null;
    cached.promise = null;

    console.log('📴 MongoDB disconnected');
  }
}
