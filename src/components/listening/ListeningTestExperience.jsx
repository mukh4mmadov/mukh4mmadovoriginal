"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flag, Headphones, Volume2 } from "lucide-react";
import { requestHelpDialog } from "@/lib/help-dialog";

export default function ListeningTestExperience({ test, html }) {
  const audioRef = useRef(null);
  const frameRef = useRef(null);
  const reportRef = useRef(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const handleFrameMessage = (event) => {
      if (event.source !== frameRef.current?.contentWindow || event.data?.type !== "listening:report") return;
      requestHelpDialog(reportRef.current, {
        category: "incorrect_answer",
        subject: `Listening content: ${test.title}`.slice(0, 200),
        body: `Please describe the issue you found in “${test.title}”.\n\nQuestion number (if relevant):\nWhat seems incorrect or unclear:\n\n`,
      });
    };
    window.addEventListener("message", handleFrameMessage);
    return () => window.removeEventListener("message", handleFrameMessage);
  }, [test.title]);

  const changePlaybackRate = (event) => {
    const rate = Number(event.target.value);
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  return (
    <main className="fixed inset-0 z-[90] flex h-[100dvh] flex-col overflow-hidden bg-slate-950 text-white">
      <header className="z-10 shrink-0 border-b border-white/10 bg-slate-950 shadow-lg">
        <div className="mx-auto flex min-h-14 max-w-[1600px] items-center gap-3 px-3 sm:px-5">
          <Link href="/listening" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Back to listening tests">
            <ArrowLeft size={18} aria-hidden="true" /> <span className="hidden sm:inline">All tests</span>
          </Link>
          <span className="h-6 w-px shrink-0 bg-white/10" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold sm:text-base">{test.title}</p>
            <p className="text-[11px] text-slate-400">4 sections · {test.questionCount} questions · {test.durationMinutes} minutes</p>
          </div>
          <button ref={reportRef} type="button" onClick={(event) => requestHelpDialog(event.currentTarget, { category: "incorrect_answer", subject: `Listening content: ${test.title}`.slice(0, 200), body: `Please describe the issue you found in “${test.title}”.\n\nQuestion number (if relevant):\nWhat seems incorrect or unclear:\n\n` })} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:text-sm">
            <Flag size={16} aria-hidden="true" /><span className="hidden sm:inline">Report issue</span>
          </button>
        </div>

        {!test.audioInsideTest && (
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-3 pb-3 sm:flex-nowrap sm:gap-4 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-2 sm:px-3">
              <Volume2 size={16} className="hidden shrink-0 text-brand-300 sm:block" aria-hidden="true" />
              <audio ref={audioRef} controls preload="metadata" className="h-11 min-w-0 flex-1" aria-label={`Audio for ${test.title}`}>
                <source src={test.audioPath} type="audio/mpeg" />
                Your browser cannot play this audio file.
              </audio>
            </div>
            <label className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 text-xs font-medium text-slate-300">
              <Headphones size={15} aria-hidden="true" />
              <span className="sr-only">Audio speed</span>
              <select value={playbackRate} onChange={changePlaybackRate} className="bg-transparent text-sm text-white outline-none" aria-label="Audio playback speed">
                {[0.75, 0.9, 1, 1.1, 1.25, 1.5].map((rate) => <option key={rate} value={rate} className="bg-slate-900">{rate === 1 ? "Normal" : `${rate}×`}</option>)}
              </select>
            </label>
          </div>
        )}
      </header>

      <iframe
        ref={frameRef}
        srcDoc={html}
        title={`${test.title} practice test`}
        className="min-h-0 w-full flex-1 border-0 bg-white"
        sandbox="allow-scripts allow-forms allow-modals allow-downloads allow-pointer-lock allow-presentation"
        allowFullScreen
        loading="eager"
      />
    </main>
  );
}
