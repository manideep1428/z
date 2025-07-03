'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PostCard } from './post-card';
import { toast } from 'sonner';
import { ArrowLeft, Send, Bot, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@clerk/nextjs';

interface PostCommentsProps {
  postId: string;
  onBack: () => void;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  likesCount: number;
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
  isLiked?: boolean;
}

interface Post {
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
  likesCount: number;
  repliesCount: number;
  sharesCount: number;
  isAiGenerated: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export function PostComments({ postId, onBack }: PostCommentsProps) {
  const { userId } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPostAndComments();
  }, [postId]);

  const fetchPostAndComments = async () => {
    try {
      setIsLoading(true);
      
      // Fetch the main post
      const postResponse = await fetch(`/api/posts/${postId}`);
      if (postResponse.ok) {
        const postData = await postResponse.json();
        setPost(postData);
      }

      // Fetch comments (replies to this post)
      const commentsResponse = await fetch(`/api/posts/${postId}/comments`);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments);
      }
    } catch (error) {
      console.error('Failed to fetch post and comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: postId,
        }),
      });

      if (response.ok) {
        setNewComment('');
        fetchPostAndComments(); // Refresh comments
        toast.success('Comment posted! ✨');
      } else {
        throw new Error('Failed to post comment');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: commentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId 
              ? { 
                  ...comment, 
                  isLiked: data.liked,
                  likesCount: data.likesCount 
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
      toast.error('Failed to like comment');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-bold">Loading...</h2>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-bold">Post not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold">Post Comments</h2>
      </div>

      {/* Original Post */}
      <PostCard 
        post={post} 
        showTopComments={false}
      />

      {/* Comment Form */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-4">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={280}
            />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {280 - newComment.length} characters remaining
              </span>
              
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
        
        {comments.length > 0 ? (
          comments.map((comment) => {
            const author = comment.author || comment.aiAuthor;
            const isAI = !!comment.aiAuthor;
            
            return (
              <Card key={comment.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={isAI ? comment.aiAuthor?.avatarUrl : comment.author?.profile?.avatarUrl} 
                          alt={author?.displayName} 
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                          {isAI ? (
                            <Bot className="w-5 h-5" />
                          ) : (
                            author?.displayName?.split(' ').map(n => n[0]).join('') || '?'
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {isAI && (
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3 shadow-lg ring-1 ring-background"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">
                          {author?.displayName || author?.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{author?.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                        {isAI && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            AI
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm leading-relaxed">
                        {comment.content}
                      </p>
                      
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-xs transition-colors ${
                            comment.isLiked 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-muted-foreground hover:text-red-500'
                          }`}
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          <Heart className={`w-3 h-3 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                          {comment.likesCount || 0}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-blue-500"
                          disabled
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-8">
              <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground">Be the first to comment!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}