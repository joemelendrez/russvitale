import { ViewTransition } from "react";

// Remounts on every in-app navigation (next/link), so the page fades and
// lifts in with the same classes the full-page-load transition uses
// (see "Page transitions" in globals.css).
export default function Template({ children }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
