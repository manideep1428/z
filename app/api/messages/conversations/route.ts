import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.chatGroup.findMany({
      where: {
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
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              include: {
                profile: true
              }
            },
            aiSender: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedConversations = conversations.map(conv => {
      const otherMembers = conv.members.filter(m => m.userId !== userId);
      const isGroup = conv.members.length > 2;
      
      let name = conv.name;
      if (!name && !isGroup && otherMembers.length > 0) {
        const otherMember = otherMembers[0];
        name = otherMember.user?.profile?.displayName || otherMember.ai?.displayName || 'Unknown';
      }

      const participants = otherMembers.map(member => ({
        id: member.userId || member.aiId || '',
        name: member.user?.profile?.displayName || member.ai?.displayName || 'Unknown',
        username: member.user?.username || member.ai?.username || 'unknown',
        avatar: member.user?.profile?.avatarUrl || member.ai?.avatarUrl,
        isAI: !!member.ai,
        isOnline: !member.ai // Assume humans are online, AI is always available
      }));

      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        name: name || 'Unnamed Conversation',
        isGroup,
        participants,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          timestamp: lastMessage.createdAt.toISOString(),
          senderId: lastMessage.senderId,
          aiId: lastMessage.aiId
        } : undefined,
        unreadCount: 0 // TODO: Implement unread count
      };
    });

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { participantIds, isAI, isGroup, name } = body;

    if (!participantIds || participantIds.length === 0) {
      return NextResponse.json({ error: 'Participant IDs required' }, { status: 400 });
    }

    // For direct messages, check if conversation already exists
    if (!isGroup && participantIds.length === 1) {
      const participantId = participantIds[0];
      const participantIsAI = isAI[0];

      let existingConversation;
      
      if (participantIsAI) {
        // Check for existing AI conversation
        existingConversation = await prisma.chatGroup.findFirst({
          where: {
            AND: [
              {
                members: {
                  some: { userId: userId }
                }
              },
              {
                members: {
                  some: { aiId: participantId }
                }
              },
              {
                members: {
                  every: {
                    OR: [
                      { userId: userId },
                      { aiId: participantId }
                    ]
                  }
                }
              }
            ]
          }
        });
      } else {
        // Check for existing human conversation
        existingConversation = await prisma.chatGroup.findFirst({
          where: {
            AND: [
              {
                members: {
                  some: { userId: userId }
                }
              },
              {
                members: {
                  some: { userId: participantId }
                }
              },
              {
                members: {
                  every: {
                    userId: { in: [userId, participantId] }
                  }
                }
              }
            ]
          }
        });
      }

      if (existingConversation) {
        return NextResponse.json({ 
          conversation: { id: existingConversation.id },
          existing: true 
        });
      }
    }

    // Create new conversation
    const membersData = [
      { userId: userId },
      ...participantIds.map((id: string, index: number) => 
        isAI[index] ? { aiId: id } : { userId: id }
      )
    ];

    const conversation = await prisma.chatGroup.create({
      data: {
        name: name || null,
        creatorId: userId,
        isPublic: false,
        members: {
          create: membersData
        }
      }
    });

    return NextResponse.json({ 
      conversation: { id: conversation.id },
      existing: false 
    });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}