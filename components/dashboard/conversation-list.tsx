'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Bot, CheckCheck, Plus, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';

interface Conversation {
  id: string;
  name: string;
  isGroup: boolean;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId?: string;
    aiId?: string;
  };
  participants: Array<{
    id: string;
    name: string;
    username: string;
    avatar?: string;
    isAI: boolean;
    isOnline?: boolean;
  }>;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  conversations,
  isLoading,
  searchQuery,
  onSearchChange,
  onConversationSelect,
  onNewConversation,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-primary" />
                Messages
              </CardTitle>
              <Button size="sm" className="rounded-full">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Loading Skeleton */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse p-4">
                  <div className="flex space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-muted rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* WhatsApp-style Header */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-primary" />
              Messages
              {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                <Badge variant="destructive" className="ml-2 rounded-full">
                  {conversations.filter(c => c.unreadCount > 0).length}
                </Badge>
              )}
            </CardTitle>
            <Button 
              onClick={onNewConversation}
              size="sm" 
              className="rounded-full bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 rounded-full border-2 focus:border-primary/50"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Conversations List */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {conversations.length > 0 ? (
            <div className="divide-y divide-border/50">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center space-x-3 p-4 hover:bg-muted/30 transition-all duration-200 cursor-pointer group active:bg-muted/50"
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  {/* Avatar */}
                  {conversation.isGroup ? (
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="relative">
                      <Avatar className="w-12 h-12 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                        <AvatarImage src={conversation.participants[0]?.avatar} alt={conversation.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                          {conversation.participants[0]?.isAI ? (
                            <Bot className="w-6 h-6" />
                          ) : (
                            conversation.name.split(' ').map(n => n[0]).join('')
                          )}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Status Indicators */}
                      {conversation.participants[0]?.isAI && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-4 h-4 shadow-lg ring-2 ring-background"></div>
                      )}
                      
                      {conversation.participants[0]?.isOnline && !conversation.participants[0]?.isAI && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-semibold truncate ${
                          conversation.unreadCount > 0 ? 'text-foreground' : 'text-foreground/90'
                        }`}>
                          {conversation.name}
                        </h4>
                        {conversation.participants[0]?.isAI && !conversation.isGroup && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border border-green-200 px-1.5 py-0">
                            AI
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: false })}
                          </span>
                        )}
                        <CheckCheck className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${
                        conversation.unreadCount > 0 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground'
                      }`}>
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground min-w-[20px] h-5 text-xs flex items-center justify-center rounded-full ml-2">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery ? 'Try a different search term' : 'Start your first conversation!'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={onNewConversation}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Chatting
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}