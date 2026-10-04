export const OPEN_HELP_EVENT = "app:open-help";

export function requestHelpDialog(trigger, defaults = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_HELP_EVENT, { detail: { trigger, defaults } }));
}
