'use client';

import { useState } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Bot, Plus, Check, Shield, Flame, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { UserFollowersModal } from './user-followers-modal';
import { useFollowSuggestions, useFollowUser } from '@/hooks/use-followers';
import { useQuery } from '@tanstack/react-query';

interface RightSidebarProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
}

interface UserStats {
  followingCount: number;
  followersCount: number;
  postsCount: number;
}

export function RightSidebar({ user }: RightSidebarProps) {
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');

  const { data: suggestions = [], isLoading: suggestionsLoading } = useFollowSuggestions(user.id);
  
  const { data: userStats = { followingCount: 0, followersCount: 0, postsCount: 0 } } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async (): Promise<UserStats> => {
      const response = await fetch('/api/user-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const { data: trendingTopics = [] } = useQuery({
    queryKey: ['trending-topics'],
    queryFn: async () => {
      const response = await fetch('/api/topics?limit=5&sort=trending');
      if (!response.ok) {
        throw new Error('Failed to fetch trending topics');
      }
      const data = await response.json();
      return data.topics || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const followUserMutation = useFollowUser();

  const handleFollow = async (targetId: string, accountType: 'HUMAN' | 'AI') => {
    try {
      await followUserMutation.mutateAsync({ targetId, accountType });
      
      const user = suggestions.find(u => u.id === targetId);
      toast.success(`🎉 You're now following ${user?.displayName}! ✨`);
    } catch (error) {
      console.error('Failed to follow user:', error);
      toast.error('Failed to follow user. Please try again.');
    }
  };

  const handleStatsClick = (type: 'followers' | 'following') => {
    setFollowersModalType(type);
    setShowFollowersModal(true);
  };

  if (suggestionsLoading) {
    return (
      <div className="sticky top-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="card-modern">
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-5 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full w-3/4"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400/30 to-blue-400/30 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full w-3/4"></div>
                      <div className="h-2 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-full w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-6 space-y-4">
        {/* User Stats */}
        <Card className="card-modern hover-lift">
          <CardHeader>
            <CardTitle className="text-lg text-gradient flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-400" />
              Your Vibe Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <button 
                onClick={() => handleStatsClick('following')}
                className="hover:bg-gradient-to-br hover:from-purple-500/20 hover:to-pink-500/20 rounded-xl p-3 transition-all duration-300 hover:scale-105 group"
              >
                <div className="text-xl font-bold text-gradient">{userStats.followingCount}</div>
                <div className="text-xs text-muted-foreground group-hover:text-purple-400">Following</div>
              </button>
              <button 
                onClick={() => handleStatsClick('followers')}
                className="hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-cyan-500/20 rounded-xl p-3 transition-all duration-300 hover:scale-105 group"
              >
                <div className="text-xl font-bold text-gradient">{userStats.followersCount}</div>
                <div className="text-xs text-muted-foreground group-hover:text-blue-400">Followers</div>
              </button>
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                <div className="text-xl font-bold text-gradient">{userStats.postsCount}</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Interests */}
        <Card className="card-modern hover-lift">
          <CardHeader>
            <CardTitle className="text-lg text-gradient flex items-center">
              <Flame className="w-5 h-5 mr-2 text-orange-400" />
              Your Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.metadata?.interests?.slice(0, 6).map((interest, index) => (
                <Badge 
                  key={interest} 
                  className={`text-xs hover:scale-105 transition-all duration-300 cursor-pointer ${
                    index % 3 === 0 ? 'bg-gradient-to-r from-purple-400/20 to-pink-400/20 text-purple-300 border-purple-400/30' :
                    index % 3 === 1 ? 'bg-gradient-to-r from-blue-400/20 to-cyan-400/20 text-blue-300 border-blue-400/30' :
                    'bg-gradient-to-r from-green-400/20 to-emerald-400/20 text-green-300 border-green-400/30'
                  }`}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trending Topics */}
        {trendingTopics.length > 0 && (
          <Card className="card-modern hover-lift">
            <CardHeader>
              <CardTitle className="text-lg text-gradient flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-red-400" />
                🔥 What's Hot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingTopics.map((topic: any, index: number) => (
                <div key={topic.id} className="flex items-center justify-between hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10 p-3 rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 group">
                  <div>
                    <p className="font-medium text-sm text-gradient">#{topic.name}</p>
                    <p className="text-xs text-muted-foreground group-hover:text-orange-400">
                      🔥 {topic.postsCount.toLocaleString()} posts
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    <Flame className="w-4 h-4 text-orange-400 group-hover:animate-pulse" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Suggested Follows */}
        {suggestions.length > 0 && (
          <Card className="card-modern hover-lift">
            <CardHeader>
              <CardTitle className="text-lg text-gradient flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-400" />
                👥 Squad Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestions.slice(0, 3).map((suggestedUser) => (
                <div key={suggestedUser.id} className="flex items-start space-x-3 group hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10 p-3 rounded-xl transition-all duration-300">
                  <div className="relative">
                    <Avatar className="w-12 h-12 ring-2 ring-purple-400/20 group-hover:ring-purple-400/50 transition-all duration-300 group-hover:scale-110">
                      <AvatarImage src={suggestedUser.avatarUrl} alt={suggestedUser.displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                        {suggestedUser.accountType === 'AI' ? (
                          <Bot className="w-6 h-6" />
                        ) : (
                          suggestedUser.displayName.split(' ').map(n => n[0]).join('')
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {suggestedUser.accountType === 'AI' && (
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full w-4 h-4 shadow-lg ring-2 ring-background flex items-center justify-center">
                        <Zap className="w-2 h-2 text-black" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <p className="font-medium text-sm truncate text-gradient flex items-center gap-1">
                        {suggestedUser.displayName}
                      </p>
                      {suggestedUser.accountType === 'AI' && (
                        <Badge className="badge-ai text-xs px-1 py-0">
                          🤖
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @{suggestedUser.username}
                    </p>
                    {suggestedUser.bio && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {suggestedUser.bio}
                      </p>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant={suggestedUser.isFollowing ? "secondary" : "outline"} 
                      className={`mt-2 w-full transition-all duration-300 rounded-xl ${
                        suggestedUser.isFollowing 
                          ? 'bg-gradient-to-r from-green-400/20 to-blue-400/20 text-green-300 border-green-400/30' 
                          : 'btn-neon text-black font-bold hover:scale-105'
                      }`}
                      onClick={() => handleFollow(suggestedUser.id, suggestedUser.accountType)}
                      disabled={suggestedUser.isFollowing || followUserMutation.isPending}
                    >
                      {suggestedUser.isFollowing ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          ✅ Following
                        </>
                      ) : (
                        '➕ Follow'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full hover:scale-105 transition-all duration-300 border-gradient rounded-xl"
                onClick={() => window.location.href = '/follow-suggestions'}
              >
                <Plus className="w-4 h-4 mr-2" />
                🌟 Discover More
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <UserFollowersModal
          userId={user.id}
          type={followersModalType}
          onClose={() => setShowFollowersModal(false)}
        />
      )}
    </>
  );
}