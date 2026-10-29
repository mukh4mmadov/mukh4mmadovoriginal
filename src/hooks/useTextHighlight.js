import { useState, useEffect, useRef, useCallback } from "react";
import { HIGHLIGHT_COLORS } from "@/lib/highlightConstants";

export function useTextHighlight(
  storageKey,
  onHighlight,
  onHighlightRemove,
) {
  const [highlights, setHighlights] = useState({});
  const [loadedStorageKey, setLoadedStorageKey] = useState(null);
  const currentHighlights = loadedStorageKey === storageKey ? highlights : {};

  useEffect(() => {
    let restoredHighlights = {};
    try {
      const stored = window.localStorage.getItem(
        `highlights_${storageKey}`,
      );
      const parsed = stored ? JSON.parse(stored) : {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        restoredHighlights = Object.fromEntries(
          Object.entries(parsed).filter(
            ([, container]) =>
              container && typeof container === "object" && !Array.isArray(container),
          ),
        );
      }
    } catch {
    }
    setHighlights(restoredHighlights);
    setLoadedStorageKey(storageKey);
  }, [storageKey]);

  const [eraseMode, setEraseMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState("yellow");

  const totalHighlights = Object.values(currentHighlights).reduce(
    (sum, container) => sum + Object.keys(container).length,
    0,
  );

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    try {
      window.localStorage.setItem(
        `highlights_${storageKey}`,
        JSON.stringify(highlights),
      );
    } catch {
    }
  }, [highlights, loadedStorageKey, storageKey]);

  const clearAll = useCallback(() => {
    setHighlights({});
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(`highlights_${storageKey}`);
      } catch {
      }
    }
  }, [storageKey]);

  const toggleEraseMode = useCallback(() => {
    setEraseMode((prev) => !prev);
  }, []);

  const toggleToken = useCallback(
    (tokenKey, containerKey, tokenText) => {
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
            current[tokenKey] = selectedColor;
            onHighlight?.(tokenText);
          }
        }

        next[containerKey] = current;
        return next;
      });
    },
    [eraseMode, selectedColor, onHighlight, onHighlightRemove],
  );

  const handleDoubleClick = useCallback(
    (tokenKey, containerKey, tokenText) => {
      toggleToken(tokenKey, containerKey, tokenText);
      window.getSelection()?.removeAllRanges();
    },
    [toggleToken],
  );

  // Highlights (or, with erase, clears) the selected words. The colour and
  // erase mode default to the toolbar's, and can be given per call (the
  // exam selection menu does that).
  const handleSelection = useCallback(
    (containerKey, containerElement, options = {}) => {
      const selectedKeys = selectedTokenKeys(containerElement);
      if (selectedKeys.length === 0) return;
      const erase = options.erase ?? eraseMode;
      const color = options.color ?? selectedColor;
      const tokenTexts = selectedKeys.map((key) => containerElement.querySelector(`[data-token-key="${key}"]`)?.textContent?.trim() || "");

      setHighlights((prev) => {
        const next = { ...prev };
        const current = { ...(next[containerKey] || {}) };

        selectedKeys.forEach((key, idx) => {
          const tokenText = tokenTexts[idx];
          if (erase) {
            if (current[key]) {
              delete current[key];
              onHighlightRemove?.(tokenText);
            }
          } else if (current[key] !== color) {
            if (!current[key]) onHighlight?.(tokenText);
            current[key] = color;
          }
        });

        next[containerKey] = current;
        return next;
      });
    },
    [eraseMode, onHighlight, onHighlightRemove, selectedColor],
  );

  // Same as handleSelection, for word keys captured earlier (the selection
  // menu keeps them, since tapping a menu button can clear the selection).
  const applyToTokens = useCallback(
    (containerKey, tokenKeys, texts = [], options = {}) => {
      if (!tokenKeys?.length) return;
      const erase = options.erase ?? false;
      const color = options.color ?? selectedColor;
      setHighlights((prev) => {
        const next = { ...prev };
        const current = { ...(next[containerKey] || {}) };
        tokenKeys.forEach((key, idx) => {
          if (erase) {
            if (current[key]) {
              delete current[key];
              onHighlightRemove?.(texts[idx] || "");
            }
          } else if (current[key] !== color) {
            if (!current[key]) onHighlight?.(texts[idx] || "");
            current[key] = color;
          }
        });
        next[containerKey] = current;
        return next;
      });
    },
    [onHighlight, onHighlightRemove, selectedColor],
  );

  return {
    applyToTokens,
    highlights: currentHighlights,
    eraseMode,
    toggleEraseMode,
    clearAll,
    totalHighlights,
    handleSelection,
    handleDoubleClick,
    toggleToken,
    selectedColor,
    setSelectedColor,
  };
}

// Token keys of the words the current text selection touches, if the
// selection lies inside containerElement.
export function selectedTokenKeys(containerElement) {
  const selection = typeof window !== "undefined" ? window.getSelection() : null;
  if (!containerElement || !selection || selection.rangeCount === 0 || selection.isCollapsed) return [];
  if (!selection.toString().trim()) return [];

  const range = selection.getRangeAt(0);
  const containerRange = document.createRange();
  containerRange.selectNodeContents(containerElement);
  const isWithinContainer =
    range.compareBoundaryPoints(Range.START_TO_START, containerRange) >= 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, containerRange) <= 0;
  if (!isWithinContainer) return [];

  const keys = [];
  for (const tokenElement of containerElement.querySelectorAll("[data-token-key]")) {
    const tokenRange = document.createRange();
    tokenRange.selectNodeContents(tokenElement);
    const intersects =
      range.compareBoundaryPoints(Range.START_TO_END, tokenRange) >= 0 &&
      range.compareBoundaryPoints(Range.END_TO_START, tokenRange) <= 0;
    const tokenKey = tokenElement.getAttribute("data-token-key");
    if (intersects && tokenKey) keys.push(tokenKey);
  }
  return keys;
}
