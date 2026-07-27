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
    console.log('[HighlightablePassage DBLCLICK] Event fired', { tokenKey, paragraphKey, tokenText });
    const now = Date.now();
    const lastClick = lastClickRef.current;
    
    console.log('[HighlightablePassage DBLCLICK] Last click check', { lastClick, timeDiff: lastClick ? now - lastClick.time : null });
    
    // Check if this is a double-click on the same token
    if (lastClick && lastClick.key === tokenKey && now - lastClick.time < 300) {
      console.log('[HighlightablePassage DBLCLICK] Double-click detected, toggling highlight');
      // Double-click detected - toggle highlight
      setHighlights((prev) => {
        const next = { ...prev };
        const currentSet = next[paragraphKey] || new Set<string>();
        const current = new Set(currentSet);
        
        console.log('[HighlightablePassage DBLCLICK] Current highlights before toggle', { currentSet: Array.from(currentSet), hasToken: current.has(tokenKey) });
        
        if (current.has(tokenKey)) {
          console.log('[HighlightablePassage DBLCLICK] Removing highlight');
          current.delete(tokenKey);
          onHighlightRemove?.(tokenText);
        } else {
          console.log('[HighlightablePassage DBLCLICK] Adding highlight');
          current.add(tokenKey);
          onHighlight?.(tokenText);
        }
        
        next[paragraphKey] = current;
        console.log('[HighlightablePassage DBLCLICK] State updated', { newHighlights: Array.from(current) });
        return next;
      });
      lastClickRef.current = null;
    } else {
      console.log('[HighlightablePassage DBLCLICK] First click, waiting');
      lastClickRef.current = { key: tokenKey, time: now };
    }
  };

  const handleSelection = (
    paragraphKey: string,
    paragraphElement: HTMLParagraphElement,
  ) => {
    console.log('[HighlightablePassage SELECTION] Event fired', { paragraphKey });
    const selection = window.getSelection();
    console.log('[HighlightablePassage SELECTION] getSelection result', { 
      selection, 
      rangeCount: selection?.rangeCount, 
      isCollapsed: selection?.isCollapsed,
      selectedText: selection?.toString()
    });
    
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      console.log('[HighlightablePassage SELECTION] Early return - no valid selection');
      return;
    }

    const range = selection.getRangeAt(0);
    const paragraphRange = document.createRange();
    paragraphRange.selectNodeContents(paragraphElement);

    const isWithinParagraph =
      range.compareBoundaryPoints(Range.START_TO_START, paragraphRange) >= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, paragraphRange) <= 0;

    console.log('[HighlightablePassage SELECTION] Boundary check', { isWithinParagraph });

    if (!isWithinParagraph) {
      console.log('[HighlightablePassage SELECTION] Selection not within paragraph');
      return;
    }

    const selectedText = selection.toString().trim();
    console.log('[HighlightablePassage SELECTION] Selected text', { selectedText, length: selectedText.length });
    
    if (selectedText.length === 0) {
      console.log('[HighlightablePassage SELECTION] Selected text is empty');
      return;
    }

    // New algorithm: Use DOM Range intersection to detect overlapping tokens
    const tokenElements = Array.from(
      paragraphElement.querySelectorAll<HTMLElement>("[data-token-key]")
    );
    
    console.log('[HighlightablePassage SELECTION] Found token elements', { count: tokenElements.length });

    const selectedKeys: string[] = [];
    
    for (const tokenElement of tokenElements) {
      const tokenRange = document.createRange();
      tokenRange.selectNodeContents(tokenElement);
      
      // Check if the selection range intersects with this token range
      const startToEnd = range.compareBoundaryPoints(Range.START_TO_END, tokenRange);
      const endToStart = range.compareBoundaryPoints(Range.END_TO_START, tokenRange);
      
      // If START_TO_END >= 0 and END_TO_START <= 0, the ranges intersect
      const intersects = startToEnd >= 0 && endToStart <= 0;
      
      if (intersects) {
        const tokenKey = tokenElement.getAttribute("data-token-key");
        if (tokenKey) {
          selectedKeys.push(tokenKey);
          console.log('[HighlightablePassage SELECTION] Token intersects', { tokenKey, tokenText: tokenElement.textContent?.trim() });
        }
      }
    }

    console.log('[HighlightablePassage SELECTION] Selected token keys', { selectedKeys, count: selectedKeys.length });

    if (selectedKeys.length === 0) {
      console.log('[HighlightablePassage SELECTION] No token keys selected');
      return;
    }

    setHighlights((prev) => {
      const next = { ...prev };
      const currentSet = next[paragraphKey] || new Set<string>();
      const current = new Set(currentSet);
      
      console.log('[HighlightablePassage SELECTION] Before adding', { currentHighlights: Array.from(current) });
      
      selectedKeys.forEach((key) => {
        current.add(key);
      });
      
      next[paragraphKey] = current;
      console.log('[HighlightablePassage SELECTION] State updated', { newHighlights: Array.from(current) });
      return next;
    });

    selection.removeAllRanges();
  };

  return (
    <div className="space-y-4">

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
