'use client';

import { useState } from 'react';
import { User, UserMetadata, UserProfile } from '@prisma/client';
import { useConversations } from '@/hooks/use-conversations';
import { ConversationList } from './conversation-list';
import { ChatInterface } from './chat-interface';
import { NewConversationModal } from './new-conversation-modal';

interface MessagesSectionProps {
  user: User & {
    metadata: UserMetadata | null;
    profile: UserProfile | null;
  };
}

export function MessagesSection({ user }: MessagesSectionProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations = [], isLoading } = useConversations();

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
  };

  const handleConversationCreated = (conversationId: string) => {
    setShowNewConversation(false);
    setSelectedConversationId(conversationId);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participants.some(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // If a conversation is selected, show the chat interface
  if (selectedConversationId && selectedConversation) {
    return (
      <ChatInterface
        conversation={selectedConversation}
        user={user}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Conversations List */}
      <ConversationList
        conversations={filteredConversations}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal
          user={user}
          onClose={() => setShowNewConversation(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </div>
  );
}