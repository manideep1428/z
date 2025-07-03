'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Flame, Link, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    createdAt: string;
    author?: {
      id: string;
      profile?: {
        username: string;
        displayName: string;
        avatarUrl?: string;
      };
    };
    aiAuthor?: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string;
    };
    replies?: any[];
    _count?: {
      replies: number;
      likes: number;
    };
    likesCount: number;
    repliesCount: number;
    sharesCount: number;
    isAiGenerated: boolean;
    isLiked?: boolean;
    isBookmarked?: boolean;
  };
  onPostDeleted?: () => void;
  onViewComments?: (postId: string) => void;
  showTopComments?: boolean;
}

export function PostCard({ post, onPostDeleted, onViewComments, showTopComments = true }: PostCardProps) {
  const { userId } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLoading, setIsLoading] = useState(false);

  const author = post.author || post.aiAuthor;
  const isAI = !!post.aiAuthor;
  const isOwnPost = post.author?.id === userId;

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Optimistic update with animation
    const newLikedState = !isLiked;
    const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;
    
    setIsLiked(newLikedState);
    setLikesCount(newLikesCount);
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      setIsLiked(data.liked);
      setLikesCount(data.likesCount || (data.liked ? likesCount + 1 : likesCount - 1));
      
    } catch (error) {
      setIsLiked(!newLikedState);
      setLikesCount(likesCount);
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.bookmarked);
        toast.success(data.bookmarked ? '✨ Post saved to your collection!' : '📤 Removed from collection');
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      toast.error('Failed to update bookmark. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `🔥 Post by ${author?.displayName || author?.username}`,
          text: post.content,
          url: postUrl,
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast.success('🔗 Link copied! Share the vibes!');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share post');
    }
  };

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success('🔗 Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleDelete = async () => {
    if (!isOwnPost) return;
    
    if (!confirm('Are you sure you want to delete this post? 🗑️')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('🗑️ Post deleted successfully');
        onPostDeleted?.();
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (content: string) => {
    return content.replace(/@(\w+)/g, '<span class="text-gradient font-bold cursor-pointer hover:underline">@$1</span>');
  };

  return (
    <Card className="post-modern hover-lift group">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="relative">
            <Avatar className={`w-14 h-14 ring-2 transition-all duration-300 group-hover:scale-110 ${
              isAI ? 'ring-green-400/50 hover:ring-green-400' : 'ring-purple-400/30 hover:ring-purple-400/60'
            }`}>
              <AvatarImage 
                src={isAI ? post.aiAuthor?.avatarUrl : post.author?.profile?.avatarUrl} 
                alt={author?.displayName} 
              />
              <AvatarFallback className={`font-bold text-lg ${
                isAI ? 'bg-green-500 text-white' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
              }`}>
                {author?.displayName?.split(' ').map(n => n[0]).join('') || '?'}
              </AvatarFallback>
            </Avatar>
            {isAI && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-5 h-5 shadow-lg ring-2 ring-background"></div>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-foreground hover:text-gradient transition-all cursor-pointer flex items-center gap-2">
                  {author?.displayName || author?.username}
                  {isAI && (
                    <Badge className="text-xs px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30">
                      AI
                    </Badge>
                  )}
                </span>
                <span className="text-muted-foreground text-sm">
                  @{author?.username}
                </span>
                <span className="text-muted-foreground text-sm">•</span>
                <span className="text-muted-foreground text-sm hover:text-green-400 transition-colors cursor-pointer">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/10 rounded-full">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dropdown-modern">
                  <DropdownMenuItem onClick={handleCopyLink} className="hover:bg-white/10">
                    <Link className="w-4 h-4 mr-2" />
                    🔗 Copy link
                  </DropdownMenuItem>
                  {isOwnPost && (
                    <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4 mr-2" />
                      🗑️ Delete post
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div 
              className="text-foreground leading-relaxed text-[16px] cursor-pointer"
              onClick={() => onViewComments?.(post.id)}
              dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
            />
            
            {/* Top Comments Preview */}
            {showTopComments && post.replies && post.replies.length > 0 && (
              <div className="mt-4 space-y-3 border-l-2 border-gradient-to-b from-green-400 to-blue-400 pl-4 bg-white/5 rounded-r-lg p-3">
                {post.replies.slice(0, 2).map((reply: any) => (
                  <div key={reply.id} className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage 
                          src={reply.aiAuthor?.avatarUrl || reply.author?.profile?.avatarUrl} 
                          alt={reply.aiAuthor?.displayName || reply.author?.profile?.displayName} 
                        />
                        <AvatarFallback className={`text-xs ${
                          reply.aiAuthor ? 'bg-green-500 text-white' : 'bg-gradient-to-br from-purple-400 to-pink-400 text-white'
                        }`}>
                          {(reply.aiAuthor?.displayName || reply.author?.profile?.displayName || '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                      {reply.aiAuthor && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3 h-3 shadow-sm ring-1 ring-background"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 text-xs">
                        <span className="font-medium text-gradient">
                          {reply.aiAuthor?.displayName || reply.author?.profile?.displayName}
                        </span>
                        {reply.aiAuthor && (
                          <Badge className="text-xs px-1 py-0 bg-green-500/20 text-green-400 border border-green-500/30">
                            AI
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                ))}
                {post.repliesCount > 2 && (
                  <button
                    onClick={() => onViewComments?.(post.id)}
                    className="text-sm text-gradient hover:underline font-medium"
                  >
                    💬 View {post.repliesCount - 2} more replies
                  </button>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-300 group/btn rounded-xl"
                  onClick={() => onViewComments?.(post.id)}
                >
                  <MessageCircle className="w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform" />
                  <span className="font-medium">{post._count?.replies || post.repliesCount || 0}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`transition-all duration-300 group/btn rounded-xl ${
                    isLiked 
                      ? 'text-red-400 hover:text-red-500 bg-red-400/10' 
                      : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'
                  }`}
                  onClick={handleLike}
                  disabled={isLoading}
                >
                  <Heart className={`w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform ${isLiked ? 'fill-current animate-pulse' : ''}`} />
                  <span className="font-medium">{likesCount}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-green-400 hover:bg-green-400/10 transition-all duration-300 group/btn rounded-xl"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform" />
                  <span className="font-medium">{post.sharesCount || 0}</span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`transition-all duration-300 rounded-xl ${
                    isBookmarked 
                      ? 'text-yellow-400 hover:text-yellow-500 bg-yellow-400/10' 
                      : 'text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10'
                  }`}
                  onClick={handleBookmark}
                  disabled={isLoading}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
                
                {likesCount > 100 && (
                  <div className="flex items-center text-xs text-gradient font-medium">
                    <Flame className="w-4 h-4 mr-1 text-orange-400" />
                    <span>🔥 Trending</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}