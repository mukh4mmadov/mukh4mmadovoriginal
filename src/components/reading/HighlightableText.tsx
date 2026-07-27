"use client";

import { useState, useRef, useMemo } from "react";

interface HighlightableTextProps {
  children: React.ReactNode;
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

export default function HighlightableText({
  children,
  fontSize = "medium",
  onHighlight,
  onHighlightRemove,
}: HighlightableTextProps) {
  const [highlights, setHighlights] = useState<
    Record<string, Set<string>>
  >({});
  const lastClickRef = useRef<{ key: string; time: number } | null>(null);


  const handleDoubleClick = (tokenKey: string, containerKey: string, tokenText: string) => {
    const now = Date.now();
    const lastClick = lastClickRef.current;
    
    // Check if this is a double-click on the same token
    if (lastClick && lastClick.key === tokenKey && now - lastClick.time < 300) {
      // Double-click detected - toggle highlight
      setHighlights((prev) => {
        const next = { ...prev };
        const current = next[containerKey] || new Set<string>();
        
        if (current.has(tokenKey)) {
          current.delete(tokenKey);
          onHighlightRemove?.(tokenText);
        } else {
          current.add(tokenKey);
          onHighlight?.(tokenText);
        }
        
        next[containerKey] = current;
        return next;
      });
      lastClickRef.current = null;
    } else {
      lastClickRef.current = { key: tokenKey, time: now };
    }
  };

  const handleSelection = (
    containerKey: string,
    containerElement: HTMLDivElement,
  ) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    const containerRange = document.createRange();
    containerRange.selectNodeContents(containerElement);

    const isWithinContainer =
      range.compareBoundaryPoints(Range.START_TO_START, containerRange) >= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, containerRange) <= 0;

    if (!isWithinContainer) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    const selectedKeys = Array.from(
      containerElement.querySelectorAll<HTMLElement>("[data-token-key]"),
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
      const current = next[containerKey] || new Set<string>();
      
      selectedKeys.forEach((key) => {
        current.add(key);
      });
      
      next[containerKey] = current;
      return next;
    });

    selection.removeAllRanges();
  };

  // Convert children to text for tokenization
  const textContent = typeof children === 'string' ? children : '';
  const containerKey = useMemo(() => `text-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <span
      className={`select-none text-slate-200 ${fontSizeMap[fontSize]}`}
      style={{
        fontFamily: "var(--font-display)",
        lineHeight: 1.9,
        letterSpacing: "0.01em",
      }}
      onMouseUp={(event) =>
        handleSelection(containerKey, event.currentTarget as HTMLDivElement)
      }
      onTouchEnd={(event) =>
        handleSelection(containerKey, event.currentTarget as HTMLDivElement)
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
