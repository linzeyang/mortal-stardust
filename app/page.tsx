import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Brain, Users } from 'lucide-react';
import { siteConfig } from '@/lib/config';

export default function HomePage() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground tracking-tight sm:text-5xl md:text-6xl">
            Welcome to
            <span className="block text-primary">{siteConfig.name}</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            Share your life experiences and receive personalized AI guidance through our comprehensive three-stage counseling process
          </p>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-lg bg-card border">
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Psychological Healing</h3>
              <p className="text-muted-foreground text-sm">
                Stage 1: Emotional support and mental wellness guidance tailored to your experiences
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-card border">
              <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Practical Solutions</h3>
              <p className="text-muted-foreground text-sm">
                Stage 2: Actionable strategies and concrete steps to address your challenges
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-card border">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ongoing Support</h3>
              <p className="text-muted-foreground text-sm">
                Stage 3: Follow-up guidance and experience enhancement for long-term growth
              </p>
            </div>
          </div>
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