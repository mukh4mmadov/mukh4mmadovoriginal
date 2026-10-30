"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookMarked, BookOpen, Brain, Check, Layers, RotateCcw, Search, Trash2 } from "lucide-react";
import { useVocabulary } from "@/hooks/useVocabulary";
import { buildQuizQuestion, dueItems, reviewUpdate } from "@/lib/vocabulary/spaced-review.mjs";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "learning", label: "Learning" },
  { id: "known", label: "Known" },
];

function SentenceWithTerm({ sentence, term }) {
  if (!sentence) return null;
  const index = sentence.toLowerCase().indexOf(term.toLowerCase());
  if (index === -1) return <span>{sentence}</span>;
  return (
    <span>
      {sentence.slice(0, index)}
      <strong className="font-semibold text-white">{sentence.slice(index, index + term.length)}</strong>
      {sentence.slice(index + term.length)}
    </span>
  );
}

function syncText(syncState, accountUserId) {
  if (syncState === "synced") return "Saved to your account, so your words follow you to other devices.";
  if (syncState === "syncing") return "Syncing with your account…";
  if (syncState === "failed") return "Saved in this browser; your account copy is not available right now.";
  return accountUserId ? "Saved in this browser." : "Saved in this browser. Sign in to keep your words on all your devices.";
}

function WordCard({ item, onUpdate, onRemove }) {
  const [note, setNote] = useState(item.note || "");
  const known = item.status === "known";
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="break-words font-display text-xl font-bold text-white">{item.term}</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${known ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-400/10 text-amber-200"}`}>
          {known ? "Known" : "Learning"}
        </span>
      </div>
      {item.sentence && (
        <p className="mt-2 text-sm italic leading-6 text-slate-300">
          “<SentenceWithTerm sentence={item.sentence} term={item.term} />”
        </p>
      )}
      {item.passageSlug && (
        <Link href={`/reading/${item.passageSlug}`} className="mt-1 inline-flex min-h-9 items-center gap-1.5 text-xs text-brand-300 hover:underline">
          <BookOpen size={13} aria-hidden="true" /> {item.passageTitle || "Open passage"}
        </Link>
      )}
      <label className="mt-3 block">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your meaning or translation</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => { if (note !== (item.note || "")) onUpdate(item.id, { note }); }}
          maxLength={500}
          rows={2}
          placeholder="e.g. a synonym, a translation, or your own example"
          className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => onUpdate(item.id, known
          ? { status: "learning", box: 0, dueAt: new Date().toISOString() }
          : { status: "known", box: 4, dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() })} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-200 hover:bg-white/5">
          {known ? <><RotateCcw size={15} aria-hidden="true" /> Learn again</> : <><Check size={15} aria-hidden="true" /> Mark as known</>}
        </button>
        <button type="button" onClick={() => onRemove(item.id)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
          <Trash2 size={15} aria-hidden="true" /> Remove
        </button>
      </div>
    </article>
  );
}

const NEXT_LABEL = { again: "now", hard: null, easy: null };
const inDays = (iso) => {
  const days = Math.round((Date.parse(iso) - Date.now()) / (24 * 60 * 60 * 1000));
  return days <= 0 ? "today" : days === 1 ? "in 1 day" : `in ${days} days`;
};

// Spaced repetition: today's due words, graded Again / Hard / Easy.
function Review({ items, onUpdate, onQuiz }) {
  const [deck, setDeck] = useState(() => dueItems(items).map((item) => item.id));
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const current = items.find((item) => item.id === deck[0]);

  const grade = (value) => {
    if (!current) return;
    onUpdate(current.id, reviewUpdate(current, value));
    setRevealed(false);
    if (value === "again") setDeck((ids) => [...ids.slice(1), ids[0]]);
    else { setDeck((ids) => ids.slice(1)); setDone((count) => count + 1); }
  };

  if (!current) {
    const upcoming = items.map((item) => item.dueAt).filter(Boolean).sort()[0];
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-8 text-center">
        <p className="text-lg font-semibold text-white">{done > 0 ? `All caught up: you reviewed ${done} ${done === 1 ? "word" : "words"}.` : "No words are due right now."}</p>
        <p className="mt-1 text-sm text-slate-300">{upcoming ? `Your next words are due ${inDays(upcoming)}.` : "Save new words while you read."}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => { setDeck(items.map((item) => item.id)); setDone(0); }} className="btn-secondary">Practise all words anyway</button>
          <button type="button" onClick={onQuiz} className="btn-primary">Take a quiz</button>
        </div>
      </div>
    );
  }

  const preview = (value) => NEXT_LABEL[value] || inDays(reviewUpdate(current, value).dueAt);
  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-3 text-center text-sm text-slate-400" aria-live="polite">{done} reviewed · {deck.length} to go</p>
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center sm:p-10">
        <p className="break-words font-display text-3xl font-bold text-white sm:text-4xl">{current.term}</p>
        {revealed ? (
          <div className="mt-5 space-y-3 text-left">
            {current.sentence && <p className="text-sm italic leading-6 text-slate-300">“<SentenceWithTerm sentence={current.sentence} term={current.term} />”</p>}
            {current.note ? <p className="rounded-xl bg-white/5 p-3 text-sm text-slate-200">{current.note}</p> : <p className="text-xs text-slate-400">No meaning written yet. Add one in the word list.</p>}
          </div>
        ) : (
          <button type="button" onClick={() => setRevealed(true)} className="btn-secondary mt-6">Show the sentence and meaning</button>
        )}
      </div>
      {revealed && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[["again", "Again"], ["hard", "Hard"], ["easy", "Easy"]].map(([value, label]) => (
            <button key={value} type="button" onClick={() => grade(value)} className={value === "easy" ? "btn-primary flex-col !gap-0" : "btn-secondary flex-col !gap-0"}>
              <span>{label}</span>
              <span className="text-xs font-normal opacity-80">{preview(value)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Multiple-choice quiz on saved words: fill the gap or match the meaning.
function Quiz({ items, onUpdate }) {
  const [round, setRound] = useState(0);
  const questions = useMemo(() => {
    const ordered = [...dueItems(items), ...items.filter((item) => !dueItems(items).includes(item))];
    return ordered.map((item) => buildQuizQuestion(item, items)).filter(Boolean).slice(0, 10);
    // A new round reshuffles; the items' own updates don't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const question = questions[index];

  if (questions.length === 0) {
    return <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-300">The quiz needs at least 4 saved words, each with its sentence or your own meaning.</p>;
  }
  if (!question) {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-8 text-center">
        <p className="text-lg font-semibold text-white">You scored {score} of {questions.length}.</p>
        <button type="button" onClick={() => { setRound((value) => value + 1); setIndex(0); setScore(0); setPicked(null); }} className="btn-primary mt-4">New quiz</button>
      </div>
    );
  }
  const choose = (option) => {
    if (picked) return;
    setPicked(option);
    const correct = option === question.answer;
    if (correct) setScore((value) => value + 1);
    const item = items.find((entry) => entry.id === question.id);
    if (item) onUpdate(item.id, reviewUpdate(item, correct ? "easy" : "again"));
  };
  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-3 text-center text-sm text-slate-400" aria-live="polite">Question {index + 1} of {questions.length} · {score} correct</p>
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-300">{question.kind === "gap" ? "Fill the gap" : "Which word means…"}</p>
        <p className="text-lg leading-8 text-white">{question.kind === "gap" ? question.prompt : `“${question.prompt}”`}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2" role="group" aria-label="Answers">
          {question.options.map((option) => {
            const state = !picked ? "" : option === question.answer ? "border-emerald-400/60 bg-emerald-500/15" : option === picked ? "border-rose-400/60 bg-rose-500/15" : "opacity-60";
            return (
              <button key={option} type="button" onClick={() => choose(option)} disabled={Boolean(picked)} className={`min-h-12 rounded-xl border border-white/10 px-4 text-left text-sm font-medium text-slate-100 ${state}`}>
                {option}
              </button>
            );
          })}
        </div>
        {picked && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p role="status" className={`text-sm font-semibold ${picked === question.answer ? "text-emerald-300" : "text-rose-300"}`}>{picked === question.answer ? "Correct!" : `The answer is “${question.answer}”.`}</p>
            <button type="button" onClick={() => { setIndex((value) => value + 1); setPicked(null); }} className="btn-primary">{index + 1 < questions.length ? "Next" : "See score"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VocabularyPage() {
  const { items, syncState, accountUserId, updateWord, removeWord } = useVocabulary();
  const [mode, setMode] = useState("list");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [deckKey, setDeckKey] = useState(0);

  const counts = useMemo(() => ({
    all: items.length,
    learning: items.filter((item) => item.status !== "known").length,
    known: items.filter((item) => item.status === "known").length,
    due: dueItems(items).length,
  }), [items]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return items.filter((item) => (filter === "all" || (filter === "known") === (item.status === "known"))
      && (!search || item.term.toLowerCase().includes(search) || (item.note || "").toLowerCase().includes(search)));
  }, [items, filter, query]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">Study tools</p>
      <h1 className="mb-3 flex items-center gap-3 text-3xl font-bold text-white">
        <BookMarked size={28} className="text-brand-400" aria-hidden="true" /> Vocabulary notebook
      </h1>
      <p className="mb-8 max-w-2xl text-sm leading-6 text-slate-300">
        Words you saved from Reading passages, with the sentence you found them in. {syncText(syncState, accountUserId)}
      </p>

      {items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <h2 className="text-lg font-semibold text-white">No words saved yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-300">
            While you practise a passage, select or double-click a word you don&apos;t know, then press <strong className="text-white">Save word</strong> in the toolbar above the passage.
          </p>
          <Link href="/reading" className="btn-primary mt-5">Practise a passage</Link>
        </section>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="View">
            {[{ id: "list", label: "Word list", icon: BookMarked }, { id: "cards", label: `Review (${counts.due} due)`, icon: Layers }, { id: "quiz", label: "Quiz", icon: Brain }].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => { setMode(id); if (id !== "list") setDeckKey((key) => key + 1); }}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${mode === id ? "border-brand-500/50 bg-brand-500/15 text-brand-200" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
              >
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
            <span className="ml-auto text-sm text-slate-400">{counts.learning} learning · {counts.known} known</span>
          </div>

          {mode === "cards" ? (
            <Review key={deckKey} items={items} onUpdate={updateWord} onQuiz={() => { setMode("quiz"); setDeckKey((key) => key + 1); }} />
          ) : mode === "quiz" ? (
            <Quiz key={deckKey} items={items} onUpdate={updateWord} />
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative flex-1">
                  <span className="sr-only">Search words</span>
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search words or meanings"
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
                <div role="group" aria-label="Filter words" className="flex flex-wrap gap-2">
                  {FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={filter === item.id}
                      onClick={() => setFilter(item.id)}
                      className={`min-h-10 rounded-full border px-4 text-sm font-medium transition ${filter === item.id ? "border-brand-500/50 bg-brand-500/15 text-brand-200" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
                    >
                      {item.label} ({counts[item.id]})
                    </button>
                  ))}
                </div>
              </div>
              {visible.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">No words match.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {visible.map((item) => (
                    <WordCard key={`${item.id}-${item.updatedAt}`} item={item} onUpdate={updateWord} onRemove={removeWord} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
