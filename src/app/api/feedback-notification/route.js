const requestCounts = new Map();
const allowedTypes = new Set(["bug", "feature", "incorrect_answer", "general"]);

function limitText(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function escapeHeader(value) {
  return value.replace(/[\r\n\t]+/g, " ");
}

function isRateLimited(key) {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (requestCounts.get(key) || []).filter((time) => time > windowStart);
  if (recent.length >= 5) {
    requestCounts.set(key, recent);
    return true;
  }
  recent.push(now);
  requestCounts.set(key, recent);
  return false;
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const clientAddress = forwardedFor.split(",")[0].trim() || "unknown";
  if (isRateLimited(clientAddress)) {
    return Response.json({ error: "Too many notifications" }, { status: 429 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    return Response.json({ configured: false }, { status: 503 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const id = limitText(payload?.id, 64);
  const name = limitText(payload?.name, 120);
  const email = limitText(payload?.email, 180);
  const subject = limitText(payload?.subject, 300);
  const message = limitText(payload?.message, 2500);
  const type = limitText(payload?.message_type, 40);
  const pageUrl = limitText(payload?.page_url, 500);
  const createdAt = limitText(payload?.created_at, 80);

  if (!id || !name || !email || !subject || !message || !allowedTypes.has(type)) {
    return Response.json({ error: "Missing or invalid feedback fields" }, { status: 400 });
  }

  const notification = [
    `New ${type.replaceAll("_", " ")} feedback`,
    `From: ${escapeHeader(name)} <${escapeHeader(email)}>`,
    `Subject: ${escapeHeader(subject)}`,
    `Message: ${message}`,
    pageUrl ? `Page: ${escapeHeader(pageUrl)}` : "",
    createdAt ? `Time: ${escapeHeader(createdAt)}` : "",
    `Feedback ID: ${id}`,
  ].filter(Boolean).join("\n").slice(0, 3900);

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: notification }),
      cache: "no-store",
    });
    if (!telegramResponse.ok) {
      return Response.json({ error: "Telegram delivery failed" }, { status: 502 });
    }
  } catch {
    return Response.json({ error: "Telegram delivery failed" }, { status: 502 });
  }

  return Response.json({ sent: true });
}
