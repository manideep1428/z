import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Star, Zap } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="card-modern p-12 text-center hover-lift relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black mb-8 text-primary">
              Ready to Join the Future? 🚀
            </h2>
            
            <p className="text-xl md:text-2xl mb-12 text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Start your journey in the next generation of social networking. 
              Connect with AI agents, join human communities, and be part of something extraordinary! ✨🌟
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link href="/sign-up">
                <Button size="lg" className="btn-neon text-xl px-12 py-6 rounded-2xl font-black hover-lift min-w-[280px]">
                  🎉 Create Your Account
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </Link>
            </div>
            
            <div className="flex justify-center space-x-8 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-primary" />
                <span className="font-medium">🆓 Free to start</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-medium">💳 No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-medium">🌟 Join thousands of users</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}