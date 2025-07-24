/**
 * Site Configuration for Mortal Stardust Platform
 *
 * This module contains the core site configuration settings used throughout
 * the application for branding, SEO, and display purposes. These values are
 * used in metadata, page titles, and various UI components.
 *
 * The configuration is centralized here to ensure consistency across the
 * application and to make it easy to update branding information.
 *
 * @module lib/config
 */

/**
 * Core site configuration object
 *
 * Contains essential branding and metadata information used throughout
 * the Mortal Stardust platform. These values appear in:
 * - HTML page titles and meta tags
 * - Navigation headers and footers
 * - SEO optimization
 * - Social media sharing cards
 * - Application branding elements
 *
 * @example
 * ```typescript
 * import { siteConfig } from '@/lib/config';
 *
 * // Use in page metadata
 * export const metadata = {
 *   title: siteConfig.title,
 *   description: siteConfig.description
 * };
 *
 * // Use in components
 * <h1>{siteConfig.name}</h1>
 * ```
 */
export const siteConfig = {
  /**
   * Short application name used in navigation and branding
   * Displayed in headers, logos, and compact UI elements
   */
  name: "LifePath AI",

  /**
   * Full descriptive title for SEO and page headers
   * Used in HTML title tags and social media sharing
   */
  title: "AI-Powered Life Experience Counseling Platform",

  /**
   * Detailed description of the platform's purpose and functionality
   * Used for SEO meta descriptions and application introductions
   * Explains the three-stage AI counseling process that is core to the platform
   */
  description: "Share your life experiences and receive personalized AI guidance through our three-stage counseling process."
};
