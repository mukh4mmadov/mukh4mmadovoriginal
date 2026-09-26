import { NextRequest, NextResponse } from "next/server";
import { AIProviderFactory } from "@/lib/ai/providers";

const rateLimitMap = new Map();
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_MESSAGES_PER_REQUEST = 50;
const ALLOWED_PERSONALITIES = ["friendly", "strict", "savage"];
const ALLOWED_PROVIDERS = ["openai", "gemini", "claude", "openrouter"];

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateMessages(messages) {
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

function validateContext(context) {
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

function checkRateLimit(identifier) {
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

function sanitizeMessage(message) {
  return {
    ...message,
    content: message.content
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .substring(0, MAX_MESSAGE_LENGTH),
  };
}

export async function POST(request) {
  try {
    let body;
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

    if (
      typeof personality !== "string" ||
      !ALLOWED_PERSONALITIES.includes(personality)
    ) {
      return NextResponse.json(
        { error: "Invalid personality" },
        { status: 400 },
      );
    }

    if (typeof provider !== "string" || !ALLOWED_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const validatedPersonality = personality;
    const validatedProvider = provider;

    const sanitizedMessages = messages.map(sanitizeMessage);

    const providerKeys = {
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
            "AI service is not configured on the server. Add the required API key for the selected provider in the environment variables.",
        },
        { status: 503 },
      );
    }

    const providerModels = {
      openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
      claude: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
      gemini: process.env.GOOGLE_MODEL || "gemini-3.8-flash",
      openrouter: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    };

    const aiProvider = AIProviderFactory.create(validatedProvider, {
      apiKey,
      model: providerModels[validatedProvider],
      fallbackModels:
        validatedProvider === "gemini"
          ? [process.env.GOOGLE_FALLBACK_MODEL || "gemini-3.5-flash-lite"]
          : [],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = "";

          const providerResponse = await aiProvider.sendMessage(
            sanitizedMessages,
            context,
            validatedPersonality,
            (chunk) => {
              fullContent += chunk;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`),
              );
            },
          );

          if (!fullContent && typeof providerResponse === "string") {
            fullContent = providerResponse;
          }

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
