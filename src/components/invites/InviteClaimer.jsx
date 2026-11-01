"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { CLAIM_MESSAGES, clearPendingInvite, isFinalClaimResult, readPendingInvite } from "@/lib/invites/invites.mjs";
import { claimInvite } from "@/lib/invites/invites-client";

export const INVITE_SAVED_EVENT = "ielts-invite-saved";

const TONES = {
  success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  info: "border-brand-400/30 bg-brand-500/15 text-brand-100",
  warning: "border-amber-400/30 bg-amber-500/15 text-amber-100",
};

// After a friend opens an invite link and signs in, sends the saved code to
// the database once and shows the answer.
export default function InviteClaimer() {
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const [message, setMessage] = useState(null);
  const busy = useRef(false);

  const claim = useCallback(async () => {
    if (!accountUserId || busy.current) return;
    const code = readPendingInvite(window.localStorage);
    if (!code) return;
    busy.current = true;
    try {
      const result = await claimInvite(code);
      if (isFinalClaimResult(result)) {
        clearPendingInvite(window.localStorage);
        setMessage({ ...CLAIM_MESSAGES[result], joined: result === "joined" });
      }
    } catch (error) {
      // Kept for the next visit; the database may be briefly unreachable.
      console.warn("Invite could not be claimed yet:", error?.message || error);
    } finally {
      busy.current = false;
    }
  }, [accountUserId]);

  useEffect(() => {
    void claim();
    const onSaved = () => void claim();
    window.addEventListener(INVITE_SAVED_EVENT, onSaved);
    return () => window.removeEventListener(INVITE_SAVED_EVENT, onSaved);
  }, [claim]);

  if (!message) return null;
  return (
    <div role="status" className={`ielts-site-announcement border-b ${TONES[message.tone] || TONES.info}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <Gift size={16} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1">
          {message.text}
          {message.joined && <> <Link href="/full-mock" className="font-semibold underline underline-offset-2">Start a test</Link></>}
        </p>
        <button type="button" onClick={() => setMessage(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-white/10" aria-label="Dismiss invite message">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
