import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = params;

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 });
    }

    // Add user to group
    await prisma.groupMember.create({
      data: {
        groupId: groupId,
        userId: userId,
        role: 'MEMBER',
      },
    });

    // Update group member count
    await prisma.group.update({
      where: { id: groupId },
      data: {
        memberCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to join group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = params;

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 400 });
    }

    // Don't allow owner to leave their own group
    if (membership.role === 'OWNER') {
      return NextResponse.json({ error: 'Group owner cannot leave the group' }, { status: 400 });
    }

    // Remove user from group
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: userId,
        },
      },
    });

    // Update group member count
    await prisma.group.update({
      where: { id: groupId },
      data: {
        memberCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to leave group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}