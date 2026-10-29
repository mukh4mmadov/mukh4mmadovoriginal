"use client";

import { useEffect, useState } from "react";
import { BellRing, Megaphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ANNOUNCEMENT_KEY, ANNOUNCEMENT_TONES, readSiteSetting, writeSiteSetting } from "@/lib/site-settings";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-white";

export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const [banner, setBanner] = useState({ active: false, text: "", link: "", linkLabel: "", tone: "info" });
  const [bannerStatus, setBannerStatus] = useState("");
  const [push, setPush] = useState({ title: "", body: "", url: "/home" });
  const [pushStatus, setPushStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    readSiteSetting(ANNOUNCEMENT_KEY).then((value) => { if (value) setBanner((current) => ({ ...current, ...value })); });
  }, []);

  const saveBanner = async (active) => {
    setBannerStatus("");
    try {
      const next = { ...banner, active, text: banner.text.trim().slice(0, 300), link: banner.link.trim(), linkLabel: banner.linkLabel.trim().slice(0, 40) };
      if (active && !next.text) throw new Error("Write the announcement first.");
      if (next.link && !/^(https:\/\/|\/(?!\/))/.test(next.link)) throw new Error("The link must start with / or https://");
      delete next.updatedAt;
      await writeSiteSetting(ANNOUNCEMENT_KEY, next, user?.id);
      setBanner(next);
      setBannerStatus(active ? "The announcement is now shown on every page." : "The announcement is hidden.");
    } catch (error) {
      setBannerStatus(error.message?.includes("site_settings") ? "Apply migration 021 first." : error.message);
    }
  };

  const sendPush = async () => {
    if (!window.confirm("Send this notification to every learner who turned on notifications?")) return;
    setSending(true);
    setPushStatus("");
    try {
      const response = await fetch("/api/admin/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(push) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Sending failed.");
      setPushStatus(`Sent to ${data.sent} of ${data.recipients} devices${data.removed ? ` (${data.removed} old devices removed)` : ""}${data.failed ? `, ${data.failed} failed` : ""}.`);
    } catch (error) {
      setPushStatus(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Announcements</h1>
        <p className="mt-2 text-sm text-slate-400">Talk to every learner: a banner at the top of the site, or a push notification on their phone or computer.</p>
      </div>

      <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5" aria-labelledby="banner-title">
        <h2 id="banner-title" className="flex items-center gap-2 text-lg font-bold text-white"><Megaphone size={20} className="text-brand-400" aria-hidden="true" /> Site banner {banner.active && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">Live</span>}</h2>
        <label className="block text-sm text-slate-300">Message
          <textarea value={banner.text} maxLength={300} rows={3} onChange={(event) => setBanner({ ...banner, text: event.target.value })} className={`${inputClass} py-2`} placeholder="New: full IELTS mock test with an overall band!" />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-slate-300">Link (optional)
            <input value={banner.link} onChange={(event) => setBanner({ ...banner, link: event.target.value })} className={inputClass} placeholder="/full-mock" />
          </label>
          <label className="text-sm text-slate-300">Link text
            <input value={banner.linkLabel} maxLength={40} onChange={(event) => setBanner({ ...banner, linkLabel: event.target.value })} className={inputClass} placeholder="Try it" />
          </label>
          <label className="text-sm text-slate-300">Colour
            <select value={banner.tone} onChange={(event) => setBanner({ ...banner, tone: event.target.value })} className={inputClass}>
              {ANNOUNCEMENT_TONES.map((tone) => <option key={tone} value={tone} style={{ color: "#111" }}>{tone}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void saveBanner(true)} className="min-h-11 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white">Show on the site</button>
          {banner.active && <button type="button" onClick={() => void saveBanner(false)} className="min-h-11 rounded-lg border border-white/10 px-4 text-sm text-slate-200">Hide banner</button>}
        </div>
        {bannerStatus && <p role="status" className="text-sm text-slate-300">{bannerStatus}</p>}
      </section>

      <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5" aria-labelledby="push-title">
        <h2 id="push-title" className="flex items-center gap-2 text-lg font-bold text-white"><BellRing size={20} className="text-brand-400" aria-hidden="true" /> Push notification</h2>
        <p className="text-sm text-slate-400">Goes to every learner who turned on notifications. Use it sparingly.</p>
        <label className="block text-sm text-slate-300">Title
          <input value={push.title} maxLength={80} onChange={(event) => setPush({ ...push, title: event.target.value })} className={inputClass} placeholder="New full mock test" />
        </label>
        <label className="block text-sm text-slate-300">Message
          <textarea value={push.body} maxLength={240} rows={3} onChange={(event) => setPush({ ...push, body: event.target.value })} className={`${inputClass} py-2`} placeholder="Take Listening, Reading and Writing in one go and get your overall band." />
        </label>
        <label className="block text-sm text-slate-300">Opens page
          <input value={push.url} onChange={(event) => setPush({ ...push, url: event.target.value })} className={inputClass} placeholder="/full-mock" />
        </label>
        <button type="button" disabled={sending || !push.title.trim() || !push.body.trim()} onClick={() => void sendPush()} className="min-h-11 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white disabled:opacity-40">{sending ? "Sending…" : "Send notification"}</button>
        {pushStatus && <p role="status" className="text-sm text-slate-300">{pushStatus}</p>}
      </section>
    </div>
  );
}
