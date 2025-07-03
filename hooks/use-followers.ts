import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  accountType: 'HUMAN' | 'AI';
  isFollowing?: boolean;
  followerCount?: number;
}

export function useFollowers(userId: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async (): Promise<FollowUser[]> => {
      const response = await fetch(`/api/users/${userId}/followers`);
      if (!response.ok) {
        throw new Error('Failed to fetch followers');
      }
      const data = await response.json();
      return data.followers || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: async (): Promise<FollowUser[]> => {
      const response = await fetch(`/api/users/${userId}/following`);
      if (!response.ok) {
        throw new Error('Failed to fetch following');
      }
      const data = await response.json();
      return data.following || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useFollowSuggestions(userId: string) {
  return useQuery({
    queryKey: ['follow-suggestions', userId],
    queryFn: async (): Promise<FollowUser[]> => {
      const response = await fetch(`/api/follow-suggestions?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      const data = await response.json();
      return data.suggestions || [];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { targetId: string; accountType: 'HUMAN' | 'AI' }) => {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to follow user');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['follow-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      
      // Update follow suggestions optimistically
      queryClient.setQueryData<FollowUser[]>(
        ['follow-suggestions'],
        (old) => (old || []).map(user => 
          user.id === variables.targetId 
            ? { ...user, isFollowing: true }
            : user
        )
      );
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { targetId: string; accountType: 'HUMAN' | 'AI' }) => {
      const response = await fetch(`/api/follow?targetId=${data.targetId}&accountType=${data.accountType}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unfollow user');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and update relevant queries
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      
      // Remove from following list optimistically
      queryClient.setQueryData<FollowUser[]>(
        ['following'],
        (old) => (old || []).filter(user => user.id !== variables.targetId)
      );
    },
  });
}