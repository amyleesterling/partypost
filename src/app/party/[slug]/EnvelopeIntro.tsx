"use client";

import { useEffect, useState } from "react";

type Phase = "closed" | "opening" | "done";

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
    setTimeout(() => setPhase("done"), 2300);
  }

  if (phase === null || phase === "done") return null;

  const dateLabel = formatDateForCard(date);

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
          <div className="pp-env-front" />
          <div className="pp-env-flap" />
          <div className="pp-env-seal" aria-hidden="true">✨</div>
        </div>
        <div className="pp-env-hint" aria-hidden="true">Tap to open</div>
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
