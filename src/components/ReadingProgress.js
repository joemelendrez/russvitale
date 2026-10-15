"use client";
import { useEffect, useState } from "react";

// A thin accent bar along the top that fills as you read the article.
export default function ReadingProgress({ targetId }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, height } = el.getBoundingClientRect();
      const total = height - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -top / total)) : 1);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);
  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-[3px]" aria-hidden="true">
      <div className="h-full origin-left bg-era-accent" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
