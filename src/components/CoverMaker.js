"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { COVER_CATEGORIES, COVER_FORMATS, DEFAULT_SHADE, SECTION_SHADES, coverUrl, sectionShade } from "@/data/blogCovers";
import { COVER_ICONS, COVER_ICON_GROUPS } from "@/data/coverIcons";

const label = "text-xs uppercase tracking-[0.2em] text-white/50";
const chip = (on) => `rounded-full px-3 py-1.5 text-xs font-semibold ${on ? "bg-white text-black" : "border border-white/15 text-white/70"}`;

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

// The picture as /blog/cover draws it, built in the page so it changes as you
// type and click. Sizes match the route: icon 17% of the short side (15% with
// words), words 9% (7% when long), in Anton.
function CoverPreview({ width, height, background, icon, text }) {
  const side = Math.min(width, height);
  const pct = (px) => `${(px / width) * 100}cqw`;
  return (
    <div className="flex h-full w-full shrink-0 flex-col items-center justify-center [container-type:inline-size]" style={{ background }}>
      <Icon name={icon} strokeWidth={1.15} className="text-white" style={{ width: pct(side * (text ? 0.15 : 0.17)), height: pct(side * (text ? 0.15 : 0.17)) }} />
      {text && (
        <p
          className="max-w-[80%] text-center font-display uppercase text-white"
          style={{ marginTop: pct(side * 0.05), fontSize: pct(side * (text.length > 18 ? 0.07 : 0.09)), lineHeight: 1.05, letterSpacing: pct(2) }}
        >
          {text}
        </p>
      )}
    </div>
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
                  <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
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

// Blog covers and section images in the style of Russ's single art: a flat
// category color with one white icon. Posts without a featured image get
// their category's cover on their own; this is for picking an icon, making
// section images, and Pinterest sizes.
export default function CoverMaker() {
  const [category, setCategory] = useState(COVER_CATEGORIES[1].slug);
  const [variant, setVariant] = useState("cover");
  const [icon, setIcon] = useState(null);
  const [text, setText] = useState("");
  const [format, setFormat] = useState("wide");
  const [shade, setShade] = useState(DEFAULT_SHADE);
  const [status, setStatus] = useState(null);

  const cat = COVER_CATEGORIES.find((c) => c.slug === category);
  const chosenIcon = icon ?? cat.icon;
  const words = variant === "section" ? text.replace(/\s+/g, " ").trim().slice(0, 40) : "";
  const src = coverUrl({ category, icon: chosenIcon, text: words, variant, format, shade });
  const background = variant === "section" ? sectionShade(cat.color, shade) : cat.color;
  const { width, height } = COVER_FORMATS[format];
  const name = `russ-${category}-${variant}-${chosenIcon}${text ? `-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : ""}.png`;

  const download = async () => {
    setStatus("working");
    try {
      const blob = await (await fetch(src)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      setStatus(null);
    } catch {
      setStatus("failed");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(src, window.location.origin).href);
      setStatus("copied");
      setTimeout(() => setStatus(null), 2000);
    } catch {}
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Blog covers</h2>

      <p className={label}>Category</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {COVER_CATEGORIES.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => {
              setCategory(c.slug);
              setIcon(null);
            }}
            aria-pressed={category === c.slug}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${category === c.slug ? "bg-white text-black" : "border border-white/15 text-white/70"}`}
          >
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden="true" />
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <p className={label}>Kind</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setVariant("cover")} aria-pressed={variant === "cover"} className={chip(variant === "cover")}>
              Cover
            </button>
            <button type="button" onClick={() => setVariant("section")} aria-pressed={variant === "section"} className={chip(variant === "section")}>
              Section image
            </button>
          </div>
        </div>
        <div>
          <p className={label}>Size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(COVER_FORMATS).map(([key, f]) => (
              <button key={key} type="button" onClick={() => setFormat(key)} aria-pressed={format === key} className={chip(format === key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {variant === "section" && (
        <div className="mt-5">
          <p className={label}>Shade of {cat.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(SECTION_SHADES).map(([key, s]) => (
              <button key={key} type="button" onClick={() => setShade(key)} aria-pressed={shade === key} className={`flex items-center gap-2 ${chip(shade === key)}`}>
                <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/20" style={{ background: sectionShade(cat.color, key) }} aria-hidden="true" />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {variant === "section" && (
        <label className="mt-5 block">
          <span className={label}>Words under the icon (optional)</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={40}
            placeholder="Step 1"
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2.5 text-base text-white placeholder:text-white/30 [color-scheme:dark]"
          />
        </label>
      )}

      <p className={`${label} mt-5`}>Icon</p>
      <IconPicker value={chosenIcon} onChange={setIcon} color={background} />

      <div
        className="mt-5 overflow-hidden rounded-xl"
        style={{
          aspectRatio: `${width} / ${height}`,
          background,
          maxWidth: format === "pin" ? "16rem" : undefined,
        }}
      >
        <CoverPreview width={width} height={height} background={background} icon={chosenIcon} text={words} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          disabled={status === "working"}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
        >
          {status === "working" ? "Getting it..." : "Download PNG"}
        </button>
        <button type="button" onClick={copy} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold">
          {status === "copied" ? "Link copied" : "Copy image link"}
        </button>
      </div>
      {status === "failed" && <p className="mt-2 text-sm text-red-400">Couldn&apos;t get the picture. Try again.</p>}

      <p className="mt-4 text-sm leading-relaxed text-white/50">
        Posts without a featured image get their category&apos;s cover on their own. In Handoff Hero, set the post&apos;s category to one of the names
        above, and add the tag <code className="text-white/70">icon-{chosenIcon}</code> to use this icon instead of the category&apos;s.
      </p>
    </section>
  );
}
