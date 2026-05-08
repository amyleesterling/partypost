"use client";

import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";

type Phase = "closed" | "opening" | "settled" | "exiting" | "done";

const SESSION_KEY = "pp-envelope-seen";

export function EnvelopeIntro({
  partyTitle,
  birthdayChildName,
  date,
  inviteImageUrl,
}: {
  partyTitle: string;
  birthdayChildName?: string | null;
  date?: string | null;
  inviteImageUrl?: string | null;
}) {
  const [phase, setPhase] = useState<Phase | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // ?envelope=1 forces the envelope to show even if seen already this
    // session. Useful for testing / iterating on the animation.
    const forced =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("envelope") === "1";
    let seen = false;
    if (!forced) {
      try {
        seen = sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {
        /* private mode etc. */
      }
    }
    setPhase(seen ? "done" : "closed");
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  function open() {
    if (phase !== "closed") return;
    setPhase("opening");
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    fireOpenConfetti();
    // Card animation runs 0.4s delay + 2.0s emerge → ~2.4s total.
    settleTimer.current = setTimeout(() => setPhase("settled"), 2400);
  }

  function dismiss() {
    setPhase("exiting");
    setTimeout(() => setPhase("done"), 500);
  }

  if (phase === null || phase === "done") return null;

  const dateLabel = formatDateForCard(date);
  const isClosed = phase === "closed";

  return (
    <div
      className={`pp-env-overlay pp-env-${phase}`}
      role={isClosed ? "button" : undefined}
      tabIndex={isClosed ? 0 : undefined}
      aria-label={isClosed ? `Open invitation for ${partyTitle}` : undefined}
      onClick={isClosed ? open : undefined}
      onKeyDown={
        isClosed
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }
          : undefined
      }
    >
      <div className="pp-env-stage">
        <div className="pp-env">
          <div className="pp-env-back" />
          <div className="pp-env-side-flap pp-env-side-flap-left" />
          <div className="pp-env-side-flap pp-env-side-flap-right" />
          <div className="pp-env-bottom-flap" />
          <div
            className="pp-env-card"
            onClick={phase === "settled" ? dismiss : undefined}
            style={phase === "settled" ? { cursor: "pointer" } : undefined}
            role={phase === "settled" ? "button" : undefined}
            aria-label={phase === "settled" ? "Open invitation" : undefined}
          >
            {inviteImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={inviteImageUrl}
                alt={partyTitle}
                className="pp-env-card-img"
              />
            ) : (
              <div className="pp-env-card-frame">
                <div className="pp-env-card-eyebrow">You&apos;re Invited</div>
                <div className="pp-env-card-title">{partyTitle}</div>
                {(dateLabel || birthdayChildName) && (
                  <div className="pp-env-card-meta">
                    {dateLabel}
                    {dateLabel && birthdayChildName ? " · " : ""}
                    {birthdayChildName ? `for ${birthdayChildName}` : ""}
                  </div>
                )}
                <div className="pp-env-card-flourish" aria-hidden="true">
                  <span>✦</span>
                  <span>·</span>
                  <span>✦</span>
                </div>
              </div>
            )}
          </div>
          <div className="pp-env-flap" />
          {isClosed && (
            <div className="pp-env-seal" aria-hidden="true">✨</div>
          )}
        </div>

        {isClosed && (
          <div className="pp-env-hint" aria-hidden="true">Tap to open</div>
        )}

        {phase === "settled" && (
          <button
            type="button"
            className="pp-env-rsvp-btn pp-env-rsvp-enter"
            onClick={dismiss}
          >
            RSVP →
          </button>
        )}
      </div>
    </div>
  );
}

function formatDateForCard(d: string | null | undefined): string {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return "";
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[m - 1]} ${day}, ${y}`;
}

/** Two-burst confetti when the user taps to open the envelope. Picks up
 *  the live theme accent + secondary so the celebration matches the
 *  party's vibe (beach blues, princess pinks, etc.). */
function fireOpenConfetti() {
  if (typeof window === "undefined") return;
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim() || "#E94F8A";
  const secondary = styles.getPropertyValue("--secondary").trim() || "#FFD166";
  const colors = [accent, secondary, "#ffffff", "#ffe5b4"];
  // Center burst — feels like the seal popping open.
  confetti({
    particleCount: 90,
    spread: 95,
    startVelocity: 42,
    ticks: 220,
    origin: { x: 0.5, y: 0.45 },
    colors,
    scalar: 1,
  });
  // Slight follow-up burst from the bottom for a fountain effect.
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 90,
      spread: 70,
      startVelocity: 55,
      ticks: 220,
      origin: { x: 0.5, y: 0.85 },
      colors,
      scalar: 0.85,
    });
  }, 180);
}
