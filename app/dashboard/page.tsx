/**
 * @fileoverview Dashboard Page Component
 *
 * The main dashboard page for authenticated users. This component serves as
 * the central hub where users can view and manage their experiences, AI solutions,
 * and account information. It includes authentication checks and personalized
 * content based on the current user's data.
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/mongodb-queries';
import DashboardContent from '@/components/dashboard/dashboard-content';

/**
 * Dashboard Page Component
 *
 * The main dashboard page that provides authenticated users with access to
 * their personal data and AI solutions. This component:
 *
 * - Performs server-side authentication checks
 * - Redirects unauthenticated users to the sign-in page
 * - Displays a personalized welcome message with the user's name
 * - Renders the main dashboard content with user-specific data
 * - Uses a responsive container layout for optimal viewing
 *
 * The page is server-rendered to ensure authentication is verified before
 * any content is displayed to the user. This provides better security and
 * user experience compared to client-side authentication checks.
 *
 * @async
 * @component
 * @returns {Promise<JSX.Element>} The rendered dashboard page with user content
 *
 * @example
 * ```tsx
 * // This component is automatically rendered for the /dashboard route
 * // Authentication is handled automatically via server-side checks
 * <DashboardPage />
 * ```
 */
export default async function DashboardPage() {
  // Server-side authentication check
  const user = await getCurrentUser();

  // Redirect unauthenticated users to sign-in page
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Personalized Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              欢迎回来，{user.firstName}！
            </h1>
            <p className="text-muted-foreground mt-2">
              管理您的人生经历和AI辅导方案
            </p>
          </div>

          {/* Main Dashboard Content - Renders user-specific data and controls */}
          <DashboardContent user={user} />
        </div>
      </div>
    </main>
  );
}
