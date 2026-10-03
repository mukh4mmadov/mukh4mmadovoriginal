"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { findFullMockPassages, getMockBand, MOCK_STORAGE_KEY } from "@/lib/reading/mock-test";
import { isAnswerCorrect, formatAnswer } from "@/lib/reading/answer-review";
import { supabase } from "@/lib/supabase/client";
import { readingMockAttemptsRepository } from "@/lib/supabase/repositories/reading-mock-attempts.repository";
import HighlightablePassage from "@/components/reading/HighlightablePassage";
import { useTextHighlight } from "@/hooks/useTextHighlight";
import { ArrowLeft, Type } from "lucide-react";

const DURATION = 60 * 60;
const ANSWER_OPTIONS = {
  "true-false-not-given": ["TRUE", "FALSE", "NOT GIVEN"],
  "yes-no-not-given": ["YES", "NO", "NOT GIVEN"],
};
const answerKey = (passage, question) => `${passage.slug}:${question.id}`;
const readSaved = () => {
  try { return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || "null"); } catch { return null; }
};

export default function FullMockPage() {
  const { user, profile, isLoading } = useAuth();
  const accountUserId = !isLoading && user?.id && profile && !profile.is_guest && !user.is_anonymous ? user.id : null;
  const passages = useMemo(() => findFullMockPassages(), []);
  const highlightOne = useTextHighlight(`mock-${passages?.[0]?.slug || "empty"}`);
  const highlightTwo = useTextHighlight(`mock-${passages?.[1]?.slug || "empty"}`);
  const highlightThree = useTextHighlight(`mock-${passages?.[2]?.slug || "empty"}`);
  const highlightStates = [highlightOne, highlightTwo, highlightThree];
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(DURATION);
  const [fontSize, setFontSize] = useState("medium");
  const [result, setResult] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [resumeAfterConsent, setResumeAfterConsent] = useState(false);
  const [startError, setStartError] = useState("");
  const [focusWarning, setFocusWarning] = useState(false);
  const finishedRef = useRef(false);
  const [saved, setSaved] = useState(null);
  const [cloudResults, setCloudResults] = useState([]);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudMessage, setCloudMessage] = useState("");
  const [cloudSaving, setCloudSaving] = useState(false);
  const startedAtRef = useRef(0);
  const deadlineRef = useRef(0);
  const answersRef = useRef({});
  const forcedExitAtRef = useRef(null);

  useEffect(() => {
    setSaved(readSaved());
  }, []);

  useEffect(() => {
    const record = readSaved();
    if (!record?.draft || (!record.draft.exitAttemptAt && record.draft.deadline > Date.now())) return;
    const expiredAnswers = record.draft.answers || {};
    answersRef.current = expiredAnswers;
    setAnswers(expiredAnswers);
    deadlineRef.current = record.draft.deadline;
    forcedExitAtRef.current = record.draft.exitAttemptAt || record.draft.deadline;
    startedAtRef.current = record.draft.startedAt || record.draft.deadline - DURATION * 1000;
    setRemaining(0);
    setFocusWarning(true);
    setStarted(true);
  }, []);

  useEffect(() => {
    let active = true;
    if (!accountUserId || !supabase) { setCloudLoaded(true); return; }
    readingMockAttemptsRepository.listForUser(accountUserId).then((history) => {
      if (!active) return;
      setCloudResults(Array.isArray(history) ? history : []);
      setCloudLoaded(true);
    }).catch(() => { if (active) { setCloudResults([]); setCloudLoaded(true); setCloudMessage("Cloud mock history could not be loaded. You can retry after checking your connection."); } });
    return () => { active = false; };
  }, [accountUserId]);

  useEffect(() => {
    if (!started || result) return;
    document.body.classList.add("ielts-mock-active");
    const sync = () => {
      const next = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) finish(true);
    };
    const onVisibility = () => {
      if (document.hidden) {
        setFocusWarning(true);
        finish(true, "left-test-screen");
      } else sync();
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) {
        setFocusWarning(true);
        finish(true, "left-fullscreen");
      }
    };
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onPageHide = () => {
      if (finishedRef.current) return;
      try {
        const current = readSaved() || {};
        current.draft = { answers: answersRef.current, deadline: deadlineRef.current, startedAt: startedAtRef.current, exitAttemptAt: Date.now() };
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(current));
      } catch { /* the in-memory attempt is still protected during this page session */ }
    };
    const timer = window.setInterval(sync, 1000);
    window.addEventListener("focus", sync);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("visibilitychange", onVisibility);
      document.body.classList.remove("ielts-mock-active");
    };
  }, [started, result]);

  useEffect(() => {
    if (!started || result) return;
    try {
      const current = readSaved() || {};
      const next = { ...current, draft: { answers, deadline: deadlineRef.current, startedAt: startedAtRef.current, exitAttemptAt: null } };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(next));
      setSaved(next);
    } catch { /* keep working if local storage is unavailable */ }
  }, [started, result, answers, remaining]);

  const questions = useMemo(() => passages?.flatMap((passage, passageIndex) => passage.questionGroups.flatMap((group) => group.questions.map((question) => ({ passage, passageIndex, group, question, key: answerKey(passage, question) })))) || [], [passages]);

  function setAnswer(key, value) {
    setAnswers((current) => {
      const next = { ...current, [key]: value };
      answersRef.current = next;
      return next;
    });
  }

  async function begin(restore = false) {
    setStartError("");
    if (!document.fullscreenEnabled || typeof document.documentElement.requestFullscreen !== "function") {
      setStartError("This browser cannot grant fullscreen, so the mock cannot start here.");
      return;
    }
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setStartError("Fullscreen permission is required to start the mock. Allow it in your browser and try again.");
      return;
    }
    if (!document.fullscreenElement) {
      setStartError("Fullscreen permission is required to start the mock. Allow it in your browser and try again.");
      return;
    }
    const prior = restore ? readSaved() : null;
    const currentAnswers = prior?.draft?.answers || {};
    setAnswers(currentAnswers);
    answersRef.current = currentAnswers;
    const left = prior?.draft?.deadline ? Math.max(0, Math.ceil((prior.draft.deadline - Date.now()) / 1000)) : DURATION;
    setRemaining(left);
    deadlineRef.current = Date.now() + left * 1000;
    startedAtRef.current = prior?.draft?.startedAt || (Date.now() - (DURATION - left) * 1000);
    forcedExitAtRef.current = null;
    setStarted(true);
    setResult(null);
    finishedRef.current = false;
    setFocusWarning(false);
  }

  async function finish(autoSubmit = false, autoSubmitReason = null) {
    if (!started || finishedRef.current || !passages) return;
    finishedRef.current = true;
    const finalAnswers = answersRef.current;
    const checkedQuestions = questions.map(({ passage, passageIndex, group, question, key }, index) => ({
      number: index + 1,
      passageNumber: passageIndex + 1,
      passageTitle: passage.title,
      passage,
      groupInstructions: group.instructions,
      question,
      userAnswer: finalAnswers[key] ?? "",
      correct: isAnswerCorrect(question, finalAnswers[key]),
    }));
    const score = checkedQuestions.filter((item) => item.correct).length;
    const sections = passages.map((passage, index) => {
      const sectionQuestions = checkedQuestions.filter((item) => item.passageNumber === index + 1);
      return { title: passage.title, difficulty: ["Easy", "Medium", "Hard"][index], correct: sectionQuestions.filter((item) => item.correct).length, total: sectionQuestions.length, answered: sectionQuestions.filter((item) => item.userAnswer !== "").length };
    });
    const endedAt = forcedExitAtRef.current || Date.now();
    const elapsedSeconds = DURATION - Math.max(0, Math.ceil((deadlineRef.current - endedAt) / 1000));
    const typeMap = new Map();
    checkedQuestions.forEach((item) => {
      const stats = typeMap.get(item.question.type) || { type: item.question.type, correct: 0, wrong: 0, skipped: 0, total: 0 };
      stats.total += 1;
      if (!item.userAnswer) stats.skipped += 1;
      else if (item.correct) stats.correct += 1;
      else stats.wrong += 1;
      typeMap.set(item.question.type, stats);
    });
    const history = { id: crypto.randomUUID(), completedAt: new Date().toISOString(), rawScore: score, total: questions.length, band: getMockBand(score), elapsedSeconds, autoSubmitted: autoSubmit, autoSubmitReason: autoSubmitReason || (forcedExitAtRef.current ? "left-test-screen" : null), sections, questionTypes: [...typeMap.values()], answers: checkedQuestions.map(({ number, passageNumber, passageTitle, question, userAnswer, correct }) => ({ number, passageNumber, passageTitle, type: question.type, prompt: question.prompt || question.paragraphLabel || `${question.before || ""} ___ ${question.after || ""}`, userAnswer: formatAnswer(question, userAnswer, passages[passageNumber - 1]), correctAnswer: formatAnswer(question, question.answer, passages[passageNumber - 1]), explanation: question.explanation || "", correct })) };
    try {
      const previous = readSaved();
      const results = [...(previous?.results || []), history].slice(-20);
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify({ results, draft: null }));
      setSaved({ results, draft: null });
      if (accountUserId && supabase) void saveToAccount(accountUserId, [history]);
    } catch { /* keep the result available on screen */ }
    setResult(history);
    setStarted(false);
    setShowSubmit(false);
    document.body.classList.remove("ielts-mock-active");
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }

  async function saveToAccount(userId, localResults) {
    if (!supabase) { setCloudMessage("Cloud sync is not configured. Your results are still saved in this browser."); return; }
    setCloudSaving(true);
    setCloudMessage("");
    try {
      const remote = await readingMockAttemptsRepository.listForUser(userId);
      const merged = new Map([...remote, ...localResults].filter((item) => item?.id).map((item) => [item.id, item]));
      const results = [...merged.values()].sort((a,b)=>String(a.completedAt).localeCompare(String(b.completedAt))).slice(-20);
      const stored = await readingMockAttemptsRepository.upsertMany(userId, results);
      setCloudResults(stored.length ? stored : results);
      setCloudMessage("Mock history is saved to your account and will be available on your other signed-in devices.");
    } catch { setCloudMessage("Mock history could not be synced yet. Your browser copy is still saved; try again when online."); }
    finally { setCloudSaving(false); }
  }

  const startFresh = () => {
    setAnswers({}); answersRef.current = {}; setResult(null); setShowSubmit(false);
    try { const current=readSaved()||{}; current.draft=null; localStorage.setItem(MOCK_STORAGE_KEY,JSON.stringify(current)); setSaved(current); } catch {}
    setResumeAfterConsent(false);
    setStartError("");
    setShowConsent(true);
  };
  const acceptMockRules = async () => {
    setShowConsent(false);
    await begin(resumeAfterConsent);
  };
  const savedDraft = saved?.draft?.deadline && saved.draft.deadline > Date.now();
  const localResults = saved?.results || [];
  const historyForDisplay = [...new Map([...cloudResults, ...localResults].filter((item) => item?.id).map((item) => [item.id, item])).values()].sort((a,b)=>String(b.completedAt).localeCompare(String(a.completedAt)));
  const cloudImportNeeded = localResults.some((item) => !cloudResults.some((cloudItem) => cloudItem.id === item.id));

  if (!passages) return <main className="mx-auto max-w-3xl px-4 py-16 text-white"><h1 className="text-3xl font-bold">Mock test is being prepared</h1><p className="mt-3 text-slate-300">The passage library does not currently contain an easy, medium and hard combination with exactly 40 questions. No incomplete mock has been published.</p><Link href="/reading" className="mt-6 inline-flex text-brand-300 underline">Back to passages</Link></main>;

  if (result) return <main className="mx-auto max-w-5xl px-4 py-10 text-slate-100 sm:px-6">
    <Link href="/reading" className="inline-flex items-center gap-2 text-sm text-brand-300"><ArrowLeft size={16}/>Back to practice</Link>
    <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-300">Full Reading Mock · Practice result, not an official IELTS score</p>
      <div className="mt-5 flex flex-wrap items-end gap-6"><div><h1 className="text-5xl font-black">{result.rawScore}<span className="text-2xl text-slate-400">/40</span></h1><p className="mt-2 text-slate-300">Correct answers</p></div><div><p className="text-4xl font-bold">Band {result.band.toFixed(1)}</p><p className="mt-2 text-slate-400">Approximate Academic Reading conversion</p></div><div><p className="text-2xl font-bold">{Math.floor(result.elapsedSeconds / 60)}:{String(result.elapsedSeconds % 60).padStart(2,"0")}</p><p className="mt-2 text-slate-400">Time used</p></div></div>
      <p className="mt-5 rounded-xl bg-amber-300/10 p-4 text-sm text-amber-100">This conversion is approximate practice guidance. It is not an official IELTS result; official band boundaries can vary by test.</p>{result.autoSubmitReason&&<p role="status" className="mt-3 rounded-xl bg-amber-300/10 p-4 text-sm text-amber-100">The mock was automatically submitted because the test screen or fullscreen mode was left.</p>}
      <h2 className="mt-8 text-xl font-bold">Section analysis</h2><div className="mt-3 grid gap-3 md:grid-cols-3">{result.sections.map((section) => <article key={section.title} className="rounded-xl border border-white/10 p-4"><p className="text-xs uppercase text-slate-400">{section.difficulty} · {section.answered}/{section.total} answered</p><h3 className="mt-2 font-semibold">{section.title}</h3><p className="mt-3 text-2xl font-bold">{section.correct}/{section.total}</p></article>)}</div>
      <h2 className="mt-8 text-xl font-bold">Question-type analysis</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{result.questionTypes.map((item)=><article key={item.type} className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold capitalize">{item.type.replace(/-/g," ")}</h3><p className="mt-2 text-sm text-slate-300">{item.correct}/{item.total} correct · {item.wrong} incorrect · {item.skipped} skipped</p>{item.total-item.skipped>0&&<p className="mt-1 text-xs text-slate-400">Accuracy among answered: {Math.round(item.correct/(item.total-item.skipped)*100)}%</p>}</article>)}</div>
      <h2 className="mt-8 text-xl font-bold">Question review</h2><div className="mt-3 space-y-3">{result.answers.map((item) => <article key={`${item.passageNumber}-${item.number}`} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">Q{item.number} · Passage {item.passageNumber}: {item.prompt}</p><span className={item.correct ? "text-emerald-300" : "text-rose-300"}>{item.correct ? "Correct" : item.userAnswer ? "Incorrect" : "Skipped"}</span></div><p className="mt-2 text-sm text-slate-300">Your answer: {item.userAnswer || "Not answered"} · Correct answer: {item.correctAnswer}</p>{item.explanation && <p className="mt-2 text-sm text-slate-400">{item.explanation}</p>}</article>)}</div>
      <button onClick={startFresh} className="mt-8 min-h-12 rounded-xl bg-brand-500 px-5 font-semibold text-white">Start another mock</button>
    </section>
  </main>;

  if (!started) return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><Link href="/reading" className="inline-flex items-center gap-2 text-sm text-brand-300"><ArrowLeft size={16}/>Passage practice</Link><section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-brand-300">IELTS Reading</p><h1 className="mt-3 text-4xl font-black text-white">Full mock test</h1><p className="mt-3 max-w-2xl text-slate-300">Three passages · 40 questions · 60 minutes. The timer cannot be paused. Your guest draft and results stay in this browser until you choose to sync them.</p><div className="mt-7 grid gap-3 sm:grid-cols-3">{passages.map((passage, index) => <article key={passage.slug} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs font-bold uppercase tracking-wider text-brand-300">Passage {index + 1} · {["Easy","Medium","Hard"][index]}</p><h2 className="mt-2 font-semibold text-white">{passage.title}</h2><p className="mt-2 text-sm text-slate-400">{passage.questionGroups.flatMap((group) => group.questions).length} questions</p></article>)}</div><p className="mt-6 text-sm text-slate-400">The mock requires fullscreen consent. Switching tabs, hiding this page, or exiting fullscreen ends the attempt and submits the answers recorded so far.</p>{startError&&<p role="alert" className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{startError}</p>}{savedDraft && <button onClick={() => {setResumeAfterConsent(true);setStartError("");setShowConsent(true);}} className="mt-6 mr-3 min-h-12 rounded-xl border border-brand-300/40 px-5 font-semibold text-brand-200">Resume saved mock</button>}<button onClick={() => {setResumeAfterConsent(false);setStartError("");setShowConsent(true);}} className="mt-6 min-h-12 rounded-xl bg-brand-500 px-6 font-bold text-white">Start 60-minute mock</button>{historyForDisplay.length>0&&<section className="mt-8 border-t border-white/10 pt-5"><h2 className="font-bold text-white">Saved mock history</h2><p className="mt-1 text-sm text-slate-400">{accountUserId?"Account mock history syncs across your signed-in devices.":"Guest results stay in this browser. Sign in, then choose sync to move these results to your account."}</p>{!accountUserId&&<Link href="/login?next=%2Fmock" className="mt-2 inline-block text-sm text-brand-300 underline">Sign in to sync your history</Link>}{accountUserId&&cloudLoaded&&cloudImportNeeded&&<button disabled={cloudSaving} onClick={()=>void saveToAccount(accountUserId,localResults)} className="mt-3 min-h-10 rounded-lg border border-brand-300/30 px-4 text-sm font-semibold text-brand-200 disabled:opacity-50">{cloudSaving?"Saving…":"Save browser results to my account"}</button>}{cloudMessage&&<p role="status" className="mt-2 text-sm text-slate-300">{cloudMessage}</p>}<div className="mt-3 space-y-2">{historyForDisplay.slice(0,5).map((item)=><button type="button" key={item.id} onClick={()=>setResult(item)} className="block w-full rounded-lg bg-white/5 p-3 text-left text-sm text-slate-300">{new Date(item.completedAt).toLocaleString()} · {item.rawScore}/40 · approximate band {Number(item.band).toFixed(1)} · Review results</button>)}</div></section>}</section>{showConsent&&<div className="fixed inset-0 z-[110] grid place-items-center bg-black/80 p-4"><section role="dialog" aria-modal="true" aria-labelledby="mock-consent-title" className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6"><h2 id="mock-consent-title" className="text-2xl font-bold text-white">Before you start</h2><p className="mt-3 text-slate-200">This mock needs your permission to open the page in fullscreen.</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300"><li>· The test will not start unless fullscreen permission is granted.</li><li>· Switching tabs, hiding the page, or exiting fullscreen automatically submits your current answers.</li><li>· Closing the browser cannot be completely blocked. Your browser will warn you; if you leave, reopening the mock will submit the saved attempt.</li></ul><p className="mt-4 text-sm font-semibold text-amber-200">If you choose “I do not agree”, you cannot start or resume this mock.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={()=>setShowConsent(false)} className="min-h-11 rounded-lg border border-white/20 px-4 text-sm text-slate-200">I do not agree</button><button type="button" onClick={()=>void acceptMockRules()} className="min-h-11 rounded-lg bg-brand-500 px-4 text-sm font-bold text-white">I agree and enter fullscreen</button></div></section></div>}</main>;

  const answeredCount = Object.values(answers).filter((value) => value !== "").length;
  return <main className="mock-shell fixed inset-0 z-[100] overflow-y-auto bg-slate-950 text-slate-100">
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950 px-4 py-3"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-300">IELTS Reading Mock</p><p className="text-xs text-slate-400">40 questions · {answeredCount} answered</p></div><div className="flex items-center gap-3"><label className="sr-only" htmlFor="mock-font-size">Passage text size</label><Type size={17}/><select id="mock-font-size" value={fontSize} onChange={(event) => setFontSize(event.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-2 py-2 text-sm"><option value="small">A−</option><option value="medium">A</option><option value="large">A+</option></select><div aria-live="off" className={`min-w-24 rounded-lg px-3 py-2 text-center font-mono text-xl font-bold ${remaining < 300 ? "bg-red-500/20 text-red-200" : "bg-white/10"}`}>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,"0")}</div><button onClick={() => setShowSubmit(true)} className="min-h-10 rounded-lg bg-brand-500 px-4 text-sm font-bold">Submit</button></div></header>
    {focusWarning && <div role="status" className="sticky top-[68px] z-10 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-slate-950">The timer kept running while this test was not active. Return to your questions.</div>}
    <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-6">{passages.map((passage, passageIndex) => <section key={passage.slug} className="mb-8"><h2 className="mb-4 text-xl font-bold">{passage.title}</h2><div className="grid gap-5 lg:grid-cols-2"><article className={`max-h-[72vh] overflow-auto rounded-xl border border-white/10 bg-slate-900 p-5 leading-8`}><HighlightablePassage paragraphs={passage.paragraphs} fontSize={fontSize} highlightState={highlightStates[passageIndex]} /></article><div className="space-y-4">{passage.questionGroups.map((group, groupIndex) => <section key={groupIndex} className="rounded-xl border border-white/10 bg-slate-900 p-4"><p className="mb-4 text-sm text-slate-300">{group.instructions}</p>{group.questions[0]?.type === "matching-headings" && passage.headingBank && <div className="mb-4 grid gap-1 text-sm text-slate-300 sm:grid-cols-2">{passage.headingBank.map((heading) => <p key={heading.id}><b>{heading.id}.</b> {heading.text}</p>)}</div>}{group.questions.map((question) => {const key=answerKey(passage,question); const value=answers[key] ?? ""; const number=questions.findIndex((item)=>item.key===key)+1; const set=(next)=>setAnswer(key,next); return <div key={key} id={`mock-q-${number}`} className="mb-3 scroll-mt-28 rounded-lg border border-white/10 p-3"><p className="mb-3 text-sm leading-6"><b className="mr-2 text-brand-300">{number}.</b>{question.type==="sentence-completion"?<>{question.before} <input aria-label={`Answer for question ${number}, maximum ${question.maxWords || 1} words`} maxLength={120} className="mx-1 w-32 border-b border-brand-300 bg-transparent px-1" value={value} onChange={(event)=>{const next=event.target.value; if(next.trim().split(/\s+/).filter(Boolean).length <= (question.maxWords || 1)) set(next);}} /> {question.after}</>:question.type==="matching-headings"?question.paragraphLabel:question.prompt}</p>{ANSWER_OPTIONS[question.type] ? <div className="flex flex-wrap gap-2">{ANSWER_OPTIONS[question.type].map((option)=><button type="button" key={option} onClick={()=>set(option)} className={`rounded-full border px-3 py-2 text-sm ${value===option?"border-brand-400 bg-brand-500/20":"border-white/20"}`}>{option}</button>)}</div>:question.type==="multiple-choice"?<div className="grid gap-2">{question.options.map((option)=><button type="button" key={option.key} onClick={()=>set(option.key)} className={`rounded-lg border px-3 py-2 text-left text-sm ${value===option.key?"border-brand-400 bg-brand-500/20":"border-white/20"}`}>{option.key}. {option.text}</button>)}</div>:question.type==="matching-headings"?<select aria-label={`Choose a heading for question ${number}`} value={value} onChange={(event)=>set(event.target.value)} className="rounded-lg border border-white/20 bg-slate-950 px-3 py-2"><option value="">Choose a heading</option>{passage.headingBank?.map((heading)=><option key={heading.id} value={heading.id}>{heading.id}. {heading.text}</option>)}</select>:<input aria-label={`Answer for question ${number}`} value={value} onChange={(event)=>set(event.target.value)} className="w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2"/>}</div>})}</section>)}</div></div></section>)}</div>
    <nav aria-label="Question navigator" className="sticky bottom-0 z-20 flex max-h-28 flex-wrap justify-center gap-1 overflow-y-auto border-t border-white/10 bg-slate-950/95 p-2">{questions.map(({key},index)=><button type="button" key={key} onClick={()=>document.getElementById(`mock-q-${index+1}`)?.scrollIntoView({behavior:"smooth",block:"center"})} aria-label={`Go to question ${index+1}`} className={`h-8 w-8 rounded border text-xs ${answers[key]?"border-emerald-400 bg-emerald-500/20":"border-white/20"}`}>{index+1}</button>)}</nav>
    {showSubmit && <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4"><section role="dialog" aria-modal="true" aria-labelledby="mock-submit-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6"><h2 id="mock-submit-title" className="text-xl font-bold">Submit the mock test?</h2><p className="mt-2 text-slate-300">You answered {answeredCount} of 40 questions. Unanswered questions will be marked as skipped.</p><div className="mt-5 flex justify-end gap-3"><button onClick={()=>setShowSubmit(false)} className="rounded-lg border border-white/20 px-4 py-2">Keep working</button><button onClick={()=>void finish(false)} className="rounded-lg bg-brand-500 px-4 py-2 font-bold">Submit test</button></div></section></div>}
  </main>;
}
