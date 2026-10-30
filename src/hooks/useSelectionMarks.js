"use client";

import { useCallback, useEffect, useState } from "react";

const MARK_CLASS = "lis-mark";

// Wraps the text a range covers in <mark> elements (one per text node), so
// the selection can span words, lines and table cells. Form controls are
// left alone.
function wrapRange(range, attributes) {
  const container = range.commonAncestorContainer;
  const root = container.nodeType === Node.ELEMENT_NODE ? container : container.parentNode;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (range.intersectsNode(node) && node.textContent.trim() && !node.parentElement.closest("input, select, textarea, option, .lis-mark")
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_REJECT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const marks = [];
  for (const node of nodes) {
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.length;
    if (start >= end) continue;
    if (end < node.length) node.splitText(end);
    const target = start > 0 ? node.splitText(start) : node;
    const mark = document.createElement("mark");
    mark.className = MARK_CLASS;
    Object.entries(attributes).forEach(([name, value]) => mark.setAttribute(name, value));
    target.parentNode.insertBefore(mark, target);
    mark.appendChild(target);
    marks.push(mark);
  }
  return marks;
}

function unwrap(mark) {
  const parent = mark.parentNode;
  while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
  parent.removeChild(mark);
  parent.normalize();
}

/**
 * Highlight and note text inside `containerRef` (the Listening questions).
 * Marks live in the page for this attempt; notes are listed so the learner
 * can jump back to them.
 */
export function useSelectionMarks(containerRef, enabled = true) {
  const [menu, setMenu] = useState(null);
  const [notes, setNotes] = useState([]);

  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return undefined;
    const show = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) { setMenu(null); return; }
      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) { setMenu(null); return; }
      if (range.startContainer.parentElement?.closest("input, select, textarea")) return;
      const rect = range.getBoundingClientRect();
      const text = selection.toString().replace(/\s+/g, " ").trim();
      if (!text) { setMenu(null); return; }
      setMenu({
        range: range.cloneRange(),
        text: text.slice(0, 160),
        insideMark: Boolean(range.startContainer.parentElement?.closest(`.${MARK_CLASS}`) || range.cloneContents().querySelector?.(`.${MARK_CLASS}`)),
        x: Math.min(window.innerWidth - 16, Math.max(16, rect.left + rect.width / 2)),
        y: Math.max(8, rect.top - 8),
        writing: false,
      });
    };
    const onPointerUp = () => window.setTimeout(show, 0);
    const onKeyUp = (event) => { if (event.shiftKey) show(); };
    container.addEventListener("mouseup", onPointerUp);
    container.addEventListener("touchend", onPointerUp);
    container.addEventListener("keyup", onKeyUp);
    return () => {
      container.removeEventListener("mouseup", onPointerUp);
      container.removeEventListener("touchend", onPointerUp);
      container.removeEventListener("keyup", onKeyUp);
    };
  }, [containerRef, enabled]);

  const highlight = useCallback(() => {
    if (!menu) return;
    wrapRange(menu.range, { "data-kind": "highlight" });
    window.getSelection()?.removeAllRanges();
    setMenu(null);
  }, [menu]);

  const addNote = useCallback((text) => {
    if (!menu || !text.trim()) return;
    const id = `note-${Date.now().toString(36)}`;
    wrapRange(menu.range, { "data-kind": "note", "data-note": id, title: text.trim() });
    setNotes((current) => [...current, { id, quote: menu.text, text: text.trim() }]);
    window.getSelection()?.removeAllRanges();
    setMenu(null);
  }, [menu]);

  const clear = useCallback(() => {
    if (!menu) return;
    const container = containerRef.current;
    const marks = [...container.querySelectorAll(`.${MARK_CLASS}`)].filter((mark) => menu.range.intersectsNode(mark));
    const removedNotes = new Set(marks.map((mark) => mark.getAttribute("data-note")).filter(Boolean));
    marks.forEach(unwrap);
    if (removedNotes.size) setNotes((current) => current.filter((note) => !removedNotes.has(note.id)));
    window.getSelection()?.removeAllRanges();
    setMenu(null);
  }, [menu, containerRef]);

  const removeNote = useCallback((id) => {
    containerRef.current?.querySelectorAll(`[data-note="${id}"]`).forEach(unwrap);
    setNotes((current) => current.filter((note) => note.id !== id));
  }, [containerRef]);

  return { menu, setMenu, close, highlight, addNote, clear, notes, removeNote };
}
