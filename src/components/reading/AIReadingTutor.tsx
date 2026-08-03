"use client";

import { useMemo, useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  Lightbulb,
  Search,
  BookOpen,
  PenTool,
  ListChecks,
  Compass,
  MessageSquareText,
} from "lucide-react";
import { ReadingPassage, ReadingQuestion } from "@/types/ielts";

type TutorAction =
  | "hint"
  | "paragraph"
  | "vocab"
  | "strategy"
  | "wrong"
  | "evidence"
  | "grammar"
  | "summary"
  | "example";

interface AIReadingTutorProps {
  passage: ReadingPassage;
  question: ReadingQuestion;
  selectedAnswer?: string;
}

const actionMeta: Array<{
  key: TutorAction;
  label: string;
  icon: typeof Lightbulb;
}> = [
  { key: "hint", label: "Give me a Hint", icon: Lightbulb },
  { key: "paragraph", label: "Explain this Paragraph", icon: BookOpen },
  { key: "vocab", label: "Explain Vocabulary", icon: PenTool },
  { key: "strategy", label: "Reading Strategy", icon: Compass },
  { key: "wrong", label: "Why is my answer wrong?", icon: Search },
  { key: "evidence", label: "Find Evidence", icon: Search },
  { key: "grammar", label: "Grammar Help", icon: ListChecks },
  { key: "summary", label: "Summarize this Passage", icon: MessageSquareText },
  {
    key: "example",
    label: "Create a Similar Practice Example",
    icon: Sparkles,
  },
];

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function findRelevantParagraph(
  question: ReadingQuestion,
  passage: ReadingPassage,
) {
  const label =
    question.type === "matching-headings"
      ? question.paragraphLabel
      : question.prompt || "";
  const keywords = label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let bestIndex = 0;
  let bestScore = -1;

  passage.paragraphs.forEach((paragraph, index) => {
    const text = paragraph.text.toLowerCase();
    const score = keywords.reduce<number>((sum: number, word: string) => {
      return sum + (text.includes(word) ? 1 : 0);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return passage.paragraphs[bestIndex];
}

function buildResponse(
  action: TutorAction,
  question: ReadingQuestion,
  passage: ReadingPassage,
  selectedAnswer?: string,
) {
  const paragraph = findRelevantParagraph(question, passage);
  const answerText =
    question.type === "multiple-choice" && question.options
      ? question.options.find((option) => option.key === question.answer)?.text
      : question.answer;

  switch (action) {
    case "hint":
      if (question.type === "matching-headings") {
        return "Start with the paragraph's main idea rather than a single detail. Ask yourself: what is the paragraph mainly about, and which heading captures that overall purpose?";
      }
      if (question.type === "sentence-completion") {
        return "Look for a word that fits both the grammar and the meaning of the sentence. Read the words before and after the blank carefully, then scan the passage for a precise match.";
      }
      if (question.type === "multiple-choice") {
        return "Eliminate the options that are too broad, too extreme, or not supported by the passage. The correct choice will usually match the evidence most closely.";
      }
      return "Focus on the wording of the statement and the wording in the passage. A strong IELTS answer usually depends on a precise match, not a general impression.";
    case "paragraph":
      return `The key idea in ${paragraph.label} is that ${cleanText(paragraph.text.slice(0, 180))}... Think about the main point first, then connect it to the question.`;
    case "vocab":
      if (
        question.prompt?.toLowerCase().includes("urban") ||
        passage.title.toLowerCase().includes("urban")
      ) {
        return "A useful word here is 'sustainability'. It means meeting present needs without harming future generations. In IELTS Reading, pay attention to how a word is used in context rather than relying on a single dictionary meaning.";
      }
      return "Choose one word from the passage that feels important to the question. Ask yourself what it means in context, and whether it signals cause, comparison, evidence, or consequence.";
    case "strategy":
      return "A strong approach is: skim for the main idea, scan for key terms, then read closely for the sentence that supports the answer. In IELTS Reading, paraphrase recognition is often the difference between a good and a weak response.";
    case "wrong":
      if (!selectedAnswer) {
        return "You have not selected an answer yet, so the tutor is guiding you to the evidence instead. Read the question again and look for a sentence that directly supports or contradicts the claim.";
      }
      return `Your selected answer ${selectedAnswer} does not fit the evidence as closely as the strongest option in the passage. The tutor recommends that you re-read the relevant sentence, compare the wording carefully, and decide which choice matches the passage most precisely. If you want, I can help you find the exact evidence without giving away the answer.`;
    case "evidence":
      return "Search for a sentence in the passage that directly answers the question. In IELTS Reading, the best evidence is usually a specific sentence that contains a clear match, contrast, or example.";
    case "grammar":
      if (question.type === "sentence-completion") {
        return "For sentence completion, check whether the missing word must be singular, plural, or a specific part of speech. The grammar often narrows the answer before the meaning does.";
      }
      return "Grammar helps you notice the logic of the sentence. Watch for words like 'however', 'although', 'because', and 'therefore', because they often change the meaning of the statement.";
    case "summary":
      return `A concise summary of this passage is: ${passage.paragraphs.map((paragraph) => paragraph.label).join(", ")} together explain the topic, the key evidence, and the broader significance of the ideas presented.`;
    case "example":
      return `Try this practice prompt: 'Which paragraph describes the main benefit of this idea and which paragraph discusses a challenge? Explain your choice using evidence from the passage.'`;
    default:
      return "The tutor is ready to help you think through the passage carefully.";
  }
}

export default function AIReadingTutor({
  passage,
  question,
  selectedAnswer,
}: AIReadingTutorProps) {
  const [activeAction, setActiveAction] = useState<TutorAction>("hint");
  const [response, setResponse] = useState(() =>
    buildResponse("hint", question, passage),
  );
  const [prompt, setPrompt] = useState("");

  const quickActions = useMemo(() => actionMeta, []);

  const handleAction = (action: TutorAction) => {
    setActiveAction(action);
    setResponse(buildResponse(action, question, passage, selectedAnswer));
  };

  const handleCustomAsk = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setResponse(
      `You asked: ${trimmed}. The tutor encourages you to search for the exact sentence in the passage that supports your reasoning before choosing an answer.`,
    );
    setPrompt("");
  };

  return (
    <div
      className="rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-slate-900/70 to-cyan-500/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
      role="region"
      aria-label="Guided study coach"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/15 p-2.5 text-brand-300">
          <BrainCircuit size={18} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-300">
            Guided study coach
          </p>
          <h3 className="text-lg font-semibold text-slate-100">
            Think through the passage with guidance
          </h3>
        </div>
      </div>

      <p className="mb-4 text-sm leading-6 text-slate-400">
        This tutor helps you reason step by step. It gives hints first and only
        reveals a direct answer when you request it.
      </p>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isActive = activeAction === action.key;
          return (
            <button
              key={action.key}
              onClick={() => handleAction(action.key)}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm transition-all ${
                isActive
                  ? "border-brand-500/40 bg-brand-500/20 text-brand-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <Icon size={15} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-7 text-slate-300">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          <Sparkles size={14} />
          Tutor response
        </div>
        <p>{response}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask the tutor for a hint, strategy, or evidence..."
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-brand-500"
        />
        <button
          onClick={handleCustomAsk}
          className="rounded-2xl bg-brand-500/20 px-3 py-2 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/30"
        >
          Ask tutor
        </button>
      </div>
    </div>
  );
}
