import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's interests
    const userMetadata = await prisma.userMetadata.findUnique({
      where: { userId },
    });

    if (!userMetadata) {
      return NextResponse.json({ error: 'User metadata not found' }, { status: 404 });
    }

    // Get existing follows
    const existingHumanFollows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followedId: true },
    });

    const existingAiFollows = await prisma.aiFollow.findMany({
      where: { userId: userId },
      select: { aiAccountId: true },
    });

    const followedHumanIds = existingHumanFollows.map(f => f.followedId);
    const followedAiIds = existingAiFollows.map(f => f.aiAccountId);

    // Get suggested human users based on interests
    const humanSuggestions = await prisma.userProfile.findMany({
      where: {
        userId: {
          notIn: [userId, ...followedHumanIds],
        },
        accountType: 'HUMAN',
        tags: {
          hasSome: userMetadata.interests,
        },
      },
      take: 15,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Also get some random users if we don't have enough interest-based suggestions
    const additionalUsers = await prisma.userProfile.findMany({
      where: {
        userId: {
          notIn: [userId, ...followedHumanIds, ...humanSuggestions.map(u => u.userId)],
        },
        accountType: 'HUMAN',
      },
      take: Math.max(0, 10 - humanSuggestions.length),
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const allHumanUsers = [...humanSuggestions, ...additionalUsers];

    // Get AI characters based on user interests
    const aiSuggestions = await prisma.aiAccount.findMany({
      where: {
        id: {
          notIn: followedAiIds,
        },
        OR: [
          {
            tags: {
              hasSome: userMetadata.interests
            }
          },
          {
            category: {
              in: userMetadata.interests.map(interest => interest.toLowerCase())
            }
          },
          {
            sourceMedia: {
              in: userMetadata.interests
            }
          },
          // Include some popular characters regardless of interests
          {
            username: {
              in: ['pikachu', 'iron_man', 'doraemon', 'ben_tennyson', 'python_dev']
            }
          }
        ]
      },
      take: 15
    });

    // Determine which users are "new" (created within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Combine and format suggestions
    const allSuggestions = [
      // Human users
      ...allHumanUsers.map(user => ({
        id: user.userId,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        accountType: 'HUMAN' as const,
        tags: user.tags,
        isFollowing: false,
        followerCount: Math.floor(Math.random() * 5000) + 100,
        mutualConnections: Math.floor(Math.random() * 10),
        isNew: user.createdAt > sevenDaysAgo,
      })),
      // AI characters
      ...aiSuggestions.map(ai => ({
        id: ai.id,
        username: ai.username,
        displayName: ai.displayName,
        bio: ai.bio,
        avatarUrl: ai.avatarUrl,
        accountType: 'AI' as const,
        tags: ai.tags,
        isFollowing: false,
        followerCount: Math.floor(Math.random() * 50000) + 1000,
        sourceMedia: ai.sourceMedia,
        characterType: ai.characterType,
        isNew: ai.createdAt > sevenDaysAgo,
      })),
    ];

    // Shuffle and limit results, but prioritize interest matches
    const interestMatches = allSuggestions.filter(suggestion => 
      suggestion.tags.some(tag => 
        userMetadata.interests.some(interest => 
          interest.toLowerCase().includes(tag.toLowerCase()) || 
          tag.toLowerCase().includes(interest.toLowerCase())
        )
      )
    );

    const otherSuggestions = allSuggestions.filter(suggestion => 
      !interestMatches.includes(suggestion)
    );

    // Combine with interest matches first, then new users, then others
    const newUsers = otherSuggestions.filter(s => s.isNew);
    const regularUsers = otherSuggestions.filter(s => !s.isNew);

    const finalSuggestions = [
      ...interestMatches.sort(() => 0.5 - Math.random()),
      ...newUsers.sort(() => 0.5 - Math.random()),
      ...regularUsers.sort(() => 0.5 - Math.random())
    ].slice(0, 24);

    return NextResponse.json({
      suggestions: finalSuggestions,
      followedCount: followedHumanIds.length + followedAiIds.length,
      interestMatches: interestMatches.length,
      totalAiCharacters: aiSuggestions.length,
      newUsers: allSuggestions.filter(s => s.isNew).length,
    });
  } catch (error) {
    console.error('Failed to fetch follow suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}