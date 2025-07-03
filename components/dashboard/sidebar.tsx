'use client';

import { useState } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccountSettings } from './account-settings';
import { useTheme } from 'next-themes';
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  Users, 
  Settings, 
  Plus,
  Hash,
  Sun,
  Moon,
  Zap,
  Sparkles,
  Star
} from 'lucide-react';

interface SidebarProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const sidebarItems = [
  { id: 'home', label: 'Feed', icon: Home, emoji: '🏠' },
  { id: 'search', label: 'Discover', icon: Search, emoji: '🔍' },
  { id: 'notifications', label: 'Notifications', icon: Bell, emoji: '🔔' },
  { id: 'messages', label: 'Messages', icon: Mail, emoji: '💬' },
  { id: 'groups', label: 'Communities', icon: Users, emoji: '👥' },
  { id: 'topics', label: 'Trending', icon: Hash, emoji: '🔥' },
];

export function Sidebar({ user, activeTab, onTabChange }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const cycleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <div className="sticky top-6 space-y-4">
        {/* User Profile Card */}
        <Card className="card-modern hover-lift">
          <CardContent className="p-4">
            <button
              onClick={() => setShowAccountSettings(true)}
              className="flex items-center space-x-3 w-full hover:bg-muted/50 rounded-xl p-2 transition-all duration-300 group"
            >
              <div className="relative">
                <Avatar className="w-12 h-12 avatar-glow">
                  <AvatarImage src={user.profile?.avatarUrl} alt={user.profile?.displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                    {user.profile?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background status-online"></div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="font-bold text-sm truncate text-primary">
                  {user.profile?.displayName || 'User'}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            </button>
            
            {user.metadata?.persona && (
              <div className="mt-3 pt-3 border-t border-border">
                <Badge className="badge-ai text-xs">
                  ✨ {user.metadata.persona}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card className="card-modern">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start h-12 rounded-xl transition-all duration-300 group ${
                    activeTab === item.id 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'hover:bg-muted/50 hover:scale-105'
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <span className="text-lg mr-3">{item.emoji}</span>
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {activeTab === item.id && (
                    <Zap className="ml-auto h-4 w-4 text-primary" />
                  )}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Theme Toggle */}
        <Card className="card-modern hover-lift">
          <CardContent className="p-4">
            <Button
              variant="outline"
              onClick={cycleTheme}
              className="w-full justify-start h-12 rounded-xl hover:scale-105 transition-all duration-300"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="mr-3 h-5 w-5" />
                  <span>🌙 Dark Vibes</span>
                </>
              ) : (
                <>
                  <Sun className="mr-3 h-5 w-5" />
                  <span>☀️ Light Mode</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Create Post Button */}
        <Button className="w-full h-14 btn-neon rounded-xl text-lg font-bold hover-lift">
          <Plus className="mr-2 h-5 w-5" />
          <span>✨ Create Magic</span>
        </Button>

        {/* Quick Stats */}
        <Card className="card-modern">
          <CardContent className="p-4">
            <h3 className="font-bold text-sm mb-3 text-primary">🚀 Your Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-lg bg-primary/20">
                <div className="text-lg font-bold text-primary">0</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-primary/20">
                <div className="text-lg font-bold text-primary">0</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Button
          variant="ghost"
          onClick={() => onTabChange('settings')}
          className="w-full justify-start h-12 rounded-xl hover:bg-muted/50 hover:scale-105 transition-all duration-300"
        >
          <Settings className="mr-3 h-5 w-5" />
          <span>⚙️ Settings</span>
        </Button>
      </div>

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <AccountSettings 
          user={user} 
          onClose={() => setShowAccountSettings(false)} 
        />
      )}
    </>
  );
}