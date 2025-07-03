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
    const { displayName, bio, interests, persona } = body;

    // Update user profile
    await prisma.userProfile.update({
      where: { userId },
      data: {
        displayName: displayName?.trim() || null,
        bio: bio?.trim() || null,
      },
    });

    // Update user metadata
    await prisma.userMetadata.update({
      where: { userId },
      data: {
        interests: interests || [],
        persona: persona?.trim() || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}