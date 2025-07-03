import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'trending'; // 'trending', 'popular', 'new'

    const skip = (page - 1) * limit;

    let whereClause: any = {
      isActive: true,
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = {};
    switch (sort) {
      case 'popular':
        orderBy = { followersCount: 'desc' };
        break;
      case 'new':
        orderBy = { createdAt: 'desc' };
        break;
      case 'trending':
      default:
        orderBy = { postsCount: 'desc' };
        break;
    }

    const topics = await prisma.topic.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
    });

    return NextResponse.json({
      topics,
      hasMore: topics.length === limit,
      page,
    });
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Topic name is required' }, { status: 400 });
    }

    // Check if topic already exists
    const existingTopic = await prisma.topic.findUnique({
      where: { name: name.trim().toLowerCase() },
    });

    if (existingTopic) {
      return NextResponse.json({ error: 'Topic already exists' }, { status: 400 });
    }

    const topic = await prisma.topic.create({
      data: {
        name: name.trim().toLowerCase(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, topic });
  } catch (error) {
    console.error('Failed to create topic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}