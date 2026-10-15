"use client";
import { useEffect } from "react";
import { DEFAULT_PALETTE } from "@/data/eras";
import { applyPalette } from "./usePalette";

// Coming from the timeline, the page may still be in an era's colors.
export default function DefaultPalette() {
  useEffect(() => applyPalette(DEFAULT_PALETTE), []);
  return null;
}
