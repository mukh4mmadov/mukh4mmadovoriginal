"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, EyeOff, HelpCircle, Settings } from "lucide-react";
import { COLOUR_SCHEMES, formatTimeLeft, TEXT_SIZES } from "@/lib/exam/exam-settings.mjs";

function Popover({ id, open, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!ref.current?.parentElement?.contains(event.target)) onClose();
    };
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return <div ref={ref} id={id} className="exam-popover" role="dialog" aria-label={id === "exam-settings" ? "Settings" : "Help"}>{children}</div>;
}

// Fixed sample colours, so each option previews itself whatever scheme is on.
const SCHEME_SAMPLE = {
  standard: { background: "#ffffff", color: "#111111" },
  inverse: { background: "#000000", color: "#ffffff" },
  yellow: { background: "#000000", color: "#ffe600" },
};

export const EXAM_SHORTCUTS = [
  ["Alt + →", "Next question"],
  ["Alt + ←", "Previous question"],
  ["Alt + F", "Flag or unflag the current question"],
  ["Alt + H", "Highlight the selected passage text"],
  ["Double-click", "Highlight one word"],
  ["?", "Show this help"],
];

/**
 * The exam's top bar: test name, time left, Settings, Help and the
 * page's own actions (Exit, Submit…), passed as children.
 */
export default function ExamTopBar({ title, subtitle, remainingSeconds, settings, onSettingsChange, helpText, children }) {
  const [openPanel, setOpenPanel] = useState(null);
  const close = () => setOpenPanel(null);
  const toggle = (panel) => setOpenPanel((current) => (current === panel ? null : panel));
  const urgent = remainingSeconds != null && remainingSeconds < 5 * 60;

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "?" && !/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName) && !event.target?.isContentEditable) {
        event.preventDefault();
        setOpenPanel("help");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="exam-topbar">
      <div className="exam-topbar-title">
        <p>{title}</p>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {remainingSeconds != null && (
        <div className="flex items-center gap-2">
          {settings.hideTimer && !urgent ? (
            <button type="button" className="exam-btn" onClick={() => onSettingsChange({ hideTimer: false })} aria-label="Show time left">
              <Clock size={16} aria-hidden="true" /><span className="exam-btn-label">Show time</span>
            </button>
          ) : (
            <p className="exam-timer" data-urgent={urgent} role="timer" aria-live={urgent ? "polite" : "off"}>
              <Clock size={16} aria-hidden="true" className="mr-1 inline-block align-[-2px]" />
              {formatTimeLeft(remainingSeconds)}
            </p>
          )}
          {!settings.hideTimer && !urgent && (
            <button type="button" className="exam-btn hidden sm:inline-flex" onClick={() => onSettingsChange({ hideTimer: true })} aria-label="Hide time left" title="Hide time left">
              <EyeOff size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative">
          <button type="button" className="exam-btn" aria-label="Settings" aria-expanded={openPanel === "settings"} aria-controls="exam-settings" onClick={() => toggle("settings")}>
            <Settings size={16} aria-hidden="true" /><span className="exam-btn-label">Settings</span>
          </button>
          <Popover id="exam-settings" open={openPanel === "settings"} onClose={close}>
            <h3>Text size</h3>
            <div className="exam-choice-row" role="group" aria-label="Text size">
              {TEXT_SIZES.map((size) => (
                <button key={size.id} type="button" className="exam-btn" aria-pressed={settings.textSize === size.id} onClick={() => onSettingsChange({ textSize: size.id })}>{size.label}</button>
              ))}
            </div>
            <h3>Colours</h3>
            <div className="exam-choice-row" role="group" aria-label="Colours">
              {COLOUR_SCHEMES.map((scheme) => (
                <button key={scheme.id} type="button" className="exam-btn" aria-pressed={settings.scheme === scheme.id} onClick={() => onSettingsChange({ scheme: scheme.id })}>
                  <span aria-hidden="true" className="exam-sample rounded-sm border border-neutral-500 px-1 text-xs font-bold" style={SCHEME_SAMPLE[scheme.id]}>Aa</span>
                  {scheme.label}
                </button>
              ))}
            </div>
            <h3>Time</h3>
            <div className="exam-choice-row">
              <button type="button" className="exam-btn" aria-pressed={settings.hideTimer} onClick={() => onSettingsChange({ hideTimer: !settings.hideTimer })}>Hide time left</button>
              <button type="button" className="exam-btn" aria-pressed={settings.timerWarnings} onClick={() => onSettingsChange({ timerWarnings: !settings.timerWarnings })}>Warn at 10 and 5 minutes</button>
            </div>
            <p className="text-xs" style={{ color: "var(--exam-muted)" }}>Your choices are remembered on this device.</p>
          </Popover>
        </div>

        <div className="relative">
          <button type="button" className="exam-btn" aria-label="Help" aria-expanded={openPanel === "help"} aria-controls="exam-help" onClick={() => toggle("help")}>
            <HelpCircle size={16} aria-hidden="true" /><span className="exam-btn-label">Help</span>
          </button>
          <Popover id="exam-help" open={openPanel === "help"} onClose={close}>
            {helpText && <p className="mb-3 text-sm leading-6">{helpText}</p>}
            <h3>Keyboard shortcuts</h3>
            <ul className="space-y-1 text-sm">
              {EXAM_SHORTCUTS.map(([keys, action]) => (
                <li key={keys} className="flex justify-between gap-3"><kbd className="font-mono font-bold">{keys}</kbd><span>{action}</span></li>
              ))}
            </ul>
          </Popover>
        </div>

        {children}
      </div>
    </header>
  );
}
