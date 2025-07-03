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
    const { content, aiMentions = [], mentions = [], parentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 280) {
      return NextResponse.json({ error: 'Content too long (max 280 characters)' }, { status: 400 });
    }

    // Extract AI mentions from content using @ pattern
    const aiMentionMatches = content.match(/@(\w+)/g) || [];
    const extractedAiMentions = [];
    
    for (const match of aiMentionMatches) {
      const username = match.substring(1); // Remove @
      
      // Find AI character by username
      const aiCharacter = await prisma.aiAccount.findUnique({
        where: { username },
        select: { characterId: true }
      });
      
      if (aiCharacter && !extractedAiMentions.includes(aiCharacter.characterId)) {
        extractedAiMentions.push(aiCharacter.characterId);
      }
    }

    // Extract user mentions from content using @ pattern
    const userMentionMatches = content.match(/@(\w+)/g) || [];
    const extractedUserMentions = [];
    
    for (const match of userMentionMatches) {
      const username = match.substring(1); // Remove @
      
      // Find user by username
      const mentionedUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
      });
      
      if (mentionedUser && !extractedUserMentions.includes(mentionedUser.id)) {
        extractedUserMentions.push(mentionedUser.id);
      }
    }

    // Combine with manually provided mentions
    const allAiMentions = [...new Set([...aiMentions, ...extractedAiMentions])];
    const allUserMentions = [...new Set([...mentions, ...extractedUserMentions])];

    // Create the post
    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        authorId: userId,
        aiMentions: allAiMentions,
        mentions: allUserMentions,
        parentId: parentId || null,
        isPublic: true,
        isAiGenerated: false,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        parent: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    // Update parent post reply count if this is a reply
    if (parentId) {
      await prisma.post.update({
        where: { id: parentId },
        data: {
          repliesCount: {
            increment: 1,
          },
        },
      });
    }

    // Create notifications for mentioned users
    if (allUserMentions.length > 0) {
      const notificationPromises = allUserMentions
        .filter(mentionedUserId => mentionedUserId !== userId) // Don't notify self
        .map(mentionedUserId =>
          prisma.notification.create({
            data: {
              recipientId: mentionedUserId,
              actorId: userId,
              type: 'MENTION',
              postId: post.id,
            },
          })
        );
      await Promise.all(notificationPromises);
    }

    // Handle AI mentions - trigger webhook for AI responses (WITH DELAY for posts)
    if (allAiMentions.length > 0) {
      // Create notifications for AI mentions
      const aiNotificationPromises = allAiMentions.map(aiCharacterId =>
        prisma.notification.create({
          data: {
            recipientId: userId, // Notify the user that AI will respond
            actorId: userId,
            type: 'AI_MENTION',
            postId: post.id,
          },
        })
      );
      await Promise.all(aiNotificationPromises);

      // Trigger AI responses using DeepSeek (with delay for posts)
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-post-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: post.id,
            aiMentions: allAiMentions,
            originalContent: content,
            authorId: userId,
          }),
        });
      } catch (error) {
        console.error('Failed to trigger AI post webhook:', error);
        // Don't fail the post creation if AI webhook fails
      }
    }

    // Trigger general post webhook for LLM processing
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/post-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          content: content.trim(),
          authorId: userId,
          mentions: allUserMentions,
          aiMentions: allAiMentions,
          isReply: !!parentId,
        }),
      });
    } catch (error) {
      console.error('Failed to trigger post webhook:', error);
      // Don't fail the post creation if webhook fails
    }

    return NextResponse.json({ 
      success: true, 
      post: {
        ...post,
        author: {
          ...post.author,
          profile: post.author?.profile,
        },
      },
    });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const feedType = searchParams.get('feedType') || 'public'; // 'public' or 'following'

    const skip = (page - 1) * limit;

    let whereClause: any = {
      parentId: null, // Only get top-level posts
      isPublic: true,
    };

    // If feedType is 'following' and userId is provided, get posts from followed users/AI
    if (feedType === 'following' && userId) {
      // Get followed human users
      const followedHumans = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followedId: true },
      });

      // Get followed AI accounts
      const followedAis = await prisma.aiFollow.findMany({
        where: { userId: userId },
        select: { aiAccountId: true },
      });

      const followedHumanIds = followedHumans.map(f => f.followedId);
      const followedAiIds = followedAis.map(f => f.aiAccountId);

      // Include user's own posts and posts from followed accounts
      whereClause = {
        isPublic: true,
        OR: [
          { authorId: userId }, // User's own posts
          { authorId: { in: followedHumanIds } }, // Posts from followed humans
          { aiAuthorId: { in: followedAiIds } }, // Posts from followed AIs
        ],
      };
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        aiAuthor: true,
        replies: {
          take: 3, // Show first 3 replies
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            aiAuthor: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      posts,
      hasMore: posts.length === limit,
      page,
    });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}