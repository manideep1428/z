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
    const { name, description, isPublic = true } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    // Create the group
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic,
        ownerId: userId,
        memberCount: 1, // Owner is automatically a member
      },
    });

    // Add owner as a member
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: userId,
        role: 'OWNER',
      },
    });

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Failed to create group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'all'; // 'all', 'joined', 'owned'

    const skip = (page - 1) * limit;

    let whereClause: any = {
      isPublic: true,
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by user relationship
    if (userId && type !== 'all') {
      if (type === 'joined') {
        whereClause.members = {
          some: { userId: userId },
        };
      } else if (type === 'owned') {
        whereClause.ownerId = userId;
      }
    }

    const groups = await prisma.group.findMany({
      where: whereClause,
      include: {
        owner: {
          include: {
            profile: true,
          },
        },
        members: {
          take: 5, // Show first 5 members
          include: {
            user: {
              include: {
                profile: true,
              },
            },
            ai: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        memberCount: 'desc', // Popular groups first
      },
      skip,
      take: limit,
    });

    // Check if user is a member of each group (if userId provided)
    let userMemberships: any = {};
    if (userId) {
      const memberships = await prisma.groupMember.findMany({
        where: {
          userId: userId,
          groupId: { in: groups.map(g => g.id) },
        },
        select: { groupId: true, role: true },
      });
      
      userMemberships = memberships.reduce((acc, membership) => {
        acc[membership.groupId] = membership.role;
        return acc;
      }, {} as Record<string, string>);
    }

    const formattedGroups = groups.map(group => ({
      ...group,
      memberCount: group._count.members,
      userRole: userMemberships[group.id] || null,
      isJoined: !!userMemberships[group.id],
    }));

    return NextResponse.json({
      groups: formattedGroups,
      hasMore: groups.length === limit,
      page,
    });
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}