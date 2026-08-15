"use client";

import confetti from "canvas-confetti";
import { useEffect, useMemo, useRef, useState } from "react";

// Hype mode: within 48h of party start the normal hero swaps for a
// full-width animated countdown that gets guests stoked. Documented in
// docs/hype-mode.md.

const HYPE_WINDOW_MS = 48 * 60 * 60 * 1000;
// Matches Countdown's "party's already happened" cutoff.
const PARTY_OVER_GRACE_MS = 2 * 60 * 60 * 1000;

function startEpoch(date: string | null | undefined, time: string | null | undefined): number | null {
  if (!date) return null;
  const t = (time && /^\d{1,2}:\d{2}/.test(time)) ? time.slice(0, 5) : "12:00";
  const ms = new Date(`${date}T${t}:00`).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function endEpoch(
  date: string | null | undefined,
  endTime: string | null | undefined,
  start: number,
): number {
  if (date && endTime && /^\d{1,2}:\d{2}/.test(endTime)) {
    const ms = new Date(`${date}T${endTime.slice(0, 5)}:00`).getTime();
    if (!Number.isNaN(ms) && ms > start) return ms;
  }
  return start + PARTY_OVER_GRACE_MS;
}

/** True once the clock is inside the hype window (48h before start →
 *  party end). Always false during SSR/hydration so server and first
 *  client render match. `?hype=1` forces it on for testing; `?hype=0`
 *  forces it off. */
export function useHypeMode(
  date: string | null | undefined,
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): boolean {
  const [hype, setHype] = useState(false);

  useEffect(() => {
    const start = startEpoch(date, startTime);
    if (!start) return;
    const forced = new URLSearchParams(window.location.search).get("hype");
    if (forced === "1") { setHype(true); return; }
    if (forced === "0") { setHype(false); return; }
    const end = endEpoch(date, endTime, start);
    const check = () => {
      const now = Date.now();
      setHype(now >= start - HYPE_WINDOW_MS && now <= end);
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [date, startTime, endTime]);

  return hype;
}

const FLOAT_EMOJI = ["🎈", "🎉", "🎂", "✨", "🎁", "🥳", "🎊", "🍰", "⭐", "🎈"];

export function HypeCountdown({
  date,
  startTime,
  endTime,
  childName,
}: {
  date: string | null | undefined;
  startTime: string | null | undefined;
  endTime: string | null | undefined;
  childName?: string | null;
}) {
  const start = startEpoch(date, startTime);
  const [now, setNow] = useState<number | null>(null);
  const [taps, setTaps] = useState(0);
  const firedPartyStart = useRef(false);

  useEffect(() => {
    if (!start) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [start]);

  // Only rendered client-side (useHypeMode gates it), so a one-time
  // random layout is hydration-safe.
  const floaters = useMemo(
    () =>
      FLOAT_EMOJI.map((emoji, i) => ({
        emoji,
        left: `${(i * 41 + 13) % 92 + 2}%`,
        delay: `${(i * 1.7) % 6}s`,
        duration: `${7 + (i % 4) * 1.6}s`,
        size: `${1.1 + (i % 3) * 0.35}rem`,
      })),
    [],
  );

  const diff = start !== null && now !== null ? start - now : null;
  const partyNow = diff !== null && diff <= 0;

  // One celebratory volley the moment the countdown hits zero.
  useEffect(() => {
    if (!partyNow || firedPartyStart.current) return;
    firedPartyStart.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = themeColors();
    [0, 250, 500].forEach((ms, i) =>
      setTimeout(
        () =>
          confetti({
            particleCount: 90,
            spread: 90 + i * 20,
            startVelocity: 40,
            ticks: 220,
            origin: { x: 0.2 + i * 0.3, y: 0.4 },
            colors,
          }),
        ms,
      ),
    );
  }, [partyNow]);

  if (!start) return null;

  function fire(originX = 0.5, originY = 0.45) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nextTap = taps + 1;
    setTaps(nextTap);
    const colors = themeColors();
    // Every 5th tap goes bigger — reward the enthusiastic clicker.
    const big = nextTap % 5 === 0;
    confetti({
      particleCount: big ? 220 : 80,
      spread: big ? 140 : 85,
      startVelocity: big ? 55 : 40,
      ticks: big ? 260 : 200,
      origin: { x: originX, y: originY },
      colors,
      shapes: big ? ["star", "circle"] : ["circle", "square"],
      scalar: big ? 1.2 : 1,
    });
  }

  return (
    <section
      className="pp-hype pp-card"
      onClick={(e) => fire(e.clientX / window.innerWidth, e.clientY / window.innerHeight)}
      aria-label={partyNow ? "The party is happening now" : "Countdown to the party"}
    >
      {floaters.map((f, i) => (
        <span
          key={i}
          className="pp-hype-emoji"
          aria-hidden="true"
          style={{ left: f.left, animationDelay: f.delay, animationDuration: f.duration, fontSize: f.size }}
        >
          {f.emoji}
        </span>
      ))}

      <div className="pp-hype-inner">
        {partyNow ? (
          <>
            <div className="pp-hype-eyebrow">✨ RIGHT NOW ✨</div>
            <div className="pp-hype-headline">IT&rsquo;S PARTY TIME!</div>
            <p className="pp-hype-sub">
              {childName ? `${childName}'s big day is HAPPENING.` : "The big day is HAPPENING."} See you there! 🎂
            </p>
          </>
        ) : (
          <>
            <div className="pp-hype-eyebrow">
              {diff !== null && diff > 24 * 60 * 60 * 1000 ? "⏰ IT'S ALMOST TIME ⏰" : "🚨 FINAL COUNTDOWN 🚨"}
            </div>
            <div className="pp-hype-headline">
              {childName ? `${childName}'s party starts in` : "The party starts in"}
            </div>
            <HypeDigits diff={diff} />
          </>
        )}

        <button
          type="button"
          className="pp-hype-btn"
          onClick={(e) => {
            e.stopPropagation();
            const r = (e.target as HTMLElement).getBoundingClientRect();
            fire(
              (r.left + r.width / 2) / window.innerWidth,
              (r.top + r.height / 2) / window.innerHeight,
            );
          }}
        >
          Tap for confetti 🎉
        </button>
        {taps >= 10 && (
          <div className="pp-hype-tapcount" aria-hidden="true">
            🔥 confetti master ×{taps} 🔥
          </div>
        )}
      </div>
    </section>
  );
}

function HypeDigits({ diff }: { diff: number | null }) {
  if (diff === null) {
    // Stable placeholder for the tick-before-mount frame.
    return (
      <div className="pp-hype-digits" aria-hidden="true" style={{ opacity: 0 }}>
        <Digit value="00" label="hours" />
        <span className="pp-hype-colon">:</span>
        <Digit value="00" label="min" />
        <span className="pp-hype-colon">:</span>
        <Digit value="00" label="sec" />
      </div>
    );
  }
  const totalSec = Math.max(0, Math.floor(diff / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <div className="pp-hype-digits" role="timer">
      <Digit value={pad(hours)} label="hours" />
      <span className="pp-hype-colon" aria-hidden="true">:</span>
      <Digit value={pad(minutes)} label="min" />
      <span className="pp-hype-colon" aria-hidden="true">:</span>
      <Digit value={pad(seconds)} label="sec" />
    </div>
  );
}

function Digit({ value, label }: { value: string; label: string }) {
  return (
    <div className="pp-hype-cell">
      {/* key remounts the span each change so the pop animation replays */}
      <span key={value} className="pp-hype-digit">{value}</span>
      <span className="pp-hype-label">{label}</span>
    </div>
  );
}

function themeColors(): string[] {
  const styles = getComputedStyle(document.documentElement);
  const accent = (styles.getPropertyValue("--accent") || "#E94F8A").trim();
  const secondary = (styles.getPropertyValue("--secondary") || "#FFD166").trim();
  return [accent, secondary, "#ffffff", "#ffe5b4"];
}
