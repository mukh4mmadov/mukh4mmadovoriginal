"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, RefreshCw, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { AdminPageError, AdminPageLoading } from "@/components/admin/AdminPageStatus";
import { downloadCsv } from "@/lib/admin/csv.mjs";

const band = (value) => (value == null ? "—" : Number(value).toFixed(1));
const COLUMNS = [
  { label: "Learner", value: (row) => row.user?.full_name || row.user?.email || row.user_id },
  { label: "Email", value: (row) => row.user?.email },
  { label: "Overall", value: (row) => row.overall_band },
  { label: "Listening", value: (row) => row.listening_band },
  { label: "Reading", value: (row) => row.reading_band },
  { label: "Writing", value: (row) => row.writing_band },
  { label: "Finished", value: (row) => row.completed_at },
];

export default function AdminFullMocksPage() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    if (!supabase) { setError("Supabase is not configured."); return; }
    const { data, error: queryError } = await supabase
      .from("full_mock_results")
      .select("*, user:profiles!full_mock_results_user_id_fkey(id, full_name, email)")
      .order("completed_at", { ascending: false })
      .limit(500);
    if (queryError) { setError("Full mock results could not be loaded. Confirm that migration 021_admin_full_access.sql has been applied."); return; }
    setRows(data || []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (error && !rows) return <AdminPageError message={error} onRetry={() => void load()} />;
  if (!rows) return <AdminPageLoading label="Loading full mocks" />;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3"><Trophy className="text-brand-400" size={28} aria-hidden="true" /><h1 className="text-3xl font-bold text-white">Full mock results</h1></div>
      <p className="mb-6 text-sm text-slate-400">Listening + Reading + Writing mocks finished by signed-in learners, newest first.</p>
      <div className="mb-4 flex flex-wrap justify-between gap-3">
        <p className="text-sm text-slate-300">{rows.length} results</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => downloadCsv(`full-mocks-${new Date().toISOString().slice(0, 10)}.csv`, rows, COLUMNS)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5"><Download size={15} aria-hidden="true" />Export CSV</button>
          <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5"><RefreshCw size={15} aria-hidden="true" />Refresh</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">{["Learner", "Overall", "Listening", "Reading", "Writing", "Finished"].map((label) => <th key={label} className="p-4">{label}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-slate-400">No full mocks finished yet.</td></tr> : rows.map((row) => (
              <tr key={`${row.user_id}-${row.id}`} className="border-b border-white/10 text-slate-200">
                <td className="p-4"><Link href={`/admin/users/${row.user_id}`} className="font-medium text-white underline-offset-2 hover:underline">{row.user?.full_name || row.user?.email || "Learner"}</Link><p className="text-xs text-slate-400">{row.user?.email}</p></td>
                <td className="p-4 text-lg font-bold text-white">{band(row.overall_band)}</td>
                <td className="p-4">{band(row.listening_band)}</td>
                <td className="p-4">{band(row.reading_band)}</td>
                <td className="p-4">{band(row.writing_band)}{row.result_data?.results?.writing?.pending && <span className="ml-1 text-xs text-amber-300">pending</span>}</td>
                <td className="p-4 text-slate-400">{new Date(row.completed_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
