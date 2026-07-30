import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

async function authenticateRequest(
  request: NextRequest
): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;
  if (!token) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;

  return { userId: data.user.id };
}

export async function POST(request: NextRequest) {
  try {
    // Require an authenticated session before doing any work. This prevents
    // anonymous callers from abusing the server-side AI provider credentials.
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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

    // Rate limiting per authenticated user (not a client-supplied header)
    if (!checkRateLimit(auth.userId)) {
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
