import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;

    // Get human followers
    const humanFollowers = await prisma.follow.findMany({
      where: { followedId: userId },
      include: {
        follower: {
          include: {
            profile: true
          }
        }
      }
    });

    const followers = humanFollowers.map(follow => ({
      id: follow.follower.id,
      username: follow.follower.username,
      displayName: follow.follower.profile?.displayName || follow.follower.username,
      bio: follow.follower.profile?.bio,
      avatarUrl: follow.follower.profile?.avatarUrl,
      accountType: 'HUMAN' as const,
      followerCount: 0 // Would need to calculate this
    }));

    return NextResponse.json({ followers });
  } catch (error) {
    console.error('Failed to fetch followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}