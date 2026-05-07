"use client";

import { useEffect, useState } from "react";

function partyEpoch(date: string | null | undefined, time: string | null | undefined): number | null {
  if (!date) return null;
  const t = (time && /^\d{1,2}:\d{2}/.test(time)) ? time.slice(0, 5) : "12:00";
  const ms = new Date(`${date}T${t}:00`).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function Countdown({
  date,
  startTime,
}: {
  date: string | null | undefined;
  startTime: string | null | undefined;
}) {
  const target = partyEpoch(date, startTime);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  const diff = target - now;

  if (diff <= -2 * 60 * 60 * 1000) {
    return (
      <div className="rounded-2xl bg-white/60 px-4 py-3 text-center text-sm font-medium pp-muted">
        🎉 Party&apos;s already happened! Hope it was a blast.
      </div>
    );
  }

  if (diff <= 0) {
    return (
      <div className="rounded-2xl px-4 py-3 text-center font-semibold text-white"
           style={{ background: "var(--accent)" }}>
        ✨ Happening now! ✨
      </div>
    );
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff / (60 * 60 * 1000)) % 24);
  const minutes = Math.floor((diff / (60 * 1000)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return (
    <div className="rounded-2xl bg-white/70 px-3 py-3 text-center backdrop-blur">
      <div className="text-[10px] font-semibold uppercase tracking-widest pp-muted">
        Counting down
      </div>
      <div className="mt-1 grid grid-cols-4 gap-1">
        <Cell n={days} label="days" />
        <Cell n={hours} label="hrs" />
        <Cell n={minutes} label="min" />
        <Cell n={seconds} label="sec" />
      </div>
    </div>
  );
}

function Cell({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div
        className="font-[family-name:var(--font-playful)] text-2xl font-bold tabular-nums sm:text-3xl"
        style={{ color: "var(--accent)" }}
      >
        {n}
      </div>
      <div className="text-[10px] uppercase tracking-wider pp-muted">{label}</div>
    </div>
  );
}
