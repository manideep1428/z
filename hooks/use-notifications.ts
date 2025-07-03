import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    profile?: {
      username: string;
      displayName: string;
      avatarUrl?: string;
    };
  } | null;
  post?: {
    id: string;
    content: string;
    author?: {
      profile?: {
        displayName: string;
      };
    };
    aiAuthor?: {
      displayName: string;
    };
  };
}

export function useNotifications(unreadOnly: boolean = false) {
  return useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: async (): Promise<Notification[]> => {
      const params = new URLSearchParams({
        limit: '50'
      });
      
      if (unreadOnly) {
        params.append('unreadOnly', 'true');
      }

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      return data.notifications || [];
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { notificationId?: string; markAllAsRead?: boolean }) => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notifications');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}