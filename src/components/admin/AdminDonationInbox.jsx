"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { donationSupportRepository } from "@/lib/supabase/repositories/donation-support.repository";

const labels = { pending: "Awaiting review", confirmed: "Confirmed", not_confirmed: "Not confirmed", needs_info: "Needs information" };
const selectClass = "min-h-11 rounded-lg border border-white/15 bg-slate-950 px-3 text-sm text-slate-100";

export default function AdminDonationInbox() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [images, setImages] = useState({});
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const conversations = await donationSupportRepository.listAdmin();
      setRows(conversations);
      setSelectedId((current) => conversations.some((row) => row.id === current) ? current : conversations[0]?.id || null);
      const paths = conversations.flatMap((row) => row.donation_messages || []).filter((message) => message.attachment_path).map((message) => message.attachment_path);
      const signed = await Promise.all(paths.map(async (path) => [path, await donationSupportRepository.signedImage(path)]));
      setImages(Object.fromEntries(signed));
    } catch (cause) { setError(cause.message || "Donation inbox could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const selected = useMemo(() => rows.find((row) => row.id === selectedId) || null, [rows, selectedId]);
  const messages = useMemo(() => [...(selected?.donation_messages || [])].sort((a,b) => new Date(a.created_at)-new Date(b.created_at)), [selected]);

  async function reply(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!selected || !body || busy) return;
    setBusy(true); setError("");
    try { await donationSupportRepository.sendMessage(selected.id, user.id, body, true); setDraft(""); await load(); }
    catch (cause) { setError(cause.message || "Reply could not be sent."); }
    finally { setBusy(false); }
  }

  async function updateStatus(status) {
    if (!selected) return;
    setBusy(true); setError("");
    try { await donationSupportRepository.setStatus(selected.id, status); await load(); }
    catch (cause) { setError(cause.message || "Status could not be updated."); }
    finally { setBusy(false); }
  }

  if (loading) return <p className="text-slate-300">Loading donation inbox…</p>;
  return <div className="space-y-5">
    <header><h1 className="text-2xl font-bold text-white">Donation inbox</h1><p className="mt-1 text-sm text-slate-400">Review submitted screenshots and reply in a private donation thread.</p></header>
    {error && <p role="alert" className="rounded-lg border border-rose-300/30 bg-rose-950/40 p-3 text-sm text-rose-100">{error}</p>}
    <div className="grid min-h-[65vh] gap-4 lg:grid-cols-[minmax(250px,0.8fr)_minmax(0,1.6fr)]">
      <aside className="space-y-2 rounded-xl border border-white/10 bg-slate-900/60 p-3">
        <h2 className="px-2 py-1 text-sm font-semibold text-slate-300">Submissions ({rows.length})</h2>
        {rows.length === 0 ? <p className="p-2 text-sm text-slate-400">No donation screenshots yet.</p> : rows.map((row) => <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} className={`w-full rounded-lg border p-3 text-left ${row.id === selectedId ? "border-cyan-400/60 bg-cyan-950/40" : "border-white/10 bg-slate-950/60 hover:bg-slate-800"}`}><span className="block truncate font-medium text-white">{row.owner?.full_name || row.owner?.username || row.owner?.email || "User"}</span><span className="mt-1 block text-xs text-slate-400">{new Date(row.created_at).toLocaleString()}</span><span className="mt-2 inline-block rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">{labels[row.status] || row.status}</span></button>)}
      </aside>
      <section className="flex min-h-[60vh] flex-col rounded-xl border border-white/10 bg-slate-900/60 p-4 sm:p-5">
        {!selected ? <p className="m-auto text-slate-400">Select a submission to review.</p> : <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><div><h2 className="font-semibold text-white">{selected.owner?.full_name || selected.owner?.username || "Donation submission"}</h2><p className="text-sm text-slate-400">{selected.owner?.email || selected.user_id}</p></div><label className="text-xs text-slate-400">Review status<select aria-label="Donation review status" className={`${selectClass} ml-2`} value={selected.status} disabled={busy} onChange={(event) => updateStatus(event.target.value)}>{Object.entries(labels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
          <div className="flex-1 space-y-4 overflow-y-auto py-4">{messages.map((message) => <article key={message.id} className={`max-w-3xl rounded-xl p-4 ${message.is_from_admin ? "ml-auto bg-cyan-950/60" : "bg-slate-800"}`}><p className="mb-1 text-xs font-semibold text-slate-300">{message.is_from_admin ? "Admin reply" : "User submission"} · {new Date(message.created_at).toLocaleString()}</p>{message.body && <p className="whitespace-pre-wrap text-slate-100">{message.body}</p>}{message.attachment_path && images[message.attachment_path] && <a href={images[message.attachment_path]} target="_blank" rel="noreferrer"><img className="mt-3 max-h-[30rem] rounded-lg object-contain" src={images[message.attachment_path]} alt="Submitted payment screenshot" /></a>}</article>)}</div>
          <form onSubmit={reply} className="flex gap-2 border-t border-white/10 pt-4"><label className="sr-only" htmlFor="donation-reply">Reply to user</label><textarea id="donation-reply" className="min-h-12 min-w-0 flex-1 resize-y rounded-lg border border-white/15 bg-slate-950 p-3 text-slate-100" rows={2} maxLength={5000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a private reply…" /><button disabled={busy || !draft.trim()} className="min-h-12 self-end rounded-lg bg-cyan-500 px-4 font-semibold text-slate-950 disabled:opacity-50">Reply</button></form>
        </>}
      </section>
    </div>
  </div>;
}
