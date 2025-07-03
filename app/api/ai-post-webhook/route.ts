import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deepseekClient } from '@/lib/deepseek-client';

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

    // Process each AI mention with delay
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

      // Add random delay between 5-10 seconds before responding
      const delayMs = Math.floor(Math.random() * 5000) + 5000; // 5000-10000ms (5-10 seconds)
      
      // Process AI response after delay
      setTimeout(async () => {
        try {
          // Generate AI response using DeepSeek
          const aiResponse = await deepseekClient.generateResponse(
            aiPrompt.systemPrompt,
            originalContent,
            50, // Max 50 words for posts
            {
              authorName: originalPost.author?.profile?.displayName || 'User',
              isMessage: false
            }
          );

          // Create AI response post
          const aiReplyPost = await prisma.post.create({
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

          // Create notification for AI reply to original author
          await prisma.notification.create({
            data: {
              recipientId: authorId,
              actorId: authorId, // Use author as actor since AI doesn't have user ID
              type: 'AI_REPLY',
              postId: aiReplyPost.id,
            },
          });

          // Create notifications for other users mentioned in the original post
          if (originalPost.mentions && originalPost.mentions.length > 0) {
            const mentionNotifications = originalPost.mentions
              .filter(mentionedUserId => mentionedUserId !== authorId) // Don't duplicate notification for author
              .map(mentionedUserId =>
                prisma.notification.create({
                  data: {
                    recipientId: mentionedUserId,
                    actorId: authorId,
                    type: 'AI_MENTION',
                    postId: aiReplyPost.id,
                  },
                })
              );
            
            await Promise.all(mentionNotifications);
          }

          console.log(`✅ AI response created by ${aiCharacter.username} after ${delayMs}ms delay`);
        } catch (error) {
          console.error(`Failed to create AI response for ${aiCharacter.username}:`, error);
        }
      }, delayMs);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI post webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}