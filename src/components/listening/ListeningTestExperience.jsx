"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Flag, Headphones, LogOut, Volume2, X } from "lucide-react";
import ExamShell from "@/components/exam/ExamShell";
import ExamTopBar from "@/components/exam/ExamTopBar";
import ShareResultButton from "@/components/shared/ShareResultButton";
import { useExamSettings } from "@/hooks/useExamSettings";
import { requestHelpDialog } from "@/lib/help-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { saveListeningAttemptToAccount } from "@/hooks/useListeningHistory";
import { getAccountUserId } from "@/lib/auth/account";
import { buildListeningAttempt, listeningResultSignature, saveListeningAttemptLocally } from "@/lib/listening/listening-results.mjs";
import { makeAttemptUuid } from "@/lib/reading/reading-attempt-outbox.mjs";
import { fullMockFor, saveFullMockResult } from "@/lib/mock/full-mock.mjs";

export default function ListeningTestExperience({ test, html }) {
  const audioRef = useRef(null);
  const frameRef = useRef(null);
  const reportRef = useRef(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [savedResult, setSavedResult] = useState(null);
  // Set when this test was opened as Part 1 of a full mock.
  const [fullMock, setFullMock] = useState(null);
  const [fullMockDone, setFullMockDone] = useState(false);
  const fullMockRef = useRef(null);
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const accountUserIdRef = useRef(accountUserId);
  const startedAtRef = useRef(Date.now());
  const lastResultSignatureRef = useRef("");
  const [settings, updateSettings] = useExamSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    accountUserIdRef.current = accountUserId;
  }, [accountUserId]);

  useEffect(() => {
    const session = fullMockFor(window.localStorage, "listening", window.location.search);
    const mine = session?.listeningSlug === test.slug ? session : null;
    fullMockRef.current = mine;
    setFullMock(mine);
  }, [test.slug]);

  const saveResult = useCallback(async (payload) => {
    const signature = listeningResultSignature(payload);
    if (!signature || signature === lastResultSignatureRef.current) return;
    const attempt = buildListeningAttempt(test, payload, { id: makeAttemptUuid(), startedAt: startedAtRef.current });
    if (!attempt) return;
    lastResultSignatureRef.current = signature;
    if (fullMockRef.current) {
      saveFullMockResult(window.localStorage, "listening", { score: attempt.score, total: attempt.total, band: attempt.band, testTitle: test.title });
      fullMockRef.current = null;
      setFullMockDone(true);
    }
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
    const frame = frameRef.current?.contentWindow;
    if (!frame) return;
    const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    frame.postMessage({ type: "listening:set-theme", theme }, "*");
    // The exam colours and text size apply inside the test page too.
    const { scheme, textSize } = settingsRef.current;
    frame.postMessage({ type: "listening:set-exam", scheme, textSize }, "*");
  }, []);

  useEffect(() => {
    sendThemeToFrame();
  }, [settings.scheme, settings.textSize, sendThemeToFrame]);

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

  const report = (target) => requestHelpDialog(target, {
    category: "incorrect_answer",
    subject: `Listening content: ${test.title}`.slice(0, 200),
    body: `Please describe the issue you found in “${test.title}”.\n\nQuestion number (if relevant):\nWhat seems incorrect or unclear:\n\n`,
  });

  return (
    <ExamShell settings={settings}>
      <ExamTopBar
        title={fullMock || fullMockDone ? "Full mock · Part 1 of 3: Listening" : "IELTS Listening"}
        subtitle={`${test.title} · 4 parts · ${test.questionCount} questions · ${test.durationMinutes} minutes`}
        settings={settings}
        onSettingsChange={updateSettings}
        helpText="Play the recording and answer the questions as you listen. The timer, the parts and Submit are inside the test below. Settings change the text size and colours of the whole test."
      >
        <button ref={reportRef} type="button" className="exam-btn hidden sm:inline-flex" onClick={(event) => report(event.currentTarget)} aria-label="Report an issue with this test">
          <Flag size={16} aria-hidden="true" /><span className="exam-btn-label">Report issue</span>
        </button>
        <Link href={fullMock || fullMockDone ? "/full-mock" : "/listening"} className="exam-btn" aria-label={fullMock || fullMockDone ? "Exit to the full mock" : "Exit to all Listening tests"}>
          <LogOut size={16} aria-hidden="true" /><span className="exam-btn-label">Exit</span>
        </Link>
      </ExamTopBar>

      {!test.audioInsideTest && (
        <div className="exam-part-strip flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
          <Volume2 size={18} className="hidden shrink-0 sm:block" aria-hidden="true" />
          <audio ref={audioRef} controls preload="metadata" className="h-10 min-w-0 flex-1" aria-label={`Audio for ${test.title}`} onLoadedMetadata={syncFrameSettings} onVolumeChange={syncFrameSettings} onRateChange={syncFrameSettings}>
            <source src={test.audioPath} type="audio/mpeg" />
            Your browser cannot play this audio file.
          </audio>
          <label className="exam-btn shrink-0">
            <Headphones size={15} aria-hidden="true" />
            <span className="sr-only">Audio speed</span>
            <select value={playbackRate} onChange={changePlaybackRate} className="bg-transparent outline-none" aria-label="Audio playback speed" style={{ color: "inherit" }}>
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => <option key={rate} value={rate} style={{ color: "#111", background: "#fff" }}>{rate === 1 ? "Normal speed" : `${rate}× speed`}</option>)}
            </select>
          </label>
        </div>
      )}

      {fullMockDone && (
        <div role="status" className="exam-notice flex flex-wrap items-center justify-center gap-3">
          <p><strong>Listening done.</strong> Next: Part 2, Reading (60 minutes).</p>
          <Link href="/readingmock?fullmock=1" className="exam-btn exam-btn-primary">Continue to Reading <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      )}

      {savedResult && (
        <div role="status" className="exam-notice flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-left">
          <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />
          <p className="min-w-0">
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
          <ShareResultButton className="exam-btn" label="Share" card={{ kind: "IELTS Listening", band: savedResult.attempt.band, bandLabel: "Listening band", detail: `${savedResult.attempt.score}/${savedResult.attempt.total} correct · ${test.title}` }} />
          <button type="button" onClick={() => setSavedResult(null)} className="exam-btn" aria-label="Dismiss result message">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        <iframe
          ref={frameRef}
          srcDoc={html}
          title={`${test.title} practice test`}
          className="block h-full min-h-0 w-full border-0"
          style={{ background: "var(--exam-bg)" }}
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
    </ExamShell>
  );
}
