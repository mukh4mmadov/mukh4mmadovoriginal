"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_SPLIT = 50;
const clampSplit = (value) => Math.min(75, Math.max(25, value));

/**
 * Passage and questions side by side with a draggable divider (remembered
 * on this device; double-click or Home resets it). On narrow screens the
 * two sides become tabs.
 */
export default function SplitPane({ left, right, leftLabel, rightLabel, storageKey = "ielts-exam-split-v1", mobileTab, onMobileTabChange, leftId, rightId }) {
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const containerRef = useRef(null);
  const [internalTab, setInternalTab] = useState("left");
  const tab = mobileTab ?? internalTab;
  const setTab = onMobileTabChange ?? setInternalTab;

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(storageKey));
      if (Number.isFinite(saved) && saved > 0) setSplit(clampSplit(saved));
    } catch {
      // Keep the even split.
    }
  }, [storageKey]);

  const save = (value) => {
    const next = clampSplit(value);
    setSplit(next);
    try { window.localStorage.setItem(storageKey, String(next)); } catch { /* not remembered */ }
  };

  const onPointerDown = (event) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const move = (moveEvent) => {
      const rect = container.getBoundingClientRect();
      save(((moveEvent.clientX - rect.left) / rect.width) * 100);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); save(split - 5); }
    if (event.key === "ArrowRight") { event.preventDefault(); save(split + 5); }
    if (event.key === "Home") { event.preventDefault(); save(DEFAULT_SPLIT); }
  };

  return (
    <>
      <div className="exam-mobile-tabs" role="tablist" aria-label="Show">
        <button type="button" role="tab" aria-selected={tab === "left"} aria-controls={leftId} onClick={() => setTab("left")}>{leftLabel}</button>
        <button type="button" role="tab" aria-selected={tab === "right"} aria-controls={rightId} onClick={() => setTab("right")}>{rightLabel}</button>
      </div>
      <div ref={containerRef} className="exam-split">
        <section id={leftId} className="exam-pane" style={{ width: `${split}%` }} data-mobile-hidden={tab !== "left"} aria-label={leftLabel}>
          {left}
        </section>
        <div
          className="exam-divider"
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label="Resize passage and questions"
          aria-valuemin={25}
          aria-valuemax={75}
          aria-valuenow={Math.round(split)}
          title="Drag to resize. Double-click to reset."
          onPointerDown={onPointerDown}
          onDoubleClick={() => save(DEFAULT_SPLIT)}
          onKeyDown={onKeyDown}
        />
        <section id={rightId} className="exam-pane" style={{ width: `${100 - split}%` }} data-mobile-hidden={tab !== "right"} aria-label={rightLabel}>
          {right}
        </section>
      </div>
    </>
  );
}
