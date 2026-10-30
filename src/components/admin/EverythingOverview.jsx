"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { formatUzs } from "@/lib/writing/premium.mjs";

const WEEK_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const count = (table, build = (query) => query) => build(supabase.from(table).select("*", { count: "exact", head: true }));

// One count per feature (all time and the last 7 days), each linking to the
// admin page where the records can be opened.
const CARDS = [
  { label: "Registered learners", href: "/admin/users", all: () => count("profiles", (q) => q.eq("is_guest", false)), week: (since) => count("profiles", (q) => q.eq("is_guest", false).gte("created_at", since)) },
  { label: "Passages finished", href: "/admin/analytics", all: () => count("reading_history"), week: (since) => count("reading_history", (q) => q.gte("completed_at", since)) },
  { label: "Reading mocks", href: "/admin/readingmock-results", all: () => count("reading_mock_attempts"), week: (since) => count("reading_mock_attempts", (q) => q.gte("completed_at", since)) },
  { label: "Listening tests", href: "/admin/listening-results", all: () => count("listening_attempts"), week: (since) => count("listening_attempts", (q) => q.gte("completed_at", since)) },
  { label: "Writing feedback", href: "/admin/writing", all: () => count("writing_submissions"), week: (since) => count("writing_submissions", (q) => q.gte("created_at", since)) },
  { label: "Full mocks", href: "/admin/full-mocks", all: () => count("full_mock_results"), week: (since) => count("full_mock_results", (q) => q.gte("completed_at", since)) },
  { label: "AI coach messages", href: "/admin/analytics", all: () => count("ai_chat_history"), week: (since) => count("ai_chat_history", (q) => q.gte("created_at", since)) },
  { label: "Saved words", href: "/admin/users", all: () => count("vocabulary_items", (q) => q.is("removed_at", null)) },
  { label: "Mistakes in review queues", href: "/admin/users", all: () => count("review_queue_items", (q) => q.is("removed_at", null)) },
  { label: "Push notification devices", href: "/admin/announcements", all: () => count("push_subscriptions") },
  { label: "Open support tickets", href: "/admin/support", all: () => count("support_tickets", (q) => q.neq("status", "resolved")) },
];

export default function EverythingOverview() {
  const [values, setValues] = useState(null);
  const [premium, setPremium] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const since = WEEK_AGO();
    Promise.all(CARDS.map(async (card) => {
      const [all, week] = await Promise.all([card.all(), card.week ? card.week(since) : Promise.resolve(null)]);
      return { all: all.error ? null : all.count, week: week && !week.error ? week.count : null };
    })).then((results) => { if (active) setValues(results); });
    supabase.from("premium_writing_requests").select("status, price_uzs, credits_used").then(({ data, error }) => {
      if (!active || error) return;
      const summary = { awaiting_payment: 0, paid: 0, done: 0, rejected: 0, revenue: 0 };
      for (const row of data || []) {
        summary[row.status] = (summary[row.status] || 0) + 1;
        if ((row.status === "paid" || row.status === "done") && !row.credits_used) summary.revenue += Number(row.price_uzs) || 0;
      }
      // Bundle sales count once, when the order is paid; checks paid with
      // credits are not counted again.
      supabase.from("premium_credit_orders").select("price_uzs, status").eq("status", "paid").then(({ data: orders }) => {
        if (!active) return;
        setPremium({ ...summary, revenue: summary.revenue + (orders || []).reduce((sum, order) => sum + (Number(order.price_uzs) || 0), 0) });
      });
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="mb-8" aria-labelledby="everything-title">
      <h2 id="everything-title" className="mb-3 text-xl font-bold text-white">Everything at a glance</h2>
      {premium && (
        <Link href="/admin/writing-premium" className="mb-4 grid gap-3 rounded-xl border border-amber-400/30 bg-amber-500/[0.06] p-4 hover:bg-amber-500/10 sm:grid-cols-5">
          {[
            ["AI Premium revenue", formatUzs(premium.revenue)],
            ["Waiting for payment", premium.awaiting_payment],
            ["Paid · to check", premium.paid],
            ["Done", premium.done],
            ["Rejected", premium.rejected],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs uppercase tracking-wide text-amber-200">{label}</p>
              <p className={`mt-1 text-xl font-bold ${label === "Paid · to check" && premium.paid ? "text-amber-300" : "text-white"}`}>{value}</p>
            </div>
          ))}
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {CARDS.map((card, index) => {
          const value = values?.[index];
          return (
            <Link key={card.label} href={card.href} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-brand-400/40">
              <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{value == null ? "…" : value.all == null ? "—" : value.all.toLocaleString()}</p>
              {card.week && value?.week != null && <p className="text-xs text-emerald-300">+{value.week.toLocaleString()} in 7 days</p>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
