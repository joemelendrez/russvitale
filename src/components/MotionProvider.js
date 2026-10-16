"use client";
import { LazyMotion } from "framer-motion";

const loadFeatures = () => import("@/lib/motionFeatures").then((mod) => mod.default);

// Every animated element uses framer-motion's small `m` components; the
// animation features load here after the page is up.
export default function MotionProvider({ children }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
