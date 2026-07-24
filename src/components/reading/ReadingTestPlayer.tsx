"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { ReadingPassage, ReadingQuestion } from "@/types/ielts";
import Timer from "@/components/shared/Timer";
import { BookOpen, Check, AlertTriangle, X, Type, MessageCircle, Instagram, Send } from "lucide-react";
import HighlightablePassage from "@/components/reading/HighlightablePassage";
import ReadingTestResults from "@/components/reading/ReadingTestResults";
import { saveProgress } from "@/lib/progressTracker";

function allQuestions(passage: ReadingPassage): ReadingQuestion[] {
  return passage.questionGroups.flatMap((g) => g.questions);
}

function normalise(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCorrect(q: ReadingQuestion, given: string | undefined): boolean {
  if (!given) return false;
  if (q.type === "true-false-not-given") return given === q.answer;
  if (q.type === "yes-no-not-given") return given === q.answer;
  if (q.type === "matching-headings") return given === q.answer;
  if (q.type === "multiple-choice") return given === q.answer;
  if (q.type === "sentence-completion")
    return q.answer.some((a) => normalise(a) === normalise(given));
  return false;
}

export default function ReadingTestPlayer({ passage }: { passage: ReadingPassage }) {
  const questions = useMemo(() => allQuestions(passage), [passage]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const [activeQ, setActiveQ] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [panelWidth, setPanelWidth] = useState(65);
  const [isResizing, setIsResizing] = useState(false);
  const startTimeRef = useRef(Date.now());
  const pausedTimeRef = useRef(0);
  const lastPauseStartRef = useRef<number | null>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement>>({});

  // Auto-save functionality
  useEffect(() => {
    if (submitted) return;
    
    const saveData = {
      answers,
      timeSpent,
      timerRunning,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(`ielts-reading-${passage.slug}`, JSON.stringify(saveData));
  }, [answers, timeSpent, timerRunning, submitted, passage.slug]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`ielts-reading-${passage.slug}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Only restore if it's from the last 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setAnswers(parsed.answers || {});
          setTimeSpent(parsed.timeSpent || 0);
          setTimerRunning(parsed.timerRunning ?? true);
          // Adjust start time to account for elapsed time
          startTimeRef.current = Date.now() - (parsed.timeSpent * 1000);
        }
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    }
  }, [passage.slug]);

  // Calculate progress
  const answeredCount = Object.keys(answers).filter(id => answers[id]).length;
  const remainingCount = questions.length - answeredCount;
  const progress = (answeredCount / questions.length) * 100;

  // Font size mapping
  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const scrollToQuestion = (questionId: string) => {
    const element = questionRefs.current[questionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveQ(questionId);
    }
  };
  
  useEffect(() => {
    if (timerRunning) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000) - pausedTimeRef.current);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerRunning]);

  const handleTimerPause = () => {
    setTimerRunning(false);
    lastPauseStartRef.current = Date.now();
  };

  const handleTimerResume = () => {
    if (lastPauseStartRef.current) {
      pausedTimeRef.current += Math.floor((Date.now() - lastPauseStartRef.current) / 1000);
      lastPauseStartRef.current = null;
    }
    setTimerRunning(true);
  };

  const handleTimerReset = () => {
    setTimerRunning(false);
    setTimeSpent(0);
    pausedTimeRef.current = 0;
    lastPauseStartRef.current = null;
    startTimeRef.current = Date.now();
  };

  const setAnswer = (id: string, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    // Check if there are unanswered questions
    if (remainingCount > 0) {
      setShowSubmitDialog(true);
      return;
    }
    
    // Proceed with submission
    performSubmit();
  };

  const performSubmit = () => {
    const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setTimeSpent(finalTime);
    setSubmitted(true);
    setTimerRunning(false);
    setShowSubmitDialog(false);
    
    // Clear saved data after submission
    localStorage.removeItem(`ielts-reading-${passage.slug}`);
    
    // Save progress
    const correctCount = questions.filter((q) => isCorrect(q, answers[q.id])).length;
    const score = (correctCount / questions.length) * 100;
    
    saveProgress(passage.slug, {
      completed: true,
      bestScore: score,
      attempts: 1,
      totalTime: finalTime,
    });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setTimerRunning(true);
    setActiveQ(null);
  };

  if (submitted) {
    return <ReadingTestResults passage={passage} answers={answers} onRetry={handleRetry} timeSpent={timeSpent} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 bg-surface/95 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto max-w-full flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-1">
              {passage.subtitle}
            </p>
            <h1 className="font-display text-2xl font-bold truncate">{passage.title}</h1>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Font size selector */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
              <Type size={14} className="text-slate-400" />
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`w-6 h-6 rounded text-xs font-semibold transition-all ${
                    fontSize === size
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                </button>
              ))}
            </div>
            
            <Timer
              initialSeconds={20 * 60}
              running={timerRunning}
              onExpire={handleSubmit}
              onPause={handleTimerPause}
              onResume={handleTimerResume}
              onReset={handleTimerReset}
            />
            <button
              className="btn-primary"
              onClick={handleSubmit}
            >
              Submit answers
            </button>
          </div>
        </div>
      </div>

      {/* Main content - Split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Passage panel - 65% width */}
        <div className={`w-[65%] overflow-y-auto p-8 border-r border-white/10 bg-surface ${fontSizeClasses[fontSize]} custom-scrollbar`}>
          <div className="max-w-4xl mx-auto">
            <HighlightablePassage paragraphs={passage.paragraphs} />
          </div>
        </div>

        {/* Question panel - 35% width, sticky */}
        <div className={`w-[35%] overflow-y-auto p-6 bg-surface/50 ${fontSizeClasses[fontSize]} custom-scrollbar`}>
          {/* Progress and stats */}
          <div className="mb-6 space-y-4">
            {/* Progress bar */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-300">
                  {answeredCount} of {questions.length} answered
                </span>
                <span className="text-xs text-slate-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Remaining questions */}
            <div className="glass-card p-3 flex items-center justify-between">
              <span className="text-sm text-slate-400">Questions Remaining:</span>
              <span className="text-lg font-bold text-brand-400">{remainingCount}</span>
            </div>

            {/* Question Navigator */}
            <div className="glass-card p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Question Navigator
              </p>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, index) => {
                  const isAnswered = answers[q.id];
                  const isActive = activeQ === q.id;
                  const localNumber = index + 1;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => scrollToQuestion(q.id)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-500 text-white scale-110 shadow-lg shadow-brand-500/30'
                          : isAnswered
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
                      }`}
                      title={`Question ${localNumber}`}
                    >
                      {isAnswered ? <Check size={14} className="mx-auto" /> : localNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {passage.questionGroups.map((group, gi) => (
              <div key={gi} className="glass-card">
                <p className="mb-4 text-sm text-slate-400">{group.instructions}</p>

                {group.questions[0].type === "matching-headings" && passage.headingBank && (
                  <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-400">
                      List of headings
                    </p>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {passage.headingBank.map((h) => (
                        <li key={h.id}>
                          <span className="mr-2 font-semibold text-slate-100">
                            {h.id}.
                          </span>
                          {h.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-4">
                  {group.questions.map((q, qIndex) => {
                    const given = answers[q.id];
                    // Calculate local question number (1-based within this group)
                    const localQuestionNumber = qIndex + 1;

                    return (
                      <div
                        key={q.id}
                        ref={(el) => { if (el) questionRefs.current[q.id] = el; }}
                        onFocus={() => setActiveQ(q.id)}
                        className={`rounded-xl border p-3 transition-colors ${
                          activeQ === q.id
                            ? "border-brand-500/50 bg-brand-500/5"
                            : "border-white/10"
                        }`}
                      >
                        <div className="mb-2 flex items-start gap-2">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                            {localQuestionNumber}
                          </span>

                          {q.type === "sentence-completion" ? (
                            <p className="text-sm text-slate-200">
                              {q.before}{" "}
                              <input
                                value={given || ""}
                                onChange={(e) => setAnswer(q.id, e.target.value)}
                                className="mx-1 w-40 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-sm text-white focus:border-brand-500 focus:outline-none"
                                placeholder={`max ${q.maxWords} words`}
                              />{" "}
                              {q.after}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-200">
                              {q.type === "matching-headings" ? q.paragraphLabel : q.prompt}
                            </p>
                          )}
                        </div>

                        {q.type === "true-false-not-given" && (
                          <div className="ml-8 flex flex-wrap gap-2">
                            {(["TRUE", "FALSE", "NOT GIVEN"] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setAnswer(q.id, opt)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  given === opt
                                    ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                    : "border-white/15 text-slate-300 hover:border-white/30"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {q.type === "yes-no-not-given" && (
                          <div className="ml-8 flex flex-wrap gap-2">
                            {(["YES", "NO", "NOT GIVEN"] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setAnswer(q.id, opt)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  given === opt
                                    ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                    : "border-white/15 text-slate-300 hover:border-white/30"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {q.type === "matching-headings" && passage.headingBank && (
                          <div className="ml-8 flex flex-wrap gap-2">
                            {passage.headingBank.map((h) => (
                              <button
                                key={h.id}
                                onClick={() => setAnswer(q.id, h.id)}
                                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                  given === h.id
                                    ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                    : "border-white/15 text-slate-300 hover:border-white/30"
                                }`}
                              >
                                {h.id}
                              </button>
                            ))}
                          </div>
                        )}

                        {q.type === "multiple-choice" && (
                          <div className="ml-8 space-y-1.5">
                            {q.options.map((opt) => (
                              <button
                                key={opt.key}
                                onClick={() => setAnswer(q.id, opt.key)}
                                className={`block w-full rounded-lg border px-3 py-1.5 text-left text-xs transition-colors ${
                                  given === opt.key
                                    ? "border-brand-500 bg-brand-500/20 text-brand-300"
                                    : "border-white/15 text-slate-300 hover:border-white/30"
                                }`}
                              >
                                <span className="mr-1 font-semibold">{opt.key}.</span>
                                {opt.text}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Feedback Section */}
          <div className="mt-8 glass-card p-4">
            <div className="flex items-start gap-3 mb-3">
              <MessageCircle size={18} className="text-brand-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-1">
                  Found a bug, mistake, or have suggestions?
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  If you find any mistakes or have ideas to improve this project, please let me know. I'd love to hear your feedback.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href="https://instagram.com/mukh4mmadov_7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-pink-400 transition-colors"
              >
                <Instagram size={14} />
                @mukh4mmadov_7
              </a>
              <a
                href="https://t.me/mukh4mmadov"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-brand-400 transition-colors"
              >
                <Send size={14} />
                @mukh4mmadov
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="text-amber-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-100 mb-2">
                  Unanswered Questions
                </h3>
                <p className="text-slate-300">
                  You still have <span className="font-bold text-amber-400">{remainingCount}</span> unanswered question{remainingCount !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="flex-1 btn-secondary"
              >
                Review Answers
              </button>
              <button
                onClick={performSubmit}
                className="flex-1 btn-primary"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
