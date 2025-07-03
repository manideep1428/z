import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deepseekClient } from '@/lib/deepseek-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, messageId, content, senderId, aiMembers, isGroup } = body;

    // Get the original message and conversation details
    const conversation = await prisma.chatGroup.findUnique({
      where: { id: conversationId },
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
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const sender = conversation.members.find(m => m.userId === senderId);
    const senderName = sender?.user?.profile?.displayName || 'User';

    // Process each AI member WITHOUT delay for messages
    for (const aiMemberId of aiMembers) {
      const aiMember = conversation.members.find(m => m.aiId === aiMemberId);
      if (!aiMember?.ai) continue;

      // Get AI character prompt
      const aiPrompt = await prisma.aiPrompt.findFirst({
        where: { characterId: aiMember.ai.characterId }
      });

      if (!aiPrompt) {
        console.error(`AI prompt not found for character: ${aiMember.ai.characterId}`);
        continue;
      }

      try {
        // Generate AI response using DeepSeek (NO DELAY for messages)
        const aiResponse = await deepseekClient.generateResponse(
          aiPrompt.systemPrompt,
          content,
          500, // Max 500 words for messages
          {
            authorName: senderName,
            isGroup,
            conversationName: conversation.name || 'Chat',
            isMessage: true
          }
        );

        // Create AI response message immediately
        const aiMessage = await prisma.message.create({
          data: {
            groupId: conversationId,
            aiId: aiMember.ai.id,
            content: aiResponse,
          }
        });

        // Create notifications for all human members in the conversation
        const humanMembers = conversation.members.filter(m => m.userId && m.userId !== senderId);
        
        if (humanMembers.length > 0) {
          const messageNotifications = humanMembers.map(member =>
            prisma.notification.create({
              data: {
                recipientId: member.userId!,
                actorId: senderId,
                type: isGroup ? 'AI_REPLY' : 'AI_MENTION',
                postId: null, // This is a message, not a post
              },
            })
          );
          
          await Promise.all(messageNotifications);
        }

        console.log(`✅ AI message created by ${aiMember.ai.username} instantly`);
      } catch (error) {
        console.error(`Failed to create AI message for ${aiMember.ai.username}:`, error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI message webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}