import { useEffect, useRef } from "react";

export function useModalAccessibility(isOpen, onClose, initialFocusRef, returnFocusRef) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement;
    const getDialog = () => {
      const scopedDialog = dialogRef.current;
      if (scopedDialog?.getClientRects().length) return scopedDialog;
      const scope = scopedDialog?.dataset.modalFocusScope;
      const candidates = scope
        ? document.querySelectorAll(`[data-modal-focus-scope="${scope}"]`)
        : document.querySelectorAll('[data-modal-focus-scope]');
      return Array.from(candidates).find((element) => element.getClientRects().length > 0);
    };
    const dialog = getDialog();
    const initialTarget =
      initialFocusRef?.current?.getClientRects().length > 0
        ? initialFocusRef.current
        : dialog?.querySelector(
            'textarea:not([disabled]), input:not([disabled]), button:not([disabled])',
          ) || dialog;
    initialTarget?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
        return;
      }

      const activeDialog = getDialog();
      if (event.key !== "Tab" || !activeDialog) return;

      const focusable = Array.from(
        activeDialog.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        activeDialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!activeDialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const focusTarget = returnFocusRef?.current || previousFocus;
      if (focusTarget instanceof HTMLElement && focusTarget.isConnected) {
        focusTarget.focus();
      }
    };
  }, [isOpen, initialFocusRef, returnFocusRef]);

  return dialogRef;
}
