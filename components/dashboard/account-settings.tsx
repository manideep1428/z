'use client';

import { useState } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Heart, 
  Save,
  Camera,
  X
} from 'lucide-react';

interface AccountSettingsProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
  onClose: () => void;
}

export function AccountSettings({ user, onClose }: AccountSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user.profile?.displayName || '',
    bio: user.profile?.bio || '',
    interests: user.metadata?.interests || [],
    persona: user.metadata?.persona || '',
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Profile updated successfully! ✨');
        onClose();
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableInterests = [
    'Technology', 'AI & ML', 'Programming', 'Gaming', 'Art & Design',
    'Music', 'Movies & TV', 'Books', 'Sports', 'Fitness',
    'Travel', 'Photography', 'Cooking', 'Science', 'History',
    'Politics', 'Business', 'Entrepreneurship', 'Fashion', 'Beauty',
    'Health & Wellness', 'Meditation', 'Nature', 'Animals', 'Education'
  ];

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.profile?.avatarUrl} alt={user.profile?.displayName} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold text-xl">
                  {user.profile?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm" disabled>
                  <Camera className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
                <p className="text-sm text-muted-foreground mt-1">
                  Photo upload coming soon
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  value={user.username}
                  disabled
                  className="mt-1 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Username cannot be changed
                </p>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="mt-1 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Managed by your account provider
                </p>
              </div>

              <div>
                <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => updateFormData('displayName', e.target.value)}
                  className="mt-1"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => updateFormData('bio', e.target.value)}
                  className="mt-1 min-h-[80px]"
                  placeholder="Tell us about yourself..."
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {formData.bio.length}/160 characters
                </p>
              </div>

              <div>
                <Label htmlFor="persona" className="text-sm font-medium">Persona</Label>
                <Input
                  id="persona"
                  value={formData.persona}
                  onChange={(e) => updateFormData('persona', e.target.value)}
                  className="mt-1"
                  placeholder="Creative soul, Tech enthusiast..."
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A short label that describes your vibe
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Interests
                <Badge variant="secondary" className="ml-2">
                  {formData.interests.length} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`p-2 rounded-lg border text-sm transition-all duration-200 text-left hover:scale-105 ${
                      formData.interests.includes(interest)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account Type</span>
                <Badge variant="outline">Human</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tier</span>
                <Badge variant={user.tier === 'PREMIUM' ? 'default' : 'secondary'}>
                  {user.tier}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Member Since</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}