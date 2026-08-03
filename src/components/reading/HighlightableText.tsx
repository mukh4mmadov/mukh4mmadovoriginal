"use client";

import { HIGHLIGHT_COLOR, fontSizeMap, type FontSize, tokenize } from "@/lib/highlightConstants";
import type { UseTextHighlightReturn } from "@/hooks/useTextHighlight";

interface HighlightableTextProps {
  children: React.ReactNode;
  fontSize?: FontSize;
  containerKey: string;
  highlightState: UseTextHighlightReturn;
  className?: string;
}

export default function HighlightableText({
  children,
  fontSize = "medium",
  containerKey,
  highlightState,
  className,
}: HighlightableTextProps) {
  const {
    highlights,
    handleSelection,
    handleDoubleClick,
    toggleToken,
  } = highlightState;

  return (
    <span
      className={`${className || ""} ${fontSizeMap[fontSize]}`}
      style={{
        fontFamily: "var(--font-display)",
        lineHeight: 1.9,
        letterSpacing: "0.01em",
      }}
      onMouseUp={(event) => handleSelection(containerKey, event.currentTarget)}
      onTouchEnd={(event) => handleSelection(containerKey, event.currentTarget)}
    >
      {typeof children === "string" ? (
        tokenize(children).map((tok, i) => {
          if (/^\s+$/.test(tok)) {
            return <span key={`${containerKey}-${i}`}>{tok}</span>;
          }

          const tokenKey = `${containerKey}-${i}`;
          const containerHighlights = highlights[containerKey] || {};
          const isHighlighted = containerHighlights[tokenKey];

          return (
            <span
              key={tokenKey}
              data-token-key={tokenKey}
              tabIndex={0}
              onDoubleClick={() =>
                handleDoubleClick(tokenKey, containerKey, tok.trim())
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleToken(tokenKey, containerKey, tok.trim());
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
        })
      ) : (
        children
      )}
    </span>
  );
}
