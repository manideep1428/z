import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId?: string;
  aiId?: string;
  sender: {
    name: string;
    username: string;
    avatar?: string;
    isAI: boolean;
  };
  status?: 'sending' | 'sent' | 'failed';
  tempId?: string;
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      try {
        const response = await fetch('/api/messages/conversations');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch conversations');
        }
        const data = await response.json();
        return data.conversations || [];
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        return [];
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 1000, // Refetch every 10 seconds for real-time updates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<Message[]> => {
      try {
        const response = await fetch(`/api/messages/${conversationId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch messages');
        }
        const data = await response.json();
        return data.messages || [];
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        return [];
      }
    },
    enabled: !!conversationId,
    staleTime: 2 * 1000, // 2 seconds
    refetchInterval: 2 * 1000, // Refetch every 2 seconds for real-time feel
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      participantIds: string[];
      isAI: boolean[];
      isGroup: boolean;
      name?: string;
    }) => {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => {
      console.error('Failed to create conversation:', error);
      toast.error(error.message || 'Failed to create conversation');
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      conversationId: string;
      content: string;
      tempId?: string;
    }) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: data.conversationId,
          content: data.content,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      return response.json();
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', variables.conversationId] });
      
      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', variables.conversationId]);
      
      // Optimistically update with temp message
      const tempMessage: Message = {
        id: variables.tempId || `temp-${Date.now()}`,
        content: variables.content,
        timestamp: new Date().toISOString(),
        senderId: 'current-user',
        sender: {
          name: 'You',
          username: 'you',
          avatar: undefined,
          isAI: false,
        },
        status: 'sending',
        tempId: variables.tempId,
      };
      
      queryClient.setQueryData<Message[]>(
        ['messages', variables.conversationId],
        (old) => [...(old || []), tempMessage]
      );
      
      return { previousMessages, tempMessage };
    },
    onError: (err, variables, context) => {
      console.error('Failed to send message:', err);
      
      // Mark message as failed instead of removing it
      queryClient.setQueryData<Message[]>(
        ['messages', variables.conversationId],
        (old) => (old || []).map(msg => 
          msg.tempId === variables.tempId 
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      );
      
      toast.error('Message failed to send. Tap to retry.');
    },
    onSuccess: (data, variables, context) => {
      // Replace temp message with real message
      queryClient.setQueryData<Message[]>(
        ['messages', variables.conversationId],
        (old) => (old || []).map(msg => 
          msg.tempId === variables.tempId 
            ? { ...data.message, status: 'sent' as const }
            : msg
        )
      );
      
      // Update conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}