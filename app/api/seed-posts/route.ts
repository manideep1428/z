import { NextRequest, NextResponse } from 'next/server';
import { seedPosts } from '@/lib/seed-posts';

export async function POST(req: NextRequest) {
  try {
    const result = await seedPosts();
    
    return NextResponse.json({
      success: true,
      message: 'Posts seeded successfully!',
      createdPosts: result.createdPosts,
      createdReplies: result.createdReplies,
      totalPosts: result.totalPosts
    });
  } catch (error) {
    console.error('Failed to seed posts:', error);
    return NextResponse.json(
      { error: 'Failed to seed posts' }, 
      { status: 500 }
    );
  }
}