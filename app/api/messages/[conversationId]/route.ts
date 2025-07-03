import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    // Check if user is member of the conversation
    const conversation = await prisma.chatGroup.findFirst({
      where: {
        id: conversationId,
        members: {
          some: { userId: userId }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { groupId: conversationId },
      include: {
        sender: {
          include: {
            profile: true
          }
        },
        aiSender: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
      senderId: message.senderId,
      aiId: message.aiId,
      sender: {
        name: message.sender?.profile?.displayName || message.aiSender?.displayName || 'Unknown',
        username: message.sender?.username || message.aiSender?.username || 'unknown',
        avatar: message.sender?.profile?.avatarUrl || message.aiSender?.avatarUrl,
        isAI: !!message.aiSender
      }
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}