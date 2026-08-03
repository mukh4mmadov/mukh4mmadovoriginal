import { useState, useEffect, useRef, useCallback } from "react";
import { HIGHLIGHT_COLOR } from "@/lib/highlightConstants";

export interface UseTextHighlightReturn {
  highlights: Record<string, Record<string, boolean>>;
  eraseMode: boolean;
  toggleEraseMode: () => void;
  clearAll: () => void;
  totalHighlights: number;
  handleSelection: (
    containerKey: string,
    containerElement: HTMLElement,
  ) => void;
  handleDoubleClick: (
    tokenKey: string,
    containerKey: string,
    tokenText: string,
  ) => void;
  toggleToken: (
    tokenKey: string,
    containerKey: string,
    tokenText: string,
  ) => void;
}

export function useTextHighlight(
  storageKey: string,
  onHighlight?: (text: string) => void,
  onHighlightRemove?: (text: string) => void,
): UseTextHighlightReturn {
  const [highlights, setHighlights] = useState<
    Record<string, Record<string, boolean>>
  >(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem(
        `highlights_${storageKey}`,
      );
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [eraseMode, setEraseMode] = useState(false);

  const totalHighlights = Object.values(highlights).reduce(
    (sum, container) => sum + Object.keys(container).length,
    0,
  );

  // Persist highlights to localStorage on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        `highlights_${storageKey}`,
        JSON.stringify(highlights),
      );
    } catch {
      // Quota exceeded or other save error — ignore silently
    }
  }, [highlights, storageKey]);

  const clearAll = useCallback(() => {
    setHighlights({});
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(`highlights_${storageKey}`);
      } catch {
        // Ignore
      }
    }
  }, [storageKey]);

  const toggleEraseMode = useCallback(() => {
    setEraseMode((prev) => !prev);
  }, []);

  const toggleToken = useCallback(
    (tokenKey: string, containerKey: string, tokenText: string) => {
      setHighlights((prev) => {
        const next = { ...prev };
        const container = next[containerKey] || {};
        const current = { ...container };

        if (eraseMode) {
          if (current[tokenKey]) {
            delete current[tokenKey];
            onHighlightRemove?.(tokenText);
          }
        } else {
          if (current[tokenKey]) {
            delete current[tokenKey];
            onHighlightRemove?.(tokenText);
          } else {
            current[tokenKey] = true;
            onHighlight?.(tokenText);
          }
        }

        next[containerKey] = current;
        return next;
      });
    },
    [eraseMode, onHighlight, onHighlightRemove],
  );

  const handleDoubleClick = useCallback(
    (tokenKey: string, containerKey: string, tokenText: string) => {
      // Double-click — toggle the token immediately
      toggleToken(tokenKey, containerKey, tokenText);
      // Clean up the browser's auto-selected word from the double-click
      window.getSelection()?.removeAllRanges();
    },
    [toggleToken],
  );

  const handleSelection = useCallback(
    (containerKey: string, containerElement: HTMLElement) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return;
      }

      const range = selection.getRangeAt(0);
      const containerRange = document.createRange();
      containerRange.selectNodeContents(containerElement);

      const isWithinContainer =
        range.compareBoundaryPoints(Range.START_TO_START, containerRange) >=
          0 &&
        range.compareBoundaryPoints(Range.END_TO_END, containerRange) <= 0;

      if (!isWithinContainer) return;

      const selectedText = selection.toString().trim();
      if (selectedText.length === 0) return;

      // New algorithm: Use DOM Range intersection to detect overlapping tokens
      const tokenElements = Array.from(
        containerElement.querySelectorAll<HTMLElement>("[data-token-key]"),
      );

      const selectedKeys: string[] = [];

      for (const tokenElement of tokenElements) {
        const tokenRange = document.createRange();
        tokenRange.selectNodeContents(tokenElement);

        const startToEnd = range.compareBoundaryPoints(
          Range.START_TO_END,
          tokenRange,
        );
        const endToStart = range.compareBoundaryPoints(
          Range.END_TO_START,
          tokenRange,
        );

        const intersects = startToEnd >= 0 && endToStart <= 0;

        if (intersects) {
          const tokenKey = tokenElement.getAttribute("data-token-key");
          if (tokenKey) {
            selectedKeys.push(tokenKey);
          }
        }
      }

      // Single-token selections should also be highlighted
      // Don't return early - allow highlighting of single words

      // Collect token texts for analytics callbacks
      const tokenTexts: string[] = [];
      for (const key of selectedKeys) {
        const el = containerElement.querySelector<HTMLElement>(
          `[data-token-key="${key}"]`,
        );
        if (el) {
          tokenTexts.push(el.textContent?.trim() || "");
        }
      }

      setHighlights((prev) => {
        const next = { ...prev };
        const container = next[containerKey] || {};
        const current = { ...container };

        selectedKeys.forEach((key, idx) => {
          const tokenText = tokenTexts[idx];
          if (eraseMode) {
            if (current[key]) {
              delete current[key];
              onHighlightRemove?.(tokenText);
            }
          } else {
            if (!current[key]) {
              current[key] = true;
              onHighlight?.(tokenText);
            }
          }
        });

        next[containerKey] = current;
        return next;
      });

      // Intentionally do NOT call selection.removeAllRanges() here —
      // the user needs the selection to copy text to clipboard.
    },
    [eraseMode, onHighlight, onHighlightRemove],
  );

  return {
    highlights,
    eraseMode,
    toggleEraseMode,
    clearAll,
    totalHighlights,
    handleSelection,
    handleDoubleClick,
    toggleToken,
  };
}
