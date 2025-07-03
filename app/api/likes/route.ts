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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await prisma.$transaction([
        prisma.like.delete({
          where: {
            userId_postId: {
              userId: userId,
              postId: postId,
            },
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      // Get updated likes count
      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        select: { likesCount: true },
      });

      return NextResponse.json({ 
        liked: false, 
        likesCount: updatedPost?.likesCount || 0 
      });
    } else {
      // Like the post
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId: userId,
            postId: postId,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              increment: 1,
            },
          },
        }),
      ]);

      // Create notification for post author (if not liking own post)
      if (post.authorId && post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            recipientId: post.authorId,
            actorId: userId,
            type: 'LIKE',
            postId: postId,
          },
        });
      }

      // Get updated likes count
      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        select: { likesCount: true },
      });

      return NextResponse.json({ 
        liked: true, 
        likesCount: updatedPost?.likesCount || 0 
      });
    }
  } catch (error) {
    console.error('Failed to toggle like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}