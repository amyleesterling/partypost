"use client";

import { useMemo } from "react";

const MOTIF_EMOJI: Record<string, string[]> = {
  default: ["🎉", "🎈", "✨", "🎂"],
  beach: ["🌊", "🐚", "🌴", "☀️", "🏖️", "⭐"],
  princess: ["👑", "🌸", "🦋", "💖", "✨"],
  woodland: ["🍄", "🦊", "🌿", "🌰", "🐿️"],
  space: ["🚀", "⭐", "🪐", "☄️", "🌙", "👽"],
  rainbow: ["🌈", "🎨", "✏️", "🌟", "💫"],
  science: ["🧪", "⚗️", "🔬", "💡", "⚡"],
  "garden-tea": ["🫖", "🌷", "🦋", "🌼", "🍪"],
  arcade: ["🕹️", "🎮", "🪙", "👾", "🎯"],
  dinosaur: ["🦖", "🌋", "🦕", "🌿", "🥚"],
};

interface Sprite {
  emoji: string;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  drift: number;
}

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 10000) / 10000;
  };
}

export function FloatingMotif({ themeKey, count = 14 }: { themeKey: string; count?: number }) {
  const sprites = useMemo<Sprite[]>(() => {
    const emoji = MOTIF_EMOJI[themeKey] || MOTIF_EMOJI.default;
    const r = rng(themeKey.length * 31 + 7);
    return Array.from({ length: count }).map((_, i) => ({
      emoji: emoji[Math.floor(r() * emoji.length)],
      left: r() * 100,
      top: r() * 100,
      size: 18 + r() * 22,
      duration: 12 + r() * 18,
      delay: -r() * 30,
      rotate: -25 + r() * 50,
      drift: -10 + r() * 20,
      // unique key seed
      ...{ _i: i },
    }));
  }, [themeKey, count]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {sprites.map((s, i) => (
        <span
          key={i}
          className="absolute opacity-30"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            transform: `rotate(${s.rotate}deg)`,
            animation: `pp-float ${s.duration}s ease-in-out ${s.delay}s infinite`,
            // CSS variable so the keyframes can read the per-sprite drift
            ["--pp-drift" as string]: `${s.drift}px`,
          }}
        >
          {s.emoji}
        </span>
      ))}
      <style jsx>{`
        @keyframes pp-float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(var(--pp-drift), -14px) rotate(6deg); }
          50% { transform: translate(calc(var(--pp-drift) * -1), 0) rotate(-4deg); }
          75% { transform: translate(var(--pp-drift), 12px) rotate(8deg); }
        }
      `}</style>
    </div>
  );
}
