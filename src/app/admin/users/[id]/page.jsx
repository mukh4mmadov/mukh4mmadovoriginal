"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, RefreshCw, Shield, ShieldOff, Trash2, UserCog } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageError, AdminPageLoading } from "@/components/admin/AdminPageStatus";
import WritingFeedback from "@/components/writing/WritingFeedback";
import { getWritingTask } from "@/data/writingTasks";
import { getListeningTest } from "@/data/listeningTests";
import { getMockBand } from "@/lib/reading/mock-scoring.mjs";
import { formatUzs } from "@/lib/writing/premium.mjs";

const byUser = (table, column = "user_id") => (id) => supabase.from(table).select("*").eq(column, id);
// Every table that holds something about a learner. Each loads on its own,
// so one missing table (e.g. before a migration) doesn't hide the rest.
const SOURCES = {
  profile: (id) => supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
  streak: (id) => byUser("streaks")(id).maybeSingle(),
  xp: (id) => byUser("xp")(id).maybeSingle(),
  goal: (id) => byUser("study_goals")(id).maybeSingle(),
  settings: (id) => byUser("user_settings")(id).maybeSingle(),
  stats: (id) => byUser("study_statistics")(id).maybeSingle(),
  readingHistory: (id) => byUser("reading_history")(id).order("completed_at", { ascending: false }).limit(300),
  readingProgress: (id) => byUser("reading_progress")(id).order("updated_at", { ascending: false }),
  mockAttempts: (id) => byUser("reading_mock_attempts")(id).order("completed_at", { ascending: false }),
  fullMocks: (id) => byUser("full_mock_results")(id).order("completed_at", { ascending: false }),
  listening: (id) => byUser("listening_attempts")(id).order("completed_at", { ascending: false }),
  writing: (id) => byUser("writing_submissions")(id).order("created_at", { ascending: false }),
  premium: (id) => byUser("premium_writing_requests")(id).order("created_at", { ascending: false }),
  creditOrders: (id) => byUser("premium_credit_orders")(id).order("created_at", { ascending: false }),
  credits: (id) => supabase.rpc("premium_credit_balance", { p_user_id: id }),
  review: (id) => byUser("review_queue_items")(id).order("updated_at", { ascending: false }),
  vocabulary: (id) => byUser("vocabulary_items")(id).order("updated_at", { ascending: false }),
  highlights: (id) => byUser("highlights")(id).order("created_at", { ascending: false }).limit(300),
  quotes: (id) => byUser("saved_quotes")(id).order("saved_at", { ascending: false }),
  achievements: (id) => byUser("achievements")(id).order("unlocked_at", { ascending: false }),
  missions: (id) => byUser("daily_missions")(id).order("date", { ascending: false }).limit(60),
  aiConversations: (id) => byUser("ai_conversations")(id).order("updated_at", { ascending: false }).limit(50),
  aiMessages: (id) => byUser("ai_chat_history")(id).order("created_at", { ascending: false }).limit(300),
  tickets: (id) => byUser("support_tickets", "owner_id")(id).order("created_at", { ascending: false }),
  feedback: (id) => byUser("feedback_messages")(id).order("created_at", { ascending: false }),
  donations: (id) => byUser("donation_conversations")(id).order("created_at", { ascending: false }),
  push: (id) => supabase.from("push_subscriptions").select("id, created_at, last_active_at, last_notified_at").eq("user_id", id),
  events: (id) => byUser("analytics_events")(id).order("created_at", { ascending: false }).limit(200),
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "reading", label: "Reading", keys: ["readingHistory", "readingProgress"] },
  { id: "mocks", label: "Mock tests", keys: ["mockAttempts", "fullMocks"] },
  { id: "listening", label: "Listening", keys: ["listening"] },
  { id: "writing", label: "Writing", keys: ["writing", "premium", "creditOrders"] },
  { id: "study", label: "Study tools", keys: ["review", "vocabulary", "highlights", "quotes", "achievements", "missions"] },
  { id: "ai", label: "AI coach", keys: ["aiConversations", "aiMessages"] },
  { id: "support", label: "Support", keys: ["tickets", "feedback", "donations"] },
  { id: "activity", label: "Activity", keys: ["events", "push"] },
];

const fmtDate = (value) => (value ? new Date(value).toLocaleString() : "—");
const fmtBand = (value) => (value == null || value === "" ? "—" : Number(value).toFixed(1));
const fmtTime = (seconds) => (seconds == null ? "—" : `${Math.floor(seconds / 60)}m ${String(Math.round(seconds % 60)).padStart(2, "0")}s`);
const buttonClass = "inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-40";

function Section({ title, count, error, children }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-3 font-semibold text-white">{title}{count != null && <span className="ml-2 text-sm font-normal text-slate-400">{count}</span>}</h3>
      {error ? <p className="text-sm text-amber-300">Could not load: {error}</p> : children}
    </section>
  );
}

function Table({ rows, columns, empty = "Nothing saved.", expand, onDelete }) {
  const [open, setOpen] = useState(null);
  if (!rows?.length) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
            {columns.map((column) => <th key={column.label} className="p-2">{column.label}</th>)}
            {(expand || onDelete) && <th className="p-2 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <Fragment key={row.id || row.item_id || index}>
              <tr className="border-b border-white/5 text-slate-200">
                {columns.map((column) => <td key={column.label} className="p-2 align-top">{column.value(row)}</td>)}
                {(expand || onDelete) && (
                  <td className="whitespace-nowrap p-2 text-right">
                    {expand && <button type="button" className="mr-2 text-brand-300 underline" onClick={() => setOpen(open === index ? null : index)}>{open === index ? "Hide" : "View"}</button>}
                    {onDelete && <button type="button" className="text-rose-300 underline" onClick={() => onDelete(row)}>Delete</button>}
                  </td>
                )}
              </tr>
              {open === index && <tr><td colSpan={columns.length + 1} className="bg-black/20 p-3">{expand(row)}</td></tr>}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Json = ({ value }) => <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 text-xs text-slate-300">{JSON.stringify(value, null, 2)}</pre>;

export default function AdminUserPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    if (!supabase) { setErrors({ profile: "Supabase is not configured." }); setData({}); return; }
    const keys = Object.keys(SOURCES);
    const results = await Promise.allSettled(keys.map((key) => SOURCES[key](id)));
    const nextData = {};
    const nextErrors = {};
    results.forEach((result, index) => {
      const key = keys[index];
      const value = result.status === "fulfilled" ? result.value : { error: result.reason };
      if (value.error) nextErrors[key] = value.error.message || String(value.error);
      else nextData[key] = value.data;
    });
    setData(nextData);
    setErrors(nextErrors);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const profile = data?.profile;
  const counts = useMemo(() => Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key, Array.isArray(value) ? value.length : value ? 1 : 0])), [data]);

  if (!data) return <AdminPageLoading label="Loading learner" />;
  if (!profile) return <AdminPageError message={errors.profile || "This learner was not found."} onRetry={() => void load()} />;

  const isMe = me?.id === id;
  const run = async (label, action) => {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage(`${label}: done.`);
      await load();
    } catch (error) {
      console.error(label, error);
      setMessage(`${label} failed: ${error.message || "check that migration 021 is applied."}`);
    } finally {
      setBusy(false);
    }
  };
  const mustChange = ({ data: rows, error }) => {
    if (error) throw error;
    if (Array.isArray(rows) && rows.length === 0) throw new Error("No permission or nothing changed.");
  };
  const toggleAdmin = () => run(profile.is_admin ? "Remove admin" : "Make admin", async () => {
    if (!window.confirm(profile.is_admin ? `Remove admin rights from ${profile.email}?` : `Give ${profile.email} full admin rights?`)) throw new Error("Cancelled");
    mustChange(await supabase.from("profiles").update({ is_admin: !profile.is_admin }).eq("id", id).select("id"));
  });
  const saveProfile = () => run("Save profile", async () => {
    const changes = Object.fromEntries(["full_name", "username", "country", "bio"].map((key) => [key, editing[key]?.trim() || null]));
    mustChange(await supabase.from("profiles").update(changes).eq("id", id).select("id"));
    setEditing(null);
  });
  const deleteRow = (table, row, keyColumn = "id") => run("Delete record", async () => {
    if (!window.confirm("Delete this record permanently?")) throw new Error("Cancelled");
    let query = supabase.from(table).delete().eq(keyColumn, row[keyColumn]);
    if (keyColumn !== "id") query = query.eq("user_id", id);
    mustChange(await query.select(keyColumn));
  });
  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `learner-${(profile.email || id).replace(/[^a-z0-9@._-]/gi, "_")}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const deleteAccount = () => run("Delete account", async () => {
    const typed = window.prompt(`This permanently deletes ${profile.email}'s account and all their data. Type their email to confirm:`);
    if (typed?.trim().toLowerCase() !== String(profile.email || "").toLowerCase()) throw new Error("Cancelled");
    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Server error");
    router.push("/admin/users");
  });

  const mockScore = (row) => row.result_data?.rawScore ?? row.result_data?.score;

  return (
    <div>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} aria-hidden="true" /> All users</Link>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{profile.full_name || profile.username || "Unnamed learner"}</h1>
          <p className="mt-1 text-sm text-slate-400">{profile.email} · joined {fmtDate(profile.created_at)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {profile.is_admin && <span className="rounded-full bg-brand-500/20 px-2 py-1 font-semibold text-brand-200">Admin</span>}
            {profile.is_guest && <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">Guest</span>}
            <span className="rounded-full bg-white/10 px-2 py-1 font-mono text-slate-400">{id}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass} onClick={() => void load()} disabled={busy}><RefreshCw size={15} aria-hidden="true" />Refresh</button>
          <button type="button" className={buttonClass} onClick={exportAll}><Download size={15} aria-hidden="true" />Export all data</button>
          <button type="button" className={buttonClass} onClick={() => setEditing({ ...profile })} disabled={busy}><UserCog size={15} aria-hidden="true" />Edit profile</button>
          {!isMe && <button type="button" className={buttonClass} onClick={toggleAdmin} disabled={busy}>{profile.is_admin ? <ShieldOff size={15} aria-hidden="true" /> : <Shield size={15} aria-hidden="true" />}{profile.is_admin ? "Remove admin" : "Make admin"}</button>}
          {!isMe && <button type="button" className={`${buttonClass} border-rose-400/30 text-rose-200`} onClick={deleteAccount} disabled={busy}><Trash2 size={15} aria-hidden="true" />Delete account</button>}
        </div>
      </div>
      {message && <p role="status" className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-200">{message}</p>}

      {editing && (
        <section className="mb-4 grid gap-3 rounded-xl border border-brand-400/30 bg-brand-500/5 p-4 sm:grid-cols-2">
          {[["full_name", "Full name"], ["username", "Username"], ["country", "Country"], ["bio", "Bio"]].map(([key, label]) => (
            <label key={key} className="text-sm text-slate-300">{label}
              <input value={editing[key] || ""} onChange={(event) => setEditing((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-white" />
            </label>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" className="min-h-10 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white" onClick={saveProfile} disabled={busy}>Save</button>
            <button type="button" className={buttonClass} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </section>
      )}

      <div role="tablist" aria-label="Learner data" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((item) => {
          const total = (item.keys || []).reduce((sum, key) => sum + (counts[key] || 0), 0);
          return (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`${buttonClass} ${tab === item.id ? "border-brand-400 bg-brand-500/15 text-white" : ""}`}>
              {item.label}{item.keys ? ` (${total})` : ""}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {tab === "overview" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Passages done", counts.readingHistory],
                ["Reading mocks", counts.mockAttempts],
                ["Listening tests", counts.listening],
                ["Writing feedback", counts.writing],
                ["AI Premium requests", counts.premium],
                ["Full mocks", counts.fullMocks],
                ["Streak", data.streak ? `${data.streak.current_streak} days (best ${data.streak.longest_streak})` : "—"],
                ["XP", data.xp ? `${data.xp.total_xp} · level ${data.xp.level}` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-xl font-bold text-white">{value ?? 0}</p>
                </div>
              ))}
            </div>
            <Section title="Profile"><Json value={profile} /></Section>
            <Section title="Study goal" error={errors.goal}>{data.goal ? <Json value={data.goal} /> : <p className="text-sm text-slate-400">No goal set.</p>}</Section>
            <Section title="Reading statistics" error={errors.stats}>{data.stats ? <Json value={data.stats} /> : <p className="text-sm text-slate-400">None.</p>}</Section>
            <Section title="Settings" error={errors.settings}>{data.settings ? <Json value={data.settings} /> : <p className="text-sm text-slate-400">Defaults.</p>}</Section>
          </>
        )}

        {tab === "reading" && (
          <>
            <Section title="Finished passages" count={counts.readingHistory} error={errors.readingHistory}>
              <Table rows={data.readingHistory} onDelete={(row) => deleteRow("reading_history", row)} expand={(row) => <Json value={row.question_breakdown} />} columns={[
                { label: "Passage", value: (row) => row.passage_id },
                { label: "Score", value: (row) => `${row.correct_count ?? row.score ?? "—"}/${row.question_count ?? "—"}` },
                { label: "Band", value: (row) => fmtBand(row.band_score) },
                { label: "Time", value: (row) => fmtTime(row.time_spent_seconds) },
                { label: "Finished", value: (row) => fmtDate(row.completed_at) },
              ]} />
            </Section>
            <Section title="Passages in progress" count={counts.readingProgress} error={errors.readingProgress}>
              <Table rows={data.readingProgress} onDelete={(row) => deleteRow("reading_progress", row)} expand={(row) => <Json value={row.answers} />} columns={[
                { label: "Passage", value: (row) => row.passage_id },
                { label: "Question", value: (row) => row.current_question_index },
                { label: "Completed", value: (row) => (row.is_completed ? "Yes" : "No") },
                { label: "Updated", value: (row) => fmtDate(row.updated_at) },
              ]} />
            </Section>
          </>
        )}

        {tab === "mocks" && (
          <>
            <Section title="Full mocks (Listening + Reading + Writing)" count={counts.fullMocks} error={errors.fullMocks}>
              <Table rows={data.fullMocks} onDelete={(row) => deleteRow("full_mock_results", row)} expand={(row) => <Json value={row.result_data} />} columns={[
                { label: "Overall", value: (row) => fmtBand(row.overall_band) },
                { label: "Listening", value: (row) => fmtBand(row.listening_band) },
                { label: "Reading", value: (row) => fmtBand(row.reading_band) },
                { label: "Writing", value: (row) => fmtBand(row.writing_band) },
                { label: "Finished", value: (row) => fmtDate(row.completed_at) },
              ]} />
            </Section>
            <Section title="Reading mocks" count={counts.mockAttempts} error={errors.mockAttempts}>
              <Table rows={data.mockAttempts} onDelete={(row) => deleteRow("reading_mock_attempts", row)} expand={(row) => <Json value={row.result_data} />} columns={[
                { label: "Score", value: (row) => `${mockScore(row) ?? "—"}/40` },
                { label: "Band", value: (row) => fmtBand(getMockBand(Number(mockScore(row)))) },
                { label: "Time", value: (row) => fmtTime(row.result_data?.elapsedSeconds) },
                { label: "Finished", value: (row) => fmtDate(row.completed_at) },
              ]} />
            </Section>
          </>
        )}

        {tab === "listening" && (
          <Section title="Listening tests" count={counts.listening} error={errors.listening}>
            <Table rows={data.listening} onDelete={(row) => deleteRow("listening_attempts", row)} expand={(row) => <Json value={row.result_data} />} columns={[
              { label: "Test", value: (row) => getListeningTest(row.test_slug)?.title || row.test_slug },
              { label: "Score", value: (row) => `${row.score}/${row.total}` },
              { label: "Band", value: (row) => fmtBand(row.result_data?.band) },
              { label: "Finished", value: (row) => fmtDate(row.completed_at) },
            ]} />
          </Section>
        )}

        {tab === "writing" && (
          <>
            <Section title="AI Writing feedback" count={counts.writing} error={errors.writing}>
              <Table rows={data.writing} onDelete={(row) => deleteRow("writing_submissions", row)} expand={(row) => (
                <div className="space-y-3">
                  <p className="whitespace-pre-wrap rounded-lg bg-white/[0.04] p-3 text-sm leading-6 text-slate-300">{row.essay}</p>
                  <WritingFeedback feedback={row.feedback} taskNumber={row.task_number} wordCount={row.word_count} headingId={`admin-user-writing-${row.id}`} />
                </div>
              )} columns={[
                { label: "Task", value: (row) => `Task ${row.task_number} · ${getWritingTask(row.task_slug)?.title || row.task_slug}` },
                { label: "Words", value: (row) => row.word_count },
                { label: "Band", value: (row) => fmtBand(row.overall_band) },
                { label: "Submitted", value: (row) => fmtDate(row.created_at) },
              ]} />
            </Section>
            <Section title="AI Premium requests" count={counts.premium} error={errors.premium}>
              <Table rows={data.premium} onDelete={(row) => deleteRow("premium_writing_requests", row)} expand={(row) => <Json value={row} />} columns={[
                { label: "Code", value: (row) => <span className="font-mono">{row.code}</span> },
                { label: "Status", value: (row) => row.status },
                { label: "Amount", value: (row) => formatUzs(row.price_uzs) },
                { label: "Requested", value: (row) => fmtDate(row.created_at) },
              ]} />
              <Link href="/admin/writing-premium" className="mt-3 inline-block text-sm text-brand-300 underline">Open AI Premium Writing</Link>
            </Section>
            <Section title={`Bundle orders · ${data.credits ?? 0} credits left`} count={counts.creditOrders} error={errors.creditOrders}>
              <Table rows={data.creditOrders} columns={[
                { label: "Code", value: (row) => <span className="font-mono">{row.code}</span> },
                { label: "Bundle", value: (row) => `${row.credits} checks` },
                { label: "Amount", value: (row) => formatUzs(row.price_uzs) },
                { label: "Status", value: (row) => row.status },
                { label: "Ordered", value: (row) => fmtDate(row.created_at) },
              ]} />
            </Section>
          </>
        )}

        {tab === "study" && (
          <>
            <Section title="Mistake review queue" count={counts.review} error={errors.review}>
              <Table rows={data.review} onDelete={(row) => deleteRow("review_queue_items", row, "item_id")} expand={(row) => <Json value={row.data} />} columns={[
                { label: "Item", value: (row) => row.data?.prompt || row.item_id },
                { label: "Reviewed", value: (row) => (row.reviewed ? "Yes" : "No") },
                { label: "Removed", value: (row) => (row.removed_at ? fmtDate(row.removed_at) : "—") },
                { label: "Updated", value: (row) => fmtDate(row.updated_at) },
              ]} />
            </Section>
            <Section title="Saved vocabulary" count={counts.vocabulary} error={errors.vocabulary}>
              <Table rows={data.vocabulary} onDelete={(row) => deleteRow("vocabulary_items", row, "item_id")} expand={(row) => <Json value={row.data} />} columns={[
                { label: "Word", value: (row) => row.data?.word || row.data?.text || row.item_id },
                { label: "Removed", value: (row) => (row.removed_at ? fmtDate(row.removed_at) : "—") },
                { label: "Updated", value: (row) => fmtDate(row.updated_at) },
              ]} />
            </Section>
            <Section title="Highlights and notes" count={counts.highlights} error={errors.highlights}>
              <Table rows={data.highlights} onDelete={(row) => deleteRow("highlights", row)} columns={[
                { label: "Passage", value: (row) => row.passage_id },
                { label: "Text", value: (row) => row.text },
                { label: "Note", value: (row) => row.note || "—" },
                { label: "Created", value: (row) => fmtDate(row.created_at) },
              ]} />
            </Section>
            <Section title="Saved quotes" count={counts.quotes} error={errors.quotes}>
              <Table rows={data.quotes} columns={[
                { label: "Quote", value: (row) => row.quote },
                { label: "Author", value: (row) => row.author },
                { label: "Saved", value: (row) => fmtDate(row.saved_at) },
              ]} />
            </Section>
            <Section title="Achievements" count={counts.achievements} error={errors.achievements}>
              <Table rows={data.achievements} columns={[
                { label: "Achievement", value: (row) => row.title },
                { label: "Unlocked", value: (row) => fmtDate(row.unlocked_at) },
              ]} />
            </Section>
            <Section title="Daily missions" count={counts.missions} error={errors.missions}>
              <Table rows={data.missions} expand={(row) => <Json value={{ missions: row.missions, completed: row.completed_missions }} />} columns={[
                { label: "Date", value: (row) => row.date },
                { label: "Completed", value: (row) => (Array.isArray(row.completed_missions) ? row.completed_missions.length : "—") },
              ]} />
            </Section>
          </>
        )}

        {tab === "ai" && (
          <>
            <Section title="AI coach conversations" count={counts.aiConversations} error={errors.aiConversations}>
              <Table rows={data.aiConversations} expand={(row) => <Json value={row.messages} />} columns={[
                { label: "Title", value: (row) => row.title || "—" },
                { label: "Messages", value: (row) => (Array.isArray(row.messages) ? row.messages.length : "—") },
                { label: "Updated", value: (row) => fmtDate(row.updated_at) },
              ]} />
            </Section>
            <Section title="AI coach messages" count={counts.aiMessages} error={errors.aiMessages}>
              <Table rows={data.aiMessages} columns={[
                { label: "Who", value: (row) => row.role },
                { label: "Message", value: (row) => <span className="line-clamp-3">{row.message}</span> },
                { label: "Passage", value: (row) => row.passage_slug || "—" },
                { label: "When", value: (row) => fmtDate(row.created_at) },
              ]} />
            </Section>
          </>
        )}

        {tab === "support" && (
          <>
            <Section title="Support tickets" count={counts.tickets} error={errors.tickets}>
              <Table rows={data.tickets} expand={(row) => <Json value={row} />} columns={[
                { label: "Subject", value: (row) => row.subject },
                { label: "Category", value: (row) => row.category },
                { label: "Status", value: (row) => row.status },
                { label: "Created", value: (row) => fmtDate(row.created_at) },
              ]} />
              <Link href="/admin/support" className="mt-3 inline-block text-sm text-brand-300 underline">Open support inbox</Link>
            </Section>
            <Section title="Older feedback messages" count={counts.feedback} error={errors.feedback}>
              <Table rows={data.feedback} expand={(row) => <Json value={row} />} columns={[
                { label: "Subject", value: (row) => row.subject },
                { label: "Status", value: (row) => row.status },
                { label: "Created", value: (row) => fmtDate(row.created_at) },
              ]} />
            </Section>
            <Section title="Donations" count={counts.donations} error={errors.donations}>
              <Table rows={data.donations} columns={[
                { label: "Status", value: (row) => row.status },
                { label: "Created", value: (row) => fmtDate(row.created_at) },
                { label: "Resolved", value: (row) => fmtDate(row.resolved_at) },
              ]} />
            </Section>
          </>
        )}

        {tab === "activity" && (
          <>
            <Section title="Recent activity" count={counts.events} error={errors.events}>
              <Table rows={data.events} expand={(row) => <Json value={row} />} columns={[
                { label: "Event", value: (row) => row.event_type },
                { label: "Page", value: (row) => row.page_url || "—" },
                { label: "When", value: (row) => fmtDate(row.created_at) },
              ]} />
            </Section>
            <Section title="Push notification devices" count={counts.push} error={errors.push}>
              <Table rows={data.push} columns={[
                { label: "Added", value: (row) => fmtDate(row.created_at) },
                { label: "Last active", value: (row) => fmtDate(row.last_active_at) },
                { label: "Last notified", value: (row) => fmtDate(row.last_notified_at) },
              ]} />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
