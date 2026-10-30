"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Image as ImageIcon, Share2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useModalAccessibility } from "@/hooks/useModalAccessibility";
import { canvasToBlob, drawResultCard } from "@/lib/share/result-card";

/**
 * "Share my result" button: shows a story-sized image of the result that
 * can be shared to Instagram/Telegram (phone share sheet) or downloaded.
 * card: { kind, band, bandLabel, detail, parts }
 */
export default function ShareResultButton({ card, className = "btn-secondary", label = "Share my result" }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const blobRef = useRef(null);
  const dialogRef = useModalAccessibility(open, () => setOpen(false));
  // Callers pass a new object each render; redraw only when its content changes.
  const cardKey = JSON.stringify(card);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    let url = "";
    setPreview("");
    setStatus("");
    const canvas = document.createElement("canvas");
    const data = JSON.parse(cardKey);
    drawResultCard(canvas, {
      ...data,
      name: data.name ?? (profile?.full_name || ""),
      date: data.date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      site: window.location.host,
    })
      .then(canvasToBlob)
      .then((blob) => {
        if (!active || !blob) return;
        blobRef.current = blob;
        url = URL.createObjectURL(blob);
        setPreview(url);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, cardKey, profile?.full_name]);

  const fileName = `ielts-result-${new Date().toISOString().slice(0, 10)}.png`;
  const download = () => {
    if (!preview) return;
    const link = document.createElement("a");
    link.href = preview;
    link.download = fileName;
    link.click();
  };
  const share = async () => {
    const blob = blobRef.current;
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My IELTS result", text: `My IELTS practice result · ${window.location.origin}` });
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
    download();
    setStatus("Image saved. Post it to your Instagram or Telegram story.");
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <ImageIcon size={16} aria-hidden="true" /> {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="share-result-title" className="flex max-h-full w-full max-w-sm flex-col rounded-2xl border border-white/10 p-4" style={{ background: "#0f172a", color: "#f1f5f9" }}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="share-result-title" className="text-lg font-bold" style={{ color: "#ffffff" }}>Share your result</h2>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg" style={{ color: "#f1f5f9" }} aria-label="Close"><X size={18} aria-hidden="true" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-black/40">
              {preview
                ? <img src={preview} alt="Your result card" className="mx-auto max-h-[60vh] w-auto" />
                : <p className="grid aspect-[9/16] max-h-[60vh] place-items-center text-sm" style={{ color: "#94a3b8" }} role="status">Making your image…</p>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void share()} disabled={!preview} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold disabled:opacity-40" style={{ background: "#0ea5e9", color: "#ffffff" }}><Share2 size={16} aria-hidden="true" /> Share</button>
              <button type="button" onClick={download} disabled={!preview} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border font-semibold disabled:opacity-40" style={{ color: "#f1f5f9", borderColor: "rgba(255,255,255,0.2)" }}><Download size={16} aria-hidden="true" /> Download</button>
            </div>
            {status && <p role="status" className="mt-2 text-center text-xs" style={{ color: "#cbd5e1" }}>{status}</p>}
          </section>
        </div>
      )}
    </>
  );
}
