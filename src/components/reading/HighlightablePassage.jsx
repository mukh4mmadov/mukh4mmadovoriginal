"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookmarkCheck,
  BookmarkPlus,
  Eraser,
  Highlighter,
  MessageSquarePlus,
  NotebookPen,
  Trash2,
  Palette,
  X,
} from "lucide-react";
import {
  HIGHLIGHT_COLORS,
  HIGHLIGHT_COLOR,
  fontSizeMap,
  tokenize,
} from "@/lib/highlightConstants";
import { selectedTokenKeys } from "@/hooks/useTextHighlight";
import { useModalAccessibility } from "@/hooks/useModalAccessibility";
import { cleanTerm, termId } from "@/lib/vocabulary/vocabulary-notebook.mjs";
import { makeNote, notedTokens, readNotes, sortNotes, writeNotes } from "@/lib/reading/passage-notes.mjs";

const HIGH_CONTRAST_HIGHLIGHTS = {
  yellow: "#fef08a",
  green: "#86efac",
  blue: "#93c5fd",
};

const paragraphKeyFor = (paragraph, index) => (paragraph.label ? `${paragraph.label}-${index}` : `paragraph-${index}`);

// Keeps a floating box inside the window.
function clampPosition(x, y, width = 300, height = 60) {
  const maxX = window.innerWidth - width - 8;
  const maxY = window.innerHeight - height - 8;
  return { x: Math.max(8, Math.min(x, maxX)), y: Math.max(8, Math.min(y, maxY)) };
}

/**
 * The reading passage with highlighting. Selecting text (or right-clicking a
 * selection) opens a small menu like the real exam's: highlight in three
 * colours, clear, add a private note, or save the word. Notes are kept per
 * passage when notesKey is given. renderBeforeParagraph lets the exam put
 * drop boxes for Matching Headings above paragraphs.
 */
export default function HighlightablePassage({
  paragraphs,
  fontSize = "medium",
  highlightState,
  highContrastHighlights = false,
  onSaveWord,
  savedTermIds,
  notesKey,
  renderBeforeParagraph,
}) {
  // The word or short phrase the learner last selected, offered for saving.
  const [pick, setPick] = useState(null);
  const [menu, setMenu] = useState(null);
  const [noteDraft, setNoteDraft] = useState(null);
  const [openNote, setOpenNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const menuRef = useRef(null);
  const containerRef = useRef(null);
  const noteDialogRef = useModalAccessibility(Boolean(noteDraft), () => setNoteDraft(null));

  const {
    highlights,
    eraseMode,
    toggleEraseMode,
    clearAll,
    totalHighlights,
    applyToTokens,
    handleDoubleClick,
    toggleToken,
    selectedColor,
    setSelectedColor,
  } = highlightState;

  useEffect(() => {
    if (!notesKey) return;
    setNotes(readNotes(window.localStorage, notesKey));
  }, [notesKey]);

  // Alt+H highlights the current selection in the chosen colour.
  useEffect(() => {
    const onKey = (event) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.code !== "KeyH") return;
      for (const element of containerRef.current?.querySelectorAll("p[data-paragraph-key]") || []) {
        const keys = selectedTokenKeys(element);
        if (keys.length === 0) continue;
        event.preventDefault();
        applyToTokens(element.dataset.paragraphKey, keys, [], eraseMode ? { erase: true } : {});
        setMenu(null);
        window.getSelection()?.removeAllRanges();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyToTokens, eraseMode]);

  const saveNotes = (next) => {
    setNotes(next);
    if (notesKey) writeNotes(window.localStorage, notesKey, next);
  };

  const tokenOrder = useMemo(() => paragraphs.flatMap((paragraph, index) => {
    const key = paragraphKeyFor(paragraph, index);
    return tokenize(paragraph.text).map((_, tokenIndex) => `${key}-${tokenIndex}`);
  }), [paragraphs]);
  const noted = useMemo(() => notedTokens(notes), [notes]);
  const orderedNotes = useMemo(() => sortNotes(notes, tokenOrder), [notes, tokenOrder]);

  const rememberPick = (text, paragraphText) => {
    if (!onSaveWord) return;
    const term = cleanTerm(text);
    if (term) setPick({ term, paragraphText });
  };
  const pickSaved = pick ? savedTermIds?.has(termId(pick.term)) : false;

  // Close the menu or a note on outside click / Escape.
  useEffect(() => {
    if (!menu && !openNote) return undefined;
    const onPointer = (event) => { if (!menuRef.current?.contains(event.target)) { setMenu(null); setOpenNote(null); } };
    const onKey = (event) => { if (event.key === "Escape") { setMenu(null); setOpenNote(null); } };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu, openNote]);

  const openMenuForSelection = (paragraphKey, paragraphText, element) => {
    const tokenKeys = selectedTokenKeys(element);
    if (tokenKeys.length === 0) return false;
    const selection = window.getSelection();
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const text = selection.toString();
    rememberPick(text, paragraphText);
    setOpenNote(null);
    setMenu({
      ...clampPosition(rect.left, rect.bottom + 8, 320, 56),
      paragraphKey,
      paragraphText,
      tokenKeys,
      texts: tokenKeys.map((key) => element.querySelector(`[data-token-key="${key}"]`)?.textContent?.trim() || ""),
      text,
    });
    return true;
  };

  const applyHighlight = (options) => {
    if (!menu) return;
    applyToTokens(menu.paragraphKey, menu.tokenKeys, menu.texts, options);
    if (options.color) setSelectedColor(options.color);
    setMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  const startNote = () => {
    if (!menu) return;
    setNoteDraft({ ...menu, value: "" });
    setMenu(null);
  };

  const saveNote = () => {
    const note = makeNote({ paragraphKey: noteDraft.paragraphKey, tokenKeys: noteDraft.tokenKeys, quote: noteDraft.text, text: noteDraft.value });
    if (note) saveNotes([...notes, note]);
    setNoteDraft(null);
    window.getSelection()?.removeAllRanges();
  };

  const goToNote = (note) => {
    const element = containerRef.current?.querySelector(`[data-token-key="${note.tokenKeys[0]}"]`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("passage-note-flash");
    window.setTimeout(() => element.classList.remove("passage-note-flash"), 1600);
  };

  const term = menu ? cleanTerm(menu.text) : "";
  const menuTermSaved = term ? savedTermIds?.has(termId(term)) : false;

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-slate-400" />
          <div className="flex gap-1">
            {Object.entries(HIGHLIGHT_COLORS).map(([colorName, colorValue]) => (
              <button
                key={colorName}
                type="button"
                onClick={() => setSelectedColor(colorName)}
                className={`min-h-11 min-w-11 rounded-full border-2 transition-all ${
                  selectedColor === colorName
                    ? "border-white scale-110"
                    : "border-transparent hover:border-white/50"
                }`}
                style={{ backgroundColor: highContrastHighlights ? HIGH_CONTRAST_HIGHLIGHTS[colorName] : colorValue }}
                aria-label={`Select ${colorName} highlight color`}
                aria-pressed={selectedColor === colorName}
                title={`Select ${colorName} highlight`}
              />
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-white/10" />

        <button
          type="button"
          onClick={toggleEraseMode}
          className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            eraseMode
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-slate-100"
          }`}
          title={eraseMode ? "Exit eraser mode" : "Enable eraser mode"}
          aria-label={eraseMode ? "Exit eraser mode" : "Enable eraser mode"}
          aria-pressed={eraseMode}
        >
          <Eraser size={12} />
          {eraseMode ? "Erasing" : "Eraser"}
        </button>

        <button
          type="button"
          onClick={clearAll}
          disabled={totalHighlights === 0}
          className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            totalHighlights === 0
              ? highContrastHighlights
                ? "cursor-not-allowed border-slate-500 bg-slate-700 text-slate-100"
                : "cursor-not-allowed opacity-60"
              : "border-white/10 bg-white/5 text-slate-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
          }`}
          title="Clear all highlights"
          aria-label="Clear all highlights"
        >
          <Trash2 size={12} />
          Clear all
        </button>

        {notesKey && (
          <button
            type="button"
            onClick={() => setNotesOpen((value) => !value)}
            aria-expanded={notesOpen}
            aria-controls="passage-notes-list"
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:border-white/20 hover:text-slate-100"
            title="Your notes on this passage"
          >
            <NotebookPen size={12} aria-hidden="true" />
            Notes ({notes.length})
          </button>
        )}

        {onSaveWord && (
          <>
            <div className="w-px h-6 bg-white/10" />
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick && !pickSaved && onSaveWord(pick)}
              disabled={!pick || pickSaved}
              className={`flex min-h-11 max-w-[14rem] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                pickSaved
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : pick
                    ? "border-brand-500/40 bg-brand-500/10 text-brand-200 hover:bg-brand-500/20"
                    : "cursor-not-allowed border-white/10 bg-white/5 text-slate-400 opacity-70"
              }`}
              title={pick ? `Save "${pick.term}" to your vocabulary notebook` : "Select or double-click a word in the passage to save it"}
            >
              {pickSaved ? <BookmarkCheck size={12} aria-hidden="true" /> : <BookmarkPlus size={12} aria-hidden="true" />}
              <span className="truncate">{pick ? (pickSaved ? `Saved "${pick.term}"` : `Save "${pick.term}"`) : "Save word"}</span>
            </button>
          </>
        )}

        {totalHighlights > 0 && (
          <span className="text-xs text-slate-500">
            {totalHighlights} highlight{totalHighlights !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {notesKey && notesOpen && (
        <section id="passage-notes-list" className="passage-notes" aria-label="Your notes">
          {orderedNotes.length === 0 ? (
            <p className="text-sm">No notes yet. Select words in the passage and choose <b>Note</b>.</p>
          ) : (
            <ul className="space-y-2">
              {orderedNotes.map((note) => (
                <li key={note.id} className="passage-note-item">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => goToNote(note)} title="Show in the passage">
                    <span className="block truncate text-xs italic opacity-80">“{note.quote}”</span>
                    <span className="block text-sm">{note.text}</span>
                  </button>
                  <button type="button" className="exam-btn" onClick={() => saveNotes(notes.filter((item) => item.id !== note.id))} aria-label={`Delete note: ${note.text}`}>
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div
        className={`overflow-x-hidden text-slate-200 ${fontSizeMap[fontSize] ?? ""}`}
        style={{
          fontFamily: "var(--font-display)",
          lineHeight: 1.9,
          letterSpacing: "0.01em",
        }}
      >
        {paragraphs.map((p, paragraphIndex) => {
          const paragraphKey = paragraphKeyFor(p, paragraphIndex);
          const paragraphHighlights = highlights[paragraphKey] || {};
          const tokens = tokenize(p.text);
          const firstWordIndex = tokens.findIndex((token) => !/^\s+$/.test(token));
          const onSelectionEnd = (event) => {
            if (eraseMode) {
              // In eraser mode a selection clears straight away, as before.
              applyToTokens(paragraphKey, selectedTokenKeys(event.currentTarget), [], { erase: true });
              return;
            }
            openMenuForSelection(paragraphKey, p.text, event.currentTarget);
          };

          return (
            <div key={paragraphKey}>
              {renderBeforeParagraph?.(p, paragraphIndex)}
              <p
                data-paragraph-key={paragraphKey}
                className="mb-6 overflow-wrap-anywhere break-words last:mb-0"
                onMouseUp={onSelectionEnd}
                onTouchEnd={onSelectionEnd}
                onKeyUp={(event) => { if (event.shiftKey) onSelectionEnd(event); }}
                onContextMenu={(event) => {
                  if (openMenuForSelection(paragraphKey, p.text, event.currentTarget)) event.preventDefault();
                }}
              >
                <span className="mr-3 inline-block font-semibold uppercase tracking-[0.2em] text-brand-400/90">
                  {p.label}
                </span>
                {tokens.map((tok, i) => {
                  if (/^\s+$/.test(tok)) {
                    return <span key={`${paragraphKey}-${i}`}>{tok}</span>;
                  }

                  const tokenKey = `${paragraphKey}-${i}`;
                  const highlightColor = paragraphHighlights[tokenKey];
                  const noteId = noted.get(tokenKey);

                  return (
                    <span
                      key={tokenKey}
                      data-token-key={tokenKey}
                      role="button"
                      aria-pressed={Boolean(highlightColor)}
                      aria-label={`Passage word ${tok.trim()}${noteId ? ", has a note" : ""}; press Enter or Space to toggle highlight`}
                      tabIndex={i === firstWordIndex ? 0 : -1}
                      onClick={(event) => {
                        if (!noteId || window.getSelection()?.toString()) return;
                        const rect = event.currentTarget.getBoundingClientRect();
                        setMenu(null);
                        setOpenNote({ id: noteId, ...clampPosition(rect.left, rect.bottom + 8, 300, 120) });
                      }}
                      onDoubleClick={() => {
                        rememberPick(tok, p.text);
                        handleDoubleClick(tokenKey, paragraphKey, tok.trim());
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleToken(tokenKey, paragraphKey, tok.trim());
                          return;
                        }

                        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                          e.preventDefault();
                          const tokensInParagraph = Array.from(
                            e.currentTarget.parentElement.querySelectorAll("[data-token-key]"),
                          );
                          const currentIndex = tokensInParagraph.indexOf(e.currentTarget);
                          const nextIndex = Math.max(
                            0,
                            Math.min(
                              tokensInParagraph.length - 1,
                              currentIndex + (e.key === "ArrowRight" ? 1 : -1),
                            ),
                          );
                          tokensInParagraph[nextIndex]?.focus();
                        }
                      }}
                      style={
                        highlightColor
                          ? {
                              backgroundColor: highContrastHighlights
                                ? HIGH_CONTRAST_HIGHLIGHTS[highlightColor] || HIGH_CONTRAST_HIGHLIGHTS.yellow
                                : HIGHLIGHT_COLORS[highlightColor] || HIGHLIGHT_COLOR,
                              ...(highContrastHighlights ? { color: "#0f172a" } : {}),
                              borderRadius: 3,
                            }
                          : undefined
                      }
                      className={`cursor-text transition-colors duration-200 outline-none focus:ring-2 focus:ring-brand-500/50 focus:rounded${noteId ? " passage-noted" : ""}`}
                    >
                      {tok}
                    </span>
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>

      {menu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Selected text"
          className="passage-menu"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <Highlighter size={16} aria-hidden="true" className="mx-1 opacity-70" />
          {Object.entries(HIGHLIGHT_COLORS).map(([colorName, colorValue]) => (
            <button
              key={colorName}
              type="button"
              role="menuitem"
              className="passage-menu-swatch"
              style={{ backgroundColor: highContrastHighlights ? HIGH_CONTRAST_HIGHLIGHTS[colorName] : colorValue }}
              aria-label={`Highlight in ${colorName}`}
              onClick={() => applyHighlight({ color: colorName })}
            />
          ))}
          <button type="button" role="menuitem" className="exam-btn" onClick={() => applyHighlight({ erase: true })} aria-label="Clear highlight"><Eraser size={14} aria-hidden="true" /><span>Clear</span></button>
          {notesKey && <button type="button" role="menuitem" className="exam-btn" onClick={startNote}><MessageSquarePlus size={14} aria-hidden="true" /><span>Note</span></button>}
          {onSaveWord && term && (
            <button
              type="button"
              role="menuitem"
              className="exam-btn"
              disabled={menuTermSaved}
              onClick={() => { onSaveWord({ term, paragraphText: menu.paragraphText }); setMenu(null); }}
            >
              {menuTermSaved ? <BookmarkCheck size={14} aria-hidden="true" /> : <BookmarkPlus size={14} aria-hidden="true" />}
              <span>{menuTermSaved ? "Saved" : "Save word"}</span>
            </button>
          )}
        </div>
      )}

      {openNote && (() => {
        const note = notes.find((item) => item.id === openNote.id);
        if (!note) return null;
        return (
          <div ref={menuRef} role="dialog" aria-label="Note" className="passage-menu passage-note-pop" style={{ left: openNote.x, top: openNote.y }}>
            <p className="text-sm">{note.text}</p>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className="exam-btn" onClick={() => { saveNotes(notes.filter((item) => item.id !== note.id)); setOpenNote(null); }}><Trash2 size={14} aria-hidden="true" /> Delete</button>
              <button type="button" className="exam-btn" onClick={() => setOpenNote(null)} aria-label="Close note"><X size={14} aria-hidden="true" /></button>
            </div>
          </div>
        );
      })()}

      {noteDraft && (
        <div className="exam-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setNoteDraft(null); }}>
          <section ref={noteDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="note-dialog-title" className="exam-dialog">
            <h2 id="note-dialog-title">Add a note</h2>
            <p className="mb-2 text-sm italic opacity-80">“{noteDraft.text.trim().slice(0, 200)}”</p>
            <label className="block">
              <span className="sr-only">Your note</span>
              <textarea
                rows={4}
                maxLength={500}
                value={noteDraft.value}
                onChange={(event) => setNoteDraft((draft) => ({ ...draft, value: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) saveNote();
                }}
                placeholder="e.g. paraphrase of Q5, or a word to check"
                className="exam-input w-full"
                style={{ width: "100%", minHeight: "6rem" }}
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="exam-btn" onClick={() => setNoteDraft(null)}>Cancel</button>
              <button type="button" className="exam-btn exam-btn-primary" onClick={saveNote} disabled={!noteDraft.value.trim()}>Save note</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
