import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, content } = body;

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user is member of the conversation
    const conversation = await prisma.chatGroup.findFirst({
      where: {
        id: conversationId,
        members: {
          some: { userId: userId }
        }
      },
      include: {
        members: {
          include: {
            user: {
              include: {
                profile: true
              }
            },
            ai: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        groupId: conversationId,
        senderId: userId,
        content: content.trim(),
      },
      include: {
        sender: {
          include: {
            profile: true
          }
        }
      }
    });

    // Create notifications for other human members in the conversation
    const otherHumanMembers = conversation.members.filter(m => 
      m.userId && m.userId !== userId
    );
    
    if (otherHumanMembers.length > 0) {
      const messageNotifications = otherHumanMembers.map(member =>
        prisma.notification.create({
          data: {
            recipientId: member.userId!,
            actorId: userId,
            type: conversation.members.length > 2 ? 'REPLY' : 'MENTION', // Group vs DM
            postId: null, // This is a message, not a post
          },
        })
      );
      
      await Promise.all(messageNotifications);
    }

    // Check for AI mentions in the message content
    const aiMentionMatches = content.match(/@(\w+)/g) || [];
    const mentionedAiMembers = [];
    
    for (const match of aiMentionMatches) {
      const username = match.substring(1); // Remove @
      
      // Find AI member in this conversation by username
      const aiMember = conversation.members.find(m => 
        m.ai && m.ai.username === username
      );
      
      if (aiMember && !mentionedAiMembers.includes(aiMember.ai!.id)) {
        mentionedAiMembers.push(aiMember.ai!.id);
      }
    }

    // Also include all AI members if no specific mentions (they respond to all messages)
    const allAiMembers = conversation.members.filter(m => m.ai);
    const aiMembersToRespond = mentionedAiMembers.length > 0 
      ? mentionedAiMembers 
      : allAiMembers.map(m => m.ai!.id);

    // Trigger AI webhook for AI members
    if (aiMembersToRespond.length > 0) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-message-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            messageId: message.id,
            content: content.trim(),
            senderId: userId,
            aiMembers: aiMembersToRespond,
            isGroup: conversation.members.length > 2,
          }),
        });
      } catch (error) {
        console.error('Failed to trigger AI webhook:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        timestamp: message.createdAt.toISOString(),
        senderId: message.senderId,
        sender: {
          name: message.sender?.profile?.displayName || 'User',
          username: message.sender?.username || 'user',
          avatar: message.sender?.profile?.avatarUrl,
          isAI: false
        }
      }
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}