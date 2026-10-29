import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AIProviderFactory } from "@/lib/ai/providers";
import { buildWritingSystemPrompt, buildWritingUserMessage } from "@/lib/ai/writing-prompts";
import { countWords, getWritingTask, WRITING_TASK_RULES } from "@/data/writingTasks";
import { parseWritingFeedback } from "@/lib/writing/writing-feedback.mjs";
import { getTashkentTodayRange } from "@/lib/reading/metrics.mjs";

export const dynamic = "force-dynamic";
// Marking a full essay can take the AI model well over a minute.
export const maxDuration = 120;

const MIN_WORDS_FOR_FEEDBACK = 50;
const DAILY_LIMIT = Math.max(1, Number(process.env.WRITING_DAILY_LIMIT) || 5);
// Fallback counter for when the submissions table is not available yet.
const memoryCounts = new Map();

const PROVIDERS = [
  { name: "gemini", key: "GOOGLE_API_KEY", model: process.env.GOOGLE_MODEL || "gemini-3.8-flash", fallback: process.env.GOOGLE_FALLBACK_MODEL || "gemini-3.5-flash-lite", baseUrl: process.env.GOOGLE_API_BASE_URL },
  { name: "openai", key: "OPENAI_API_KEY", model: process.env.OPENAI_MODEL || "gpt-4o-mini" },
  { name: "claude", key: "ANTHROPIC_API_KEY", model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307" },
  { name: "openrouter", key: "OPENROUTER_API_KEY", model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini" },
];

const fail = (status, error, extra = {}) => NextResponse.json({ error, ...extra }, { status });

async function countToday(supabase, userId) {
  const { from } = getTashkentTodayRange();
  const { count, error } = await supabase
    .from("writing_submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", from);
  if (!error) return { count: count || 0, fromTable: true };
  const key = `${userId}:${from}`;
  return { count: memoryCounts.get(key) || 0, fromTable: false, key };
}

export async function POST(request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return fail(403, "Invalid origin");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.is_anonymous) {
    return fail(401, "Sign in to get AI feedback on your writing.");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Invalid request body");
  }

  const task = getWritingTask(typeof body?.taskSlug === "string" ? body.taskSlug : "");
  if (!task) return fail(400, "Unknown writing task.");
  const essay = typeof body?.essay === "string" ? body.essay.trim().slice(0, 12000) : "";
  const wordCount = countWords(essay);
  const rules = WRITING_TASK_RULES[task.task];
  if (wordCount < MIN_WORDS_FOR_FEEDBACK) {
    return fail(400, `Write at least ${MIN_WORDS_FOR_FEEDBACK} words before asking for feedback.`);
  }
  if (wordCount > rules.maxWords) {
    return fail(400, `Your response is too long. Keep it under ${rules.maxWords} words.`);
  }
  const timeSpentSeconds = Number.isFinite(Number(body?.timeSpentSeconds))
    ? Math.max(0, Math.min(4 * 60 * 60, Math.round(Number(body.timeSpentSeconds))))
    : null;

  const usage = await countToday(supabase, user.id);
  if (usage.count >= DAILY_LIMIT) {
    return fail(429, `You have used today's ${DAILY_LIMIT} feedback requests. Please come back tomorrow.`, { remainingToday: 0 });
  }

  const provider = PROVIDERS.find((item) => process.env[item.key]);
  if (!provider) return fail(503, "AI feedback is not configured on the server yet.");

  const ai = AIProviderFactory.create(provider.name, {
    apiKey: process.env[provider.key],
    baseUrl: provider.baseUrl || undefined,
    model: provider.model,
    fallbackModels: provider.fallback ? [provider.fallback] : [],
    systemPrompt: buildWritingSystemPrompt(task),
    temperature: 0.2,
    responseMimeType: provider.name === "gemini" ? "application/json" : undefined,
  });
  const messages = [{ role: "user", content: buildWritingUserMessage(task, essay) }];

  let feedback = null;
  const startedAt = Date.now();
  try {
    for (let attempt = 0; attempt < 2 && !feedback; attempt += 1) {
      feedback = parseWritingFeedback(await ai.sendMessage(messages, null, "friendly"));
    }
    console.info(`Writing feedback from ${provider.name} took ${Date.now() - startedAt} ms`);
  } catch (error) {
    // Provider errors can include upstream response bodies; log, don't return.
    console.error("Writing feedback provider error:", error);
    const busy = error instanceof Error && /\b(429|503)\b/.test(error.message);
    return fail(busy ? 503 : 502, busy
      ? "The AI examiner is busy right now. Please wait a moment and try again."
      : "The AI examiner could not mark this response. Please try again.");
  }
  if (!feedback) return fail(502, "The AI examiner returned an unreadable result. Please try again.");

  let submission = null;
  if (usage.fromTable) {
    const { data, error } = await supabase
      .from("writing_submissions")
      .insert({
        user_id: user.id,
        task_slug: task.slug,
        task_number: task.task,
        essay,
        word_count: wordCount,
        time_spent_seconds: timeSpentSeconds,
        overall_band: feedback.overall,
        feedback,
      })
      .select("id, created_at")
      .single();
    if (error) console.error("Writing submission could not be saved:", error);
    else submission = { id: data.id, createdAt: data.created_at };
  } else {
    memoryCounts.set(usage.key, usage.count + 1);
  }

  return NextResponse.json({
    feedback,
    wordCount,
    submission,
    remainingToday: Math.max(0, DAILY_LIMIT - usage.count - 1),
  });
}
