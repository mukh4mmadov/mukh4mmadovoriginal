"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Gift, RefreshCw, Send, Share2, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import {
  INVITE_FRIENDS_PER_CREDIT, INVITE_MONTHLY_LIMIT, INVITE_NEW_ACCOUNT_DAYS, INVITE_STATUSES, INVITE_TESTS_NEEDED,
  inviteLink, inviteReward, inviteShareText, telegramShareLink,
} from "@/lib/invites/invites.mjs";
import { formatUzs, PREMIUM_PRICE_UZS } from "@/lib/writing/premium.mjs";
import { getMyInvite } from "@/lib/invites/invites-client";

const TONES = {
  brand: "border-brand-400/30 bg-brand-500/10 text-brand-200",
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  rose: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

function FriendStatus({ friend }) {
  const info = INVITE_STATUSES[friend.status] || INVITE_STATUSES.joined;
  const label = friend.status === "joined" ? `Joined · ${friend.testsDone}/${INVITE_TESTS_NEEDED} tests` : info.label;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${TONES[info.tone]}`}>{label}</span>;
}

export default function InviteFriends() {
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const load = useCallback(async () => {
    if (!accountUserId) return;
    setError("");
    try {
      setInvite(await getMyInvite());
    } catch (loadError) {
      console.error("Could not load invite:", loadError);
      setError("Your invite link could not be loaded. Please try again.");
    }
  }, [accountUserId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);

  const link = invite?.code && typeof window !== "undefined" ? inviteLink(window.location.origin, invite.code) : "";
  const reward = inviteReward(invite?.approved);
  const friends = Array.isArray(invite?.friends) ? invite.friends : [];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copying didn't work here. Select the link and copy it yourself.");
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: "IELTS practice", text: inviteShareText(link), url: link });
    } catch { /* cancelled */ }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400"><Gift size={14} aria-hidden="true" /> Invite friends</p>
      <h1 className="section-title mb-3">Invite friends, get free AI Premium checks</h1>
      <p className="section-subtitle mb-6 max-w-2xl">
        For every {INVITE_FRIENDS_PER_CREDIT} friends who join and finish {INVITE_TESTS_NEEDED} practice tests, you get 1 free AI Premium Writing check (worth {formatUzs(PREMIUM_PRICE_UZS)}).
      </p>

      {!isLoading && !accountUserId ? (
        <p className="surface-card text-sm text-slate-300">
          <Link href="/login?redirect=%2Finvite" className="font-semibold text-brand-300 underline">Sign in</Link> to get your invite link.
        </p>
      ) : (
        <>
          {error && <p role="alert" className="mb-4 text-sm text-rose-300">{error}</p>}

          <section className="surface-card mb-6" aria-labelledby="invite-link-title">
            <h2 id="invite-link-title" className="mb-3 text-lg font-bold text-slate-100">Your invite link</h2>
            {invite ? (
              <>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input readOnly value={link} onFocus={(event) => event.target.select()} aria-label="Your invite link" className="min-h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-slate-100" />
                  <button type="button" onClick={() => void copy()} className="btn-primary inline-flex items-center justify-center gap-2">
                    {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copied ? "Copied" : "Copy link"}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={telegramShareLink(link)} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-2"><Send size={16} aria-hidden="true" /> Share on Telegram</a>
                  {canShare && <button type="button" onClick={() => void share()} className="btn-secondary inline-flex items-center gap-2"><Share2 size={16} aria-hidden="true" /> Share…</button>}
                </div>
                <p className="mt-3 text-xs text-slate-400">Your code: <span className="font-mono tracking-widest text-slate-200">{invite.code}</span></p>
              </>
            ) : (
              !error && <p className="text-sm text-slate-400" role="status">Loading…</p>
            )}
          </section>

          <section className="surface-card mb-6" aria-labelledby="invite-reward-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="invite-reward-title" className="text-lg font-bold text-slate-100">Your reward</h2>
              <p className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
                Free checks earned: <b>{reward.credits}</b>
              </p>
            </div>
            <div className="mt-4" aria-label={`${reward.towardsNext} of ${INVITE_FRIENDS_PER_CREDIT} friends towards your next free check`}>
              <div className="flex gap-2">
                {Array.from({ length: INVITE_FRIENDS_PER_CREDIT }, (_, index) => (
                  <span key={index} className={`h-3 flex-1 rounded-full ${index < reward.towardsNext ? "bg-emerald-400" : "bg-white/10"}`} />
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {reward.towardsNext} of {INVITE_FRIENDS_PER_CREDIT} friends · {reward.needed} more for your next free check.
              </p>
            </div>
            {reward.credits > 0 && (
              <p className="mt-3 text-sm text-slate-300">
                Free checks are added to your AI Premium credits. <Link href="/writing/premium" className="font-semibold text-brand-300 underline">See my credits</Link>
              </p>
            )}
          </section>

          <section className="surface-card mb-6" aria-labelledby="invite-friends-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="invite-friends-title" className="flex items-center gap-2 text-lg font-bold text-slate-100"><Users size={20} className="text-brand-400" aria-hidden="true" /> Friends who joined</h2>
              <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5">
                <RefreshCw size={15} aria-hidden="true" /> Refresh
              </button>
            </div>
            {friends.length === 0 ? (
              <p className="text-sm text-slate-400">No friends yet. Send your link to classmates who are preparing for IELTS.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {friends.map((friend) => (
                  <li key={friend.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium text-slate-100">{friend.name}</p>
                      <p className="text-xs text-slate-400">Joined {new Date(friend.joinedAt).toLocaleDateString()}</p>
                    </div>
                    <FriendStatus friend={friend} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface-card" aria-labelledby="invite-rules-title">
            <h2 id="invite-rules-title" className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-100"><ShieldCheck size={20} className="text-brand-400" aria-hidden="true" /> How it works</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
              <li>Your friend opens your link and signs up with Google. Only new accounts count (created within {INVITE_NEW_ACCOUNT_DAYS} days, after yours).</li>
              <li>They finish {INVITE_TESTS_NEEDED} real practice tests: a Listening test or Reading mock with at least 10 correct, a Writing answer of 150+ words, or a full mock.</li>
              <li>We check every invite, then it counts. Every {INVITE_FRIENDS_PER_CREDIT} counted friends give you 1 free AI Premium check.</li>
            </ol>
            <p className="mt-4 text-sm text-slate-400">
              Fair play: invites from your own second accounts, your own phone or computer, or fake accounts don't count, and rewards from them can be removed. Up to {INVITE_MONTHLY_LIMIT} friends a month.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
