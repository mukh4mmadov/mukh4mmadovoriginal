import { NextRequest, NextResponse } from "next/server";
import { AIProviderFactory } from "@/lib/ai/providers";
import {
  AIMessage,
  AIConversationContext,
  AIPersonality,
} from "@/types/aiCoach";

// Rate limiting: Simple in-memory store (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_MESSAGE_LENGTH = 10000; // Prevent abuse
const MAX_MESSAGES_PER_REQUEST = 50; // Prevent abuse
const ALLOWED_PERSONALITIES = ["friendly", "strict", "savage"] as const;
const ALLOWED_PROVIDERS = ["openai", "gemini", "claude", "openrouter"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateMessages(messages: unknown): messages is AIMessage[] {
  if (!Array.isArray(messages)) return false;
  if (messages.length === 0 || messages.length > MAX_MESSAGES_PER_REQUEST)
    return false;

  return messages.every((message) => {
    if (!isRecord(message)) return false;
    if (
      typeof message.role !== "string" ||
      !["user", "assistant"].includes(message.role)
    )
      return false;
    if (
      typeof message.content !== "string" ||
      message.content.trim().length === 0
    )
      return false;
    if (message.id !== undefined && typeof message.id !== "string")
      return false;
    if (
      message.timestamp !== undefined &&
      typeof message.timestamp !== "number"
    )
      return false;
    return true;
  });
}

function validateContext(context: unknown): context is AIConversationContext {
  if (!isRecord(context)) return false;

  const passage = context.passage;
  if (!isRecord(passage)) return false;
  if (typeof passage.title !== "string" || passage.title.trim().length === 0)
    return false;
  if (!Array.isArray(passage.paragraphs)) return false;

  const paragraphs = passage.paragraphs;
  if (paragraphs.length === 0) return false;

  const hasValidParagraphs = paragraphs.every((paragraph) => {
    if (!isRecord(paragraph)) return false;
    return (
      typeof paragraph.label === "string" && typeof paragraph.text === "string"
    );
  });

  if (!hasValidParagraphs) return false;

  if (context.question !== undefined && !isRecord(context.question))
    return false;
  return true;
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
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
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .substring(0, MAX_MESSAGE_LENGTH), // Truncate if too long
  };
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { messages, context, personality, provider = "openai" } = body;

    // Rate limiting by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    // Validate request
    if (!validateMessages(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 },
      );
    }

    if (!validateContext(context)) {
      return NextResponse.json(
        { error: "Invalid context format" },
        { status: 400 },
      );
    }

    // Validate personality
    if (
      typeof personality !== "string" ||
      !ALLOWED_PERSONALITIES.includes(personality as AIPersonality)
    ) {
      return NextResponse.json(
        { error: "Invalid personality" },
        { status: 400 },
      );
    }

    // Validate provider
    if (
      typeof provider !== "string" ||
      !ALLOWED_PROVIDERS.includes(
        provider as "openai" | "gemini" | "claude" | "openrouter",
      )
    ) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const validatedPersonality = personality as AIPersonality;
    const validatedProvider = provider as
      | "openai"
      | "gemini"
      | "claude"
      | "openrouter";

    // Sanitize messages
    const sanitizedMessages = messages.map(sanitizeMessage);

    // Get API key from environment based on selected provider (server-side only)
    const providerKeys: Record<string, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      claude: process.env.ANTHROPIC_API_KEY,
      gemini: process.env.GOOGLE_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
    };

    const apiKey = providerKeys[provider];
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI service not configured. Please set the appropriate API key for the selected provider.",
        },
        { status: 500 },
      );
    }

    // Provider-specific default model
    const providerModels: Record<string, string | undefined> = {
      openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
      claude: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
      gemini: process.env.GOOGLE_MODEL || "gemini-pro",
      openrouter: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    };

    // Create provider and send message
    const aiProvider = AIProviderFactory.create(validatedProvider, {
      apiKey,
      model: providerModels[validatedProvider],
    });

    // Streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = "";

          await aiProvider.sendMessage(
            sanitizedMessages,
            context,
            validatedPersonality,
            (chunk: string) => {
              fullContent += chunk;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`),
              );
            },
          );

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`,
            ),
          );
          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
