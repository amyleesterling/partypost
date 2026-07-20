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
      // visualViewport excludes mobile browser chrome; innerHeight does
      // not, so clamping against it hides the button behind the URL bar.
      const viewportH = window.visualViewport?.height ?? window.innerHeight;
      const maxTop = viewportH - btnHeight - 16;
      // .pp-env-stage carries a transform, which makes it the containing
      // block for this position:fixed button. Rects are viewport-space, so
      // rebase onto the stage or the button lands ~stageTop px too low.
      const originTop = (btn.offsetParent as HTMLElement | null)
        ?.getBoundingClientRect().top ?? 0;
      // The button keeps a resting translateY from its enter animation;
      // subtract it so the 28px above is the gap actually rendered.
      const restingShiftY = new DOMMatrix(getComputedStyle(btn).transform).f;
      const top = Math.min(desiredTop, maxTop) - originTop - restingShiftY;
      setButtonStyle({ top: `${top}px`, bottom: "auto" });
    }
    // Both the card and the button's enter animation are still moving when
    // this runs, and each feeds the math above, so re-measure until they
    // come to rest. Driven by a timer rather than rAF: rAF is paused in
    // hidden tabs, which would leave the button at its unpositioned spot.
    const settleStart = performance.now();
    update();
    const settleTick = setInterval(() => {
      update();
      if (performance.now() - settleStart >= 1500) clearInterval(settleTick);
    }, 100);
    // The card sits at a vh-based offset, so on resize it moves after the
    // event fires. Re-measure a tick later or we read its stale box.
    let resizeTimers: ReturnType<typeof setTimeout>[] = [];
    const onResize = () => {
      resizeTimers.forEach(clearTimeout);
      resizeTimers = [50, 150, 350, 600].map((ms) => setTimeout(update, ms));
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);
    return () => {
      clearInterval(settleTick);
      resizeTimers.forEach(clearTimeout);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
    };
  }, [phase]);

  function open(originX?: number, originY?: number) {
    if (phase !== "closed") return;
    setPhase("opening");
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    fireOpenConfetti(originX, originY);
    // Sequence:
    //   0.0s click → confetti from click point, pink flap starts opening
    //   0.0s → 0.8s pink flap unfolds (smooth ease)
    //   0.8s → 1.0s anticipation pause — flap open, no card yet
    //   1.0s → 1.25s card fades in INSIDE envelope, sideways (z=1)
    //   1.25s → 2.0s card rises sideways to -32vh (still z=1, clipped
    //                by green/blue side flaps until bottom edge clears)
    //   2.0s          z-index swaps to 100 — card now in front of envelope
    //   2.0s → 3.5s   rotate upright + scale to 1.1× + ease down to -16vh
    //   3.4s → 4.0s   envelope (back + flaps) dissolves
    //   3.5s          settled → RSVP button positioned below the card
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
      onClick={
        isClosed
          ? (e) =>
              open(
                e.clientX / window.innerWidth,
                e.clientY / window.innerHeight,
              )
          : undefined
      }
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

/** Single confetti burst from the user's tap location — like the
 *  envelope's seal popping right where they touched. Picks up the live
 *  theme accent + secondary so the celebration matches the party's
 *  vibe (beach blues, princess pinks, etc.). */
function fireOpenConfetti(originX = 0.5, originY = 0.5) {
  if (typeof window === "undefined") return;
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim() || "#E94F8A";
  const secondary = styles.getPropertyValue("--secondary").trim() || "#FFD166";
  const colors = [accent, secondary, "#ffffff", "#ffe5b4"];
  confetti({
    particleCount: 110,
    spread: 100,
    startVelocity: 45,
    ticks: 220,
    origin: { x: originX, y: originY },
    colors,
    scalar: 1,
  });
}
