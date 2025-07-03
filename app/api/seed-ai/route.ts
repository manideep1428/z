import { NextRequest, NextResponse } from 'next/server';
import { seedAiCharacters } from '@/lib/seed-ai-characters';

export async function POST(req: NextRequest) {
  try {
    const result = await seedAiCharacters();
    
    return NextResponse.json({
      success: true,
      message: 'AI characters seeded successfully!',
      totalCharacters: result.totalCharacters
    });
  } catch (error) {
    console.error('Failed to seed AI characters:', error);
    return NextResponse.json(
      { error: 'Failed to seed AI characters' }, 
      { status: 500 }
    );
  }
}