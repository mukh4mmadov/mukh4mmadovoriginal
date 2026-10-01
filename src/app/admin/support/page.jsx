"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ticketsRepository } from "@/lib/supabase/repositories/tickets.repository";
import { ticketNeedsReply } from "@/lib/support/tickets";

const statuses = ["new", "in_progress", "waiting_on_learner", "resolved"];
const categories = ["bug", "feature", "incorrect_answer", "general", "support"];
const readable = (value) => String(value || "").replaceAll("_", " ");
const inputClass = "rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100";

export default function AdminSupportInbox() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [draftKey, setDraftKey] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const selectedIdRef = useRef(null);
  const initialSelectionHandled = useRef(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const rows = await ticketsRepository.listAdminTickets({ status, category });
      setTickets(rows);
      const currentId = selectedIdRef.current;
      let nextId = rows.some((ticket) => ticket.id === currentId) ? currentId : null;
      if (!initialSelectionHandled.current) {
        const requestedId = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("ticket");
        if (requestedId && rows.some((ticket) => ticket.id === requestedId)) nextId = requestedId;
        initialSelectionHandled.current = true;
      }
      if (!nextId) nextId = rows[0]?.id || null;
      selectedIdRef.current = nextId;
      setSelectedId(nextId);
    } catch (cause) { setError(cause.message || "Support inbox could not be loaded."); }
    finally { setLoading(false); }
  }, [status, category]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { ticketsRepository.listAdmins().then(setAdmins).catch((cause) => setError(cause.message || "Admin assignees could not be loaded.")); }, []);

  const selected = useMemo(() => tickets.find((ticket) => ticket.id === selectedId) || null, [tickets, selectedId]);
  const selectedMessages = useMemo(() => [...(selected?.messages || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)), [selected]);
  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tickets;
    return tickets.filter((ticket) => [ticket.subject, ticket.owner?.full_name, ticket.owner?.username, ticket.owner?.email,
      ...(ticket.messages || []).map((message) => message.body)].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [tickets, search]);

  function selectTicket(ticketId) {
    selectedIdRef.current = ticketId;
    setSelectedId(ticketId);
    const url = new URL(window.location.href);
    url.searchParams.set("ticket", ticketId);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function changeDraft(value) { setDraft(value); setDraftKey((current) => current?.body === value ? current : { body: value, key: crypto.randomUUID() }); }
  async function reply(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!selected || !body || busy) return;
    const key = draftKey?.body === draft ? draftKey.key : crypto.randomUUID();
    setDraftKey({ body: draft, key }); setBusy(true); setError("");
    try {
      await ticketsRepository.addAdminMessage(selected.id, user.id, body, key);
      setDraft(""); setDraftKey(null); await load();
    } catch (cause) { setError(`Reply was not confirmed as saved. Your draft is kept; retry. ${cause.message || ""}`); }
    finally { setBusy(false); }
  }
  async function update(values) {
    if (!selected) return;
    setBusy(true); setError("");
    try { await ticketsRepository.updateTicket(selected.id, values); await load(); }
    catch (cause) { setError(cause.message || "Ticket changes could not be saved."); }
    finally { setBusy(false); }
  }

  return <div>
    <header className="mb-6"><h1 className="text-3xl font-bold text-white">Support inbox</h1><p className="mt-2 text-slate-400">Tickets, feedback, and learner replies in one place.</p></header>
    <div className="mb-5 flex flex-wrap gap-3"><input aria-label="Search support tickets" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subject, learner, or message" className={`${inputClass} min-w-64 flex-1`} /><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select><select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}><option value="all">All categories</option>{categories.map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></div>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error} <button type="button" onClick={load} className="ml-2 underline">Retry</button></p>}
    {loading ? <p className="text-slate-400">Loading tickets…</p> : <div className="grid min-h-[65vh] gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.8fr)]">
      <aside className="max-h-[75vh] space-y-2 overflow-y-auto rounded-xl border border-white/10 p-2" aria-label="Support tickets">
        {filteredTickets.map((ticket) => {
          const needsReply = ticketNeedsReply(ticket);
          return <button type="button" key={ticket.id} onClick={() => selectTicket(ticket.id)} className={`w-full rounded-lg border p-3 text-left ${selectedId === ticket.id ? "border-brand-400/50 bg-brand-500/10" : "border-transparent hover:bg-white/5"}`}>
            <div className="flex items-start justify-between gap-2"><span className="truncate font-semibold text-white">{ticket.subject}</span>{needsReply && <span className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">Needs reply</span>}</div>
            <p className="mt-1 truncate text-xs text-slate-400">{ticket.owner?.full_name || ticket.owner?.username || ticket.owner?.email || ticket.contact_email} · {readable(ticket.category)}</p><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{readable(ticket.status)}</span><time>{new Date(ticket.updated_at).toLocaleString()}</time></div>
          </button>;
        })}
        {tickets.length === 200 && <p className="p-3 text-xs text-amber-200">Showing the latest 200 tickets.</p>}
        {filteredTickets.length === 0 && <p className="p-5 text-sm text-slate-400">No tickets match these filters.</p>}
      </aside>
      {!selected ? <div className="flex items-center justify-center rounded-xl border border-white/10 p-8 text-center text-slate-400">Select a ticket to view its thread.</div> : <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10">
        <header className="border-b border-white/10 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wide text-slate-500">{readable(selected.category)} · {selected.severity}</p><h2 className="mt-1 text-xl font-bold text-white">{selected.subject}</h2><p className="mt-1 text-sm text-slate-400">{selected.owner?.full_name || selected.owner?.username || "Learner"} · {selected.owner?.email}</p></div><label className="text-xs text-slate-400">Status<select disabled={busy} value={selected.status} onChange={(event) => update({ status: event.target.value })} className={`${inputClass} mt-1 block`}>
          {statuses.map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></label></div>
          <label className="mt-3 block max-w-xs text-xs text-slate-400">Assignee<select disabled={busy} value={selected.assignee_id || ""} onChange={(event) => update({ assignee_id: event.target.value || null })} className={`${inputClass} mt-1 block w-full`}><option value="">Unassigned</option>{admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.full_name || admin.username || admin.email}</option>)}</select></label>
          <TicketContext ticket={selected} />
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-label="Ticket conversation">{selectedMessages.length === 0 && <p className="rounded-lg bg-white/5 p-4 text-center text-sm text-slate-400">No messages in this ticket yet.</p>}{selectedMessages.map((message) => { const admin = message.sender_type === "admin"; const sender = message.sender; return <article key={message.id} className={`rounded-xl p-4 ${admin ? "ml-5 bg-brand-500/10" : "mr-5 bg-white/[0.06]"}`}><div className="flex justify-between gap-2 text-xs text-slate-400"><span className="font-semibold text-slate-200">{admin ? "Support team" : sender?.full_name || sender?.username || selected.owner?.full_name || selected.contact_name || "Learner"} {sender?.email && `· ${sender.email}`}</span><time>{new Date(message.created_at).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-100">{message.body}</p></article>; })}</div>
        <form onSubmit={reply} className="border-t border-white/10 p-4"><label htmlFor="admin-ticket-reply" className="text-sm font-medium text-slate-300">Reply to learner</label><textarea id="admin-ticket-reply" maxLength={10000} rows={3} value={draft} onChange={(event) => changeDraft(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Write a reply…" /><button type="submit" disabled={busy || !draft.trim()} className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Send reply"}</button></form>
      </section>}
    </div>}
  </div>;
}

function TicketContext({ ticket }) {
  return <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{[["Reproduction steps", ticket.reproduction_steps], ["Expected behavior", ticket.expected_behavior], ["Actual behavior", ticket.actual_behavior], ["Page URL", ticket.page_url]].filter(([, value]) => value).map(([label, value]) => { let safeUrl = false; if (label === "Page URL") { try { safeUrl = ["http:", "https:"].includes(new URL(value).protocol); } catch {} } return <div key={label} className="min-w-0"><p className="text-xs text-slate-500">{label}</p>{label === "Page URL" && safeUrl ? <a href={value} target="_blank" rel="noopener noreferrer" className="break-all text-brand-300 underline">{value}</a> : <p className="whitespace-pre-wrap break-words text-slate-200">{value}</p>}</div>; })}</div>;
}
