"use client";

import { useEffect, useState } from "react";

type Phase = "closed" | "opening" | "done";

const SESSION_KEY = "pp-envelope-seen";

export function EnvelopeIntro({ partyTitle }: { partyTitle: string }) {
  // Start as null until we read sessionStorage so we can skip the animation
  // on revisits within the same browser session without a visual flash.
  const [phase, setPhase] = useState<Phase | null>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* private mode etc. */
    }
    setPhase(seen ? "done" : "closed");
  }, []);

  function open() {
    if (phase !== "closed") return;
    setPhase("opening");
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    // Animation: flap 0–600ms, card emerge 500–1500ms, fade 1500–2100ms
    setTimeout(() => setPhase("done"), 2100);
  }

  if (phase === null || phase === "done") return null;

  return (
    <div
      className={`pp-env-overlay pp-env-${phase}`}
      role="button"
      tabIndex={0}
      aria-label={`Open invitation for ${partyTitle}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="pp-env-stage">
        <div className="pp-env">
          <div className="pp-env-back" />
          <div className="pp-env-card">
            <div className="pp-env-card-emoji" aria-hidden="true">🎂</div>
            <div className="pp-env-card-text">You&apos;re invited!</div>
          </div>
          <div className="pp-env-front" />
          <div className="pp-env-flap" />
          <div className="pp-env-seal" aria-hidden="true">✨</div>
        </div>
        <div className="pp-env-hint" aria-hidden="true">Tap to open</div>
      </div>
    </div>
  );
}
