"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { COVER_ICONS, COVER_ICON_GROUPS } from "@/data/coverIcons";

function Icon({ name, className, strokeWidth = 1.5, style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      style={style}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      // Fixed icon data from src/data/coverIcons.js, never user input.
      dangerouslySetInnerHTML={{ __html: COVER_ICONS[name] }}
    />
  );
}

// A button showing the chosen icon that opens a searchable, grouped list.
export function IconPicker({ value, onChange, color }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const q = query.trim().toLowerCase().replace(/\s+/g, "-");
  const groups = useMemo(
    () =>
      q
        ? [{ label: "Results", names: Object.keys(COVER_ICONS).filter((n) => n.includes(q)) }]
        : COVER_ICON_GROUPS.filter((g) => g.names.length),
    [q]
  );

  return (
    <div ref={ref} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-left text-sm"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-white" style={{ background: color }}>
          <Icon name={value} className="h-5 w-5 shrink-0" />
        </span>
        <span className="flex-1">{value.replace(/-/g, " ")}</span>
        <span className="text-white/50" aria-hidden="true">
          &#9662;
        </span>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-xl border border-white/15 bg-neutral-900 p-3 shadow-2xl">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${Object.keys(COVER_ICONS).length} icons`}
            className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-base text-white placeholder:text-white/30 [color-scheme:dark]"
          />
          <div className="mt-3 max-h-80 space-y-4 overflow-y-auto overscroll-contain pr-1" data-lenis-prevent>
            {groups.map((g) => (
              <div key={g.label}>
                <p className="mb-1.5 text-[11px] uppercase tracking-[0.2em] text-white/40">{g.label}</p>
                {g.names.length === 0 ? (
                  <p className="text-sm text-white/50">No icon by that name.</p>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
                    {g.names.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          onChange(n);
                          setOpen(false);
                          setQuery("");
                        }}
                        aria-pressed={value === n}
                        aria-label={n}
                        title={n.replace(/-/g, " ")}
                        className="grid aspect-square place-items-center rounded-lg text-white"
                        style={{ background: value === n ? color : "rgba(255,255,255,0.06)" }}
                      >
                        <Icon name={n} className="h-5 w-5 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

