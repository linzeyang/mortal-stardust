/**
 * @fileoverview Home Page Component
 *
 * The main landing page for the Mortal Stardust application. This component
 * serves as the entry point for new users, providing an overview of the
 * three-stage AI counseling process and encouraging user registration.
 *
 * The page features a hero section with the site branding, a description
 * of the service, and a visual representation of the three processing stages.
 * It uses the site configuration for dynamic content and provides a clear
 * call-to-action for user onboarding.
 *
 * @author Mortal Stardust Team
 * @since 1.0.0
 */

import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Brain, Users } from 'lucide-react';
import { siteConfig } from '@/lib/config';

/**
 * Home Page Component
 *
 * The main landing page that introduces users to the Mortal Stardust platform.
 * This component provides:
 *
 * - Hero section with site branding and value proposition
 * - Visual overview of the three-stage AI processing system
 * - Clear explanation of each stage's purpose and benefits
 * - Call-to-action button directing users to registration
 * - Responsive design optimized for various screen sizes
 *
 * The page is designed to be welcoming and informative, helping users
 * understand the platform's capabilities before they begin the registration
 * process. It uses consistent styling with the site's design system and
 * incorporates accessibility best practices.
 *
 * @component
 * @returns {JSX.Element} The rendered home page with hero section and feature overview
 *
 * @example
 * ```tsx
 * // This component is automatically rendered for the root route
 * // No props are required as it uses site configuration
 * <HomePage />
 * ```
 */
export default function HomePage() {
  return (
    <main className="flex-1 flex items-center justify-center">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Heading - Uses site configuration for dynamic branding */}
          <h1 className="text-4xl font-bold text-foreground tracking-tight sm:text-5xl md:text-6xl">
            Welcome to
            <span className="block text-primary">{siteConfig.name}</span>
          </h1>

          {/* Value Proposition - Explains the core service offering */}
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            Share your life experiences and receive personalized AI guidance through our comprehensive three-stage counseling process
          </p>

          {/* Three-Stage Process Overview - Visual representation of the AI processing stages */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Stage 1: Psychological Healing */}
            <div className="text-center p-6 rounded-lg bg-card border">
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Psychological Healing</h3>
              <p className="text-muted-foreground text-sm">
                Stage 1: Emotional support and mental wellness guidance tailored to your experiences
              </p>
            </div>

            {/* Stage 2: Practical Solutions */}
            <div className="text-center p-6 rounded-lg bg-card border">
              <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Practical Solutions</h3>
              <p className="text-muted-foreground text-sm">
                Stage 2: Actionable strategies and concrete steps to address your challenges
              </p>
            </div>

            {/* Stage 3: Ongoing Support */}
            <div className="text-center p-6 rounded-lg bg-card border">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ongoing Support</h3>
              <p className="text-muted-foreground text-sm">
                Stage 3: Follow-up guidance and experience enhancement for long-term growth
              </p>
            </div>
          </div>

          {/* Call-to-Action - Primary conversion point directing users to registration */}
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="text-lg rounded-full px-8 py-3"
            >
              <a href="/sign-up">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
