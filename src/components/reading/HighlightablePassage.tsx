"use client";

import {
  Eraser,
  Trash2,
} from "lucide-react";
import {
  HIGHLIGHT_COLOR,
  fontSizeMap,
  type FontSize,
  tokenize,
} from "@/lib/highlightConstants";
import type { UseTextHighlightReturn } from "@/hooks/useTextHighlight";

interface HighlightablePassageProps {
  paragraphs: { label: string; text: string }[];
  fontSize?: FontSize;
  highlightState: UseTextHighlightReturn;
}

export default function HighlightablePassage({
  paragraphs,
  fontSize = "medium",
  highlightState,
}: HighlightablePassageProps) {
  const {
    highlights,
    eraseMode,
    toggleEraseMode,
    clearAll,
    totalHighlights,
    handleSelection,
    handleDoubleClick,
    toggleToken,
  } = highlightState;

  return (
    <div className="space-y-4">
      {/* Highlighting toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={toggleEraseMode}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            eraseMode
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-slate-100"
          }`}
          title={eraseMode ? "Exit eraser mode" : "Enable eraser mode"}
        >
          <Eraser size={12} />
          {eraseMode ? "Erasing" : "Eraser"}
        </button>

        <button
          type="button"
          onClick={clearAll}
          disabled={totalHighlights === 0}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            totalHighlights === 0
              ? "cursor-not-allowed opacity-40"
              : "border-white/10 bg-white/5 text-slate-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
          }`}
          title="Clear all highlights"
        >
          <Trash2 size={12} />
          Clear all
        </button>

        {totalHighlights > 0 && (
          <span className="text-xs text-slate-500">
            {totalHighlights} highlight{totalHighlights !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div
        className={`overflow-x-hidden text-slate-200 ${fontSizeMap[fontSize]}`}
        style={{
          fontFamily: "var(--font-display)",
          lineHeight: 1.9,
          letterSpacing: "0.01em",
        }}
      >
        {paragraphs.map((p, paragraphIndex) => {
          const paragraphKey = p.label || `paragraph-${paragraphIndex}`;
          const paragraphHighlights = highlights[paragraphKey] || {};

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
                const isHighlighted = paragraphHighlights[tokenKey];

                return (
                  <span
                    key={tokenKey}
                    data-token-key={tokenKey}
                    tabIndex={0}
                    onDoubleClick={() =>
                      handleDoubleClick(tokenKey, paragraphKey, tok.trim())
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleToken(tokenKey, paragraphKey, tok.trim());
                      }
                    }}
                    style={
                      isHighlighted
                        ? {
                            backgroundColor: HIGHLIGHT_COLOR,
                            borderRadius: 3,
                          }
                        : undefined
                    }
                    className="cursor-text transition-colors duration-200 outline-none focus:ring-2 focus:ring-brand-500/50 focus:rounded"
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
