'use client';

import { useState, useRef, useEffect } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Image, Smile, Sparkles, Send, X, Users, Zap, Star, AtSign } from 'lucide-react';

interface CreatePostProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
  onPostCreated?: () => void;
}

interface MentionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  accountType: 'HUMAN' | 'AI';
}

export function CreatePost({ user, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [availableUsers, setAvailableUsers] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [showMentionButton, setShowMentionButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const maxLength = 280;
  const progress = (content.length / maxLength) * 100;

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

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
        const filteredUsers = availableUsers.filter(user => 
          user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          user.displayName.toLowerCase().includes(mentionQuery.toLowerCase())
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
  }, [showMentions, mentionQuery, availableUsers, selectedMentionIndex]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`/api/follow-suggestions?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const users = data.suggestions.map((suggestion: any) => ({
          id: suggestion.id,
          username: suggestion.username,
          displayName: suggestion.displayName,
          avatarUrl: suggestion.avatarUrl,
          accountType: suggestion.accountType
        }));
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Failed to fetch available users:', error);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Write something amazing first!');
      return;
    }

    if (content.length > maxLength) {
      toast.error('Post is too long! Keep it snappy!');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }

      toast.success('Post launched successfully! ✨');
      setContent('');
      onPostCreated?.();
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMentionSelect = (mentionUser: MentionUser) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = textarea.value;
    const beforeMention = value.substring(0, mentionStartPos);
    const afterCursor = value.substring(textarea.selectionStart);
    
    const newValue = beforeMention + `@${mentionUser.username} ` + afterCursor;
    setContent(newValue);
    
    setShowMentions(false);
    setMentionQuery('');
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = mentionStartPos + mentionUser.username.length + 2;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleMentionButtonClick = () => {
    setShowMentionButton(!showMentionButton);
  };

  const handleMentionFromButton = (mentionUser: MentionUser) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const value = textarea.value;
    const beforeCursor = value.substring(0, cursorPos);
    const afterCursor = value.substring(cursorPos);
    
    const newValue = beforeCursor + `@${mentionUser.username} ` + afterCursor;
    setContent(newValue);
    setShowMentionButton(false);
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = cursorPos + mentionUser.username.length + 2;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const filteredUsers = availableUsers.filter(user => 
    user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <>
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <Avatar className="w-14 h-14 ring-2 ring-primary/20">
              <AvatarImage src={user.profile?.avatarUrl} alt={user.profile?.displayName} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
                {user.profile?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-foreground">
                  {user.profile?.displayName || 'User'}
                </span>
                {user.metadata?.persona && (
                  <Badge className="text-xs px-2 py-1 bg-primary/20 text-primary">
                    ✨ {user.metadata.persona}
                  </Badge>
                )}
                <div className="flex items-center text-xs text-muted-foreground">
                  <Star className="w-3 h-3 mr-1 text-yellow-400" />
                  <span>What's on your mind?</span>
                </div>
              </div>
              
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Drop some fire content! Use @ to tag your squad..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] resize-none text-lg placeholder:text-muted-foreground/70 p-4 border-2 focus:border-primary/50 rounded-xl"
                  maxLength={maxLength}
                />
              </div>
              
              {content.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Progress 
                      value={Math.min(progress, 100)} 
                      className="h-2"
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    progress > 90 ? 'text-red-400' : 
                    progress > 75 ? 'text-orange-400' : 
                    'text-green-400'
                  }`}>
                    {maxLength - content.length}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:bg-purple-400/10 hover:text-purple-400 transition-all duration-300 rounded-xl"
                    disabled
                  >
                    <Image className="w-5 h-5 mr-2" />
                    <span className="text-sm">📸 Soon</span>
                  </Button>
                  
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:bg-blue-400/10 hover:text-blue-400 transition-all duration-300 rounded-xl"
                      onClick={handleMentionButtonClick}
                    >
                      <AtSign className="w-5 h-5 mr-2" />
                      <span className="text-sm">@ Mention</span>
                    </Button>
                    
                    {showMentionButton && (
                      <div className="absolute top-full left-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-50 min-w-[300px] max-h-60 overflow-y-auto">
                        {availableUsers.slice(0, 8).map((mentionUser) => (
                          <button
                            key={mentionUser.id}
                            onClick={() => handleMentionFromButton(mentionUser)}
                            className="w-full text-left p-3 hover:bg-muted/50 transition-all duration-300 flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={mentionUser.avatarUrl} alt={mentionUser.displayName} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                                  {mentionUser.displayName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {mentionUser.accountType === 'AI' && (
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3 h-3 shadow-lg ring-1 ring-background"></div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-medium text-sm flex items-center gap-2">
                                {mentionUser.displayName}
                                {mentionUser.accountType === 'AI' && (
                                  <Badge className="text-xs px-1 py-0 bg-green-100 text-green-700 border border-green-200">
                                    AI
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">@{mentionUser.username}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:bg-yellow-400/10 hover:text-yellow-400 transition-all duration-300 rounded-xl"
                    disabled
                  >
                    <Smile className="w-5 h-5 mr-2" />
                    <span className="text-sm">😊 Soon</span>
                  </Button>
                </div>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={!content.trim() || isLoading || content.length > maxLength}
                  className="px-8 py-3 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      🚀 Launch
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mentions Dropdown (from typing @) */}
      {showMentions && filteredUsers.length > 0 && (
        <div 
          className="fixed bg-background border border-border rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto min-w-[320px]"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {filteredUsers.slice(0, 5).map((mentionUser, index) => (
            <button
              key={mentionUser.id}
              onClick={() => handleMentionSelect(mentionUser)}
              className={`w-full text-left p-4 transition-all duration-300 flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl ${
                index === selectedMentionIndex ? 'bg-primary/10' : 'hover:bg-muted/50'
              }`}
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={mentionUser.avatarUrl} alt={mentionUser.displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                    {mentionUser.displayName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {mentionUser.accountType === 'AI' && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-4 h-4 shadow-lg ring-2 ring-background flex items-center justify-center">
                    <Zap className="w-2 h-2 text-black" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-sm flex items-center gap-2">
                  {mentionUser.displayName}
                  {mentionUser.accountType === 'AI' && (
                    <Badge className="text-xs px-1 py-0 bg-green-100 text-green-700 border border-green-200">
                      AI
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">@{mentionUser.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}