"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { ANNOUNCEMENT_KEY, readSiteSetting } from "@/lib/site-settings";

const DISMISSED_KEY = "ielts-announcement-dismissed";
const TONES = {
  info: "border-brand-400/30 bg-brand-500/15 text-brand-100",
  success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  warning: "border-amber-400/30 bg-amber-500/15 text-amber-100",
};

// A message for every visitor, set from Admin → Announcements. Dismissing it
// hides that message only; a new message shows again.
export default function SiteAnnouncement() {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    let active = true;
    readSiteSetting(ANNOUNCEMENT_KEY).then((value) => {
      if (!active || !value?.active || !value.text) return;
      let dismissed = "";
      try { dismissed = window.localStorage.getItem(DISMISSED_KEY) || ""; } catch { /* fine */ }
      if (dismissed !== value.updatedAt) setAnnouncement(value);
    });
    return () => { active = false; };
  }, []);

  if (!announcement) return null;
  const dismiss = () => {
    try { window.localStorage.setItem(DISMISSED_KEY, announcement.updatedAt); } catch { /* fine */ }
    setAnnouncement(null);
  };
  const safeLink = /^(https:\/\/|\/(?!\/))/.test(announcement.link || "") ? announcement.link : null;
  return (
    <div role="status" className={`ielts-site-announcement border-b ${TONES[announcement.tone] || TONES.info}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <Megaphone size={16} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1">
          {announcement.text}
          {safeLink && <> <a href={safeLink} className="font-semibold underline underline-offset-2">{announcement.linkLabel || "Learn more"}</a></>}
        </p>
        <button type="button" onClick={dismiss} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-white/10" aria-label="Dismiss announcement">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
