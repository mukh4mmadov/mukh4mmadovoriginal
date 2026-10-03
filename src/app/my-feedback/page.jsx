"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ticketsRepository } from "@/lib/supabase/repositories/tickets.repository";

const labels = { in_progress: "In progress", waiting_on_learner: "Waiting for your reply", resolved: "Resolved", new: "New" };

export default function MyFeedbackPage() {
  const { user, isLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState({});
  const [replyKeys, setReplyKeys] = useState({});
  const [sending, setSending] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    let timeoutId;
    try {
      const ticketsRequest = ticketsRepository.listLearnerTickets(user.id);
      const timeoutRequest = new Promise((_, reject) => { timeoutId = window.setTimeout(() => reject(new Error("This is taking longer than expected. Check your connection and retry.")), 12000); });
      setTickets(await Promise.race([ticketsRequest, timeoutRequest]));
    }
    catch (cause) { setError(cause.message || "Your requests could not be loaded."); }
    finally { window.clearTimeout(timeoutId); setLoading(false); }
  }, [user]);
  useEffect(() => { if (user) load(); else if (!isLoading) setLoading(false); }, [isLoading, user, load]);

  function edit(ticketId, value) {
    setDrafts((current) => ({ ...current, [ticketId]: value }));
    setReplyKeys((current) => ({ ...current, [ticketId]: current[ticketId]?.body === value ? current[ticketId] : { body: value, key: crypto.randomUUID() } }));
  }
  async function send(ticket) {
    const body = (drafts[ticket.id] || "").trim();
    if (!body || body.length > 10000 || sending) return;
    const savedKey = replyKeys[ticket.id]?.body === drafts[ticket.id] ? replyKeys[ticket.id].key : crypto.randomUUID();
    setReplyKeys((current) => ({ ...current, [ticket.id]: { body: drafts[ticket.id], key: savedKey } }));
    setSending(ticket.id); setError("");
    try {
      await ticketsRepository.reply(ticket.id, body, savedKey);
      setDrafts((current) => ({ ...current, [ticket.id]: "" }));
      setReplyKeys((current) => ({ ...current, [ticket.id]: null }));
      await load();
    } catch (cause) { setError(`Reply was not confirmed as saved. Your text is kept; retry with the same key. ${cause.message || ""}`); }
    finally { setSending(null); }
  }

  return <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-10 sm:px-6">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-brand-400">Support</p><h1 className="mt-1 text-3xl font-bold text-white">My feedback</h1><p className="mt-2 text-slate-400">Your requests and replies from the support team.</p></div><Link href="/" className="text-sm text-brand-300 hover:underline">Back to practice</Link></header>
    {!isLoading && !user ? <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center"><h2 className="text-xl font-semibold text-white">Sign in to view your requests</h2><p className="mt-2 text-slate-400">Support history is private to your account.</p><Link href="/login?next=%2Fmy-feedback" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand-500 px-5 font-semibold text-white">Sign in</Link></section> : null}
    {error && <div role="alert" className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"><p>{error}</p><button type="button" onClick={load} className="mt-2 underline">Retry loading</button></div>}
    {user && (loading ? <p role="status" className="text-slate-400">Loading your requests…</p> : tickets.length === 0 ? <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center"><h2 className="text-xl font-semibold text-white">No requests yet</h2><p className="mt-2 text-slate-400">Use the Help button whenever you need us.</p></section> : <div className="space-y-5">{tickets.map((ticket) => {
      const messages = [...(ticket.messages || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return <article key={ticket.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-5"><div><p className="text-xs uppercase tracking-wide text-slate-500">{ticket.category.replaceAll("_", " ")} · {ticket.severity}</p><h2 className="mt-1 text-lg font-semibold text-white">{ticket.subject}</h2></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{labels[ticket.status] || ticket.status}</span><p className="w-full text-xs text-slate-500">Updated {new Date(ticket.updated_at).toLocaleString()}</p></div>
        <div className="space-y-3 p-5">{messages.length === 0 && <p className="rounded-lg bg-white/5 p-4 text-center text-sm text-slate-400">This request has no message yet. Write one below.</p>}{messages.map((message) => <div key={message.id} className={`rounded-xl p-4 ${message.sender_type === "admin" ? "mr-5 bg-white/10" : "ml-5 bg-brand-500/15"}`}><p className="mb-2 text-xs font-semibold text-slate-300">{message.sender_type === "admin" ? "Support team" : "You"}</p><p className="whitespace-pre-wrap break-words text-sm text-slate-100">{message.body}</p><time className="mt-2 block text-right text-xs text-slate-500">{new Date(message.created_at).toLocaleString()}</time></div>)}</div>
        <form className="border-t border-white/10 p-5" onSubmit={(event) => { event.preventDefault(); send(ticket); }}><label className="block text-sm font-medium text-slate-300" htmlFor={`reply-${ticket.id}`}>Reply</label><textarea id={`reply-${ticket.id}`} value={drafts[ticket.id] || ""} maxLength={10000} rows={3} onChange={(event) => edit(ticket.id, event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Write a reply…" /><button type="submit" disabled={sending === ticket.id || !drafts[ticket.id]?.trim()} className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending === ticket.id ? "Sending…" : "Send reply"}</button></form>
      </article>;
    })}</div>)}
  </main>;
}
