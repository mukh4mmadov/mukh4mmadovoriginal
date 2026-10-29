"use client";

import { GripVertical, X } from "lucide-react";

const DRAG_TYPE = "text/x-ielts-heading";

// "Paragraph B" -> "B"
export function paragraphLetter(question) {
  return String(question?.paragraphLabel || "").match(/([A-Z])\s*$/i)?.[1]?.toUpperCase() || null;
}

/**
 * The list of headings as draggable chips. Tap or Enter picks a heading;
 * then tap or Enter on a paragraph's box places it. Used headings are greyed.
 */
export function HeadingChips({ headings, usedIds, picked, onPick }) {
  return (
    <div className="exam-box">
      <p className="exam-box-title">List of headings</p>
      <p className="mb-2 text-sm" style={{ color: "var(--exam-muted)" }}>Drag a heading to a paragraph in the passage, or tap a heading and then tap the paragraph&apos;s box.</p>
      <div className="grid gap-1.5" role="list">
        {headings.map((heading) => {
          const used = usedIds.has(heading.id);
          return (
            <button
              key={heading.id}
              type="button"
              role="listitem"
              draggable
              className="heading-chip"
              data-used={used}
              aria-pressed={picked === heading.id}
              aria-label={`Heading ${heading.id}: ${heading.text}${used ? " (used)" : ""}. ${picked === heading.id ? "Picked. Now choose a paragraph." : "Press to pick it."}`}
              onClick={() => onPick(picked === heading.id ? null : heading.id)}
              onDragStart={(event) => {
                event.dataTransfer.setData(DRAG_TYPE, heading.id);
                event.dataTransfer.setData("text/plain", heading.id);
                event.dataTransfer.effectAllowed = "copy";
                onPick(heading.id);
              }}
              onDragEnd={() => onPick(null)}
            >
              <GripVertical size={16} aria-hidden="true" className="shrink-0 opacity-60" />
              <b className="shrink-0">{heading.id}</b>
              <span className="min-w-0 flex-1 text-left">{heading.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// The box above a paragraph where its heading goes.
export function HeadingDropZone({ number, headingBank, value, picked, onPlace, onClear, onFocusQuestion }) {
  const placed = headingBank.find((heading) => heading.id === value);
  const place = (headingId) => { if (headingId) onPlace(headingId); };
  return (
    <div
      className="heading-drop"
      data-filled={Boolean(placed)}
      data-ready={Boolean(picked)}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
      onDrop={(event) => { event.preventDefault(); place(event.dataTransfer.getData(DRAG_TYPE) || event.dataTransfer.getData("text/plain")); }}
    >
      <button
        type="button"
        className="heading-drop-target"
        onClick={() => { if (picked) place(picked); else onFocusQuestion?.(); }}
        aria-label={placed
          ? `Question ${number}: heading ${placed.id}, ${placed.text}.${picked ? " Press to replace it with the picked heading." : ""}`
          : `Question ${number}: no heading yet.${picked ? " Press to place the picked heading here." : " Pick a heading from the list first."}`}
      >
        <span className="exam-qnum" aria-hidden="true">{number}</span>
        {placed
          ? <span><b>{placed.id}</b> {placed.text}</span>
          : <span className="opacity-70">{picked ? "Tap to place the heading here" : "Drop a heading here"}</span>}
      </button>
      {placed && (
        <button type="button" className="exam-btn heading-drop-clear" onClick={onClear} aria-label={`Remove the heading from question ${number}`}>
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
