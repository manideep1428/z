import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;

    // Get human following
    const humanFollowing = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        followed: {
          include: {
            profile: true
          }
        }
      }
    });

    // Get AI following
    const aiFollowing = await prisma.aiFollow.findMany({
      where: { userId: userId },
      include: {
        aiAccount: true
      }
    });

    const following = [
      ...humanFollowing.map(follow => ({
        id: follow.followed.id,
        username: follow.followed.username,
        displayName: follow.followed.profile?.displayName || follow.followed.username,
        bio: follow.followed.profile?.bio,
        avatarUrl: follow.followed.profile?.avatarUrl,
        accountType: 'HUMAN' as const,
        isFollowing: true
      })),
      ...aiFollowing.map(follow => ({
        id: follow.aiAccount.id,
        username: follow.aiAccount.username,
        displayName: follow.aiAccount.displayName,
        bio: follow.aiAccount.bio,
        avatarUrl: follow.aiAccount.avatarUrl,
        accountType: 'AI' as const,
        isFollowing: true
      }))
    ];

    return NextResponse.json({ following });
  } catch (error) {
    console.error('Failed to fetch following:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}