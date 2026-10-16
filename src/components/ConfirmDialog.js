"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";

const noop = () => () => {};

// The site's own "Are you sure?" box, in place of the browser's confirm().
// A bottom sheet on phones, a centered card from sm up. Escape or a tap on
// the backdrop cancels; the cancel button gets focus so Enter is safe.
export default function ConfirmDialog({ open, title, body, confirmLabel = "Yes", cancelLabel = "Cancel", danger = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  // True in the browser, false while rendering on the server.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.__lenis?.stop?.();
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => cancelRef.current?.focus({ preventScroll: true }));
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      window.__lenis?.start?.();
      before?.focus?.({ preventScroll: true });
    };
  }, [open, onCancel]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          key="confirm"
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
          <m.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={body ? "confirm-body" : undefined}
            className="w-full max-w-sm rounded-3xl border border-era-fg/10 bg-era-bg p-6 text-era-fg shadow-2xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <h2 id="confirm-title" className="font-display text-3xl uppercase leading-none">
              {title}
            </h2>
            {body && (
              <p id="confirm-body" className="mt-3 text-sm leading-relaxed text-era-muted">
                {body}
              </p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="rounded-full border border-era-fg/20 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-era-fg/[0.07]"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-transform hover:scale-[1.02] ${
                  danger ? "bg-red-600 text-white" : "bg-era-accent text-era-bg"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
