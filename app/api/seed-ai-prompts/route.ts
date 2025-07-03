import { NextRequest, NextResponse } from 'next/server';
import { seedAiPrompts } from '@/lib/seed-ai-prompts';

export async function POST(req: NextRequest) {
  try {
    const result = await seedAiPrompts();
    
    return NextResponse.json({
      success: true,
      message: 'AI prompts seeded successfully!',
      totalPrompts: result.totalPrompts
    });
  } catch (error) {
    console.error('Failed to seed AI prompts:', error);
    return NextResponse.json(
      { error: 'Failed to seed AI prompts' }, 
      { status: 500 }
    );
  }
}