"use client";

import { Flag } from "lucide-react";
import { requestHelpDialog } from "@/lib/help-dialog";

export default function ReportPassageIssueButton({ passageTitle, className = "" }) {
  const report = (event) => {
    requestHelpDialog(event.currentTarget, {
      category: "incorrect_answer",
      subject: `Reading content: ${passageTitle}`.slice(0, 200),
      body: `Please describe the issue you found in “${passageTitle}”.\n\nQuestion number (if relevant):\nWhat seems incorrect or unclear:\n\n`,
    });
  };

  return (
    <button
      type="button"
      onClick={report}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 ${className}`}
      aria-label={`Report an issue with ${passageTitle}`}
    >
      <Flag size={16} aria-hidden="true" />
      <span>Report issue</span>
    </button>
  );
}
