'use client';

import { useState, useEffect, useRef } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft,
  Send,
  Users,
  Smile,
  Paperclip,
  CheckCheck,
  Clock,
  AlertCircle,
  MoreVertical,
  Phone,
  Video,
  AtSign
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMessages, useSendMessage } from '@/hooks/use-conversations';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  name: string;
  isGroup: boolean;
  participants: Array<{
    id: string;
    name: string;
    username: string;
    avatar?: string;
    isAI: boolean;
    isOnline?: boolean;
  }>;
}

interface ChatInterfaceProps {
  conversation: Conversation;
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
  onBack: () => void;
}

interface MentionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  accountType: 'HUMAN' | 'AI';
}

export function ChatInterface({ conversation, user, onBack }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [showMentionButton, setShowMentionButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [], isLoading, error } = useMessages(conversation.id);
  const sendMessageMutation = useSendMessage();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle mention detection
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInputChange = () => {
      const value = textarea.value;
      const cursorPos = textarea.selectionStart;
      
      const textBeforeCursor = value.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        
        if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
          setMentionQuery(textAfterAt);
          setMentionStartPos(lastAtIndex);
          setShowMentions(true);
          setSelectedMentionIndex(0);
          return;
        }
      }
      
      setShowMentions(false);
      setMentionQuery('');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showMentions) {
        const filteredUsers = conversation.participants.filter(participant => 
          participant.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          participant.name.toLowerCase().includes(mentionQuery.toLowerCase())
        );

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedMentionIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedMentionIndex(prev => 
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          if (filteredUsers[selectedMentionIndex]) {
            handleMentionSelect(filteredUsers[selectedMentionIndex]);
          }
        } else if (e.key === 'Escape') {
          setShowMentions(false);
          setMentionQuery('');
        }
      }
    };

    textarea.addEventListener('input', handleInputChange);
    textarea.addEventListener('keydown', handleKeyDown);
    
    return () => {
      textarea.removeEventListener('input', handleInputChange);
      textarea.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMentions, mentionQuery, conversation.participants, selectedMentionIndex]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Clear input immediately for better UX
    setNewMessage('');

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: conversation.id,
        content: messageContent,
        tempId,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error is handled by the mutation's onError
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMentionSelect = (participant: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = textarea.value;
    const beforeMention = value.substring(0, mentionStartPos);
    const afterCursor = value.substring(textarea.selectionStart);
    
    const newValue = beforeMention + `@${participant.username} ` + afterCursor;
    setNewMessage(newValue);
    
    setShowMentions(false);
    setMentionQuery('');
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = mentionStartPos + participant.username.length + 2;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleMentionButtonClick = () => {
    setShowMentionButton(!showMentionButton);
  };

  const handleMentionFromButton = (participant: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const value = textarea.value;
    const beforeCursor = value.substring(0, cursorPos);
    const afterCursor = value.substring(cursorPos);
    
    const newValue = beforeCursor + `@${participant.username} ` + afterCursor;
    setNewMessage(newValue);
    setShowMentionButton(false);
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = cursorPos + participant.username.length + 2;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const getMessageStatus = (message: any) => {
    if (message.status === 'sending') {
      return <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />;
    }
    if (message.status === 'failed') {
      return <AlertCircle className="w-3 h-3 text-destructive" />;
    }
    if (message.senderId === user.id) {
      return <CheckCheck className="w-3 h-3 text-primary" />;
    }
    return null;
  };

  const retryMessage = (message: any) => {
    if (message.status === 'failed') {
      sendMessageMutation.mutate({
        conversationId: conversation.id,
        content: message.content,
        tempId: message.tempId,
      });
    }
  };

  const filteredParticipants = conversation.participants.filter(participant => 
    participant.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    participant.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold text-destructive">Error Loading Conversation</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">Failed to load conversation. Please try again.</p>
            <Button onClick={() => window.location.reload()}>
              Reload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[800px]">
      {/* Header */}
      <Card className="border-0 shadow-lg flex-shrink-0 rounded-b-none">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-white/50">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              {conversation.isGroup ? (
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-white/50">
                    <AvatarImage src={conversation.participants[0]?.avatar} alt={conversation.name} />
                    <AvatarFallback className={`${
                      conversation.participants[0]?.isAI 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gradient-to-br from-primary to-secondary text-white'
                    }`}>
                      {conversation.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.participants[0]?.isAI && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full w-4 h-4 shadow-lg ring-2 ring-white"></div>
                  )}
                  {conversation.participants[0]?.isOnline && !conversation.participants[0]?.isAI && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"></div>
                  )}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{conversation.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {conversation.isGroup 
                    ? `${conversation.participants.length} members`
                    : conversation.participants[0]?.isAI 
                      ? 'AI Character • Always active' 
                      : conversation.participants[0]?.isOnline 
                        ? 'Online'
                        : 'Last seen recently'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="hover:bg-white/50" disabled>
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-white/50" disabled>
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-white/50">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="border-0 shadow-lg flex-1 flex flex-col min-h-0 rounded-none bg-gradient-to-b from-muted/10 to-background">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 relative">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.senderId === user.id;
                    const isFailed = message.status === 'failed';
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex space-x-2 max-w-[75%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!isOwnMessage && (
                            <div className="relative flex-shrink-0">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                                <AvatarFallback className={`text-xs ${
                                  message.sender.isAI 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gradient-to-br from-primary to-secondary text-white'
                                }`}>
                                  {message.sender.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {message.sender.isAI && (
                                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full w-3 h-3 shadow-sm ring-1 ring-white"></div>
                              )}
                            </div>
                          )}
                          
                          <div 
                            className={`group relative ${isFailed ? 'cursor-pointer' : ''}`}
                            onClick={() => isFailed && retryMessage(message)}
                          >
                            <div className={`rounded-2xl px-4 py-2 shadow-sm max-w-full break-words ${
                              isOwnMessage 
                                ? isFailed
                                  ? 'bg-destructive/10 border border-destructive/20'
                                  : 'bg-primary text-primary-foreground' 
                                : 'bg-card border'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                              
                              <div className={`flex items-center justify-end space-x-1 mt-1 ${
                                isOwnMessage 
                                  ? isFailed 
                                    ? 'text-destructive' 
                                    : 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              }`}>
                                <span className="text-xs">
                                  {formatDistanceToNow(new Date(message.timestamp), { addSuffix: false })}
                                </span>
                                {isOwnMessage && getMessageStatus(message)}
                              </div>
                            </div>
                            
                            {isFailed && (
                              <div className="absolute -bottom-6 right-0 text-xs text-destructive">
                                Tap to retry
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Message Input */}
          <div className="border-t bg-background/95 backdrop-blur-sm p-4 flex-shrink-0">
            <div className="flex items-end space-x-2">
              <Button variant="ghost" size="sm" className="mb-1" disabled>
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[40px] max-h-32 resize-none rounded-full border-2 pr-20 py-2 focus:border-primary/50"
                  rows={1}
                />
                
                <div className="absolute right-1 bottom-1 flex items-center space-x-1">
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full"
                      onClick={handleMentionButtonClick}
                    >
                      <AtSign className="w-4 h-4" />
                    </Button>
                    
                    {showMentionButton && (
                      <div className="absolute bottom-full right-0 mb-2 bg-background border border-border rounded-xl shadow-xl z-50 min-w-[250px] max-h-48 overflow-y-auto">
                        {conversation.participants.map((participant) => (
                          <button
                            key={participant.id}
                            onClick={() => handleMentionFromButton(participant)}
                            className="w-full text-left p-3 hover:bg-muted/50 transition-all duration-300 flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="relative">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={participant.avatar} alt={participant.name} />
                                <AvatarFallback className={`text-xs ${
                                  participant.isAI 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gradient-to-br from-primary to-secondary text-white'
                                }`}>
                                  {participant.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {participant.isAI && (
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3 h-3 shadow-lg ring-1 ring-background"></div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-medium text-sm">{participant.name}</div>
                              <div className="text-xs text-muted-foreground">@{participant.username}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full"
                    disabled
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="rounded-full w-10 h-10 p-0 bg-primary hover:bg-primary/90"
              >
                {sendMessageMutation.isPending ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mentions Dropdown (from typing @) */}
      {showMentions && filteredParticipants.length > 0 && (
        <div 
          className="fixed bg-background border border-border rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto min-w-[280px]"
          style={{
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          {filteredParticipants.map((participant, index) => (
            <button
              key={participant.id}
              onClick={() => handleMentionSelect(participant)}
              className={`w-full text-left p-3 transition-all duration-300 flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl ${
                index === selectedMentionIndex ? 'bg-primary/10' : 'hover:bg-muted/50'
              }`}
            >
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={participant.avatar} alt={participant.name} />
                  <AvatarFallback className={`text-xs ${
                    participant.isAI 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gradient-to-br from-primary to-secondary text-white'
                  }`}>
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {participant.isAI && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3 h-3 shadow-lg ring-1 ring-background"></div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-sm">{participant.name}</div>
                <div className="text-xs text-muted-foreground">@{participant.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}