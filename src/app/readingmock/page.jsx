"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { findFullMockVariant, findFullMockVariants, getMockBand, hasUsedFullMockVariant, MOCK_STORAGE_KEY } from "@/lib/reading/mock-test";
import { isAnswerCorrect, formatAnswer } from "@/lib/reading/answer-review";
import { supabase } from "@/lib/supabase/client";
import { readingMockAttemptsRepository } from "@/lib/supabase/repositories/reading-mock-attempts.repository";
import FullMockPicker from "@/components/reading/FullMockPicker";
import { useTextHighlight } from "@/hooks/useTextHighlight";
import { useModalAccessibility } from "@/hooks/useModalAccessibility";
import { locateEvidence } from "@/lib/reading/evidence-locator.mjs";
import EvidenceViewer from "@/components/reading/EvidenceViewer";
import MockExamScreen from "@/components/reading/MockExamScreen";
import { toggleFlag } from "@/lib/exam/exam-settings.mjs";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { fullMockFor, saveFullMockResult } from "@/lib/mock/full-mock.mjs";

const DURATION = 60 * 60;
const answerKey = (passage, question) => `${passage.slug}:${question.id}`;
const readSaved = () => {
  try { return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || "null"); } catch { return null; }
};

export default function FullMockPage() {
  const { user, profile, isLoading } = useAuth();
  const accountUserId = !isLoading && user?.id && profile && !profile.is_guest && !user.is_anonymous ? user.id : null;
  const variants = useMemo(() => findFullMockVariants(), []);
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const passages = selectedVariant?.passages || null;
  const highlightOne = useTextHighlight(`mock-${passages?.[0]?.slug || "empty"}`);
  const highlightTwo = useTextHighlight(`mock-${passages?.[1]?.slug || "empty"}`);
  const highlightThree = useTextHighlight(`mock-${passages?.[2]?.slug || "empty"}`);
  const highlightStates = [highlightOne, highlightTwo, highlightThree];
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState([]);
  const flagsRef = useRef([]);
  const [position, setPosition] = useState(1);
  const positionRef = useRef(1);
  const [remaining, setRemaining] = useState(DURATION);
  const [result, setResult] = useState(null);
  const [evidenceItem, setEvidenceItem] = useState(null);
  const [showConsent, setShowConsent] = useState(false);
  const [showRepeatConfirm, setShowRepeatConfirm] = useState(false);
  const [resumeAfterConsent, setResumeAfterConsent] = useState(false);
  const [startError, setStartError] = useState("");
  const [focusWarning, setFocusWarning] = useState(false);
  const finishedRef = useRef(false);
  const [saved, setSaved] = useState(null);
  const [cloudResults, setCloudResults] = useState([]);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudMessage, setCloudMessage] = useState("");
  const [cloudSaving, setCloudSaving] = useState(false);
  // Set when this mock was opened as Part 2 of a full mock.
  const [fullMock, setFullMock] = useState(null);
  const [fullMockDone, setFullMockDone] = useState(false);
  const fullMockRef = useRef(null);
  const startedAtRef = useRef(0);
  const deadlineRef = useRef(0);
  const answersRef = useRef({});
  const repeatDialogRef = useModalAccessibility(showRepeatConfirm, () => setShowRepeatConfirm(false));
  const consentDialogRef = useModalAccessibility(showConsent, () => setShowConsent(false));

  useEffect(() => {
    const record = readSaved();
    setSaved(record);
    const savedVariant = record?.draft
      ? findFullMockVariant(record.draft.variantId, variants, record.draft.mockVersion || 1) || variants[0]
      : variants[0];
    if (savedVariant) setSelectedVariant(savedVariant);
  }, [variants]);

  useEffect(() => {
    const session = fullMockFor(window.localStorage, "reading", window.location.search);
    if (!session) return;
    fullMockRef.current = session;
    setFullMock(session);
    const variant = variants.find((item) => item.id === session.readingVariantId);
    if (variant) setSelectedVariant(variant);
  }, [variants]);

  useEffect(() => {
    const record = readSaved();
    if (!record?.draft || record.draft.deadline > Date.now()) return;
    const expiredAnswers = record.draft.answers || {};
    answersRef.current = expiredAnswers;
    setAnswers(expiredAnswers);
    deadlineRef.current = record.draft.deadline;
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
      } else sync();
    };
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onPageHide = () => {
      if (finishedRef.current) return;
      try {
        const current = readSaved() || {};
        current.draft = { answers: answersRef.current, flags: flagsRef.current, position: positionRef.current, deadline: deadlineRef.current, startedAt: startedAtRef.current, exitAttemptAt: null, variantId: selectedVariant?.id, mockVersion: 2 };
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(current));
      } catch { /* the in-memory attempt is still protected during this page session */ }
    };
    const timer = window.setInterval(sync, 1000);
    window.addEventListener("focus", sync);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      document.body.classList.remove("ielts-mock-active");
    };
  }, [started, result, selectedVariant]);

  useEffect(() => {
    if (!started || result) return;
    try {
      const current = readSaved() || {};
      const next = { ...current, draft: { answers, flags, position, deadline: deadlineRef.current, startedAt: startedAtRef.current, exitAttemptAt: null, variantId: selectedVariant?.id, mockVersion: 2 } };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(next));
      setSaved(next);
    } catch { /* keep working if local storage is unavailable */ }
  }, [started, result, answers, flags, position, remaining]);

  const questions = useMemo(() => passages?.flatMap((passage, passageIndex) => passage.questionGroups.flatMap((group) => group.questions.map((question) => ({ passage, passageIndex, group, question, key: answerKey(passage, question) })))) || [], [passages]);

  const handlePosition = useCallback((number) => {
    positionRef.current = number;
    setPosition(number);
  }, []);

  function handleToggleFlag(number) {
    setFlags((current) => {
      const next = toggleFlag(current, number);
      flagsRef.current = next;
      return next;
    });
  }

  function setAnswer(key, value) {
    setAnswers((current) => {
      const next = { ...current, [key]: value };
      answersRef.current = next;
      return next;
    });
  }

  async function begin(restore = false) {
    setStartError("");
    const prior = restore ? readSaved() : null;
    const currentAnswers = prior?.draft?.answers || {};
    setAnswers(currentAnswers);
    answersRef.current = currentAnswers;
    const currentFlags = Array.isArray(prior?.draft?.flags) ? prior.draft.flags : [];
    setFlags(currentFlags);
    flagsRef.current = currentFlags;
    const currentPosition = Number.isInteger(prior?.draft?.position) ? prior.draft.position : 1;
    setPosition(currentPosition);
    positionRef.current = currentPosition;
    const left = prior?.draft?.deadline ? Math.max(0, Math.ceil((prior.draft.deadline - Date.now()) / 1000)) : DURATION;
    setRemaining(left);
    deadlineRef.current = Date.now() + left * 1000;
    startedAtRef.current = prior?.draft?.startedAt || (Date.now() - (DURATION - left) * 1000);
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
      return { title: passage.title, difficulty: passage.difficulty || ["easy", "medium", "hard"][index], correct: sectionQuestions.filter((item) => item.correct).length, total: sectionQuestions.length, answered: sectionQuestions.filter((item) => item.userAnswer !== "").length };
    });
    const endedAt = Date.now();
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
    const history = { id: crypto.randomUUID(), variantId: selectedVariant?.id, passageTitles: passages.map((passage) => passage.title), completedAt: new Date().toISOString(), rawScore: score, total: questions.length, band: getMockBand(score), elapsedSeconds, autoSubmitted: autoSubmit, autoSubmitReason: autoSubmitReason || null, sections, questionTypes: [...typeMap.values()], answers: checkedQuestions.map(({ number, passageNumber, passageTitle, question, userAnswer, correct }) => ({ number, passageNumber, passageTitle, questionId: question.id, type: question.type, prompt: question.prompt || question.paragraphLabel || `${question.before || ""} ___ ${question.after || ""}`, userAnswer: formatAnswer(question, userAnswer, passages[passageNumber - 1]), correctAnswer: formatAnswer(question, question.answer, passages[passageNumber - 1]), explanation: question.explanation || "", correct })) };
    try {
      const previous = readSaved();
      const results = [...(previous?.results || []), history].slice(-20);
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify({ results, draft: null }));
      setSaved({ results, draft: null });
      if (accountUserId && supabase) void saveToAccount(accountUserId, [history]);
    } catch { /* keep the result available on screen */ }
    if (fullMockRef.current) {
      saveFullMockResult(window.localStorage, "reading", { score, total: questions.length, band: history.band, variantId: selectedVariant?.id });
      fullMockRef.current = null;
      setFullMock(null);
      setFullMockDone(true);
    }
    setResult(history);
    setStarted(false);
    document.body.classList.remove("ielts-mock-active");
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
    setAnswers({}); answersRef.current = {}; setFlags([]); flagsRef.current = []; setResult(null);
    try {
      const current = readSaved() || {};
      current.draft = null;
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(current));
      setSaved(current);
    } catch {}
    setResumeAfterConsent(false);
    setStartError("");
    setShowConsent(false);
  };
  const acceptMockRules = async () => {
    setShowConsent(false);
    await begin(resumeAfterConsent);
  };
  const savedDraft = saved?.draft?.deadline && saved.draft.deadline > Date.now();
  const localResults = saved?.results || [];
  const historyForDisplay = [...new Map([...cloudResults, ...localResults].filter((item) => item?.id).map((item) => [item.id, item])).values()].sort((a,b)=>String(b.completedAt).localeCompare(String(a.completedAt)));
  const cloudImportNeeded = localResults.some((item) => !cloudResults.some((cloudItem) => cloudItem.id === item.id));
  const unusedVariants = variants.filter((variant) => !hasUsedFullMockVariant(variant, historyForDisplay));
  const selectedMockNumber = Math.max(1, variants.findIndex((variant) => variant.id === selectedVariant?.id) + 1);

  async function requestMockStart(restore = false) {
    setResumeAfterConsent(restore);
    setStartError("");
    if (restore) {
      const savedVariant = findFullMockVariant(saved?.draft?.variantId, variants, saved?.draft?.mockVersion || 1);
      if (savedVariant) setSelectedVariant(savedVariant);
    }
    let attempts = historyForDisplay;
    if (accountUserId && !cloudLoaded) {
      try {
        const remote = await readingMockAttemptsRepository.listForUser(accountUserId);
        setCloudResults(remote);
        setCloudLoaded(true);
        attempts = [...remote, ...localResults];
      } catch {
        setCloudMessage("Could not check your account history. Reconnect and retry if you want to check for a previously used mock.");
        setStartError("Your account mock history could not be checked. Reconnect and retry before starting.");
        return;
      }
    }
    if (!restore && hasUsedFullMockVariant(selectedVariant, attempts)) {
      setShowRepeatConfirm(true);
      return;
    }
    setShowConsent(true);
  }

  function switchToMockSelection() {
    setShowRepeatConfirm(false);
    setResumeAfterConsent(false);
  }

  if (showRepeatConfirm) return <main className="mock-experience fixed inset-0 z-[110] grid place-items-center bg-black/80 p-4 text-slate-100"><section ref={repeatDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="mock-repeat-title" className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6"><h1 id="mock-repeat-title" className="text-2xl font-bold text-white">You have attempted this mock before</h1><p className="mt-3 text-sm leading-6 text-slate-300">{unusedVariants.length > 0 ? "You have already completed this version. Choose a different mock or repeat this one." : `You have completed all ${variants.length} available versions. You can repeat this one.`}</p><div className="mt-6 flex flex-wrap justify-end gap-3">{unusedVariants.length > 0 && <button type="button" onClick={switchToMockSelection} className="min-h-11 rounded-lg border border-white/20 px-4 text-sm text-slate-200">Choose another mock</button>}<button type="button" onClick={() => { setShowRepeatConfirm(false); setShowConsent(true); }} className="min-h-11 rounded-lg bg-brand-500 px-4 text-sm font-bold text-white">Repeat this mock</button></div></section></main>;

  if (!passages) return <main className="mx-auto max-w-3xl px-4 py-16 text-white"><h1 className="text-3xl font-bold">Mock test is being prepared</h1><p className="mt-3 text-slate-300">The passage library does not currently contain an easy, medium and hard combination with exactly 40 questions. No incomplete mock has been published.</p><Link href="/reading" className="mt-6 inline-flex text-brand-300 underline">Back to passages</Link></main>;

  const resultBand = result ? getMockBand(Number(result.rawScore)) : null;
  const skippedCount = result
    ? Math.max(0, Number(result.total || result.answers?.length || 40) - (result.answers || []).filter((item) => item.userAnswer && item.userAnswer !== "Skipped").length)
    : 0;
  // Evidence is looked up from the passages of this mock; older saved results without question IDs get no button.
  const evidenceFor = (item) => {
    const passage = passages[item.passageNumber - 1];
    const question = passage?.questionGroups.flatMap((group) => group.questions).find((candidate) => candidate.id === item.questionId);
    const location = question ? locateEvidence(passage, question) : null;
    return location ? { passage, question, location, number: item.number, correctAnswer: item.correctAnswer } : null;
  };
  if (result) return <main className="mock-experience min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
    {fullMockDone ? (
      <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-400/40 bg-brand-500/15 p-4">
        <p className="text-sm text-slate-100"><strong>Full mock · Reading done.</strong> Next: Part 3, Writing (60 minutes).</p>
        <Link href="/writing/test?fullmock=1" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-bold text-white">Continue to Writing <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    ) : <Link href="/reading" className="inline-flex items-center gap-2 text-sm text-brand-300"><ArrowLeft size={16}/>Back to practice</Link>}
    <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-300">Full Reading Mock · Practice result, not an official IELTS score</p>
      <div className="mt-5 flex flex-wrap items-end gap-6"><div><h1 className="text-5xl font-black">{result.rawScore}<span className="text-2xl text-slate-400">/40</span></h1><p className="mt-2 text-slate-300">Correct answers</p></div><div><p className="text-4xl font-bold">{resultBand == null ? "Band estimate unavailable" : `Band ${Number(resultBand).toFixed(1)}`}</p><p className="mt-2 text-slate-400">{resultBand == null ? "No supported band estimate for this score" : "Approximate Academic Reading conversion"}</p></div><div><p className="text-2xl font-bold">{skippedCount}</p><p className="mt-2 text-slate-400">Skipped</p></div><div><p className="text-2xl font-bold">{Math.floor(result.elapsedSeconds / 60)}:{String(result.elapsedSeconds % 60).padStart(2,"0")}</p><p className="mt-2 text-slate-400">Time used</p></div></div>
      <p className="mt-5 rounded-xl bg-amber-300/10 p-4 text-sm text-amber-100">This conversion is approximate practice guidance. It is not an official IELTS result; official band boundaries can vary by test.</p>{result.autoSubmitted&&<p role="status" className="mt-3 rounded-xl bg-amber-300/10 p-4 text-sm text-amber-100">This mock was submitted automatically.</p>}
      <h2 className="mt-8 text-xl font-bold">Section analysis</h2><div className="mt-3 grid gap-3 md:grid-cols-3">{result.sections.map((section) => <article key={section.title} className="rounded-xl border border-white/10 p-4"><p className="text-xs uppercase text-slate-400">{section.difficulty} · {section.answered}/{section.total} answered</p><h3 className="mt-2 font-semibold">{section.title}</h3><p className="mt-3 text-2xl font-bold">{section.correct}/{section.total}</p></article>)}</div>
      <h2 className="mt-8 text-xl font-bold">Question-type analysis</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{result.questionTypes.map((item)=><article key={item.type} className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold capitalize">{item.type.replace(/-/g," ")}</h3><p className="mt-2 text-sm text-slate-300">{item.correct}/{item.total} correct · {item.wrong} incorrect · {item.skipped} skipped</p>{item.total-item.skipped>0&&<p className="mt-1 text-xs text-slate-400">Accuracy among answered: {Math.round(item.correct/(item.total-item.skipped)*100)}%</p>}</article>)}</div>
      <h2 className="mt-8 text-xl font-bold">Question review</h2><div className="mt-3 space-y-3">{result.answers.map((item) => <article key={`${item.passageNumber}-${item.number}`} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">Q{item.number} · Passage {item.passageNumber}: {item.prompt}</p><span className={item.correct ? "text-emerald-300" : !item.userAnswer || item.userAnswer === "Skipped" ? "text-amber-200" : "text-rose-300"}>{item.correct ? "Correct" : !item.userAnswer || item.userAnswer === "Skipped" ? "Skipped" : "Incorrect"}</span></div><p className="mt-2 text-sm text-slate-300">Your answer: {item.userAnswer || "Not answered"} · Correct answer: {item.correctAnswer}</p>{item.explanation && <p className="mt-2 text-sm text-slate-400">{item.explanation}</p>}{evidenceFor(item) && <button type="button" onClick={() => setEvidenceItem(evidenceFor(item))} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 text-xs font-semibold text-amber-200 hover:bg-amber-400/20"><MapPin size={14} aria-hidden="true" />Show me where</button>}</article>)}</div>
      <EvidenceViewer passage={evidenceItem?.passage} question={evidenceItem?.question} questionNumber={evidenceItem?.number} location={evidenceItem?.location} correctAnswer={evidenceItem?.correctAnswer} onClose={() => setEvidenceItem(null)} />
      <p className="mt-5 text-sm text-slate-400">Variant passages: {(result.passageTitles || []).join(" · ")}</p><button onClick={startFresh} className="mt-8 min-h-12 rounded-xl bg-brand-500 px-5 font-semibold text-white">Start another mock</button>
    </section>
  </main>;

  if (!started) return <main className="mock-experience min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-6">{fullMock ? <Link href="/full-mock" className="inline-flex items-center gap-2 text-sm text-brand-300"><ArrowLeft size={16}/>Full mock · Part 2 of 3: Reading</Link> : <><Link href="/reading" className="inline-flex items-center gap-2 text-sm text-brand-300"><ArrowLeft size={16}/>Passage practice</Link><Link href="/full-mock" className="ml-4 inline-flex items-center gap-1 text-sm text-slate-400 underline hover:text-white">Want all three parts? Take a full IELTS mock</Link></>}<section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-brand-300">IELTS Reading</p><h1 className="mt-3 text-4xl font-black text-white">Full mock test</h1><p className="mt-3 max-w-2xl text-slate-300">Three passages · 40 questions · 60 minutes. {variants.length} numbered full mock tests are available below. Choose any mock; completed ones stay marked. The timer cannot be paused. Your guest draft and results stay in this browser until you choose to sync them.</p><FullMockPicker variants={variants} selectedVariantId={selectedVariant?.id} history={historyForDisplay} onSelect={setSelectedVariant} /><div className="mt-7 grid gap-3 sm:grid-cols-3">{passages.map((passage, index) => <article key={passage.slug} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs font-bold uppercase tracking-wider text-brand-300">Passage {index + 1} · {passage.difficulty ? `${passage.difficulty[0].toUpperCase()}${passage.difficulty.slice(1)}` : `Passage ${index + 1}`}</p><h2 className="mt-2 font-semibold text-white">{passage.title}</h2><p className="mt-2 text-sm text-slate-400">{passage.questionGroups.flatMap((group) => group.questions).length} questions</p></article>)}</div><p className="mt-6 text-sm text-slate-400">Before starting: this is a 60-minute test. Switching tabs will not submit your answers; the timer continues running.</p>{startError&&<p role="alert" className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{startError}</p>}{savedDraft && <button onClick={() => void requestMockStart(true)} className="mt-6 mr-3 min-h-12 rounded-xl border border-brand-300/40 px-5 font-semibold text-brand-200">Resume saved mock</button>}<button onClick={() => void requestMockStart(false)} className="mt-6 min-h-12 rounded-xl bg-brand-500 px-6 font-bold text-white">Start Mock {selectedMockNumber} - 60 minutes</button>{historyForDisplay.length>0&&<section className="mt-8 border-t border-white/10 pt-5"><h2 className="font-bold text-white">Saved mock history</h2><p className="mt-1 text-sm text-slate-400">{accountUserId?"Account mock history syncs across your signed-in devices.":"Guest results stay in this browser. Sign in, then choose sync to move these results to your account."}</p>{!accountUserId&&<Link href="/login?next=%2Freadingmock" className="mt-2 inline-block text-sm text-brand-300 underline">Sign in to sync your history</Link>}{accountUserId&&cloudLoaded&&cloudImportNeeded&&<button disabled={cloudSaving} onClick={()=>void saveToAccount(accountUserId,localResults)} className="mt-3 min-h-10 rounded-lg border border-brand-300/30 px-4 text-sm font-semibold text-brand-200 disabled:opacity-50">{cloudSaving?"Saving…":"Save browser results to my account"}</button>}{cloudMessage&&<p role="status" className="mt-2 text-sm text-slate-300">{cloudMessage}</p>}<div className="mt-3 space-y-2">{historyForDisplay.slice(0,5).map((item)=><button type="button" key={item.id} onClick={()=>setResult(item)} className="block w-full rounded-lg bg-white/5 p-3 text-left text-sm text-slate-300">{new Date(item.completedAt).toLocaleString()} · {item.rawScore}/40 · approximate band {getMockBand(Number(item.rawScore)) == null ? "estimate unavailable" : Number(getMockBand(Number(item.rawScore))).toFixed(1)} · Review results</button>)}</div></section>}</section>{showConsent&&<div className="fixed inset-0 z-[110] grid place-items-center bg-black/80 p-4"><section ref={consentDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="mock-consent-title" className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6"><h2 id="mock-consent-title" className="text-2xl font-bold text-white">Before you start</h2><p className="mt-3 text-slate-200">The 60-minute timer cannot be paused. You may leave the tab, but the timer keeps running.</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300"><li>· You can start in a normal browser window; fullscreen is not required.</li><li>· Switching tabs does not submit your attempt. Submit manually when you are finished, or the timer submits when it reaches zero.</li><li>· Your answers are saved as a draft. Refreshing or reopening the mock resumes it while time remains.</li></ul><p className="mt-4 text-sm font-semibold text-amber-200">If you choose “I do not agree”, you cannot start or resume this mock.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={()=>setShowConsent(false)} className="min-h-11 rounded-lg border border-white/20 px-4 text-sm text-slate-200">I do not agree</button><button type="button" onClick={()=>void acceptMockRules()} className="min-h-11 rounded-lg bg-brand-500 px-4 text-sm font-bold text-white">I understand and start</button></div></section></div>}</main>;

  function exitMock() {
    // The draft is saved on every change; leaving keeps it resumable while
    // the deadline-based timer keeps running, as the start rules explain.
    setStarted(false);
    setFocusWarning(false);
    window.scrollTo({ top: 0 });
  }

  return (
    <MockExamScreen
      passages={passages}
      questions={questions}
      answers={answers}
      onAnswer={setAnswer}
      remaining={remaining}
      highlightStates={highlightStates}
      flags={flags}
      onToggleFlag={handleToggleFlag}
      focusWarning={focusWarning}
      onExit={exitMock}
      initialCurrent={position}
      onCurrentChange={handlePosition}
      onSubmit={() => void finish(false)}
    />
  );
}
