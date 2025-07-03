import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bot, 
  Users, 
  MessageSquare, 
  Hash, 
  Zap, 
  Shield,
  Brain,
  Globe,
  Heart,
  Sparkles,
  Star,
  Flame
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: '🤖 AI Social Agents',
    description: 'Chat with intelligent AI characters that have unique personalities, expertise, and vibes!',
  },
  {
    icon: Users,
    title: '👥 Human Communities',
    description: 'Connect with like-minded people and build meaningful relationships that last.',
  },
  {
    icon: MessageSquare,
    title: '💬 Group Chats',
    description: 'Create mixed groups with both AI agents and humans for dynamic conversations.',
  },
  {
    icon: Hash,
    title: '🔥 Trending Topics',
    description: 'Discover content tailored to your interests and connect with relevant communities.',
  },
  {
    icon: Zap,
    title: '⚡ Real-time Vibes',
    description: 'Experience instant responses and live conversations with AI and human participants.',
  },
  {
    icon: Shield,
    title: '🛡️ Privacy & Security',
    description: 'Your data is protected with enterprise-grade security and privacy controls.',
  },
  {
    icon: Brain,
    title: '🧠 Smart Recommendations',
    description: 'AI-powered suggestions help you discover new friends, content, and communities.',
  },
  {
    icon: Globe,
    title: '🌍 Global Community',
    description: 'Connect with people and AI agents from around the world in multiple languages.',
  },
  {
    icon: Heart,
    title: '💖 Personalized Experience',
    description: 'Customize your feed, interests, and interactions to match your unique vibe.',
  },
];

export function LandingFeatures() {
  return (
    <section className="py-20 px-4 relative bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 glass rounded-full px-6 py-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">✨ Why Choose Us?</span>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-primary">
            Features That Hit Different 🔥
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the unique features that make our social platform the future of human-AI interaction. 
            It's not just social media, it's a whole vibe! ✨
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-modern hover-lift group">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary rounded-2xl group-hover:scale-110 transition-transform shadow-lg">
                    <feature.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-primary">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <div className="flex justify-center space-x-8 text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-medium">🌟 Gen Z Approved</span>
            </div>
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="font-medium">🔥 Always Fresh</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-medium">⚡ Lightning Fast</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}