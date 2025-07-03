import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = params;

    // Check if user liked this post
    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });

    // Check if user bookmarked this post
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });

    return NextResponse.json({
      isLiked: !!like,
      isBookmarked: !!bookmark,
    });
  } catch (error) {
    console.error('Failed to fetch post status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}