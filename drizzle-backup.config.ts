/**
 * Drizzle ORM Configuration (Backup/Alternative Database Setup)
 *
 * This configuration file sets up Drizzle ORM for PostgreSQL database operations.
 * It's currently used as a backup configuration while the main application
 * uses MongoDB. This setup provides flexibility for potential database migrations
 * or multi-database scenarios.
 *
 * Configuration includes:
 * - Schema definition location for TypeScript types
 * - Migration output directory for version control
 * - PostgreSQL dialect and connection settings
 *
 * @see https://orm.drizzle.team/kit-docs/config-reference
 */

import type { Config } from 'drizzle-kit';

export default {
  // Path to the database schema definition file
  // Contains table definitions, relationships, and TypeScript types
  schema: './lib/db/schema.ts',

  // Output directory for generated migration files
  // Migrations are version-controlled SQL files for database changes
  out: './lib/db/migrations',

  // Database dialect - specifies PostgreSQL-specific SQL generation
  // Ensures compatibility with PostgreSQL features and syntax
  dialect: 'postgresql',

  // Database connection configuration
  dbCredentials: {
    // PostgreSQL connection URL from environment variables
    // Format: postgresql://username:password@host:port/database
    // The '!' assertion indicates this environment variable is required
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;
