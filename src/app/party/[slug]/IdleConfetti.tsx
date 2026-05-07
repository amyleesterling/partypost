"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

// Light ambient confetti — a small puff every ~25-40s from a random side.
// Kept low-density so it feels playful, not annoying.
export function IdleConfetti() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const styles = getComputedStyle(document.documentElement);
    const accent = (styles.getPropertyValue("--accent") || "#E94F8A").trim();
    const secondary = (styles.getPropertyValue("--secondary") || "#FFD166").trim();
    const colors = [accent, secondary, "#ffffff"];

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function puff() {
      if (cancelled) return;
      const fromLeft = Math.random() < 0.5;
      confetti({
        particleCount: 18,
        spread: 60,
        startVelocity: 30,
        ticks: 160,
        origin: { x: fromLeft ? 0 : 1, y: 0.7 + Math.random() * 0.2 },
        angle: fromLeft ? 60 : 120,
        colors,
        scalar: 0.7,
        gravity: 0.9,
      });
      schedule();
    }

    function schedule() {
      const ms = 22000 + Math.random() * 18000;
      timer = setTimeout(puff, ms);
    }

    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
