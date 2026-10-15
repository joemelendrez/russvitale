"use client";
import { useState } from "react";
import { COVER_CATEGORIES, COVER_FORMATS, ICON_NAMES, coverUrl, sectionShade } from "@/data/blogCovers";
import { COVER_ICONS } from "@/data/coverIcons";

const label = "text-xs uppercase tracking-[0.2em] text-white/50";
const chip = (on) => `rounded-full px-3 py-1.5 text-xs font-semibold ${on ? "bg-white text-black" : "border border-white/15 text-white/70"}`;

function Icon({ name, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      // Fixed icon data from src/data/coverIcons.js, never user input.
      dangerouslySetInnerHTML={{ __html: COVER_ICONS[name] }}
    />
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
  const [status, setStatus] = useState(null);

  const cat = COVER_CATEGORIES.find((c) => c.slug === category);
  const chosenIcon = icon ?? cat.icon;
  const src = coverUrl({ category, icon: chosenIcon, text: variant === "section" ? text : "", variant, format });
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
            <span className="h-3 w-3 rounded-full" style={{ background: c.color }} aria-hidden="true" />
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
      <div className="mt-2 grid grid-cols-8 gap-1.5 sm:grid-cols-12">
        {ICON_NAMES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setIcon(n)}
            aria-pressed={chosenIcon === n}
            aria-label={n}
            title={n}
            className="grid aspect-square place-items-center rounded-lg text-white"
            style={{ background: chosenIcon === n ? cat.color : "rgba(255,255,255,0.06)" }}
          >
            <Icon name={n} className="h-5 w-5" />
          </button>
        ))}
      </div>

      <div
        className="mt-5 overflow-hidden rounded-xl"
        style={{
          aspectRatio: `${width} / ${height}`,
          background: variant === "section" ? sectionShade(cat.color) : cat.color,
          maxWidth: format === "pin" ? "16rem" : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- drawn on request by /blog/cover */}
        <img key={src} src={src} alt={`${cat.name} ${variant} with the ${chosenIcon} icon`} className="h-full w-full" />
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
