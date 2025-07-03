import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const { userId } = auth();
    const { postId } = params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
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
        bookmarks: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const formattedPost = {
      ...post,
      isLiked: userId ? post.likes.length > 0 : false,
      isBookmarked: userId ? post.bookmarks.length > 0 : false,
      likesCount: post._count.likes,
      repliesCount: post._count.replies,
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = params;

    // Check if post exists and user owns it
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.authorId !== userId) {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 });
    }

    // Delete the post (this will cascade delete likes, bookmarks, etc.)
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}