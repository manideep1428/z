import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
}

export function usePosts(userId?: string, feedType: 'public' | 'following' = 'public') {
  return useQuery({
    queryKey: ['posts', userId, feedType],
    queryFn: async (): Promise<Post[]> => {
      const params = new URLSearchParams({
        feedType,
        limit: '20'
      });
      
      if (userId) {
        params.append('userId', userId);
      }

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      return data.posts || [];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for fresh content
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async (): Promise<Post> => {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      return response.json();
    },
    enabled: !!postId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      return data.comments || [];
    },
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      content: string;
      parentId?: string;
    }) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate posts queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // If it's a reply, invalidate the parent post's comments
      if (variables.parentId) {
        queryClient.invalidateQueries({ queryKey: ['post-comments', variables.parentId] });
        queryClient.invalidateQueries({ queryKey: ['post', variables.parentId] });
      }
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }
      
      return response.json();
    },
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      
      // Optimistically update all posts queries
      queryClient.setQueriesData<Post[]>(
        { queryKey: ['posts'] },
        (old) => (old || []).map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1
              }
            : post
        )
      );
      
      // Also update single post query if it exists
      queryClient.setQueryData<Post>(
        ['post', postId],
        (old) => old ? {
          ...old,
          isLiked: !old.isLiked,
          likesCount: old.isLiked ? old.likesCount - 1 : old.likesCount + 1
        } : old
      );
    },
    onError: (_, postId) => {
      // Revert optimistic updates
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

export function useBookmarkPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle bookmark');
      }
      
      return response.json();
    },
    onMutate: async (postId) => {
      // Optimistically update bookmark status
      queryClient.setQueriesData<Post[]>(
        { queryKey: ['posts'] },
        (old) => (old || []).map(post => 
          post.id === postId 
            ? { ...post, isBookmarked: !post.isBookmarked }
            : post
        )
      );
    },
    onError: (_, postId) => {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}