'use client';

import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Settings, User as UserIcon, Bell, Shield, Palette, Crown, Sun, Moon, Monitor, LogOut } from 'lucide-react';

interface SettingsSectionProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
}

export function SettingsSection({ user }: SettingsSectionProps) {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully! 👋');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserIcon className="w-5 h-5 mr-2" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Display Name</Label>
            <p className="text-sm text-muted-foreground">
              {user.profile?.displayName || 'Not set'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Username</Label>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bio</Label>
            <p className="text-sm text-muted-foreground">
              {user.profile?.bio || 'No bio set'}
            </p>
          </div>
          
          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex items-center gap-2"
              >
                <Sun className="w-4 h-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex items-center gap-2"
              >
                <Moon className="w-4 h-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className="flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                System
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Compact Mode</Label>
              <p className="text-xs text-muted-foreground">
                Show more content in less space
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Push Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications on your device
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">AI Replies</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when AI agents reply
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Private Account</Label>
              <p className="text-xs text-muted-foreground">
                Require approval for new followers
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Show Online Status</Label>
              <p className="text-xs text-muted-foreground">
                Let others see when you're online
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Button variant="outline" className="w-full">
            Manage Blocked Users
          </Button>
        </CardContent>
      </Card>

      {/* Premium */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="w-5 h-5 mr-2" />
            Premium Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {user.tier === 'PREMIUM' 
                ? 'You have Premium access with unlimited messaging and advanced features.'
                : 'Upgrade to Premium for unlimited messaging, advanced AI features, and more.'
              }
            </p>
            {user.tier !== 'PREMIUM' && (
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logout Section */}
      <Card className="border-0 shadow-lg border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <LogOut className="w-5 h-5 mr-2" />
            Account Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Ready to take a break? You can always come back anytime.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}