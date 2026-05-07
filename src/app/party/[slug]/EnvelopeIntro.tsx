"use client";

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
    // Card animation lasts ~1.8s (0.5s delay + 1.3s emerge + rotate + zoom).
    settleTimer.current = setTimeout(() => setPhase("settled"), 1900);
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
          <div className="pp-env-card">
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
