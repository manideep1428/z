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

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId: userId,
            postId: postId,
          },
        },
      });

      return NextResponse.json({ bookmarked: false });
    } else {
      // Add bookmark
      await prisma.bookmark.create({
        data: {
          userId: userId,
          postId: postId,
        },
      });

      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Failed to toggle bookmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            aiAuthor: true,
            likes: {
              where: { userId },
              select: { id: true },
            },
            bookmarks: {
              where: { userId },
              select: { id: true },
            },
            _count: {
              select: {
                replies: true,
                likes: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const formattedBookmarks = bookmarks.map(bookmark => ({
      ...bookmark.post,
      isLiked: bookmark.post.likes.length > 0,
      isBookmarked: bookmark.post.bookmarks.length > 0,
      likesCount: bookmark.post._count.likes,
      repliesCount: bookmark.post._count.replies,
    }));

    return NextResponse.json({
      bookmarks: formattedBookmarks,
      hasMore: bookmarks.length === limit,
      page,
    });
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}