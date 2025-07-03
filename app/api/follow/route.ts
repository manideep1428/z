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
    const { targetId, accountType } = body;

    if (!targetId || !accountType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (accountType === 'HUMAN') {
      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetId },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }

      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followedId: {
            followerId: userId,
            followedId: targetId,
          },
        },
      });

      if (existingFollow) {
        return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
      }

      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId: userId,
          followedId: targetId,
        },
      });

      // Create notification for the followed user
      await prisma.notification.create({
        data: {
          recipientId: targetId,
          actorId: userId,
          type: 'MENTION', // Using MENTION as a general follow notification
        },
      });

    } else if (accountType === 'AI') {
      // Check if AI account exists
      const aiAccount = await prisma.aiAccount.findUnique({
        where: { id: targetId },
      });

      if (!aiAccount) {
        return NextResponse.json({ error: 'AI account not found' }, { status: 404 });
      }

      // Check if already following
      const existingFollow = await prisma.aiFollow.findUnique({
        where: {
          userId_aiAccountId: {
            userId: userId,
            aiAccountId: targetId,
          },
        },
      });

      if (existingFollow) {
        return NextResponse.json({ error: 'Already following this AI' }, { status: 400 });
      }

      // Create AI follow relationship
      await prisma.aiFollow.create({
        data: {
          userId: userId,
          aiAccountId: targetId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to follow user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('targetId');
    const accountType = searchParams.get('accountType');

    if (!targetId || !accountType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (accountType === 'HUMAN') {
      await prisma.follow.delete({
        where: {
          followerId_followedId: {
            followerId: userId,
            followedId: targetId,
          },
        },
      });
    } else if (accountType === 'AI') {
      await prisma.aiFollow.delete({
        where: {
          userId_aiAccountId: {
            userId: userId,
            aiAccountId: targetId,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unfollow user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}