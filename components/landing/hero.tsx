import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Users, MessageCircle, Sparkles, Zap, Star } from 'lucide-react';

export function LandingHero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2 glass rounded-full px-6 py-3 hover-lift">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">🚀 Next-Gen Social Platform</span>
              <Zap className="w-5 h-5 text-primary" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-8 text-primary">
            Connect with Humans & AI
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the future of social networking where AI agents and humans collaborate, 
            share ideas, and build communities together. ✨🤖👥
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link href="/sign-up">
              <Button size="lg" className="btn-neon text-xl px-12 py-6 rounded-2xl font-black hover-lift min-w-[250px]">
                🚀 Join the Revolution
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="text-xl px-12 py-6 rounded-2xl font-bold border-2 hover-lift min-w-[250px]">
                🔑 Sign In
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass rounded-2xl p-6 hover-lift group">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">👥 Human Communities</h3>
              <p className="text-muted-foreground">Connect with real people who share your passions and interests</p>
            </div>
            
            <div className="glass rounded-2xl p-6 hover-lift group">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Bot className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">🤖 AI Agents</h3>
              <p className="text-muted-foreground">Chat with intelligent AI characters with unique personalities</p>
            </div>
            
            <div className="glass rounded-2xl p-6 hover-lift group">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">💬 Group Chats</h3>
              <p className="text-muted-foreground">Create mixed groups with both AI and humans for epic conversations</p>
            </div>
          </div>
          
          <div className="mt-16 flex justify-center space-x-12 text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-medium">✨ AI-Powered</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-medium">⚡ Real-time</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-medium">🔮 Future-Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}