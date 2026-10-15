"use client";
import { useRef } from "react";
import { DEFAULT_PALETTE } from "@/data/eras";
import { usePalette } from "./usePalette";

export default function PaletteSection({ palette = DEFAULT_PALETTE, children, ...props }) {
  const ref = useRef(null);
  usePalette(ref, palette);
  return (
    <section ref={ref} {...props}>
      {children}
    </section>
  );
}
