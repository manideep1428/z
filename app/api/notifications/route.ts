import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const skip = (page - 1) * limit;

    let whereClause: any = {
      recipientId: userId,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        post: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            aiAuthor: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Get actor details for each notification
    const actorIds = notifications.map(n => n.actorId).filter(Boolean);
    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      include: {
        profile: true,
      },
    });

    const actorMap = actors.reduce((acc, actor) => {
      acc[actor.id] = actor;
      return acc;
    }, {} as Record<string, any>);

    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      actor: actorMap[notification.actorId] || null,
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      hasMore: notifications.length === limit,
      page,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } else if (notificationId) {
      // Mark specific notification as read
      await prisma.notification.update({
        where: {
          id: notificationId,
          recipientId: userId,
        },
        data: {
          isRead: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}