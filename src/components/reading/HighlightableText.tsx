"use client";

import { useState, useRef, useMemo } from "react";

interface HighlightableTextProps {
  children: React.ReactNode;
  fontSize?: "small" | "medium" | "large";
  onHighlight?: (text: string) => void;
  onHighlightRemove?: (text: string) => void;
  containerKey: string;
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

export default function HighlightableText({
  children,
  fontSize = "medium",
  onHighlight,
  onHighlightRemove,
  containerKey,
}: HighlightableTextProps) {
  const [highlights, setHighlights] = useState<
    Record<string, Set<string>>
  >({});
  const lastClickRef = useRef<{ key: string; time: number } | null>(null);


  const handleDoubleClick = (tokenKey: string, containerKey: string, tokenText: string) => {
    console.log('[HighlightableText DBLCLICK] Event fired', { tokenKey, containerKey, tokenText });
    const now = Date.now();
    const lastClick = lastClickRef.current;
    
    console.log('[HighlightableText DBLCLICK] Last click check', { lastClick, timeDiff: lastClick ? now - lastClick.time : null });
    
    // Check if this is a double-click on the same token
    if (lastClick && lastClick.key === tokenKey && now - lastClick.time < 300) {
      console.log('[HighlightableText DBLCLICK] Double-click detected, toggling highlight');
      // Double-click detected - toggle highlight
      setHighlights((prev) => {
        const next = { ...prev };
        const currentSet = next[containerKey] || new Set<string>();
        const current = new Set(currentSet);
        
        console.log('[HighlightableText DBLCLICK] Current highlights before toggle', { currentSet: Array.from(currentSet), hasToken: current.has(tokenKey) });
        
        if (current.has(tokenKey)) {
          console.log('[HighlightableText DBLCLICK] Removing highlight');
          current.delete(tokenKey);
          onHighlightRemove?.(tokenText);
        } else {
          console.log('[HighlightableText DBLCLICK] Adding highlight');
          current.add(tokenKey);
          onHighlight?.(tokenText);
        }
        
        next[containerKey] = current;
        console.log('[HighlightableText DBLCLICK] State updated', { newHighlights: Array.from(current) });
        return next;
      });
      lastClickRef.current = null;
    } else {
      console.log('[HighlightableText DBLCLICK] First click, waiting');
      lastClickRef.current = { key: tokenKey, time: now };
    }
  };

  const handleSelection = (
    containerKey: string,
    containerElement: HTMLElement,
  ) => {
    console.log('[HighlightableText SELECTION] Event fired', { containerKey });
    const selection = window.getSelection();
    console.log('[HighlightableText SELECTION] getSelection result', { 
      selection, 
      rangeCount: selection?.rangeCount, 
      isCollapsed: selection?.isCollapsed,
      selectedText: selection?.toString()
    });
    
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      console.log('[HighlightableText SELECTION] Early return - no valid selection');
      return;
    }

    const range = selection.getRangeAt(0);
    const containerRange = document.createRange();
    containerRange.selectNodeContents(containerElement);

    const isWithinContainer =
      range.compareBoundaryPoints(Range.START_TO_START, containerRange) >= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, containerRange) <= 0;

    console.log('[HighlightableText SELECTION] Boundary check', { isWithinContainer });

    if (!isWithinContainer) {
      console.log('[HighlightableText SELECTION] Selection not within container');
      return;
    }

    const selectedText = selection.toString().trim();
    console.log('[HighlightableText SELECTION] Selected text', { selectedText, length: selectedText.length });
    
    if (selectedText.length === 0) {
      console.log('[HighlightableText SELECTION] Selected text is empty');
      return;
    }

    // New algorithm: Use DOM Range intersection to detect overlapping tokens
    const tokenElements = Array.from(
      containerElement.querySelectorAll<HTMLElement>("[data-token-key]")
    );
    
    console.log('[HighlightableText SELECTION] Found token elements', { count: tokenElements.length });

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
          console.log('[HighlightableText SELECTION] Token intersects', { tokenKey, tokenText: tokenElement.textContent?.trim() });
        }
      }
    }

    console.log('[HighlightableText SELECTION] Selected token keys', { selectedKeys, count: selectedKeys.length });

    if (selectedKeys.length === 0) {
      console.log('[HighlightableText SELECTION] No token keys selected');
      return;
    }

    setHighlights((prev) => {
      const next = { ...prev };
      const currentSet = next[containerKey] || new Set<string>();
      const current = new Set(currentSet);
      
      console.log('[HighlightableText SELECTION] Before adding', { currentHighlights: Array.from(current) });
      
      selectedKeys.forEach((key) => {
        current.add(key);
      });
      
      next[containerKey] = current;
      console.log('[HighlightableText SELECTION] State updated', { newHighlights: Array.from(current) });
      return next;
    });

    selection.removeAllRanges();
  };

  // Convert children to text for tokenization
  const textContent = typeof children === 'string' ? children : '';

  return (
    <span
      className={`text-slate-200 ${fontSizeMap[fontSize]}`}
      style={{
        fontFamily: "var(--font-display)",
        lineHeight: 1.9,
        letterSpacing: "0.01em",
      }}
      onMouseUp={(event) =>
        handleSelection(containerKey, event.currentTarget)
      }
      onTouchEnd={(event) =>
        handleSelection(containerKey, event.currentTarget)
      }
    >
      {typeof children === 'string' ? (
        tokenize(children).map((tok, i) => {
          if (/^\s+$/.test(tok)) {
            return <span key={`${containerKey}-${i}`}>{tok}</span>;
          }

          const tokenKey = `${containerKey}-${i}`;
          const containerHighlights = highlights[containerKey] ?? new Set<string>();
          const isHighlighted = containerHighlights.has(tokenKey);

          return (
            <span
              key={tokenKey}
              data-token-key={tokenKey}
              onDoubleClick={() => handleDoubleClick(tokenKey, containerKey, tok.trim())}
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
        })
      ) : (
        children
      )}
    </span>
  );
}
