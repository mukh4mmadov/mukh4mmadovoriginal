"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Heart, ImagePlus, MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { donationSupportRepository } from "@/lib/supabase/repositories/donation-support.repository";

const CARD_NUMBER = "9860160142902313";
const CARDHOLDER_NAME = "Muhammadov Ozodbek";
const statusLabels = { pending: "Awaiting review", confirmed: "Donation confirmed", not_confirmed: "Not confirmed", needs_info: "Reply from admin" };
const panel = "rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl sm:p-7";

export default function SupportPage() {
  const { user, isLoading, isGuest } = useAuth();
  const [threads, setThreads] = useState([]);
  const [signedImages, setSignedImages] = useState({});
  const [file, setFile] = useState(null);
  const [proofConsent, setProofConsent] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const canUseChat = Boolean(user && !isGuest && !user.is_anonymous);

  const loadThreads = useCallback(async () => {
    if (!canUseChat) return;
    try {
      const rows = await donationSupportRepository.listMine();
      setThreads(rows);
      const paths = rows.flatMap((row) => row.donation_messages || []).filter((m) => m.attachment_path).map((m) => m.attachment_path);
      const pairs = await Promise.all(paths.map(async (path) => [path, await donationSupportRepository.signedImage(path)]));
      setSignedImages(Object.fromEntries(pairs));
    } catch (cause) { setError(cause.message || "Could not load your donation messages."); }
  }, [canUseChat]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  async function copyCard() {
    setError("");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CARD_NUMBER);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      let copied = false;
      const field = document.createElement("textarea");
      field.value = CARD_NUMBER;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      try {
        field.select();
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      } finally {
        field.remove();
      }

      if (copied) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } else {
        setError("Copy was blocked. Select the card number and copy it manually.");
      }
    }
  }

  async function submitProof(event) {
    event.preventDefault();
    if (!file || !proofConsent || !canUseChat || busy) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG, or WebP image up to 5 MB."); return;
    }
    setBusy(true); setError("");
    try { await donationSupportRepository.submitProof(user.id, file); setFile(null); setProofConsent(false); setFileInputKey((key) => key + 1); await loadThreads(); }
    catch (cause) { setError(cause.message || "Screenshot could not be sent."); }
    finally { setBusy(false); }
  }

  async function sendReply(event, threadId) {
    event.preventDefault();
    const body = (drafts[threadId] || "").trim();
    if (!body || busy) return;
    setBusy(true); setError("");
    try { await donationSupportRepository.sendMessage(threadId, user.id, body); setDrafts((old) => ({ ...old, [threadId]: "" })); await loadThreads(); }
    catch (cause) { setError(cause.message || "Message could not be sent."); }
    finally { setBusy(false); }
  }

  return <main className="support-experience min-h-screen w-full overflow-x-clip bg-slate-950 px-4 py-10 text-slate-100 sm:py-14">
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-8">
      <header className="text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300"><Heart size={28} /></span>
        <h1 className="mt-4 break-words text-3xl font-bold sm:text-4xl">Support the project</h1>
        <p className="mx-auto mt-3 max-w-full text-balance text-slate-300 sm:max-w-2xl">Your support helps us keep improving free IELTS practice. You can also join the community and share suggestions.</p>
      </header>

      <section className={panel}>
        <h2 className="text-xl font-semibold">Make a donation</h2>
        <p className="mt-2 text-slate-300">Send any amount to the card below. After transferring, upload a payment screenshot so the admin can review it.</p>
        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs uppercase tracking-wider text-slate-400">Card number</p><p className="mt-1 font-mono text-xl tracking-wider sm:text-2xl">9860 1601 4290 2313</p>{CARDHOLDER_NAME && <p className="mt-2 text-sm text-slate-300">Cardholder: {CARDHOLDER_NAME}</p>}</div>
          <button onClick={copyCard} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 font-medium hover:bg-white/10" type="button">{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Copied" : "Copy number"}</button>
        </div>
        <p className="mt-3 text-sm text-slate-400">Please hide unrelated personal or card details in the screenshot. A screenshot is reviewed by the admin; it does not automatically verify a payment.</p>
        <a className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-cyan-500 px-4 font-semibold text-slate-950 hover:bg-cyan-400" href="https://t.me/mukh4mmadovIELTS" target="_blank" rel="noreferrer"><Send size={18} />Join our Telegram group</a>
      </section>

      <section className={panel}>
        <div className="flex items-center gap-3"><ImagePlus className="text-cyan-300" /><div><h2 className="text-xl font-semibold">Send payment screenshot</h2><p className="mt-1 text-sm text-slate-300">Screenshot only is enough. Admin replies here if needed.</p></div></div>
        {isLoading ? <p className="mt-5 text-slate-300">Checking your account...</p> : !canUseChat ? <div className="mt-5 rounded-xl bg-slate-950 p-4 text-slate-300"><p>Sign in to submit a screenshot and receive a private reply from the admin.</p><Link className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-cyan-500 px-4 font-semibold text-slate-950" href="/login?next=%2Fsupport">Sign in to continue</Link></div> : <form onSubmit={submitProof} className="mt-5 space-y-4"><label className="block text-sm font-medium">Payment screenshot<input key={fileInputKey} className="mt-2 block w-full rounded-lg border border-white/15 bg-slate-950 p-3 text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><label className="flex items-start gap-3 rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300"><input type="checkbox" checked={proofConsent} onChange={(event) => setProofConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-500" /><span>I understand this screenshot is visible to the site admin and scheduled for deletion 3 months after review is resolved. Donation chat messages are retained separately. I have hidden unrelated personal or card details.</span></label><button disabled={!file || !proofConsent || busy} className="min-h-11 rounded-lg bg-cyan-500 px-5 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Sending..." : "Send screenshot"}</button></form>}
        {error && <p role="alert" className="mt-4 rounded-lg border border-rose-300/30 bg-rose-950/40 p-3 text-sm text-rose-100">{error}</p>}
      </section>

      {canUseChat && <section className="space-y-4"><h2 className="text-2xl font-bold">Your donation messages</h2>{threads.length === 0 ? <div className={panel}><p className="text-slate-300">No donation screenshots sent yet.</p></div> : threads.map((thread) => <article key={thread.id} className={panel}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Donation review</h3><span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">{statusLabels[thread.status] || thread.status}</span></div><div className="mt-4 space-y-3">{[...(thread.donation_messages || [])].sort((a,b) => new Date(a.created_at)-new Date(b.created_at)).map((message) => <div key={message.id} className={`max-w-2xl rounded-xl p-4 ${message.is_from_admin ? "bg-cyan-950/70" : "bg-slate-800"}`}><p className="mb-1 text-xs font-semibold text-slate-300">{message.is_from_admin ? "Admin" : "You"}</p>{message.body && <p className="whitespace-pre-wrap text-slate-100">{message.body}</p>}{message.attachment_path && signedImages[message.attachment_path] && <a href={signedImages[message.attachment_path]} target="_blank" rel="noreferrer"><img className="mt-2 max-h-80 rounded-lg object-contain" src={signedImages[message.attachment_path]} alt="Your submitted payment screenshot" /></a>}</div>)}</div><form className="mt-4 flex gap-2" onSubmit={(event) => sendReply(event, thread.id)}><label className="sr-only" htmlFor={`reply-${thread.id}`}>Reply to admin</label><input id={`reply-${thread.id}`} className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/15 bg-slate-950 px-3 text-slate-100" value={drafts[thread.id] || ""} onChange={(event) => setDrafts((old) => ({ ...old, [thread.id]: event.target.value }))} maxLength={5000} placeholder="Write a message..." /><button disabled={busy || !(drafts[thread.id] || "").trim()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-cyan-500 px-4 font-semibold text-slate-950 disabled:opacity-50"><MessageCircle size={17} /><span className="hidden sm:inline">Send</span></button></form></article>)}</section>}
      <p className="text-center text-sm text-slate-400">Need help with something else? <Link className="text-cyan-300 underline" href="/contact">Contact us</Link>.</p>
    </div>
  </main>;
}
