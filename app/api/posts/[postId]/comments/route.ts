import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const { userId } = auth();
    const { postId } = params;

    const comments = await prisma.post.findMany({
      where: { 
        parentId: postId,
        isPublic: true 
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        aiAuthor: true,
        likes: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: [
        { likesCount: 'desc' },
        { createdAt: 'asc' }
      ],
    });

    const formattedComments = comments.map(comment => ({
      ...comment,
      isLiked: userId ? comment.likes.length > 0 : false,
      likesCount: comment._count.likes,
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}