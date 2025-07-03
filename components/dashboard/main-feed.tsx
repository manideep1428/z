'use client';

import { useState } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePost } from './create-post';
import { PostCard } from './post-card';
import { PostComments } from './post-comments';
import { SearchSection } from './search-section';
import { NotificationsSection } from './notifications-section';
import { MessagesSection } from './messages-section';
import { GroupsSection } from './groups-section';
import { TopicsSection } from './topics-section';
import { SettingsSection } from './settings-section';
import { Users, Globe, Sparkles, Flame, Star, Zap } from 'lucide-react';
import { usePosts } from '@/hooks/use-posts';

interface MainFeedProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
  activeTab: string;
}

export function MainFeed({ user, activeTab }: MainFeedProps) {
  const [feedType, setFeedType] = useState<'public' | 'following'>('public');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { data: posts = [], isLoading, refetch } = usePosts(user.id, feedType);

  const handlePostCreated = () => {
    refetch();
  };

  const handlePostDeleted = () => {
    refetch();
  };

  const handleViewComments = (postId: string) => {
    setSelectedPostId(postId);
  };

  const handleBackFromComments = () => {
    setSelectedPostId(null);
    refetch();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        if (selectedPostId) {
          return (
            <PostComments 
              postId={selectedPostId} 
              onBack={handleBackFromComments}
            />
          );
        }

        return (
          <div className="space-y-6">
            <CreatePost user={user} onPostCreated={handlePostCreated} />
            
            {/* Feed Type Selector */}
            <Card className="card-modern">
              <CardContent className="p-4">
                <Tabs value={feedType} onValueChange={(value) => setFeedType(value as 'public' | 'following')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-black/20 rounded-xl p-1">
                    <TabsTrigger 
                      value="public" 
                      className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-400 data-[state=active]:text-black font-medium"
                    >
                      <Globe className="w-4 h-4" />
                      🌍 For You
                    </TabsTrigger>
                    <TabsTrigger 
                      value="following" 
                      className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-pink-400 data-[state=active]:text-black font-medium"
                    >
                      <Users className="w-4 h-4" />
                      👥 Following
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Posts */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="card-modern">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="flex space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full"></div>
                            <div className="flex-1 space-y-3">
                              <div className="h-4 bg-gradient-to-r from-green-400/30 to-blue-400/30 rounded-full w-1/4"></div>
                              <div className="h-4 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full w-3/4"></div>
                              <div className="h-4 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-full w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onPostDeleted={handlePostDeleted}
                    onViewComments={handleViewComments}
                    showTopComments={true}
                  />
                ))
              ) : (
                <Card className="card-modern hover-lift">
                  <CardContent className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 float">
                      {feedType === 'following' ? (
                        <Users className="w-10 h-10 text-white" />
                      ) : (
                        <Globe className="w-10 h-10 text-white" />
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gradient">
                      {feedType === 'following' ? '👥 No posts from your squad' : '🌍 No posts yet'}
                    </h3>
                    <p className="text-muted-foreground mb-6 text-lg">
                      {feedType === 'following' 
                        ? 'Follow some amazing people and AI characters to see their content here! ✨'
                        : 'Be the first to drop some fire content! 🔥'
                      }
                    </p>
                    {feedType === 'following' && (
                      <Button 
                        onClick={() => window.location.href = '/follow-suggestions'}
                        className="btn-neon rounded-xl px-8 py-3 text-lg font-bold"
                      >
                        <Star className="w-5 h-5 mr-2" />
                        Find Your Tribe
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      case 'search':
        return <SearchSection />;
      case 'notifications':
        return <NotificationsSection user={user} />;
      case 'messages':
        return <MessagesSection user={user} />;
      case 'groups':
        return <GroupsSection user={user} />;
      case 'topics':
        return <TopicsSection user={user} />;
      case 'settings':
        return <SettingsSection user={user} />;
      default:
        return (
          <Card className="card-modern hover-lift">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-gradient flex items-center">
                <Sparkles className="mr-3 w-8 h-8 text-yellow-400 animate-spin" />
                Coming Soon! 
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xl">
                This feature is cooking in our lab! 🧪✨ Check back soon for some mind-blowing updates! 🚀
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6 py-6">
      {renderContent()}
    </div>
  );
}