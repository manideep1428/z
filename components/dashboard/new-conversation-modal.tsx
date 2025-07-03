'use client';

import { useState } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Search, 
  Bot, 
  Users, 
  CheckCircle, 
  X,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useFollowing } from '@/hooks/use-followers';
import { useCreateConversation } from '@/hooks/use-conversations';

interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  accountType: 'HUMAN' | 'AI';
}

interface NewConversationModalProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export function NewConversationModal({ user, onClose, onConversationCreated }: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<FollowUser[]>([]);
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct');

  const { data: following = [], isLoading } = useFollowing(user.id);
  const createConversationMutation = useCreateConversation();

  const filteredFollowing = following.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (selectedUser: FollowUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === selectedUser.id);
      if (isSelected) {
        return prev.filter(u => u.id !== selectedUser.id);
      } else {
        // For direct messages, only allow one user
        if (conversationType === 'direct') {
          return [selectedUser];
        }
        return [...prev, selectedUser];
      }
    });
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      const participantIds = selectedUsers.map(u => u.id);
      const isAI = selectedUsers.map(u => u.accountType === 'AI');
      const isGroup = conversationType === 'group' && selectedUsers.length > 1;
      
      const result = await createConversationMutation.mutateAsync({
        participantIds,
        isAI,
        isGroup,
        name: isGroup ? `Group with ${selectedUsers.map(u => u.displayName).join(', ')}` : undefined
      });

      toast.success('Conversation created!');
      onConversationCreated(result.conversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] bg-background shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-xl">New Conversation</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Conversation Type Tabs */}
          <div className="border-b bg-muted/20">
            <Tabs value={conversationType} onValueChange={(value) => {
              setConversationType(value as 'direct' | 'group');
              setSelectedUsers([]); // Clear selection when switching types
            }}>
              <TabsList className="grid w-full grid-cols-2 h-12 bg-transparent">
                <TabsTrigger value="direct" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Direct Message
                </TabsTrigger>
                <TabsTrigger value="group" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Group Chat
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search */}
          <div className="p-4 border-b bg-background/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search your followers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full border-2 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="p-4 border-b bg-primary/5">
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedUsers.map(selectedUser => (
                  <Badge key={selectedUser.id} variant="secondary" className="flex items-center gap-2 pr-1 py-1">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.displayName} />
                      <AvatarFallback className="text-xs">
                        {selectedUser.accountType === 'AI' ? (
                          <Bot className="w-3 h-3" />
                        ) : (
                          selectedUser.displayName[0]
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{selectedUser.displayName}</span>
                    <button
                      onClick={() => toggleUserSelection(selectedUser)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {conversationType === 'direct' 
                  ? 'Direct message with selected user'
                  : `Group chat with ${selectedUsers.length} member${selectedUsers.length === 1 ? '' : 's'}`
                }
              </p>
            </div>
          )}
          
          {/* User List */}
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading followers...</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredFollowing.map((follower) => {
                  const isSelected = selectedUsers.find(u => u.id === follower.id);
                  const isDisabled = conversationType === 'direct' && selectedUsers.length > 0 && !isSelected;
                  
                  return (
                    <div
                      key={follower.id}
                      className={`flex items-center space-x-3 p-4 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'bg-primary/10 border-l-4 border-l-primary' 
                          : isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-muted/30 active:bg-muted/50'
                      }`}
                      onClick={() => !isDisabled && toggleUserSelection(follower)}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={follower.avatarUrl} alt={follower.displayName} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                            {follower.accountType === 'AI' ? (
                              <Bot className="w-6 h-6" />
                            ) : (
                              follower.displayName.split(' ').map((n: string) => n[0]).join('')
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {follower.accountType === 'AI' && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-4 h-4 shadow-lg ring-2 ring-background"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium truncate">{follower.displayName}</h4>
                          {follower.accountType === 'AI' && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border border-green-200">AI</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{follower.username}</p>
                        {follower.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{follower.bio}</p>
                        )}
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {filteredFollowing.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      {searchQuery ? 'No followers found' : 'No followers yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery 
                        ? 'Try a different search term' 
                        : 'Follow some people to start conversations!'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Create Button */}
          {selectedUsers.length > 0 && (
            <div className="p-4 border-t bg-background/50">
              <Button 
                onClick={handleCreateConversation}
                disabled={createConversationMutation.isPending}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full"
              >
                {createConversationMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    {conversationType === 'direct' ? (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Start Direct Message
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Create Group Chat ({selectedUsers.length} members)
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}