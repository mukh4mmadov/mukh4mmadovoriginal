"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ticketNeedsReply } from "@/lib/support/tickets";

export default function AdminNotifications() {
  const [tickets, setTickets] = useState([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) return;
      const { data, error } = await supabase.from("support_tickets")
        .select("id, subject, status, updated_at, messages:support_ticket_messages(sender_type, created_at)")
        .neq("status", "resolved")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (!error && active) setTickets((data || []).filter(ticketNeedsReply));
    }
    load();
    const interval = window.setInterval(load, 60000);
    const channel = supabase?.channel("admin-ticket-notifications").on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, load).on("postgres_changes", { event: "INSERT", schema: "public", table: "support_ticket_messages" }, load).subscribe();
    return () => { active = false; window.clearInterval(interval); if (channel) supabase.removeChannel(channel); };
  }, []);
  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-label={`${tickets.length} tickets need reply`} className="relative rounded-lg p-2 hover:bg-white/10"><Bell className="text-slate-400" size={20} />{tickets.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs text-white">{tickets.length}</span>}</button>{open && <><button type="button" aria-label="Close notifications" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} /><div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-surface shadow-xl"><div className="flex items-center justify-between border-b border-white/10 p-4"><h2 className="font-semibold text-white">Needs a reply ({tickets.length})</h2><button type="button" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button></div>{tickets.length ? tickets.slice(0, 8).map((ticket) => <Link key={ticket.id} href={`/admin/support?ticket=${ticket.id}`} onClick={() => setOpen(false)} className="block border-b border-white/5 p-4 hover:bg-white/5"><p className="truncate text-sm text-white">{ticket.subject}</p><time className="mt-1 block text-xs text-slate-400">{new Date(ticket.updated_at).toLocaleString()}</time></Link>) : <p className="p-6 text-center text-sm text-slate-400">Nothing waiting for a reply.</p>}</div></>}</div>;
}
