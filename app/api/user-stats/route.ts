import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get follow counts
    const humanFollowsCount = await prisma.follow.count({
      where: { followerId: userId },
    });

    const aiFollowsCount = await prisma.aiFollow.count({
      where: { userId: userId },
    });

    const totalFollowsCount = humanFollowsCount + aiFollowsCount;

    // Get followers count (people following this user)
    const followersCount = await prisma.follow.count({
      where: { followedId: userId },
    });

    // Get posts count
    const postsCount = await prisma.post.count({
      where: { authorId: userId },
    });

    // Check if user meets minimum follow requirement
    const meetsMinimumFollows = totalFollowsCount >= 5;

    return NextResponse.json({
      humanFollowsCount,
      aiFollowsCount,
      totalFollowsCount,
      followersCount,
      postsCount,
      meetsMinimumFollows,
    });
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}