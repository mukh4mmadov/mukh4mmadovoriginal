"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_EXAM_SETTINGS, isDarkScheme, readExamSettings, writeExamSettings } from "@/lib/exam/exam-settings.mjs";

/**
 * Exam text size and colours, remembered in this browser. While an exam
 * screen is open the page uses the light theme for "black on white" and the
 * dark theme for the black-background schemes; the learner's own site theme
 * is put back when the exam screen closes.
 */
export function useExamSettings() {
  const [settings, setSettings] = useState({ ...DEFAULT_EXAM_SETTINGS });

  useEffect(() => {
    setSettings(readExamSettings(window.localStorage));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    const previousScheme = root.style.colorScheme;
    return () => {
      root.classList.toggle("dark", wasDark);
      root.style.colorScheme = previousScheme;
    };
  }, []);

  useEffect(() => {
    const dark = isDarkScheme(settings.scheme);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [settings.scheme]);

  const updateSettings = useCallback((changes) => {
    setSettings((current) => {
      const next = { ...current, ...changes };
      writeExamSettings(window.localStorage, next);
      return next;
    });
  }, []);

  return [settings, updateSettings];
}
