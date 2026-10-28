"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Flag, Headphones, Volume2, X } from "lucide-react";
import { requestHelpDialog } from "@/lib/help-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getListeningAccountUserId, saveListeningAttemptToAccount } from "@/hooks/useListeningHistory";
import { buildListeningAttempt, listeningResultSignature, saveListeningAttemptLocally } from "@/lib/listening/listening-results.mjs";
import { makeAttemptUuid } from "@/lib/reading/reading-attempt-outbox.mjs";

export default function ListeningTestExperience({ test, html }) {
  const audioRef = useRef(null);
  const frameRef = useRef(null);
  const reportRef = useRef(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [savedResult, setSavedResult] = useState(null);
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getListeningAccountUserId(user, profile, isLoading);
  const accountUserIdRef = useRef(accountUserId);
  const startedAtRef = useRef(Date.now());
  const lastResultSignatureRef = useRef("");

  useEffect(() => {
    accountUserIdRef.current = accountUserId;
  }, [accountUserId]);

  const saveResult = useCallback(async (payload) => {
    const signature = listeningResultSignature(payload);
    if (!signature || signature === lastResultSignatureRef.current) return;
    const attempt = buildListeningAttempt(test, payload, { id: makeAttemptUuid(), startedAt: startedAtRef.current });
    if (!attempt) return;
    lastResultSignatureRef.current = signature;
    const savedLocally = saveListeningAttemptLocally(window.localStorage, attempt);
    const userId = accountUserIdRef.current;
    let where = savedLocally ? "browser" : "none";
    if (userId) {
      try {
        await saveListeningAttemptToAccount(userId, attempt);
        where = "account";
      } catch (error) {
        console.error("Listening result could not be saved to the account:", error);
      }
    }
    setSavedResult({ attempt, where });
  }, [test]);
  const syncFrameSettings = useCallback(() => {
    const frame = frameRef.current?.contentWindow;
    const audio = audioRef.current;
    if (!frame || !audio) return;
    frame.postMessage({
      type: "listening:audio-state",
      rate: audio.playbackRate,
      volume: audio.volume,
      muted: audio.muted || audio.volume === 0,
    }, "*");
  }, []);

  const sendThemeToFrame = useCallback(() => {
    const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    frameRef.current?.contentWindow?.postMessage({ type: "listening:set-theme", theme }, "*");
  }, []);

  useEffect(() => {
    const handleFrameMessage = (event) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "listening:audio-control" && audioRef.current) {
        const audio = audioRef.current;
        const { rate, volume, muted } = event.data;
        if (Number.isFinite(Number(rate)) && Number(rate) >= 0.5 && Number(rate) <= 2) {
          audio.playbackRate = Number(rate);
          setPlaybackRate(Number(rate));
        }
        if (Number.isFinite(Number(volume)) && Number(volume) >= 0 && Number(volume) <= 1) {
          audio.volume = Number(volume);
          audio.muted = false;
        }
        if (typeof muted === "boolean") audio.muted = muted;
        syncFrameSettings();
        return;
      }
      if (event.data?.type === "listening:results") {
        void saveResult(event.data);
        return;
      }
      if (event.data?.type === "listening:report") {
        requestHelpDialog(reportRef.current, {
          category: "incorrect_answer",
          subject: `Listening content: ${test.title}`.slice(0, 200),
          body: `Please describe the issue you found in “${test.title}”.\n\nQuestion number (if relevant):\nWhat seems incorrect or unclear:\n\n`,
        });
      }
    };
    const themeObserver = new MutationObserver(sendThemeToFrame);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    sendThemeToFrame();
    window.addEventListener("message", handleFrameMessage);
    return () => {
      window.removeEventListener("message", handleFrameMessage);
      themeObserver.disconnect();
    };
  }, [sendThemeToFrame, syncFrameSettings, saveResult, test.title]);

  const changePlaybackRate = (event) => {
    const rate = Number(event.target.value);
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
    syncFrameSettings();
  };

  return (
    <main className="fixed inset-0 z-[90] flex h-[100dvh] flex-col overflow-hidden bg-surface text-slate-100">
      <header className="z-10 shrink-0 border-b border-white/10 bg-surface/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-5 sm:py-3">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3">
          <Link href="/listening" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Back to listening tests">
            <ArrowLeft size={18} aria-hidden="true" /> <span className="hidden sm:inline">All tests</span>
          </Link>
          <span className="h-6 w-px shrink-0 bg-white/10" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-400">IELTS Listening practice</p>
            <h1 className="truncate font-display text-base font-semibold leading-snug sm:text-xl">{test.title}</h1>
            <p className="text-[11px] text-slate-400">4 sections · {test.questionCount} questions · {test.durationMinutes} minutes</p>
          </div>
          <button ref={reportRef} type="button" onClick={(event) => requestHelpDialog(event.currentTarget, { category: "incorrect_answer", subject: `Listening content: ${test.title}`.slice(0, 200), body: `Please describe the issue you found in “${test.title}”.\n\nQuestion number (if relevant):\nWhat seems incorrect or unclear:\n\n` })} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:text-sm">
            <Flag size={16} aria-hidden="true" /><span className="hidden sm:inline">Report issue</span>
          </button>
        </div>

        {!test.audioInsideTest && (
        <div className="mx-auto mt-2 flex w-full max-w-[1600px] flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 sm:mt-3 sm:flex-nowrap sm:gap-3 sm:p-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-surface/80 px-2 sm:px-3">
              <Volume2 size={16} className="hidden shrink-0 text-brand-300 sm:block" aria-hidden="true" />
              <audio ref={audioRef} controls preload="metadata" className="h-11 min-w-0 flex-1" aria-label={`Audio for ${test.title}`} onLoadedMetadata={syncFrameSettings} onVolumeChange={syncFrameSettings} onRateChange={syncFrameSettings}>
                <source src={test.audioPath} type="audio/mpeg" />
                Your browser cannot play this audio file.
              </audio>
            </div>
            <label className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-surface/80 px-3 text-xs font-medium text-slate-300">
              <Headphones size={15} aria-hidden="true" />
              <span className="sr-only">Audio speed</span>
              <select value={playbackRate} onChange={changePlaybackRate} className="bg-transparent text-sm text-slate-100 outline-none" aria-label="Audio playback speed">
                {[0.75, 1, 1.25, 1.5, 2].map((rate) => <option key={rate} value={rate} className="bg-slate-900">{rate === 1 ? "Normal" : `${rate}×`}</option>)}
              </select>
            </label>
          </div>
        )}
      </header>

      {savedResult && (
        <div role="status" className="shrink-0 border-b border-emerald-400/20 bg-emerald-500/10 px-3 py-2 sm:px-5">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-1 text-sm text-emerald-200">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-300" aria-hidden="true" />
            <p className="min-w-0 flex-1">
              <strong>{savedResult.attempt.score}/{savedResult.attempt.total}</strong>
              {savedResult.attempt.band != null && <> · approximate band <strong>{savedResult.attempt.band.toFixed(1)}</strong></>}
              {" · "}
              {savedResult.where === "account"
                ? "Saved to your account."
                : savedResult.where === "browser"
                  ? accountUserId ? "Saved in this browser; account sync failed." : "Saved in this browser. Sign in to keep results across devices."
                  : "This result could not be saved."}
            </p>
            <Link href="/listening#listening-history" className="font-semibold underline underline-offset-2">View history</Link>
            <button type="button" onClick={() => setSavedResult(null)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10" aria-label="Dismiss result message">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden bg-surface px-2 py-2 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        <iframe
          ref={frameRef}
          srcDoc={html}
          title={`${test.title} practice test`}
          className="mx-auto block h-full min-h-0 w-full max-w-[1600px] rounded-2xl border border-white/10 bg-surface shadow-[0_10px_40px_rgba(0,0,0,0.16)]"
          onLoad={() => {
            // A retake reloads the test page, which starts a new attempt.
            startedAtRef.current = Date.now();
            lastResultSignatureRef.current = "";
            sendThemeToFrame();
            syncFrameSettings();
          }}
          sandbox="allow-scripts allow-forms allow-modals allow-downloads allow-pointer-lock allow-presentation"
          allowFullScreen
          loading="eager"
        />
      </div>
    </main>
  );
}
