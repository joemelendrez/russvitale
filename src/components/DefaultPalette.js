"use client";
import { useEffect } from "react";
import { DEFAULT_PALETTE } from "@/data/eras";
import { applyPalette } from "./usePalette";

// Coming from the timeline, the page may still be in an era's colors, so a
// page sets its own (black unless it passes one).
export default function DefaultPalette({ palette = DEFAULT_PALETTE }) {
  useEffect(() => applyPalette(palette), [palette]);
  return null;
}
