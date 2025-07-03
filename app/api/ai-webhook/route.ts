import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, aiMentions, originalContent, authorId } = body;

    // Get the original post
    const originalPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!originalPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Process each AI mention
    for (const aiCharacterId of aiMentions) {
      // Get AI character and their prompt
      const aiCharacter = await prisma.aiAccount.findUnique({
        where: { characterId: aiCharacterId },
      });

      const aiPrompt = await prisma.aiPrompt.findFirst({
        where: { characterId: aiCharacterId },
      });

      if (!aiCharacter || !aiPrompt) {
        console.error(`AI character or prompt not found: ${aiCharacterId}`);
        continue;
      }

      // Simulate AI response generation (in a real app, this would call an LLM API)
      const aiResponse = await generateAiResponse(
        aiPrompt.systemPrompt,
        originalContent,
        originalPost.author?.profile?.displayName || 'User'
      );

      // Create AI response post
      await prisma.post.create({
        data: {
          content: aiResponse,
          aiAuthorId: aiCharacter.id,
          parentId: postId,
          isPublic: true,
          isAiGenerated: true,
          mentions: [authorId], // Mention the original author
        },
      });

      // Update parent post reply count
      await prisma.post.update({
        where: { id: postId },
        data: {
          repliesCount: {
            increment: 1,
          },
        },
      });

      // Create notification for AI reply
      await prisma.notification.create({
        data: {
          recipientId: authorId,
          actorId: aiCharacter.id,
          type: 'AI_REPLY',
          postId: postId,
        },
      });

      // Add a small delay between AI responses to make it feel more natural
      await new Promise(resolve => setTimeout(resolve, aiCharacter.replyDelayMs || 2000));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Simulate AI response generation
async function generateAiResponse(
  systemPrompt: string,
  userMessage: string,
  userName: string
): Promise<string> {
  // In a real application, this would call an LLM API like OpenAI
  // For now, we'll generate a simple response based on the character
  
  const responses = [
    "That's interesting! Let me think about that... 🤔",
    "I have some thoughts on this! What do you think?",
    "Great point! I've been wondering about that too.",
    "Hmm, that reminds me of something similar I experienced.",
    "I love discussing topics like this! Thanks for sharing.",
    "That's a fascinating perspective! Tell me more.",
    "I can relate to that! Here's my take on it...",
    "Wow, that's really cool! I hadn't thought of it that way.",
  ];

  // Add character-specific responses based on system prompt
  if (systemPrompt.includes('Ben Tennyson')) {
    return `Dude, that's totally alien-level cool! 🛸 Reminds me of this one time with the Omnitrix... What do you think would happen if we had alien tech for that? 👊`;
  } else if (systemPrompt.includes('Pikachu')) {
    return `Pika pika! ⚡ *excited electric sparks* Pikachu! 😊`;
  } else if (systemPrompt.includes('Iron Man')) {
    return `Interesting point, ${userName}. I've got some tech that could probably solve that problem in about... oh, 3.7 seconds. 🤖 Want to see it in action?`;
  } else if (systemPrompt.includes('Doraemon')) {
    return `Oh my! That sounds like a problem I could help with! 🤖 Let me check my 4D pocket... I might have just the gadget for this! 🔮`;
  } else if (systemPrompt.includes('Luffy')) {
    return `That sounds AWESOME! 🏴‍☠️ I'm gonna be King of the Pirates, so I know a thing or two about adventures! Want to join my crew? 🍖`;
  }

  // Default response
  return responses[Math.floor(Math.random() * responses.length)];
}