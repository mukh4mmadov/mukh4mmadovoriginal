"use client";

import { useMemo, useState, useRef } from "react";

interface HighlightablePassageProps {
  paragraphs: { label: string; text: string }[];
  fontSize?: "small" | "medium" | "large";
  onHighlight?: (text: string) => void;
  onHighlightRemove?: (text: string) => void;
}

const HIGHLIGHT_COLOR = "rgba(250,204,21,0.35)";

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
  onHighlight,
  onHighlightRemove,
}: HighlightablePassageProps) {
  const [highlights, setHighlights] = useState<
    Record<string, Set<string>>
  >({});
  const lastClickRef = useRef<{ key: string; time: number } | null>(null);

  const totalHighlights = useMemo(
    () =>
      Object.values(highlights).reduce((sum, items) => sum + items.size, 0),
    [highlights],
  );

  const handleDoubleClick = (tokenKey: string, paragraphKey: string, tokenText: string) => {
    const now = Date.now();
    const lastClick = lastClickRef.current;
    
    // Check if this is a double-click on the same token
    if (lastClick && lastClick.key === tokenKey && now - lastClick.time < 300) {
      // Double-click detected - toggle highlight
      setHighlights((prev) => {
        const next = { ...prev };
        const current = next[paragraphKey] || new Set<string>();
        
        if (current.has(tokenKey)) {
          current.delete(tokenKey);
          onHighlightRemove?.(tokenText);
        } else {
          current.add(tokenKey);
          onHighlight?.(tokenText);
        }
        
        next[paragraphKey] = current;
        return next;
      });
      lastClickRef.current = null;
    } else {
      lastClickRef.current = { key: tokenKey, time: now };
    }
  };

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

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    const selectedKeys = Array.from(
      paragraphElement.querySelectorAll<HTMLElement>("[data-token-key]"),
    )
      .map((token) => {
        const tokenRange = document.createRange();
        tokenRange.selectNodeContents(token);
        
        const isFullyContained =
          range.compareBoundaryPoints(Range.START_TO_START, tokenRange) <= 0 &&
          range.compareBoundaryPoints(Range.END_TO_END, tokenRange) >= 0;
        
        return isFullyContained ? token.getAttribute("data-token-key") : null;
      })
      .filter((value): value is string => Boolean(value));

    if (selectedKeys.length === 0) return;

    setHighlights((prev) => {
      const next = { ...prev };
      const current = next[paragraphKey] || new Set<string>();
      
      selectedKeys.forEach((key) => {
        current.add(key);
      });
      
      next[paragraphKey] = current;
      return next;
    });

    selection.removeAllRanges();
  };

  return (
    <div className="space-y-4">

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
          const paragraphHighlights = highlights[paragraphKey] ?? new Set<string>();
          const highlightMap = paragraphHighlights;

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
                const isHighlighted = highlightMap.has(tokenKey);

                return (
                  <span
                    key={tokenKey}
                    data-token-key={tokenKey}
                    onDoubleClick={() => handleDoubleClick(tokenKey, paragraphKey, tok.trim())}
                    style={
                      isHighlighted
                        ? { backgroundColor: HIGHLIGHT_COLOR, borderRadius: 3 }
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
