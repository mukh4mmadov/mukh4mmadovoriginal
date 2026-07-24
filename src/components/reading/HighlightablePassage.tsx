"use client";

import { useMemo, useState } from "react";
import { Highlighter, Eraser, RotateCcw } from "lucide-react";

interface HighlightablePassageProps {
  paragraphs: { label: string; text: string }[];
  fontSize?: "small" | "medium" | "large";
}

const COLORS = [
  { id: "yellow", swatch: "#facc15", bg: "rgba(250,204,21,0.35)" },
  { id: "green", swatch: "#4ade80", bg: "rgba(74,222,128,0.35)" },
  { id: "pink", swatch: "#f472b6", bg: "rgba(244,114,182,0.35)" },
] as const;

const fontSizeMap = {
  small: "text-[15px] sm:text-[16px]",
  medium: "text-[16px] sm:text-[17px]",
  large: "text-[17px] sm:text-[18px]",
};

function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) || [];
}

export default function HighlightablePassage({
  paragraphs,
  fontSize = "medium",
}: HighlightablePassageProps) {
  const [activeColor, setActiveColor] = useState<(typeof COLORS)[number]["id"]>(
    COLORS[0].id,
  );
  const [eraseMode, setEraseMode] = useState(false);
  const [highlights, setHighlights] = useState<
    Record<string, Array<{ key: string; colorId: string }>>
  >({});

  const colorFor = (id: string) => COLORS.find((c) => c.id === id)?.bg;
  const totalHighlights = useMemo(
    () =>
      Object.values(highlights).reduce((sum, items) => sum + items.length, 0),
    [highlights],
  );

  const handleSelection = (
    paragraphKey: string,
    paragraphElement: HTMLParagraphElement,
  ) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    const paragraphRange = document.createRange();
    paragraphRange.selectNodeContents(paragraphElement);

    const isWithinParagraph =
      range.compareBoundaryPoints(Range.START_TO_START, paragraphRange) >= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, paragraphRange) <= 0;

    if (!isWithinParagraph) return;

    const selectedKeys = Array.from(
      paragraphElement.querySelectorAll<HTMLElement>("[data-token-key]"),
    )
      .map((token) => {
        const intersectsToken = range.intersectsNode(token);
        return intersectsToken ? token.getAttribute("data-token-key") : null;
      })
      .filter((value): value is string => Boolean(value));

    if (selectedKeys.length === 0) return;

    setHighlights((prev) => {
      const next = { ...prev };
      const current = [...(prev[paragraphKey] ?? [])];
      const currentKeys = new Set(current.map((item) => item.key));

      if (eraseMode) {
        next[paragraphKey] = current.filter(
          (item) => !selectedKeys.includes(item.key),
        );
      } else {
        const incoming = selectedKeys
          .filter((key) => !currentKeys.has(key))
          .map((key) => ({ key, colorId: activeColor }));
        next[paragraphKey] = [...current, ...incoming];
      }

      return next;
    });

    selection.removeAllRanges();
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
        <Highlighter size={16} className="ml-1 text-slate-400" />
        {COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveColor(c.id);
              setEraseMode(false);
            }}
            aria-label={`Highlight ${c.id}`}
            className={`h-6 w-6 rounded-full border-2 transition-all duration-200 ${
              activeColor === c.id && !eraseMode
                ? "scale-110 border-white shadow-sm"
                : "border-transparent"
            }`}
            style={{ backgroundColor: c.swatch }}
          />
        ))}
        <button
          type="button"
          onClick={() => setEraseMode((v) => !v)}
          className={`ml-2 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 ${
            eraseMode
              ? "border-rose-400/60 bg-rose-500/20 text-rose-300"
              : "border-white/15 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10"
          }`}
          aria-pressed={eraseMode}
        >
          <Eraser size={13} /> Erase
        </button>
        <button
          type="button"
          onClick={() => setHighlights({})}
          className="ml-2 flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition-all duration-200 hover:border-white/30 hover:bg-white/10"
        >
          <RotateCcw size={13} /> Clear all
        </button>
        <span className="ml-auto text-[11px] text-slate-500">
          {totalHighlights > 0
            ? `${totalHighlights} highlight${totalHighlights === 1 ? "" : "s"}`
            : "Drag across the exact text you want to highlight"}
        </span>
      </div>

      <div
        className={`select-none overflow-x-hidden text-slate-200 ${fontSizeMap[fontSize]}`}
        style={{
          fontFamily: "var(--font-display)",
          lineHeight: 1.9,
          letterSpacing: "0.01em",
        }}
      >
        {paragraphs.map((p, paragraphIndex) => {
          const paragraphKey = p.label || `paragraph-${paragraphIndex}`;
          const paragraphHighlights = highlights[paragraphKey] ?? [];
          const highlightMap = new Map(
            paragraphHighlights.map((item) => [item.key, item.colorId]),
          );

          return (
            <p
              key={paragraphKey}
              className="mb-6 overflow-wrap-anywhere break-words last:mb-0"
              onMouseUp={(event) =>
                handleSelection(paragraphKey, event.currentTarget)
              }
              onTouchEnd={(event) =>
                handleSelection(paragraphKey, event.currentTarget)
              }
            >
              <span className="mr-3 inline-block font-semibold uppercase tracking-[0.2em] text-brand-400/90">
                {p.label}
              </span>
              {tokenize(p.text).map((tok, i) => {
                if (/^\s+$/.test(tok)) {
                  return <span key={`${paragraphKey}-${i}`}>{tok}</span>;
                }

                const tokenKey = `${paragraphKey}-${i}`;
                const highlightColorId = highlightMap.get(tokenKey);
                const highlightColor = highlightColorId
                  ? colorFor(highlightColorId)
                  : undefined;

                return (
                  <span
                    key={tokenKey}
                    data-token-key={tokenKey}
                    style={
                      highlightColor
                        ? { backgroundColor: highlightColor, borderRadius: 3 }
                        : undefined
                    }
                    className="cursor-text transition-colors duration-200"
                  >
                    {tok}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    </div>
  );
}
