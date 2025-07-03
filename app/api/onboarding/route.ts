import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { username, displayName, bio, dob, interests, persona } = body;

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        username,
      },
      create: {
        id: userId,
        email: '', // Will be updated via Clerk webhook
        username,
      },
    });

    // Create user profile
    await prisma.userProfile.create({
      data: {
        userId,
        username,
        displayName,
        bio: bio || null,
        accountType: 'HUMAN',
      },
    });

    // Create user metadata
    await prisma.userMetadata.create({
      data: {
        userId,
        dob: new Date(dob),
        interests,
        persona: persona || null,
      },
    });

    // Update Clerk user metadata
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        dob,
        interests,
        persona,
        username,
        displayName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}