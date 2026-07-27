import { NextRequest, NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/providers';
import { AIMessage, AIConversationContext, AIPersonality } from '@/types/aiCoach';

// Rate limiting: Simple in-memory store (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_MESSAGE_LENGTH = 10000; // Prevent abuse
const MAX_MESSAGES_PER_REQUEST = 50; // Prevent abuse

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function sanitizeMessage(message: AIMessage): AIMessage {
  // Sanitize message content to prevent prompt injection
  return {
    ...message,
    content: message.content
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, MAX_MESSAGE_LENGTH), // Truncate if too long
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages,
      context,
      personality,
      provider = 'openai',
    }: {
      messages: AIMessage[];
      context: AIConversationContext;
      personality: AIPersonality;
      provider?: 'openai' | 'gemini' | 'claude' | 'openrouter';
    } = body;

    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    if (messages.length > MAX_MESSAGES_PER_REQUEST) {
      return NextResponse.json(
        { error: 'Too many messages in request' },
        { status: 400 }
      );
    }

    if (!context || !context.passage) {
      return NextResponse.json(
        { error: 'Invalid context format' },
        { status: 400 }
      );
    }

    // Validate personality
    if (!['friendly', 'strict', 'savage'].includes(personality)) {
      return NextResponse.json(
        { error: 'Invalid personality' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['openai', 'gemini', 'claude', 'openrouter'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Sanitize messages
    const sanitizedMessages = messages.map(sanitizeMessage);

    // Get API key from environment (server-side only)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Create provider and send message
    const aiProvider = AIProviderFactory.create(provider, {
      apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    });

    // Streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';
          
          await aiProvider.sendMessage(
            sanitizedMessages,
            context,
            personality,
            (chunk: string) => {
              fullContent += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            }
          );
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
