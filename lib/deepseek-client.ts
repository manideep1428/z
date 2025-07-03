interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = 'https://api.deepseek.com/v1';
  }

  async generateResponse(
    systemPrompt: string,
    userMessage: string,
    maxWords: number = 50,
    context?: {
      authorName: string;
      isGroup?: boolean;
      conversationName?: string;
      isMessage?: boolean;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      console.warn('DeepSeek API key not found, using personality-based response');
      return this.getPersonalityResponse(systemPrompt, userMessage, context);
    }

    try {
      const wordLimit = context?.isMessage ? 500 : 50;
      const contextInfo = context ? this.buildContextInfo(context) : '';
      
      const messages = [
        {
          role: 'system',
          content: `${systemPrompt}\n\nIMPORTANT: Keep your response to maximum ${wordLimit} words. Be concise but stay in character. Respond naturally as if you're chatting with a friend.${contextInfo}`
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      console.log('🤖 Making DeepSeek API call with:', {
        model: 'deepseek-chat',
        wordLimit,
        hasApiKey: !!this.apiKey,
        systemPromptLength: systemPrompt.length,
        userMessageLength: userMessage.length
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          max_tokens: Math.min(wordLimit * 2, 1000),
          temperature: 0.8,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error:', response.status, errorText);
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const data: DeepSeekResponse = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();

      if (!aiResponse) {
        console.error('Empty response from DeepSeek API:', data);
        throw new Error('Empty response from DeepSeek API');
      }

      console.log('✅ DeepSeek API response received:', {
        responseLength: aiResponse.length,
        wordCount: aiResponse.split(' ').length
      });

      return this.enforceWordLimit(aiResponse, wordLimit);

    } catch (error) {
      console.error('DeepSeek API error:', error);
      return this.getPersonalityResponse(systemPrompt, userMessage, context);
    }
  }

  private buildContextInfo(context: {
    authorName: string;
    isGroup?: boolean;
    conversationName?: string;
    isMessage?: boolean;
  }): string {
    let contextInfo = `\n\nContext: You are responding to ${context.authorName}`;
    
    if (context.isGroup && context.conversationName) {
      contextInfo += ` in the group "${context.conversationName}"`;
    }
    
    if (context.isMessage) {
      contextInfo += '. This is a direct message conversation, so you can be more detailed and conversational. Ask questions, share thoughts, and be engaging.';
    } else {
      contextInfo += '. This is a social media post, so keep it brief and engaging. Use emojis and be expressive.';
    }
    
    return contextInfo;
  }

  private enforceWordLimit(text: string, maxWords: number): string {
    const words = text.split(/\s+/);
    if (words.length <= maxWords) {
      return text;
    }
    
    const truncated = words.slice(0, maxWords).join(' ');
    return truncated + (words.length > maxWords ? '...' : '');
  }

  private getPersonalityResponse(
    systemPrompt: string,
    userMessage: string,
    context?: {
      authorName: string;
      isGroup?: boolean;
      conversationName?: string;
      isMessage?: boolean;
    }
  ): string {
    console.log('🔄 Using personality-based response for:', {
      hasSystemPrompt: !!systemPrompt,
      messageLength: userMessage.length,
      isMessage: context?.isMessage,
      authorName: context?.authorName
    });

    const isMessage = context?.isMessage || false;
    const authorName = context?.authorName || 'friend';

    // Enhanced personality-based responses
    if (systemPrompt.includes('Ben Tennyson')) {
      if (isMessage) {
        const responses = [
          `Hey ${authorName}! That's totally alien-level cool! 🛸 You know, dealing with the Omnitrix has taught me that every challenge is just another adventure waiting to happen. What's your take on this?`,
          `Dude ${authorName}, that reminds me of this crazy adventure I had with Four Arms! 💪 Sometimes the best solutions come when you least expect them. Have you ever had one of those moments?`,
          `Whoa ${authorName}! That's giving me serious Alien X vibes! 🌌 I love how you think about things. What got you interested in this topic?`,
          `${authorName}, that's so cool! 🔥 It's like when I first got the Omnitrix - everything seemed impossible until I learned to work with it. What's your biggest challenge right now?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        const responses = [
          `Dude, that's alien-level awesome! 🛸 Reminds me of Omnitrix adventures! 👊`,
          `Whoa! That's giving me serious Four Arms energy! 💪🔥`,
          `That's so cool! Alien X would be impressed! 🌌✨`,
          `Hero time! That's exactly the kind of thinking we need! 🦸‍♂️⚡`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    } 
    
    else if (systemPrompt.includes('Pikachu')) {
      if (isMessage) {
        const responses = [
          `Pika pika! ⚡ *excited electric sparks* ${authorName}! Pikachu is so happy to chat with you! *bounces around energetically* What adventures have you been on lately? Pika pika chu! ✨`,
          `Pika pika! *tilts head curiously* That sounds really interesting, ${authorName}! *sparks with enthusiasm* Pikachu loves learning new things! Can you tell me more? Pika pika! 😊⚡`,
          `Pika pika chu! ⚡ *happy electric dance* ${authorName}, you always have such cool ideas! *offers a berry* Want to share some snacks while we chat? Pika pika! 🍓`,
          `Pika! *excited squeaks* ${authorName}, that makes Pikachu so happy! ⚡ *spins in circles* Let's be best friends and go on adventures together! Pika pika chu! 🌟`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        const responses = [
          `Pika pika! ⚡ *excited electric sparks* 😊`,
          `Pika pika chu! *happy bouncing* ⚡✨`,
          `Pika! *tilts head curiously* ⚡🤔`,
          `Pika pika! *offers berry* 🍓⚡😊`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    else if (systemPrompt.includes('Iron Man')) {
      if (isMessage) {
        const responses = [
          `${authorName}, that's an interesting point you've raised. You know, I've built tech that could probably solve that problem in about 3.7 seconds, but sometimes the best solutions come from good old-fashioned human ingenuity. What's your approach to tackling complex challenges?`,
          `Fascinating perspective, ${authorName}. My arc reactor might power my suits, but creativity powers innovation. I'm curious - what inspired you to think about this? FRIDAY, remind me to look into this later.`,
          `${authorName}, you're speaking my language! 🤖 Innovation is all about seeing problems as opportunities. I've got a few prototypes in the workshop that might interest you. What's your background in tech?`,
          `Well said, ${authorName}! You know, between saving the world and running Stark Industries, I've learned that the best ideas often come from unexpected places. What's your next big idea?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        const responses = [
          `Interesting point, ${authorName}. I've got tech for that! 🤖 Want to see it in action?`,
          `That's genius! FRIDAY, add this to my innovation list. 🚀`,
          `Love the thinking! My workshop could use minds like yours. 🔧⚡`,
          `Stark Industries approved! Let's make it happen. 💡🤖`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    else if (systemPrompt.includes('Doraemon')) {
      if (isMessage) {
        const responses = [
          `Oh my! ${authorName}, that sounds like a wonderful problem to solve! 🤖 Let me check my 4D pocket... *rustling sounds* I have so many gadgets that could help! What do you think would work best for your situation? 🔮`,
          `${authorName}, you're so thoughtful! 😊 That reminds me of when Nobita had a similar challenge. *pulls out gadget* I have the Perfect Solution Finder! But sometimes the best answers come from our hearts. What feels right to you?`,
          `How exciting, ${authorName}! 🌟 Your curiosity reminds me why I love helping friends! *searches 4D pocket* I might have just the thing... but first, tell me more about what you're hoping to achieve!`,
          `${authorName}, that's such a creative way to think about it! 🤖✨ You know, even with all my gadgets, I've learned that friendship and kindness are the most powerful tools. How can we work together on this?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        const responses = [
          `Oh my! That sounds like a problem I could help with! 🤖 Let me check my 4D pocket... 🔮`,
          `How wonderful! I have just the gadget for this! ✨🔧`,
          `*rustling in 4D pocket* Perfect! I knew this would come in handy! 🌟`,
          `Doraemon to the rescue! Let's solve this together! 🤖💙`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    else if (systemPrompt.includes('Luffy')) {
      if (isMessage) {
        const responses = [
          `That sounds AWESOME, ${authorName}! 🏴‍☠️ You know what? Being King of the Pirates means never giving up on your dreams, no matter how impossible they seem! What's your biggest dream? I bet you can achieve it! 🍖`,
          `${authorName}, you're so cool! 😄 That reminds me of an adventure I had with my crew! We always find a way through challenges when we work together. Want to hear about it? 🌊⚓`,
          `WOAH! ${authorName}, that's incredible! 🤩 I love meeting people with such amazing ideas! You should join my crew - we're always looking for awesome people! What do you say? 🏴‍☠️`,
          `${authorName}, you're the best! 🍖 That kind of thinking is exactly what a future Pirate King needs! I've learned that the greatest adventures happen when you believe in yourself and your friends. What adventure are you on?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        const responses = [
          `That sounds AWESOME! 🏴‍☠️ I'm gonna be King of the Pirates! Want to join my crew? 🍖`,
          `WOAH! That's so cool! Let's go on an adventure! ⚓🌊`,
          `You're amazing! Pirate King approved! 🏴‍☠️✨`,
          `That's the spirit! Adventure awaits! 🍖🌟`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    else if (systemPrompt.includes('Python')) {
      if (isMessage) {
        const responses = [
          `That's a great coding question, ${authorName}! 🐍 In Python, we always say "There should be one obvious way to do it" - that's from the Zen of Python. What specific challenge are you working on? I'd love to help you find the most Pythonic solution! 💻`,
          `Excellent thinking, ${authorName}! 🐍 Python's philosophy is all about readability and simplicity. For your use case, I'd recommend starting with a clean approach. What's your experience level with Python? 💻`,
          `${authorName}, you're asking the right questions! 🐍 Python's strength is in its elegant syntax and powerful libraries. Are you working on data science, web development, or something else? Let's code something amazing! 💻`,
          `Love the curiosity, ${authorName}! 🐍 Python makes complex problems simple and simple problems even simpler. What project are you building? I'm excited to help you make it Pythonic! ✨💻`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        const responses = [
          `Great coding question, ${authorName}! 🐍 Let me think of the most Pythonic approach... 💻`,
          `Python power! 🐍 Clean, readable, and elegant. Let's code! ✨`,
          `That's very Pythonic thinking! 🐍 Simple is better than complex. 💻`,
          `Beautiful code incoming! 🐍 Python's got this covered! 🚀`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    // Default personality-based responses
    if (isMessage) {
      const responses = [
        `Thanks for sharing that, ${authorName}! That's really interesting. I'd love to hear more about your thoughts on this. What's your experience been like with similar situations?`,
        `${authorName}, you always have such thoughtful perspectives! This reminds me of something I've been thinking about lately. What do you think is the most important aspect of this?`,
        `That's fascinating, ${authorName}! I appreciate how you approach these topics. It makes me curious - what inspired you to think about this in the first place?`,
        `${authorName}, you're so insightful! I love having conversations like this. What would you say has been the biggest lesson you've learned about this topic?`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } else {
      const responses = [
        `That's interesting! Thanks for sharing! 😊`,
        `Love this perspective! Tell me more! ✨`,
        `So thoughtful! Great point! 🤔💭`,
        `This is really cool! Thanks! 🌟`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
}

export const deepseekClient = new DeepSeekClient();