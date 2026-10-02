"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LifeBuoy, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ticketsRepository, validateTicketInput } from "@/lib/supabase/repositories/tickets.repository";
import { OPEN_HELP_EVENT } from "@/lib/help-dialog";
import { useModalAccessibility } from "@/hooks/useModalAccessibility";

const PENDING_KEY = "support-ticket-pending-v1";
const blankForm = () => ({ category: "bug", severity: "medium", subject: "", body: "", reproduction_steps: "", expected_behavior: "", actual_behavior: "", page_url: "" });
const fieldClass = "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60";

function readPending() {
  try { return JSON.parse(window.localStorage.getItem(PENDING_KEY) || "null"); } catch { return null; }
}

export default function ReportIssueButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [guestPrompt, setGuestPrompt] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ticketKey = useRef(null);
  const messageKey = useRef(null);
  const restoredForUser = useRef(null);
  const floatingButtonRef = useRef(null);
  const returnFocusRef = useRef(null);
  const guestCloseButtonRef = useRef(null);
  const ticketCloseButtonRef = useRef(null);
  const guestDialogRef = useModalAccessibility(guestPrompt, () => setGuestPrompt(false), guestCloseButtonRef, returnFocusRef);
  const ticketDialogRef = useModalAccessibility(open, () => { if (!busy) setOpen(false); }, ticketCloseButtonRef, returnFocusRef);

  const isReadingPage = pathname?.startsWith("/reading/") || pathname === "/reading";
  const showFloatingHelp = !isReadingPage && !pathname?.startsWith("/admin");

  const restorePending = useCallback((userId, showDialog = true) => {
    const saved = readPending();
    if (!saved) return false;
    if (saved.userId !== userId) {
      window.localStorage.removeItem(PENDING_KEY);
      return false;
    }
    if (!saved.ticketKey || !saved.messageKey || !saved.form || typeof saved.form.body !== "string") {
      window.localStorage.removeItem(PENDING_KEY);
      return false;
    }
    setPending(saved);
    setForm(saved.form);
    ticketKey.current = saved.ticketKey;
    messageKey.current = saved.messageKey;
    if (showDialog) setOpen(true);
    return true;
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      // Auth has finished loading, so this is a real signed-out state.
      window.localStorage.removeItem(PENDING_KEY);
      setPending(null);
      setOpen(false);
      restoredForUser.current = null;
      return;
    }
    if (user.is_anonymous) {
      setPending(null);
      setOpen(false);
      restoredForUser.current = null;
      return;
    }
    if (restoredForUser.current === user.id) return;
    restoredForUser.current = user.id;
    restorePending(user.id, true);
  }, [isLoading, user, restorePending]);

  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;
    mainContent.classList.toggle("pb-24", showFloatingHelp);
    return () => mainContent.classList.remove("pb-24");
  }, [showFloatingHelp]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const start = useCallback((trigger = floatingButtonRef.current) => {
    returnFocusRef.current = trigger || document.activeElement;
    if (!user || user.is_anonymous) { setGuestPrompt(true); return; }
    if (restorePending(user.id, true)) return;
    setForm(blankForm()); setError(""); setPending(null);
    ticketKey.current = crypto.randomUUID();
    messageKey.current = crypto.randomUUID();
    setOpen(true);
  }, [restorePending, user]);

  useEffect(() => {
    const openHelp = (event) => {
      returnFocusRef.current = event.detail?.trigger || document.activeElement;
      if (!user || user.is_anonymous) setGuestPrompt(true);
      else start(event.detail?.trigger);
    };
    window.addEventListener(OPEN_HELP_EVENT, openHelp);
    return () => window.removeEventListener(OPEN_HELP_EVENT, openHelp);
  }, [user, start]);

  function discardPendingDraft() {
    if (!pending || pending.ticketId !== null || busy) return;
    window.localStorage.removeItem(PENDING_KEY);
    setPending(null);
    setForm(blankForm());
    setError("");
    ticketKey.current = crypto.randomUUID();
    messageKey.current = crypto.randomUUID();
  }

  async function finishPending(record) {
    if (busy) return;
    setBusy(true); setError("");
    let current = record;
    try {
      if (!current.ticketId) {
        const ticket = await ticketsRepository.createTicket(current.form, user, profile, current.ticketKey);
        current = { ...current, ticketId: ticket.id };
        window.localStorage.setItem(PENDING_KEY, JSON.stringify(current));
        setPending(current);
      }
      await ticketsRepository.addOpeningMessage(current.ticketId, current.userId, current.form.body, current.messageKey);
      window.localStorage.removeItem(PENDING_KEY);
      setPending(null); setOpen(false); setError("");
      router.push(`/my-feedback?ticket=${current.ticketId}`);
    } catch (cause) {
      const ticketExists = Boolean(current.ticketId);
      setError(`${ticketExists ? "You have an unfinished request. Its ticket is saved; retry only the opening message." : "The request could not be confirmed. Retry safely; the same idempotency key will be reused."} ${cause?.message || "Please try again."}`);
    } finally { setBusy(false); }
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (pending) { await finishPending(pending); return; }
    const input = { ...form, page_url: window.location.href };
    const validation = validateTicketInput(input);
    if (Object.keys(validation).length) { setError(Object.values(validation)[0]); return; }
    const record = {
      userId: user.id,
      ticketId: null,
      ticketKey: ticketKey.current || crypto.randomUUID(),
      messageKey: messageKey.current || crypto.randomUUID(),
      form: input,
    };
    // Persist before network I/O: after an ambiguous ticket insert, retrying
    // uses the same ticket key and resolves to the existing ticket if saved.
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(record));
    ticketKey.current = record.ticketKey;
    messageKey.current = record.messageKey;
    setPending(record); setForm(input);
    await finishPending(record);
  }

  const loginUrl = `/login?next=${encodeURIComponent(pathname || "/")}`;
  if (pathname?.startsWith("/admin")) return null;
  return <>
    {showFloatingHelp && <button ref={floatingButtonRef} type="button" onClick={() => start()} className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-xl hover:bg-brand-600 sm:bottom-6 sm:right-6 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3" aria-label="Get help or report an issue" title="Help"><LifeBuoy size={20} aria-hidden="true" /><span className="hidden sm:inline">Help</span></button>}
    {guestPrompt && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setGuestPrompt(false); }}><section ref={guestDialogRef} role="dialog" aria-modal="true" aria-labelledby="guest-help-title" tabIndex={-1} className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-5 text-white shadow-2xl"><div className="flex items-start justify-between gap-3"><h2 id="guest-help-title" className="text-lg font-semibold">Please sign up or sign in to send feedback</h2><button ref={guestCloseButtonRef} type="button" onClick={() => setGuestPrompt(false)} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-white/10"><X size={18} /></button></div><p className="mt-2 text-sm text-slate-400">Your request and replies are saved to your account.</p><Link href={loginUrl} onClick={() => setGuestPrompt(false)} className="mt-5 block rounded-lg bg-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-600">Sign in or sign up</Link></section></div>}
    {open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
      <section ref={ticketDialogRef} role="dialog" aria-modal="true" aria-labelledby="help-title" tabIndex={-1} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface p-5 text-slate-100 shadow-2xl sm:p-7">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-4 flex shrink-0 items-start justify-between gap-3 bg-surface px-5 pb-4 pt-5 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-7"><div><h2 id="help-title" className="text-2xl font-bold">How can we help?</h2><p className="mt-1 text-sm text-slate-400">Your request and replies will be available in My feedback.</p>{user && !user.is_anonymous && <Link href="/my-feedback" onClick={() => setOpen(false)} className="mt-3 inline-block text-sm text-brand-300 underline">View my feedback</Link>}{pending && <p role="status" className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">You have an unfinished request. Retry its opening message to finish sending it.</p>}</div><button ref={ticketCloseButtonRef} type="button" disabled={busy} onClick={() => setOpen(false)} aria-label="Close help form" className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/10 disabled:opacity-40"><X size={20} /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-3">
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        <form id="help-request-form" onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Type<select disabled={Boolean(pending) || busy} name="category" value={form.category} onChange={update} className={fieldClass}><option value="bug">Report a bug</option><option value="feature">Suggest a feature</option><option value="incorrect_answer">Incorrect answer</option><option value="general">General feedback</option><option value="support">Account or other support</option></select></label><label className="text-sm">Severity<select disabled={Boolean(pending) || busy} name="severity" value={form.severity} onChange={update} className={fieldClass}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label></div>
          <label className="block text-sm">Subject<input disabled={Boolean(pending) || busy} name="subject" maxLength={200} required value={form.subject} onChange={update} className={fieldClass} /></label>
          <label className="block text-sm">What would you like us to know?<textarea disabled={Boolean(pending) || busy} name="body" maxLength={10000} required rows={4} value={form.body} onChange={update} className={fieldClass} /></label>
          <label className="block text-sm">Reproduction steps<textarea disabled={Boolean(pending) || busy} name="reproduction_steps" maxLength={10000} rows={3} value={form.reproduction_steps} onChange={update} className={fieldClass} /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Expected behavior<textarea disabled={Boolean(pending) || busy} name="expected_behavior" maxLength={5000} rows={3} value={form.expected_behavior} onChange={update} className={fieldClass} /></label><label className="text-sm">Actual behavior<textarea disabled={Boolean(pending) || busy} name="actual_behavior" maxLength={5000} rows={3} value={form.actual_behavior} onChange={update} className={fieldClass} /></label></div>
          <p className="break-all text-xs text-slate-500">Page attached automatically: {form.page_url || (typeof window !== "undefined" ? window.location.href : "")}</p>
          {pending && pending.ticketId === null && <button type="button" disabled={busy} onClick={discardPendingDraft} className="w-full rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50">Discard draft</button>}
        </form>
        </div>
        <div className="shrink-0 border-t border-white/10 bg-surface pt-4">
          <button form="help-request-form" type="submit" disabled={busy} className="w-full rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white hover:bg-brand-600 disabled:cursor-wait disabled:opacity-50">{busy ? "Saving…" : pending ? "Retry opening message" : "Send request"}</button>
        </div>
      </section>
    </div>}
  </>;
}
