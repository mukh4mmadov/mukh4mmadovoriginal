"use client";

import { useRef, useState } from "react";
import { Highlighter, Eraser } from "lucide-react";

interface HighlightablePassageProps {
  paragraphs: { label: string; text: string }[];
}

const COLORS = [
  { id: "yellow", swatch: "#facc15", bg: "rgba(250,204,21,0.35)" },
  { id: "green", swatch: "#4ade80", bg: "rgba(74,222,128,0.35)" },
  { id: "pink", swatch: "#f472b6", bg: "rgba(244,114,182,0.35)" },
];

// Splits a paragraph into tokens (words + separators) so each word can be
// independently highlighted while punctuation/spacing is preserved.
function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) || [];
}

export default function HighlightablePassage({ paragraphs }: HighlightablePassageProps) {
  const [activeColor, setActiveColor] = useState(COLORS[0].id);
  const [eraseMode, setEraseMode] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const painting = useRef(false);
  const paintValue = useRef<string | null>(null);

  const colorFor = (id: string) => COLORS.find((c) => c.id === id)?.bg;

  const applyToKey = (key: string) => {
    setHighlights((prev) => {
      const next = { ...prev };
      if (eraseMode) {
        delete next[key];
      } else if (paintValue.current !== null) {
        next[key] = paintValue.current;
      }
      return next;
    });
  };

  const startPaint = (key: string) => {
    painting.current = true;
    if (!eraseMode) {
      // toggle: if already this color, erase; else paint
      paintValue.current = highlights[key] === activeColor ? null : activeColor;
      if (paintValue.current === null) {
        setHighlights((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        return;
      }
    }
    applyToKey(key);
  };

  const continuePaint = (key: string) => {
    if (!painting.current) return;
    applyToKey(key);
  };

  const stopPaint = () => {
    painting.current = false;
  };

  return (
    <div onMouseUp={stopPaint} onMouseLeave={stopPaint}>
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
        <Highlighter size={16} className="ml-1 text-slate-400" />
        {COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveColor(c.id);
              setEraseMode(false);
            }}
            aria-label={`Highlight ${c.id}`}
            className={`h-6 w-6 rounded-full border-2 transition-transform ${
              activeColor === c.id && !eraseMode
                ? "scale-110 border-white"
                : "border-transparent"
            }`}
            style={{ backgroundColor: c.swatch }}
          />
        ))}
        <button
          onClick={() => setEraseMode((v) => !v)}
          className={`ml-2 flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${
            eraseMode
              ? "border-rose-400 bg-rose-500/20 text-rose-300"
              : "border-white/15 text-slate-300 hover:border-white/30"
          }`}
        >
          <Eraser size={13} /> Erase
        </button>
        <span className="ml-auto text-[11px] text-slate-500">
          Click or drag across words to highlight
        </span>
      </div>

      <div className="select-none leading-relaxed text-slate-200" style={{ fontFamily: "var(--font-display)" }}>
        {paragraphs.map((p) => (
          <p key={p.label} className="mb-4">
            <span className="mr-2 font-bold text-brand-400">{p.label}</span>
            {tokenize(p.text).map((tok, i) => {
              if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
              const key = `${p.label}-${i}`;
              const hl = highlights[key];
              return (
                <span
                  key={i}
                  onMouseDown={() => startPaint(key)}
                  onMouseEnter={() => continuePaint(key)}
                  style={hl ? { backgroundColor: colorFor(hl), borderRadius: 3 } : undefined}
                  className="cursor-pointer"
                >
                  {tok}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    </div>
  );
}
