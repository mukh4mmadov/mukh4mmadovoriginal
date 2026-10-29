"use client";

import { useEffect } from "react";

// Full-screen exam layout: covers the site menu and footer while it is open.
export default function ExamShell({ settings, children }) {
  useEffect(() => {
    document.body.classList.add("ielts-mock-active");
    return () => document.body.classList.remove("ielts-mock-active");
  }, []);

  return (
    <div className="exam-root" data-exam-scheme={settings.scheme} data-exam-text={settings.textSize}>
      {children}
    </div>
  );
}
