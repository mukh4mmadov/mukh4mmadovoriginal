"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Gift, RefreshCw, X } from "lucide-react";
import { AdminPageError, AdminPageLoading } from "@/components/admin/AdminPageStatus";
import { INVITE_FLAGS, INVITE_FRIENDS_PER_CREDIT, INVITE_STATUSES, INVITE_TESTS_NEEDED } from "@/lib/invites/invites.mjs";
import { adminListInvites, adminReviewInvite } from "@/lib/invites/invites-client";

const FILTERS = [
  { id: "qualified", label: "To check" },
  { id: "joined", label: "Joined · doing tests" },
  { id: "approved", label: "Counted" },
  { id: "rejected", label: "Not counted" },
  { id: "all", label: "All" },
];
const TONES = {
  brand: "border-brand-400/30 bg-brand-500/10 text-brand-200",
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  rose: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};
const buttonClass = "inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40";
const ADMIN_LABELS = { ...INVITE_STATUSES, qualified: { label: "To check", tone: "amber" } };

export default function AdminInvitesPage() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("qualified");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAll(await adminListInvites());
    } catch (loadError) {
      console.error("Could not load invites:", loadError);
      setError("Invites could not be loaded. If this is the first time, the invites database update may not be applied yet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => all.reduce((totals, row) => ({ ...totals, [row.status]: (totals[row.status] || 0) + 1 }), {}), [all]);
  const rows = filter === "all" ? all : all.filter((row) => row.status === filter);

  const review = async (row, approve) => {
    let note = null;
    if (!approve) {
      note = window.prompt(`Why doesn't ${row.invitee_name || "this friend"} count? (optional, the inviter doesn't see this)`, "");
      if (note === null) return;
    }
    setBusyId(row.id);
    try {
      await adminReviewInvite(row.id, approve, note);
      await load();
    } catch (reviewError) {
      setError(reviewError?.message || "The invite could not be updated.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading && all.length === 0 && !error) return <AdminPageLoading label="Loading invites" />;
  if (error && all.length === 0) return <AdminPageError message={error} onRetry={() => void load()} />;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Gift className="text-brand-400" size={28} aria-hidden="true" />
        <h1 className="text-3xl font-bold text-white">Invites</h1>
      </div>
      <ul className="mb-6 max-w-3xl list-disc space-y-1 pl-5 text-sm text-slate-400">
        <li>A friend moves to <b>To check</b> after {INVITE_TESTS_NEEDED} real tests and a day after signing up. Approve to count them, or Reject; every {INVITE_FRIENDS_PER_CREDIT} counted friends give the inviter 1 free AI Premium credit automatically.</li>
        <li>Already blocked automatically: own link, second account on the inviter&apos;s phone or computer, old accounts, guests, two people inviting each other, more than 20 a month.</li>
        <li>Warnings to look at: same Wi-Fi as the inviter, a device used by several friends, many friends from one network. Open the friend&apos;s profile to see their tests before approving.</li>
      </ul>
      {error && <p role="alert" className="mb-4 text-sm text-rose-300">{error}</p>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter invites" className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`${buttonClass} ${filter === item.id ? "border-brand-400 bg-brand-500/15 text-white" : ""}`}>
              {item.label}{item.id !== "all" && counts[item.id] ? ` (${counts[item.id]})` : ""}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void load()} className={buttonClass}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="p-4">Friend</th><th className="p-4">Invited by</th><th className="p-4">Tests</th><th className="p-4">Warnings</th><th className="p-4">Status</th><th className="p-4 text-right">Decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400">Nothing here.</td></tr>
            ) : rows.map((row) => {
              const status = ADMIN_LABELS[row.status] || ADMIN_LABELS.joined;
              const flags = Array.isArray(row.flags) ? row.flags : [];
              return (
                <tr key={row.id} className="border-b border-white/10 align-top text-sm text-slate-200">
                  <td className="p-4">
                    <Link href={`/admin/users/${row.invitee_id}`} className="font-medium text-white underline-offset-2 hover:underline">{row.invitee_name || "No name"}</Link>
                    <p className="mt-1 text-xs text-slate-400">{row.invitee_email}</p>
                    <p className="mt-1 text-xs text-slate-500">Account {row.invitee_created_at ? new Date(row.invitee_created_at).toLocaleDateString() : "?"} · joined {new Date(row.claimed_at).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4">
                    <Link href={`/admin/users/${row.inviter_id}`} className="font-medium text-white underline-offset-2 hover:underline">{row.inviter_name || "No name"}</Link>
                    <p className="mt-1 text-xs text-slate-400">{row.inviter_email}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.inviter_approved} counted so far</p>
                  </td>
                  <td className="p-4"><span className={`whitespace-nowrap ${row.tests_done >= INVITE_TESTS_NEEDED ? "text-emerald-300" : ""}`}>{Math.min(row.tests_done, 99)} done</span><p className="text-xs text-slate-500">needs {INVITE_TESTS_NEEDED}</p></td>
                  <td className="p-4">
                    {flags.length === 0 ? <span className="text-slate-500">None</span> : (
                      <ul className="space-y-1">
                        {flags.map((flag) => <li key={flag} className="flex items-start gap-1.5 text-xs text-amber-200"><AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />{INVITE_FLAGS[flag] || flag}</li>)}
                      </ul>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${TONES[status.tone]}`}>{status.label}</span>
                    {row.admin_note && <p className="mt-1 text-xs text-slate-400">{row.admin_note}</p>}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {row.status !== "approved" && row.status !== "joined" && (
                        <button type="button" disabled={busyId === row.id} onClick={() => void review(row, true)} className={`${buttonClass} border-emerald-400/40 text-emerald-200`}><Check size={15} aria-hidden="true" />Approve</button>
                      )}
                      {row.status !== "rejected" && (
                        <button type="button" disabled={busyId === row.id} onClick={() => void review(row, false)} className={`${buttonClass} border-rose-400/40 text-rose-200`}><X size={15} aria-hidden="true" />{row.status === "approved" ? "Remove" : "Reject"}</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
