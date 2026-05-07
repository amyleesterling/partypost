"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ThanksView() {
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const accent = (styles.getPropertyValue("--accent") || "#E94F8A").trim();
    const secondary = (styles.getPropertyValue("--secondary") || "#FFD166").trim();
    const colors = [accent, secondary, "#ffffff"];

    const end = Date.now() + 1200;
    function frame() {
      confetti({
        particleCount: 4,
        startVelocity: 35,
        spread: 70,
        ticks: 200,
        origin: { x: Math.random(), y: -0.05 },
        colors,
        scalar: 0.9,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }
    frame();

    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.3 },
      colors,
    });
  }, []);

  return null;
}
