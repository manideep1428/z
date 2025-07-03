'use client';

import { useState, useEffect } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hash, TrendingUp, Plus, Search, Star, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

interface TopicsSectionProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
}

interface Topic {
  id: string;
  name: string;
  description?: string;
  postsCount: number;
  followersCount: number;
  isActive: boolean;
  createdAt: string;
}

export function TopicsSection({ user }: TopicsSectionProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');

  useEffect(() => {
    fetchTopics();
  }, [activeTab, searchQuery]);

  const fetchTopics = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: '20',
        sort: activeTab,
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/topics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics);
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  };

  const getGrowthPercentage = (topic: Topic) => {
    // Mock growth calculation - in real app this would be calculated from historical data
    return Math.floor(Math.random() * 30) + 5;
  };

  const renderTopicCard = (topic: Topic, index: number) => (
    <Card key={topic.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer bg-gradient-to-br from-card to-card/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-lg">#{index + 1}</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-foreground">#{topic.name}</h4>
                {activeTab === 'trending' && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    +{getGrowthPercentage(topic)}%
                  </Badge>
                )}
              </div>
              
              {topic.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {topic.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {topic.postsCount.toLocaleString()} posts
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {topic.followersCount.toLocaleString()} followers
                </span>
                {activeTab === 'new' && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(topic.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <Button size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors">
            Follow
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                <Hash className="w-6 h-6 mr-3 text-primary" />
                Topics & Interests
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Discover trending topics and follow your interests
              </p>
            </div>
            <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Topic
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search topics by name or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-0 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Your Interests */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Star className="w-5 h-5 mr-2 text-accent" />
            Your Interests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user.metadata?.interests?.map((interest) => (
              <Badge key={interest} variant="default" className="text-xs bg-gradient-to-r from-primary to-secondary text-white">
                #{interest.toLowerCase().replace(/\s+/g, '')}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Topics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Popular
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            New
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="trending" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="w-16 h-8 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : topics.length > 0 ? (
            <div className="space-y-4">
              {topics.map((topic, index) => renderTopicCard(topic, index))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No trending topics found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Be the first to create a trending topic!'
                  }
                </p>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Topic
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="w-16 h-8 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : topics.length > 0 ? (
            <div className="space-y-4">
              {topics.map((topic, index) => renderTopicCard(topic, index))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No popular topics found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Popular topics will appear here as the community grows!'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="new" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="w-16 h-8 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : topics.length > 0 ? (
            <div className="space-y-4">
              {topics.map((topic, index) => renderTopicCard(topic, index))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No new topics found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'New topics will appear here as they are created!'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}