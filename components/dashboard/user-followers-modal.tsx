'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Users, Bot, Search, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface UserFollowersModalProps {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  accountType: 'HUMAN' | 'AI';
  isFollowing?: boolean;
  followerCount?: number;
}

export function UserFollowersModal({ userId, type, onClose }: UserFollowersModalProps) {
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(type);

  useEffect(() => {
    fetchFollowData();
  }, [userId]);

  const fetchFollowData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch followers and following data
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/users/${userId}/followers`),
        fetch(`/api/users/${userId}/following`)
      ]);

      if (followersRes.ok) {
        const followersData = await followersRes.json();
        setFollowers(followersData.followers || []);
      }

      if (followingRes.ok) {
        const followingData = await followingRes.json();
        setFollowing(followingData.following || []);
      }
    } catch (error) {
      console.error('Failed to fetch follow data:', error);
      // For now, use mock data
      setFollowers([]);
      setFollowing([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (targetId: string, accountType: 'HUMAN' | 'AI') => {
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId,
          accountType,
        }),
      });

      if (response.ok) {
        // Update the following list
        setFollowing(prev => 
          prev.map(user => 
            user.id === targetId 
              ? { ...user, isFollowing: true }
              : user
          )
        );
        
        const user = following.find(u => u.id === targetId);
        toast.success(`You're now following ${user?.displayName}! ✨`);
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
      toast.error('Failed to follow user. Please try again.');
    }
  };

  const handleUnfollow = async (targetId: string, accountType: 'HUMAN' | 'AI') => {
    try {
      const response = await fetch(`/api/follow?targetId=${targetId}&accountType=${accountType}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from following list
        setFollowing(prev => prev.filter(user => user.id !== targetId));
        toast.success('Unfollowed successfully');
      }
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      toast.error('Failed to unfollow user. Please try again.');
    }
  };

  const filteredFollowers = followers.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowing = following.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserCard = (user: FollowUser, showFollowButton: boolean = false) => (
    <div key={user.id} className="flex items-center space-x-3 p-4 hover:bg-muted/50 transition-colors rounded-lg">
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          <AvatarFallback>
            {user.accountType === 'AI' ? (
              <Bot className="w-6 h-6" />
            ) : (
              user.displayName.split(' ').map(n => n[0]).join('')
            )}
          </AvatarFallback>
        </Avatar>
        {user.accountType === 'AI' && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-4 h-4 shadow-lg ring-2 ring-background"></div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="font-semibold truncate">{user.displayName}</h4>
          {user.accountType === 'AI' && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border border-green-200">
              AI
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
        {user.bio && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
        )}
        {user.followerCount && (
          <p className="text-xs text-muted-foreground mt-1">
            {user.followerCount.toLocaleString()} followers
          </p>
        )}
      </div>
      
      {showFollowButton && (
        <div className="flex gap-2">
          {user.isFollowing ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUnfollow(user.id, user.accountType)}
            >
              <UserMinus className="w-4 h-4 mr-2" />
              Unfollow
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => handleFollow(user.id, user.accountType)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Follow
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] bg-background">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Connections</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-transparent">
                <TabsTrigger value="followers" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Followers ({filteredFollowers.length})
                </TabsTrigger>
                <TabsTrigger value="following" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Following ({filteredFollowing.length})
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search users..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <TabsContent value="followers" className="m-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading followers...</p>
                  </div>
                ) : filteredFollowers.length > 0 ? (
                  <div className="space-y-1">
                    {filteredFollowers.map(user => renderUserCard(user))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      {searchQuery ? 'No followers found' : 'No followers yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery 
                        ? 'Try a different search term' 
                        : 'When people follow you, they\'ll appear here'
                      }
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="following" className="m-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading following...</p>
                  </div>
                ) : filteredFollowing.length > 0 ? (
                  <div className="space-y-1">
                    {filteredFollowing.map(user => renderUserCard(user, true))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      {searchQuery ? 'No following found' : 'Not following anyone yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery 
                        ? 'Try a different search term' 
                        : 'Start following people and AI characters to see them here'
                      }
                    </p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}