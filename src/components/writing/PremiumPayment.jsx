"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Send } from "lucide-react";
import { formatUzs, PREMIUM_TELEGRAM, telegramLink, telegramMessage } from "@/lib/writing/premium.mjs";

/**
 * How to pay for an AI Premium check: send the amount on Telegram with the
 * request code, then wait for the administrator to confirm the payment.
 */
export default function PremiumPayment({ code, amount, compact = false }) {
  const [copied, setCopied] = useState(false);
  const message = telegramMessage(code, amount);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the message is shown on screen to copy by hand.
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-3 rounded-2xl border border-amber-400/25 bg-amber-500/[0.07] p-5"}>
      {!compact && <h2 className="text-lg font-bold text-white">Pay {formatUzs(amount)} on Telegram</h2>}
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
        <li>Open Telegram and message <b className="text-white">@{PREMIUM_TELEGRAM}</b>.</li>
        <li>Send this message, then pay <b className="text-white">{formatUzs(amount)}</b> using the payment details you get in the chat.</li>
        <li>When your payment is confirmed, your AI Premium result appears on <b className="text-white">My AI Premium checks</b>, usually within 24 hours.</li>
      </ol>
      <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
        {message}
      </p>
      <p className="text-sm text-slate-300">Your code: <b className="font-mono text-lg tracking-widest text-white">{code}</b></p>
      <div className="flex flex-wrap gap-2">
        <a href={telegramLink()} target="_blank" rel="noopener noreferrer" className="btn-primary">
          <Send size={18} aria-hidden="true" /> Open Telegram
        </a>
        <button type="button" onClick={copy} className="btn-secondary" aria-live="polite">
          {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />} {copied ? "Copied" : "Copy message"}
        </button>
      </div>
    </div>
  );
}

// Shown right after a learner asks for an AI Premium check.
export function PremiumRequestSaved({ request }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">AI Premium</p>
      <h1 className="section-title mb-3">Your request is saved</h1>
      <p className="section-subtitle mb-6">
        Your writing is stored safely with code <b className="font-mono text-white">{request.code}</b>. It will be checked as soon as your payment is confirmed.
      </p>
      <PremiumPayment code={request.code} amount={request.price_uzs} />
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/writing/premium" className="btn-secondary">My AI Premium checks</Link>
        <Link href="/writing" className="btn-secondary">Back to Writing</Link>
      </div>
    </main>
  );
}
