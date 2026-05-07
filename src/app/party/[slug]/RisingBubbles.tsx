"use client";

import { useMemo } from "react";

interface Bubble {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 10000) / 10000;
  };
}

export function RisingBubbles({
  count = 18,
  seed = 7,
}: {
  count?: number;
  seed?: number;
}) {
  const bubbles = useMemo<Bubble[]>(() => {
    const r = rng(seed * 31 + count);
    return Array.from({ length: count }).map(() => ({
      left: r() * 100,
      size: 5 + r() * 16,
      duration: 11 + r() * 12,
      // negative delay so they're already mid-flight on first paint
      delay: -r() * 22,
      drift: -30 + r() * 60,
      opacity: 0.18 + r() * 0.22,
    }));
  }, [count, seed]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="pp-bubble absolute block rounded-full bg-white"
          style={{
            left: `${b.left}%`,
            bottom: `-30px`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            opacity: b.opacity,
            animation: `pp-rise ${b.duration}s linear ${b.delay}s infinite`,
            ["--pp-bubble-drift" as string]: `${b.drift}px`,
            boxShadow:
              "inset 0 1px 1px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.4)",
          }}
        />
      ))}
    </div>
  );
}
