'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Users, 
  Bot, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  UserPlus,
  Check,
  X
} from 'lucide-react';

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  accountType: 'HUMAN' | 'AI';
  tags: string[];
  isFollowing: boolean;
  followerCount?: number;
  mutualConnections?: number;
  sourceMedia?: string;
  characterType?: string;
  isNew?: boolean;
}

interface FollowSuggestionsProps {
  userId: string;
  userInterests: string[];
}

export function FollowSuggestions({ userId, userInterests }: FollowSuggestionsProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [followedCount, setFollowedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    fetchSuggestions();
    checkUserStats();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/follow-suggestions?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
        setFollowedCount(data.followedCount);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserStats = async () => {
    try {
      const response = await fetch('/api/user-stats');
      if (response.ok) {
        const data = await response.json();
        setFollowedCount(data.totalFollowsCount);
        setCanSkip(data.meetsMinimumFollows);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
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
        setSuggestions(prev => 
          prev.map(user => 
            user.id === targetId 
              ? { ...user, isFollowing: true }
              : user
          )
        );
        setFollowedCount(prev => prev + 1);
        
        const user = suggestions.find(u => u.id === targetId);
        toast.success(`You're now following ${user?.displayName}! ✨`);
        
        // Check if user now meets minimum requirement
        if (followedCount + 1 >= 5) {
          setCanSkip(true);
        }
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
      toast.error('Failed to follow user. Please try again.');
    }
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  const handleSkip = () => {
    if (followedCount < 5) {
      toast.error('Please follow at least 5 accounts to get the best experience, or continue anyway.');
      return;
    }
    router.push('/dashboard');
  };

  const progress = Math.min((followedCount / 5) * 100, 100);

  const humanUsers = suggestions.filter(s => s.accountType === 'HUMAN');
  const aiCharacters = suggestions.filter(s => s.accountType === 'AI');
  const interestMatches = suggestions.filter(s => 
    s.tags.some(tag => 
      userInterests.some(interest => 
        interest.toLowerCase().includes(tag.toLowerCase()) || 
        tag.toLowerCase().includes(interest.toLowerCase())
      )
    )
  );
  const newUsers = suggestions.filter(s => s.isNew);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Finding amazing people and AI characters for you to follow...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Discover Your Community
            </h1>
            <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              Follow interesting people and AI characters based on your interests. Following at least 5 accounts will give you the best experience.
            </p>
            
            {/* Stats */}
            <div className="flex justify-center space-x-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{humanUsers.length}</div>
                <div className="text-sm text-muted-foreground">Humans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{aiCharacters.length}</div>
                <div className="text-sm text-muted-foreground">AI Characters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{interestMatches.length}</div>
                <div className="text-sm text-muted-foreground">Interest Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{newUsers.length}</div>
                <div className="text-sm text-muted-foreground">New Users</div>
              </div>
            </div>
            
            {/* Progress Card */}
            <Card className="max-w-md mx-auto mb-8 border-0 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">Progress</span>
                  <Badge variant={followedCount >= 5 ? "default" : "secondary"}>
                    {followedCount}/5 followed
                  </Badge>
                </div>
                <Progress value={progress} className="h-3 mb-4" />
                
                <div className="flex gap-2">
                  {followedCount >= 5 ? (
                    <Button 
                      onClick={handleContinue} 
                      className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg"
                    >
                      Continue to Dashboard
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleSkip}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Skip for now
                      </Button>
                      <Button 
                        onClick={handleContinue}
                        disabled={followedCount === 0}
                        className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg"
                      >
                        Continue
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                
                {followedCount < 5 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Follow {5 - followedCount} more for the best experience
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Suggestions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((user) => (
              <Card 
                key={user.id} 
                className="hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group"
              >
                <CardHeader className="text-center pb-4">
                  <div className="relative mx-auto mb-4">
                    <Avatar className="w-20 h-20 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                      <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary to-secondary text-white">
                        {user.accountType === 'AI' ? (
                          <Bot className="w-8 h-8" />
                        ) : (
                          user.displayName.split(' ').map(n => n[0]).join('')
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Account Type Badge */}
                    <div className="absolute -bottom-2 -right-2">
                      {user.accountType === 'AI' ? (
                        <div className="bg-secondary rounded-full p-2 shadow-lg">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="bg-primary rounded-full p-2 shadow-lg">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Green Circle for AI Users (instead of verified badge) */}
                    {user.accountType === 'AI' && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-6 h-6 shadow-lg ring-2 ring-background"></div>
                    )}

                    {/* New User Badge */}
                    {user.isNew && (
                      <div className="absolute -top-1 -left-1 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full p-1 shadow-lg ring-2 ring-background">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <CardTitle className="text-xl mb-1 flex items-center justify-center gap-2">
                    {user.displayName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                  
                  <div className="flex justify-center gap-2 mt-2 flex-wrap">
                    {user.isNew && (
                      <Badge className="text-xs bg-gradient-to-r from-orange-400 to-pink-500 text-white">
                        <Sparkles className="w-3 h-3 mr-1" />
                        New
                      </Badge>
                    )}
                    {user.sourceMedia && (
                      <Badge variant="outline" className="text-xs">
                        {user.sourceMedia}
                      </Badge>
                    )}
                    {user.tags.some(tag => 
                      userInterests.some(interest => 
                        interest.toLowerCase().includes(tag.toLowerCase()) || 
                        tag.toLowerCase().includes(interest.toLowerCase())
                      )
                    ) && (
                      <Badge className="text-xs bg-gradient-to-r from-accent to-accent/80">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Match
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {user.bio && (
                    <p className="text-sm text-muted-foreground text-center leading-relaxed line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                  
                  {/* Stats */}
                  {(user.followerCount || user.mutualConnections) && (
                    <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                      {user.followerCount && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {user.followerCount.toLocaleString()}
                        </span>
                      )}
                      {user.mutualConnections && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {user.mutualConnections} mutual
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Interest Tags */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {user.tags.slice(0, 3).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className={`text-xs ${
                          userInterests.some(interest => 
                            interest.toLowerCase().includes(tag.toLowerCase()) || 
                            tag.toLowerCase().includes(interest.toLowerCase())
                          )
                            ? 'border-primary text-primary bg-primary/10' 
                            : ''
                        }`}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {user.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant={user.isFollowing ? "secondary" : "default"}
                    className={`w-full transition-all duration-200 ${
                      user.isFollowing 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50' 
                        : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl'
                    }`}
                    onClick={() => handleFollow(user.id, user.accountType)}
                    disabled={user.isFollowing}
                  >
                    {user.isFollowing ? (
                      <>
                        <CheckCircle className="mr-2 w-4 h-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 w-4 h-4" />
                        Follow
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {suggestions.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No suggestions found</h3>
                <p className="text-muted-foreground mb-4">
                  Load AI characters to see more suggestions!
                </p>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                  <Bot className="w-4 h-4 mr-2" />
                  Load AI Characters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}