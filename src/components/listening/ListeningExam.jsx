"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Flag, Headphones, LogOut, Pause, Play, RotateCcw, RotateCw, StickyNote, Volume2, X, XCircle } from "lucide-react";
import ExamShell from "@/components/exam/ExamShell";
import ExamTopBar from "@/components/exam/ExamTopBar";
import ExamQuestionBar from "@/components/exam/ExamQuestionBar";
import ExamReviewDialog from "@/components/exam/ExamReviewDialog";
import ShareResultButton from "@/components/shared/ShareResultButton";
import { useExamSettings } from "@/hooks/useExamSettings";
import { useExamShortcuts } from "@/hooks/useExamShortcuts";
import { useSelectionMarks } from "@/hooks/useSelectionMarks";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountUserId } from "@/lib/auth/account";
import { saveListeningAttemptToAccount } from "@/hooks/useListeningHistory";
import { buildListeningAttempt, saveListeningAttemptLocally } from "@/lib/listening/listening-results.mjs";
import { isAnswered, scoreListening } from "@/lib/listening/exam-scoring.mjs";
import { makeAttemptUuid } from "@/lib/reading/reading-attempt-outbox.mjs";
import { toggleFlag } from "@/lib/exam/exam-settings.mjs";
import { fullMockFor, saveFullMockResult } from "@/lib/mock/full-mock.mjs";
import { requestHelpDialog } from "@/lib/help-dialog";

const SPEEDS = [0.75, 1, 1.25, 1.5];
const draftKey = (slug) => `ielts-listening-exam-v1:${slug}`;
const clock = (seconds) => {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
};

function readDraft(slug) {
  try {
    const draft = JSON.parse(window.localStorage.getItem(draftKey(slug)) || "null");
    return draft?.mode ? draft : null;
  } catch {
    return null;
  }
}

// One part's question markup. Memoised so React never rewrites it: the
// learner's typing and highlights live in this DOM.
const PartQuestions = memo(function PartQuestions({ html, hidden, number }) {
  return <div className="lis-content" data-part={number} hidden={hidden} dangerouslySetInnerHTML={{ __html: html }} />;
});

// Which question a form control (or the element containing it) belongs to.
function questionOf(element, groups) {
  const box = element.closest?.("[data-group]");
  if (box) return groups.find((group) => group.id === box.dataset.group)?.numbers[0] ?? null;
  const key = element.id || element.name || "";
  const match = key.match(/^q(\d+)$/);
  return match ? Number(match[1]) : null;
}

function ModePicker({ test, draft, onStart, volume, onVolume }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/listening" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-slate-400 hover:text-white">← All Listening tests</Link>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">IELTS Listening</p>
      <h1 className="section-title mb-2">{test.title}</h1>
      <p className="section-subtitle mb-6">4 parts · 40 questions · about {test.durationMinutes} minutes. Use headphones if you can.</p>
      <section className="surface-card mb-6" aria-labelledby="sound-check">
        <h2 id="sound-check" className="mb-2 flex items-center gap-2 font-semibold text-slate-100"><Headphones size={18} className="text-brand-400" aria-hidden="true" /> Sound check</h2>
        <label className="flex items-center gap-3 text-sm text-slate-300">
          <Volume2 size={18} aria-hidden="true" /> Volume
          <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => onVolume(Number(event.target.value))} className="w-48 accent-sky-500" aria-label="Volume" />
        </label>
      </section>
      {draft && (
        <section className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-500/[0.07] p-4">
          <p className="text-sm text-slate-200">You have an unfinished attempt ({draft.mode === "exam" ? "Exam mode" : "Practice mode"}, {Object.keys(draft.responses || {}).length} answers, audio at {clock(draft.audioTime)}).</p>
          <button type="button" className="btn-primary mt-3" onClick={() => onStart(draft.mode, draft)}>Resume where I stopped</button>
        </section>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => onStart("exam")} className="rounded-2xl border border-brand-400/40 bg-brand-500/10 p-5 text-left hover:bg-brand-500/15">
          <p className="text-lg font-bold text-white">Exam mode</p>
          <p className="mt-1 text-sm text-slate-300">Like the real test: the recording plays once and can&apos;t be paused or rewound.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-300">Start <ArrowRight size={15} aria-hidden="true" /></span>
        </button>
        <button type="button" onClick={() => onStart("practice")} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left hover:bg-white/[0.06]">
          <p className="text-lg font-bold text-white">Practice mode</p>
          <p className="mt-1 text-sm text-slate-300">Pause, go back or forward 10 seconds, change the speed and replay any part.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-300">Start <ArrowRight size={15} aria-hidden="true" /></span>
        </button>
      </div>
    </main>
  );
}

function Results({ test, attempt, onRetry, fullMockNext }) {
  const [filter, setFilter] = useState("all");
  const shown = attempt.answers.filter((answer) => filter === "all" || (filter === "wrong" ? answer.score < answer.max : answer.score === answer.max));
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {fullMockNext && (
        <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-400/40 bg-brand-500/15 p-4">
          <p className="text-sm text-slate-100"><strong>Listening done.</strong> Next: Part 2, Reading (60 minutes).</p>
          <Link href="/readingmock?fullmock=1" className="btn-primary">Continue to Reading <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      )}
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">IELTS Listening · {test.title}</p>
      <section className="mb-8 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center">
        <div className="text-center sm:pr-8">
          <p className="font-display text-6xl font-black text-white">{attempt.score}<span className="text-2xl text-slate-400">/{attempt.total}</span></p>
          <p className="mt-1 text-slate-300">{attempt.band != null ? `Approximate band ${attempt.band.toFixed(1)}` : "Band estimate needs at least 10 correct"}</p>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          {attempt.sections.map((section) => (
            <div key={section.number} className="rounded-xl border border-white/10 p-3 text-center">
              <p className="text-xs text-slate-400">Part {section.number}</p>
              <p className="text-xl font-bold text-white">{section.correct}/{section.total}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ShareResultButton card={{ kind: "IELTS Listening", band: attempt.band, bandLabel: "Listening band", detail: `${attempt.score}/${attempt.total} correct · ${test.title}` }} />
        <button type="button" onClick={onRetry} className="btn-secondary"><RotateCcw size={16} aria-hidden="true" /> Try again</button>
        <Link href="/listening" className="btn-secondary">All Listening tests</Link>
      </div>
      <h2 className="mb-3 mt-8 text-xl font-bold text-white">Check your answers</h2>
      <div role="group" aria-label="Show" className="mb-3 flex flex-wrap gap-2">
        {[["all", "All"], ["wrong", "Wrong or skipped"], ["right", "Correct"]].map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={`min-h-10 rounded-full border px-4 text-sm ${filter === id ? "border-brand-400 bg-brand-500/15 text-white" : "border-white/10 text-slate-300"}`}>{label}</button>
        ))}
      </div>
      <ul className="space-y-2">
        {shown.map((answer) => {
          const right = answer.score === answer.max;
          return (
            <li key={answer.number} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${right ? "border-emerald-400/20 bg-emerald-500/[0.05]" : "border-rose-400/20 bg-rose-500/[0.05]"}`}>
              {right ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-rose-400" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">Question {answer.number} <span className="font-normal text-slate-400">· Part {answer.section} · {answer.type}</span></p>
                {answer.prompt && <p className="text-slate-300">{answer.prompt}</p>}
                <p className="mt-1 text-slate-300">Your answer: <b className="text-white">{answer.userAnswer || "—"}</b>{!right && answer.correctAnswer && <> · Correct: <b className="text-emerald-300">{answer.correctAnswer}</b></>}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

/**
 * The Listening test in the computer-delivered exam layout: one recording,
 * four parts of questions, a question bar at the bottom. Exam mode plays the
 * recording once; Practice mode can pause, skip and change speed.
 */
export default function ListeningExam({ test, data }) {
  const [settings, updateSettings] = useExamSettings();
  const { user, profile, isLoading } = useAuth();
  const accountUserId = getAccountUserId(user, profile, isLoading);
  const audioRef = useRef(null);
  const contentRef = useRef(null);
  const reportRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const [mode, setMode] = useState(null);
  const [draft, setDraft] = useState(null);
  const [responses, setResponses] = useState({});
  const [flags, setFlags] = useState([]);
  const [current, setCurrent] = useState(1);
  const [part, setPart] = useState(1);
  const [audio, setAudio] = useState({ time: 0, duration: 0, playing: false, ended: false, rate: 1 });
  const [volume, setVolume] = useState(0.85);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [attempt, setAttempt] = useState(null);
  const [fullMock, setFullMock] = useState(null);
  const marks = useSelectionMarks(contentRef, Boolean(mode) && !attempt);

  const numbers = useMemo(() => Object.keys(data.questions).map(Number).sort((a, b) => a - b), [data]);
  const partOf = useCallback((number) => data.questions[number]?.part || 1, [data]);

  useEffect(() => {
    setDraft(readDraft(test.slug));
    setFullMock(fullMockFor(window.localStorage, "listening", window.location.search)?.listeningSlug === test.slug
      ? fullMockFor(window.localStorage, "listening", window.location.search) : null);
  }, [test.slug]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume, mode]);

  // Save progress so a reload or a dropped connection doesn't lose answers.
  useEffect(() => {
    if (!mode || attempt) return;
    try {
      window.localStorage.setItem(draftKey(test.slug), JSON.stringify({ mode, responses, flags, audioTime: audio.time, savedAt: Date.now() }));
    } catch {
      // Answers stay on screen for this visit.
    }
  }, [mode, responses, flags, audio.time, attempt, test.slug]);

  const start = (chosen, resume = null) => {
    setMode(chosen);
    setResponses(resume?.responses || {});
    setFlags(resume?.flags || []);
    startedAtRef.current = Date.now();
    window.requestAnimationFrame(() => {
      const element = audioRef.current;
      if (!element) return;
      if (resume?.audioTime) element.currentTime = resume.audioTime;
      element.play().catch(() => setAudio((state) => ({ ...state, playing: false })));
    });
  };

  // Put saved answers back into the form controls.
  useEffect(() => {
    if (!mode) return;
    const root = contentRef.current;
    if (!root) return;
    for (const [key, value] of Object.entries(responses)) {
      if (Array.isArray(value)) {
        root.querySelectorAll(`[data-group="${key}"] input[type="checkbox"]`).forEach((input) => { input.checked = value.includes(input.value); });
      } else {
        const radio = root.querySelector(`input[type="radio"][name="q${key}"][value="${CSS.escape(String(value))}"]`);
        if (radio) radio.checked = true;
        const field = root.querySelector(`#q${key}`);
        if (field && "value" in field && field.type !== "radio") field.value = value;
      }
    }
    // Only when the screen first opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const onFormChange = (event) => {
    const element = event.target;
    if (!(element instanceof HTMLElement)) return;
    if (element.type === "checkbox") {
      const box = element.closest("[data-group]");
      if (!box) return;
      const max = Number(box.dataset.max) || 2;
      let chosen = [...box.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
      if (chosen.length > max) { element.checked = false; chosen = chosen.filter((value) => value !== element.value); }
      setResponses((state) => ({ ...state, [box.dataset.group]: chosen }));
    } else {
      const number = questionOf(element, data.groups);
      if (number) setResponses((state) => ({ ...state, [number]: element.value }));
    }
    const number = questionOf(element, data.groups);
    if (number) setCurrent(number);
  };

  const goTo = useCallback((number) => {
    const target = Math.min(numbers[numbers.length - 1], Math.max(numbers[0], number));
    setCurrent(target);
    setPart(partOf(target));
    window.requestAnimationFrame(() => {
      const root = contentRef.current;
      const group = data.groups.find((item) => item.numbers.includes(target));
      const control = group
        ? root?.querySelector(`[data-group="${group.id}"] input`)
        : root?.querySelector(`#q${target}`) || root?.querySelector(`input[name="q${target}"]`);
      control?.scrollIntoView({ block: "center", behavior: "smooth" });
      control?.focus({ preventScroll: true });
    });
  }, [numbers, partOf, data.groups]);

  useExamShortcuts({
    onNext: () => goTo(current + 1),
    onPrevious: () => goTo(current - 1),
    onToggleFlag: () => setFlags((state) => toggleFlag(state, current)),
    enabled: Boolean(mode) && !attempt && !reviewOpen,
  });

  const submit = async () => {
    setReviewOpen(false);
    audioRef.current?.pause();
    const answers = scoreListening(data, responses);
    const built = buildListeningAttempt(test, { answers }, { id: makeAttemptUuid(), startedAt: startedAtRef.current });
    if (!built) return;
    saveListeningAttemptLocally(window.localStorage, built);
    if (fullMock) saveFullMockResult(window.localStorage, "listening", { score: built.score, total: built.total, band: built.band, testTitle: test.title });
    try { window.localStorage.removeItem(draftKey(test.slug)); } catch { /* fine */ }
    setAttempt(built);
    window.scrollTo({ top: 0 });
    if (accountUserId) {
      saveListeningAttemptToAccount(accountUserId, built).catch((error) => console.error("Listening result could not be saved to the account:", error));
    }
  };

  const retry = () => {
    setAttempt(null);
    setMode(null);
    setDraft(null);
    setResponses({});
    setFlags([]);
    setAudio({ time: 0, duration: audio.duration, playing: false, ended: false, rate: 1 });
    if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.playbackRate = 1; }
  };

  const audioElement = (
    <audio
      ref={audioRef}
      src={test.audioPath}
      preload="metadata"
      onLoadedMetadata={(event) => { const duration = event.currentTarget.duration || 0; setAudio((state) => ({ ...state, duration })); }}
      onTimeUpdate={(event) => { const time = event.currentTarget.currentTime; setAudio((state) => ({ ...state, time })); }}
      onPlay={() => setAudio((state) => ({ ...state, playing: true }))}
      onPause={() => setAudio((state) => ({ ...state, playing: false }))}
      onEnded={() => setAudio((state) => ({ ...state, playing: false, ended: true }))}
      onRateChange={(event) => { const rate = event.currentTarget.playbackRate; setAudio((state) => ({ ...state, rate })); }}
    />
  );

  // The audio element stays the same from the start screen into the test.
  if (attempt) return <>{audioElement}<Results test={test} attempt={attempt} onRetry={retry} fullMockNext={Boolean(fullMock)} /></>;
  if (!mode) return <>{audioElement}<ModePicker test={test} draft={draft} onStart={start} volume={volume} onVolume={setVolume} /></>;

  const answered = numbers.filter((number) => isAnswered(data, responses, number));
  const parts = data.parts.map((item) => ({
    label: item.title,
    questions: numbers.filter((number) => partOf(number) === item.number).map((number) => ({ number, answered: answered.includes(number), flagged: flags.includes(number) })),
  }));
  const currentPart = data.parts.find((item) => item.number === part) || data.parts[0];
  const partNumbers = parts[part - 1]?.questions.map((question) => question.number) || [];
  const remaining = mode === "exam" && audio.duration ? audio.duration - audio.time : null;
  const seek = (seconds) => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(audio.duration || 0, audioRef.current.currentTime + seconds)); };
  const togglePlay = () => { const element = audioRef.current; if (!element) return; if (element.paused) element.play().catch(() => {}); else element.pause(); };

  return (
    <>
    {audioElement}
    <ExamShell settings={settings}>
      <ExamTopBar
        title={fullMock ? "Full mock · Part 1 of 3: Listening" : "IELTS Listening"}
        subtitle={`${test.title} · ${mode === "exam" ? "Exam mode" : "Practice mode"}`}
        remainingSeconds={remaining}
        settings={settings}
        onSettingsChange={updateSettings}
        helpText={mode === "exam"
          ? "The recording plays once, like the real test. Answer while you listen; switch parts with the bar at the bottom. Select text to highlight it or add a note. Your answers are saved as you go."
          : "Pause, skip 10 seconds or change the speed with the audio controls. Answer while you listen; switch parts with the bar at the bottom. Select text to highlight it or add a note."}
      >
        <button type="button" className="exam-btn" onClick={() => setNotesOpen((open) => !open)} aria-expanded={notesOpen} aria-label={`Notes (${marks.notes.length})`}>
          <StickyNote size={16} aria-hidden="true" /><span className="exam-btn-label">Notes{marks.notes.length ? ` (${marks.notes.length})` : ""}</span>
        </button>
        <button ref={reportRef} type="button" className="exam-btn hidden md:inline-flex" onClick={(event) => requestHelpDialog(event.currentTarget, { category: "incorrect_answer", subject: `Listening content: ${test.title}`.slice(0, 200), body: `Please describe the issue you found in “${test.title}”.\n\nQuestion number (if relevant):\nWhat seems incorrect or unclear:\n\n` })} aria-label="Report an issue with this test">
          <Flag size={16} aria-hidden="true" /><span className="exam-btn-label">Report</span>
        </button>
        <Link href={fullMock ? "/full-mock" : "/listening"} className="exam-btn" aria-label="Save and exit (your answers are kept)">
          <LogOut size={16} aria-hidden="true" /><span className="exam-btn-label">Exit</span>
        </Link>
        <button type="button" className="exam-btn exam-btn-primary" onClick={() => setReviewOpen(true)}>Submit</button>
      </ExamTopBar>

      <div className="lis-audio-bar" role="group" aria-label="Recording">
        {mode === "practice" ? (
          <>
            <button type="button" className="exam-btn" onClick={() => seek(-10)} aria-label="Back 10 seconds"><RotateCcw size={16} aria-hidden="true" /><span className="exam-btn-label">10s</span></button>
            <button type="button" className="exam-btn exam-btn-primary" onClick={togglePlay} aria-label={audio.playing ? "Pause" : "Play"}>{audio.playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}</button>
            <button type="button" className="exam-btn" onClick={() => seek(10)} aria-label="Forward 10 seconds"><RotateCw size={16} aria-hidden="true" /><span className="exam-btn-label">10s</span></button>
            <input type="range" min="0" max={audio.duration || 0} step="1" value={audio.time} onChange={(event) => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); }} className="lis-seek" aria-label="Position in the recording" />
            <span className="lis-time">{clock(audio.time)} / {clock(audio.duration)}</span>
            <select value={audio.rate} onChange={(event) => { if (audioRef.current) audioRef.current.playbackRate = Number(event.target.value); }} className="exam-btn" aria-label="Playback speed">
              {SPEEDS.map((speed) => <option key={speed} value={speed}>{speed === 1 ? "1×" : `${speed}×`}</option>)}
            </select>
          </>
        ) : (
          <>
            <span className="lis-status">{audio.ended ? "The recording has finished. Check your answers, then submit." : audio.playing ? "Recording playing · it plays once" : audio.time > 0 ? "Recording paused by your device" : "Press Play to start the recording"}</span>
            {!audio.playing && !audio.ended && <button type="button" className="exam-btn exam-btn-primary" onClick={togglePlay}><Play size={16} aria-hidden="true" /> {audio.time > 0 ? "Resume" : "Play"}</button>}
            <div className="lis-progress" aria-hidden="true"><span style={{ width: `${audio.duration ? (audio.time / audio.duration) * 100 : 0}%` }} /></div>
          </>
        )}
        <label className="lis-volume"><Volume2 size={16} aria-hidden="true" /><span className="sr-only">Volume</span>
          <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Volume" />
        </label>
      </div>

      <div className="exam-part-strip" aria-live="polite">
        <b>{currentPart.title}</b>
        Listen and answer questions {partNumbers[0]}–{partNumbers[partNumbers.length - 1]}.
        {currentPart.intro && !/^Questions/.test(currentPart.intro) && <span className="lis-intro"> {currentPart.intro}</span>}
      </div>

      <div className="lis-scroll" ref={contentRef} onInput={onFormChange} onChange={onFormChange} onFocus={(event) => { const number = questionOf(event.target, data.groups); if (number) setCurrent(number); }}>
        {data.parts.map((item) => <PartQuestions key={item.number} number={item.number} html={item.html} hidden={item.number !== part} />)}
      </div>

      {marks.menu && (
        <div className="lis-menu" style={{ left: marks.menu.x, top: marks.menu.y }} role="toolbar" aria-label="Selected text" onMouseDown={(event) => event.preventDefault()}>
          {marks.menu.writing ? (
            <form onSubmit={(event) => { event.preventDefault(); marks.addNote(noteText); setNoteText(""); }} className="flex items-center gap-1">
              <input autoFocus value={noteText} onChange={(event) => setNoteText(event.target.value)} maxLength={200} placeholder="Your note" className="exam-input" aria-label="Note" onMouseDown={(event) => event.stopPropagation()} />
              <button type="submit" className="exam-btn exam-btn-primary">Save</button>
            </form>
          ) : (
            <>
              <button type="button" className="exam-btn" onClick={marks.highlight}>Highlight</button>
              <button type="button" className="exam-btn" onClick={() => marks.setMenu({ ...marks.menu, writing: true })}>Note</button>
              {marks.menu.insideMark && <button type="button" className="exam-btn" onClick={marks.clear}>Clear</button>}
            </>
          )}
          <button type="button" className="exam-btn" onClick={marks.close} aria-label="Close"><X size={14} aria-hidden="true" /></button>
        </div>
      )}

      {notesOpen && (
        <aside className="lis-notes" aria-label="Your notes">
          <div className="mb-2 flex items-center justify-between"><b>Notes</b><button type="button" className="exam-btn" onClick={() => setNotesOpen(false)} aria-label="Close notes"><X size={14} aria-hidden="true" /></button></div>
          {marks.notes.length === 0 ? <p style={{ color: "var(--exam-muted)" }}>Select text in the questions and choose Note.</p> : (
            <ul className="space-y-2">
              {marks.notes.map((note) => (
                <li key={note.id} className="exam-box mb-0">
                  <button type="button" className="text-left" onClick={() => { const mark = contentRef.current?.querySelector(`[data-note="${note.id}"]`); if (mark) { setPart(Number(mark.closest("[data-part]")?.dataset.part) || part); window.requestAnimationFrame(() => mark.scrollIntoView({ block: "center" })); } }}>
                    <span className="block text-sm" style={{ color: "var(--exam-muted)" }}>“{note.quote}”</span>
                    <span className="block">{note.text}</span>
                  </button>
                  <button type="button" className="mt-1 text-sm underline" onClick={() => marks.removeNote(note.id)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      <ExamQuestionBar
        parts={parts}
        current={current}
        onSelect={goTo}
        onToggleFlag={(number) => setFlags((state) => toggleFlag(state, number))}
        onReview={() => setReviewOpen(true)}
        reviewLabel="Review & submit"
      />
      <ExamReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onSubmit={() => void submit()}
        total={numbers.length}
        unanswered={numbers.filter((number) => !answered.includes(number))}
        flagged={flags}
        remainingSeconds={remaining}
        onJump={(number) => { setReviewOpen(false); goTo(number); }}
      />
    </ExamShell>
    </>
  );
}
