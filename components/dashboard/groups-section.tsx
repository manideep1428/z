'use client';

import { useState, useEffect } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Settings, Search, Crown, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface GroupsSectionProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  isPublic: boolean;
  memberCount: number;
  isJoined: boolean;
  userRole?: string;
  owner: {
    profile?: {
      displayName: string;
      username: string;
    };
  };
  members: Array<{
    user?: {
      profile?: {
        displayName: string;
        avatarUrl?: string;
      };
    };
    ai?: {
      displayName: string;
      avatarUrl?: string;
    };
  }>;
}

export function GroupsSection({ user }: GroupsSectionProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');

  useEffect(() => {
    fetchGroups();
  }, [activeTab, searchQuery]);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        userId: user.id,
        type: activeTab === 'joined' ? 'joined' : 'all',
        limit: '20',
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/groups?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (activeTab === 'joined') {
          setJoinedGroups(data.groups);
        } else {
          setGroups(data.groups);
        }
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        setGroups(prev => 
          prev.map(group => 
            group.id === groupId 
              ? { ...group, isJoined: true, memberCount: group.memberCount + 1 }
              : group
          )
        );
        toast.success('Successfully joined the group!');
        
        // Refresh joined groups if on that tab
        if (activeTab === 'joined') {
          fetchGroups();
        }
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      toast.error('Failed to join group. Please try again.');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setJoinedGroups(prev => prev.filter(group => group.id !== groupId));
        setGroups(prev => 
          prev.map(group => 
            group.id === groupId 
              ? { ...group, isJoined: false, memberCount: group.memberCount - 1 }
              : group
          )
        );
        toast.success('Left the group successfully');
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
      toast.error('Failed to leave group. Please try again.');
    }
  };

  const renderGroupCard = (group: Group) => (
    <Card key={group.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer bg-gradient-to-br from-card to-card/50">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            {group.avatarUrl ? (
              <Avatar className="w-full h-full">
                <AvatarImage src={group.avatarUrl} alt={group.name} />
                <AvatarFallback>
                  <Users className="w-8 h-8 text-white" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Users className="w-8 h-8 text-white" />
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  {group.name}
                  {!group.isPublic && (
                    <Badge variant="outline" className="text-xs">Private</Badge>
                  )}
                </h4>
                <p className="text-sm text-muted-foreground">
                  by @{group.owner.profile?.username}
                </p>
              </div>
              
              {group.userRole === 'OWNER' && (
                <Crown className="w-5 h-5 text-amber-500" />
              )}
            </div>
            
            {group.description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {group.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground font-medium">
                  {group.memberCount.toLocaleString()} members
                </span>
                
                {/* Show member avatars */}
                <div className="flex -space-x-2">
                  {group.members.slice(0, 3).map((member, index) => (
                    <Avatar key={index} className="w-6 h-6 border-2 border-background">
                      <AvatarImage 
                        src={member.user?.profile?.avatarUrl || member.ai?.avatarUrl} 
                        alt={member.user?.profile?.displayName || member.ai?.displayName} 
                      />
                      <AvatarFallback className="text-xs">
                        {(member.user?.profile?.displayName || member.ai?.displayName || '?')[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {group.memberCount > 3 && (
                    <div className="w-6 h-6 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">+{group.memberCount - 3}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {activeTab === 'joined' ? (
                <div className="flex gap-2">
                  {group.userRole === 'OWNER' && (
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  )}
                  {group.userRole !== 'OWNER' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleLeaveGroup(group.id)}
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Leave
                    </Button>
                  )}
                </div>
              ) : (
                <Button 
                  size="sm" 
                  className={group.isJoined ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"}
                  onClick={() => !group.isJoined && handleJoinGroup(group.id)}
                  disabled={group.isJoined}
                >
                  {group.isJoined ? (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Joined
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Join Group
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
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
                <Users className="w-6 h-6 mr-3 text-primary" />
                Groups
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Connect with communities that share your interests
              </p>
            </div>
            <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
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
              placeholder="Search groups by name or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-0 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discover">Discover Groups</TabsTrigger>
          <TabsTrigger value="joined">
            Your Groups ({joinedGroups.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="discover" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map(renderGroupCard)}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No groups found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Be the first to create a group in this community!'
                  }
                </p>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Group
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="joined" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : joinedGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {joinedGroups.map(renderGroupCard)}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No groups joined yet</h3>
                <p className="text-muted-foreground mb-4">
                  Join groups to connect with like-minded people and AI characters!
                </p>
                <Button 
                  onClick={() => setActiveTab('discover')}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Discover Groups
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}