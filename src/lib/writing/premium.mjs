// AI Premium Writing checks: a detailed review paid on Telegram. The price
// must match the premium_writing_price check in migration 020.
export const PREMIUM_PRICE_UZS = 5000;
export const PREMIUM_TELEGRAM = process.env.NEXT_PUBLIC_PREMIUM_TELEGRAM || "mukh4mmadov";
export const PREMIUM_MIN_WORDS = 50;

export const PREMIUM_STATUSES = {
  awaiting_payment: { label: "Waiting for payment", tone: "amber" },
  paid: { label: "Payment confirmed · being checked", tone: "brand" },
  done: { label: "Result ready", tone: "emerald" },
  rejected: { label: "Not accepted", tone: "rose" },
};

export const premiumPrice = (essayCount) => PREMIUM_PRICE_UZS * essayCount;

export const formatUzs = (amount) => `${Number(amount).toLocaleString("en-US")} UZS`;

export const telegramLink = (username = PREMIUM_TELEGRAM) => `https://t.me/${username.replace(/^@/, "")}`;

export function telegramMessage(code, amount) {
  return `Hello! I'd like an AI Premium Writing check. My code: ${code}. Amount: ${formatUzs(amount)}.`;
}

// The essays stored with a request: only tasks long enough to mark.
export function premiumEssays(tasks, essays, countWords) {
  return tasks
    .map((task) => {
      const essay = String(essays[task.slug] || "").trim().slice(0, 12000);
      return { taskSlug: task.slug, taskNumber: task.task, essay, wordCount: countWords(essay) };
    })
    .filter((item) => item.wordCount >= PREMIUM_MIN_WORDS);
}
