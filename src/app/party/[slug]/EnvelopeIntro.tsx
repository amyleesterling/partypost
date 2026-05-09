"use client";

import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";

type Phase = "closed" | "opening" | "settled" | "exiting" | "done";

const SESSION_KEY = "pp-envelope-seen";

export function EnvelopeIntro({
  partyTitle,
  birthdayChildName,
  hostName,
  date,
  inviteImageUrl,
}: {
  partyTitle: string;
  birthdayChildName?: string | null;
  hostName?: string | null;
  date?: string | null;
  inviteImageUrl?: string | null;
}) {
  const [phase, setPhase] = useState<Phase | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Dynamic button position — measured below the card's actual rendered
  // bottom in JS so it can never overlap regardless of viewport,
  // transform, or scale.
  const [buttonStyle, setButtonStyle] = useState<React.CSSProperties>({});

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

  // Position the RSVP button dynamically below the card's actual
  // rendered bottom. CSS-based positioning depended on viewport
  // height + transform math that broke down on edge-case viewports
  // (short laptops, landscape phones). Measuring the real bounding
  // box guarantees the button is always cleanly below the card.
  useEffect(() => {
    if (phase !== "settled") {
      setButtonStyle({});
      return;
    }
    function update() {
      const card = cardRef.current;
      const btn = buttonRef.current;
      if (!card || !btn) return;
      const cardRect = card.getBoundingClientRect();
      const btnHeight = btn.offsetHeight || 50;
      const desiredTop = cardRect.bottom + 28; // 28px gap below card
      // Don't push the button off-screen on tiny viewports — clamp so
      // it stays at least 16px from the bottom edge.
      const maxTop = window.innerHeight - btnHeight - 16;
      const top = Math.min(desiredTop, maxTop);
      setButtonStyle({ top: `${top}px`, bottom: "auto" });
    }
    // Run on next frame so the card transform is committed first.
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
    };
  }, [phase]);

  function open() {
    if (phase !== "closed") return;
    setPhase("opening");
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    fireOpenConfetti();
    // Sequence:
    //   0.0s click → seal vanishes, confetti, pink flap starts unfolding
    //   0.0s → 0.8s pink flap unfolds fully (slow ease)
    //   0.8s → 1.0s anticipation pause — flap open, no card yet
    //   1.0s → ~1.2s card fades in INSIDE envelope, sideways (rotated 90°)
    //   1.2s → 2.0s card slides UP through the envelope's slot, sideways,
    //               BEHIND the flaps (z-index 1) — looks like a card
    //               sliding edge-first out of a sleeve
    //   2.0s         z-index switches to 100 — card now in front
    //   1.6s → 2.2s envelope shells dissolve in the background
    //   2.0s → 3.5s card rotates upright + zooms to hero pose, slow ease-out
    //   3.5s settled → RSVP button slides in
    settleTimer.current = setTimeout(() => setPhase("settled"), 3500);
  }

  function dismiss() {
    setPhase("exiting");
    setTimeout(() => setPhase("done"), 500);
  }

  if (phase === null || phase === "done") return null;

  const dateLabel = formatDateForCard(date);
  const isClosed = phase === "closed";
  const monogram = getMonogram(birthdayChildName, hostName);

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
            ref={cardRef}
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
            monogram ? (
              <div className="pp-env-seal pp-env-seal-monogram" aria-hidden="true">
                <span className="pp-env-seal-letter">{monogram}</span>
              </div>
            ) : (
              <div className="pp-env-seal pp-env-seal-sparkle" aria-hidden="true">✨</div>
            )
          )}
        </div>

        {isClosed && (
          <div className="pp-env-hint" aria-hidden="true">Tap to open</div>
        )}

        {phase === "settled" && (
          <button
            ref={buttonRef}
            type="button"
            className="pp-env-rsvp-btn pp-env-rsvp-enter"
            style={buttonStyle}
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

/** Pull the first letter of the LAST name from the birthday child (or
 *  fall back to the host) for the wax-seal monogram.
 *
 *  Examples:
 *    "Sophia Sterling"      → "S"
 *    "Oliver Twist"         → "T"
 *    "Sophia"  (single)     → "S"  (only word — works as monogram)
 *    "Roomba 615"           → "R"  (last word starts with digit → use first)
 *    "The Crew" (host)      → "C"  ("The " stripped)
 *    "Will & Amy Sterling"  → "S"
 *    ""                     → ""   (caller falls back to ✨)
 */
function getMonogram(child?: string | null, host?: string | null): string {
  return lastNameInitial(child) || lastNameInitial(host) || "";
}

function lastNameInitial(name?: string | null): string {
  if (!name) return "";
  const cleaned = name.replace(/^the\s+/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  // Strip trailing punctuation off the last word, then take the first
  // alphanumeric character. If it's a letter, that's our monogram.
  const last = parts[parts.length - 1].replace(/[^A-Za-z0-9]+$/, "");
  if (last && /^[A-Za-z]/.test(last)) return last[0].toUpperCase();
  // Last word starts with a digit (e.g. "Roomba 615") — fall back to
  // the first word's first letter.
  for (const word of parts) {
    const stripped = word.replace(/[^A-Za-z0-9]+/g, "");
    if (stripped && /^[A-Za-z]/.test(stripped)) return stripped[0].toUpperCase();
  }
  return "";
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
