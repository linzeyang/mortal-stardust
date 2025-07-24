/**
 * @fileoverview Root Layout Component
 *
 * The root layout component that wraps all pages in the application.
 * This component sets up the fundamental structure, styling, and providers
 * that are shared across the entire application. It includes theme support,
 * authentication context, and global styling configuration.
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getCurrentUser } from '@/lib/auth/mongodb-queries';
import { SWRConfig } from 'swr';
import Header from '@/components/header';
import { ThemeProvider } from '@/contexts/theme-context';
import { siteConfig } from '@/lib/config';

/**
 * Metadata configuration for the application
 * Uses site configuration for dynamic title and description
 */
export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description
};

/**
 * Viewport configuration for responsive design
 * Prevents zoom on mobile devices for better UX
 */
export const viewport: Viewport = {
  maximumScale: 1
};

/**
 * Google Fonts configuration
 * Loads the Manrope font family with Latin subset for optimal performance
 */
const manrope = Manrope({ subsets: ['latin'] });

/**
 * Root Layout Component
 *
 * The foundational layout component that provides the structure and context
 * for all pages in the application. This component:
 *
 * - Sets up the HTML document structure with proper lang attribute
 * - Applies global font styling using Google Fonts
 * - Provides theme context for light/dark mode support
 * - Configures SWR for data fetching with authentication fallback
 * - Includes the global header navigation component
 * - Establishes the main content area with proper flex layout
 *
 * The layout uses a flex column structure to ensure the header stays at the top
 * and content fills the remaining space. It also pre-loads user authentication
 * data through SWR's fallback mechanism for improved performance.
 *
 * @param props - Component props
 * @param props.children - The page content to be rendered within the layout
 *
 * @example
 * ```tsx
 * // This layout is automatically applied to all pages in the app directory
 * // No direct usage required - Next.js handles the wrapping
 * ```
 */
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-background text-foreground">
        {/* Theme Provider - Enables light/dark mode switching throughout the app */}
        <ThemeProvider>
          {/* SWR Configuration - Sets up data fetching with authentication fallback */}
          <SWRConfig
            value={{
              fallback: {
                // Pre-load user authentication data for immediate availability
                // Components that read this data will not suspend on first render
                '/api/user': getCurrentUser()
              }
            }}
          >
            {/* Main Application Structure - Flex column layout for header and content */}
            <div className="flex flex-col min-h-screen">
              {/* Global Header - Navigation and user controls */}
              <Header />
              {/* Page Content - Rendered children from individual pages */}
              {children}
            </div>
          </SWRConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
